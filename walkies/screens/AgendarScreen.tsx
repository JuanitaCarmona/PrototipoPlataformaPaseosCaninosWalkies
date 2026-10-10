import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import type { LocationGeocodedAddress, LocationObject } from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { haversineKm, parseCoordinate } from '../lib/geo';
import { loadDefaultPickup, saveDefaultPickup } from '../lib/defaultPickup';
import {
  readFreshDeviceLocation,
  getDeviceMapCenter,
  isLikelyGoogleplexMock,
} from '../lib/deviceLocation';
import { PickupMapPreview } from '../components/PickupMapPreview';
import { PickupMapPickerModal } from '../components/PickupMapPickerModal';
import { WalkTrackingScreen } from '../components/WalkTrackingScreen';
import { WalkChatModal } from '../components/WalkChatModal';
import { StarRating } from '../components/StarRating';
import { notifyUser } from '../lib/notify';
import { callPhone } from '../lib/phone';
import { saveUserAddress } from '../lib/addresses';
import { estimateWalkPrice, petNameFromJoin, profileFromJoin, walkerDisplayName } from '../lib/walkDisplay';

type PetOption = {
  id: string;
  name: string;
};

type WalkerOption = {
  id: string;
  user_id?: string;
  bio: string | null;
  hourly_rate: number | null;
  rating_avg: number | null;
  last_lat: number | null;
  last_lng: number | null;
  profiles?: { full_name: string | null; phone?: string | null }[] | { full_name: string | null; phone?: string | null } | null;
};

type WalkReview = { id: string; rating: number; comment: string | null };

type WalkItem = {
  id: string;
  scheduled_at: string;
  started_at?: string | null;
  duration_minutes: number;
  status: string;
  notes: string | null;
  price: number | null;
  walker_id: string;
  pickup_address: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pets?: { name: string; owner_id?: string } | { name: string; owner_id?: string }[] | null;
  walkers?: {
    user_id?: string;
    last_lat?: number | null;
    last_lng?: number | null;
    profiles?: { full_name: string | null; phone?: string | null }[] | { full_name: string | null; phone?: string | null } | null;
  } | {
    user_id?: string;
    last_lat?: number | null;
    last_lng?: number | null;
    profiles?: { full_name: string | null; phone?: string | null }[] | { full_name: string | null; phone?: string | null } | null;
  }[] | null;
  reviews?: WalkReview[] | WalkReview | null;
};

type GeocodeCandidate = {
  lat: number;
  lng: number;
  label: string;
};

const DURATION_OPTIONS = [30, 45, 60];

type TabAgendar = 'nuevo' | 'historial';
type HistoryFilter = 'proximos' | 'completados';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  in_progress: 'En curso',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

type AgendarScreenProps = {
  initialPetId?: string | null;
  initialWalkerId?: string | null;
};

export function AgendarScreen({ initialPetId, initialWalkerId }: AgendarScreenProps) {
  const { session } = useAuth();
  const [tab, setTab] = useState<TabAgendar>('nuevo');
  const [historyTab, setHistoryTab] = useState<HistoryFilter>('proximos');
  const [pets, setPets] = useState<PetOption[]>([]);
  const [walkers, setWalkers] = useState<WalkerOption[]>([]);
  const [selectedWalkerId, setSelectedWalkerId] = useState<string | null>(null);
  const [walks, setWalks] = useState<WalkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWalks, setLoadingWalks] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [scheduledAt, setScheduledAt] = useState<Date | null>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const isWeb = Platform.OS === 'web';
  const [showWebDateTimeModal, setShowWebDateTimeModal] = useState(false);
  const [webDateDraft, setWebDateDraft] = useState(formatDateInputValue(new Date()));
  const [webTimeDraft, setWebTimeDraft] = useState(formatTimeInputValue(new Date()));

  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupLatResolved, setPickupLatResolved] = useState<number | null>(null);
  const [pickupLngResolved, setPickupLngResolved] = useState<number | null>(null);
  const [pickupLatText, setPickupLatText] = useState('');
  const [pickupLngText, setPickupLngText] = useState('');
  const [showPickupAdvanced, setShowPickupAdvanced] = useState(false);
  const [ownerCityHint, setOwnerCityHint] = useState<string | null>(null);
  const [geocodingPickup, setGeocodingPickup] = useState(false);
  const [gpsPickupLoading, setGpsPickupLoading] = useState(false);
  const [showPickupMapPicker, setShowPickupMapPicker] = useState(false);
  const [mapPickerInitial, setMapPickerInitial] = useState({ latitude: 4.6533, longitude: -74.0839 });
  const [mapPickerOpening, setMapPickerOpening] = useState(false);
  const [pickupCandidates, setPickupCandidates] = useState<GeocodeCandidate[]>([]);
  const [showPickupCandidateModal, setShowPickupCandidateModal] = useState(false);
  const [pickupResolvedLabel, setPickupResolvedLabel] = useState<string | null>(null);
  const [trackingWalkId, setTrackingWalkId] = useState<string | null>(null);
  const [chatWalkId, setChatWalkId] = useState<string | null>(null);
  const [ratingDraft, setRatingDraft] = useState<Record<string, { rating: number; comment: string }>>({});
  const [ratingSaving, setRatingSaving] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);

    const [petsRes, walkersRes, addrRes] = await Promise.all([
      supabase
        .from('pets')
        .select('id, name')
        .eq('owner_id', session.user.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('walkers')
        .select('id, user_id, bio, hourly_rate, rating_avg, last_lat, last_lng, profiles(full_name, phone)')
        .order('rating_avg', { ascending: false }),
      supabase
        .from('addresses')
        .select('city')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (petsRes.error) {
      setFeedback({ type: 'error', message: 'No se pudieron cargar tus mascotas.' });
    } else {
      setPets(petsRes.data ?? []);
      if (petsRes.data && petsRes.data.length > 0) {
        const preferred = initialPetId && petsRes.data.some((p) => p.id === initialPetId)
          ? initialPetId
          : petsRes.data[0].id;
        setSelectedPetId(preferred);
      }
    }

    if (walkersRes.error) {
      setFeedback({ type: 'error', message: 'No se pudo cargar la información de paseadores.' });
    } else {
      const list = (walkersRes.data as WalkerOption[]) ?? [];
      setWalkers(list);
      const preferredWalker =
        initialWalkerId && list.some((w) => w.id === initialWalkerId)
          ? initialWalkerId
          : list[0]?.id ?? null;
      setSelectedWalkerId(preferredWalker);
    }

    if (!addrRes.error && addrRes.data?.city?.trim()) {
      setOwnerCityHint(addrRes.data.city.trim());
    } else {
      setOwnerCityHint(null);
    }

    setLoading(false);
  }, [session?.user?.id, initialPetId, initialWalkerId]);

  const loadWalks = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoadingWalks(true);
    const selects = [
      'id, scheduled_at, started_at, duration_minutes, status, notes, price, walker_id, pickup_address, pickup_lat, pickup_lng, pets(name, owner_id), walkers(user_id, last_lat, last_lng, profiles(full_name, phone)), reviews(id, rating, comment)',
      'id, scheduled_at, duration_minutes, status, notes, price, walker_id, pickup_address, pickup_lat, pickup_lng, pets(name, owner_id), walkers(user_id, last_lat, last_lng, profiles(full_name, phone)), reviews(id, rating, comment)',
      'id, scheduled_at, started_at, duration_minutes, status, notes, price, walker_id, pickup_address, pickup_lat, pickup_lng, pets(name, owner_id)',
      'id, scheduled_at, duration_minutes, status, notes, price, walker_id, pickup_address, pickup_lat, pickup_lng, pets(name, owner_id)',
    ];
    let data: unknown = null;
    let error: { message: string } | null = null;
    for (const select of selects) {
      const res = await supabase
        .from('walks')
        .select(select)
        .eq('pets.owner_id', session.user.id)
        .order('scheduled_at', { ascending: false });
      data = res.data;
      error = res.error;
      if (!error) break;
    }
    setLoadingWalks(false);
    if (error) {
      setFeedback({ type: 'error', message: 'No se pudo cargar el historial de paseos.' });
      return;
    }
    const rows = ((data as WalkItem[] | null) ?? []).map((row) => {
      const petRaw = row.pets as unknown;
      const pet =
        Array.isArray(petRaw) ? (petRaw[0] as WalkItem['pets']) : (petRaw as WalkItem['pets']);
      return { ...row, pets: pet } as WalkItem;
    });
    setWalks(rows);
  }, [session?.user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (initialPetId) setSelectedPetId(initialPetId);
  }, [initialPetId]);

  useEffect(() => {
    if (initialWalkerId) setSelectedWalkerId(initialWalkerId);
  }, [initialWalkerId]);

  useEffect(() => {
    setFeedback(null);
    if (tab === 'historial') loadWalks();
  }, [tab, loadWalks]);

  useEffect(() => {
    const loadPickup = async () => {
      if (!session?.user?.id) return;
      const saved = await loadDefaultPickup(session.user.id);
      if (saved) {
        setPickupAddress(saved.address);
        setPickupLatResolved(saved.lat);
        setPickupLngResolved(saved.lng);
        setPickupLatText(String(saved.lat));
        setPickupLngText(String(saved.lng));
        setPickupResolvedLabel(saved.address.trim());
      }
    };
    loadPickup();
  }, [session?.user?.id]);

  useEffect(() => {
    if (!pickupResolvedLabel) return;
    if (pickupAddress.trim() === pickupResolvedLabel) return;
    setPickupLatResolved(null);
    setPickupLngResolved(null);
    setPickupResolvedLabel(null);
  }, [pickupAddress, pickupResolvedLabel]);

  const advancedLat = parseCoordinate(pickupLatText);
  const advancedLng = parseCoordinate(pickupLngText);
  const pickupLat = pickupLatResolved ?? advancedLat;
  const pickupLng = pickupLngResolved ?? advancedLng;
  const hasPickupCoords = pickupLat != null && pickupLng != null;

  const sortedWalkers = useMemo(() => {
    const list = [...walkers];
    if (!hasPickupCoords) return list;
    list.sort((a, b) => {
      const da =
        a.last_lat != null && a.last_lng != null
          ? haversineKm(pickupLat!, pickupLng!, a.last_lat, a.last_lng)
          : Number.MAX_SAFE_INTEGER;
      const db =
        b.last_lat != null && b.last_lng != null
          ? haversineKm(pickupLat!, pickupLng!, b.last_lat, b.last_lng)
          : Number.MAX_SAFE_INTEGER;
      return da - db;
    });
    return list;
  }, [walkers, hasPickupCoords, pickupLat, pickupLng]);

  const selectedWalker = sortedWalkers.find((w) => w.id === selectedWalkerId) ?? sortedWalkers[0] ?? null;

  const upcomingWalks = walks.filter((w) => w.status !== 'completed' && w.status !== 'cancelled');
  const completedWalks = walks.filter((w) => w.status === 'completed' || w.status === 'cancelled');
  const visibleWalks = historyTab === 'proximos' ? upcomingWalks : completedWalks;

  const formatGeocodeLabel = (place: LocationGeocodedAddress) => {
    const parts = [
      place.streetNumber && place.street ? `${place.streetNumber} ${place.street}` : place.street,
      place.district,
      place.city,
      place.region,
      place.country,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const buildPickupCandidates = async (query: string, locations: Location.LocationGeocodedLocation[]) => {
    const sliced = locations.slice(0, 8);
    const out: GeocodeCandidate[] = [];
    for (const loc of sliced) {
      let label = '';
      try {
        const [rev] = await Location.reverseGeocodeAsync({
          latitude: loc.latitude,
          longitude: loc.longitude,
        });
        if (rev) {
          label = formatGeocodeLabel(rev).trim();
        }
      } catch {
        // ignorar reverse geocode puntual
      }
      if (!label) {
        label = `${query} · (${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)})`;
      }
      out.push({ lat: loc.latitude, lng: loc.longitude, label });
    }
    return out;
  };

  const geocodePickupAddress = async () => {
    const raw = pickupAddress.trim();
    if (!raw) {
      setFeedback({ type: 'error', message: 'Escribe la dirección donde están las mascotas.' });
      return;
    }
    setGeocodingPickup(true);
    setFeedback(null);
    try {
      const query =
        ownerCityHint && !raw.toLowerCase().includes(ownerCityHint.toLowerCase())
          ? `${raw}, ${ownerCityHint}`
          : raw;
      const results = await Location.geocodeAsync(query);
      if (!results.length) {
        setGeocodingPickup(false);
        setFeedback({
          type: 'error',
          message: 'No encontramos esa dirección. Intenta con más detalle (barrio, ciudad).',
        });
        return;
      }
      const mapped = await buildPickupCandidates(query, results);
      setGeocodingPickup(false);
      if (mapped.length === 1) {
        setPickupLatResolved(mapped[0].lat);
        setPickupLngResolved(mapped[0].lng);
        setPickupLatText(String(mapped[0].lat));
        setPickupLngText(String(mapped[0].lng));
        const nice = mapped[0].label.trim();
        if (nice && nice !== pickupAddress.trim()) {
          setPickupAddress(nice);
          setPickupResolvedLabel(nice);
        } else {
          setPickupResolvedLabel(pickupAddress.trim());
        }
        setFeedback({ type: 'success', message: 'Ubicación encontrada. Revisa que sea el lugar correcto.' });
        return;
      }
      setPickupCandidates(mapped);
      setShowPickupCandidateModal(true);
    } catch {
      setGeocodingPickup(false);
      setFeedback({
        type: 'error',
        message: 'No se pudo buscar la dirección. Verifica conexión o intenta otra redacción.',
      });
    }
  };

  const fillPickupFromDevice = async () => {
    if (isWeb) {
      setFeedback({
        type: 'error',
        message: 'En web usa “Buscar ubicación” con la dirección, o abre la app en el celular.',
      });
      return;
    }
    setGpsPickupLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso', 'Necesitamos ubicación para rellenar coordenadas.');
        return;
      }
      let pos: LocationObject;
      try {
        pos = await readFreshDeviceLocation();
      } catch {
        const last = await Location.getLastKnownPositionAsync();
        if (!last) throw new Error('no location');
        pos = last;
      }
      if (isLikelyGoogleplexMock(pos.coords.latitude, pos.coords.longitude)) {
        Alert.alert(
          'Emulador (Mountain View)',
          'Android sigue reportando la ubicación de prueba por defecto.\n\n' +
            'En el panel del emulador: ⋮ → Location → poné lat/long y tocá Send varias veces.\n' +
            'Probá también: Extended Controls → Location → set coordinates → Save.\n' +
            'Si no cambia, reiniciá el AVD (Cold boot) o probá en un teléfono real.',
        );
      }
      setPickupLatResolved(pos.coords.latitude);
      setPickupLngResolved(pos.coords.longitude);
      setPickupLatText(String(pos.coords.latitude));
      setPickupLngText(String(pos.coords.longitude));
      try {
        const [rev] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (rev) {
          const label = formatGeocodeLabel(rev);
          if (label.trim()) {
            setPickupAddress(label);
            setPickupResolvedLabel(label.trim());
          } else {
            setPickupResolvedLabel(`${pos.coords.latitude},${pos.coords.longitude}`);
          }
        } else {
          setPickupResolvedLabel(`${pos.coords.latitude},${pos.coords.longitude}`);
        }
      } catch {
        setPickupResolvedLabel(`${pos.coords.latitude},${pos.coords.longitude}`);
      }
      setFeedback({
        type: 'success',
        message: 'Ubicación tomada del GPS. Confirma que sea donde están las mascotas.',
      });
    } catch {
      setFeedback({
        type: 'error',
        message:
          'No se pudo leer la ubicación. En el emulador: menú ⋮ del AVD → Location → fija un punto; o probá de nuevo en un dispositivo real.',
      });
    } finally {
      setGpsPickupLoading(false);
    }
  };

  const openPickupMapPicker = async () => {
    if (isWeb) return;
    setMapPickerOpening(true);
    try {
      let lat = pickupLat;
      let lng = pickupLng;
      if (lat == null || lng == null) {
        const center = await getDeviceMapCenter();
        if (center) {
          lat = center.latitude;
          lng = center.longitude;
        }
      }
      setMapPickerInitial({
        latitude: lat ?? 4.6533,
        longitude: lng ?? -74.0839,
      });
      setShowPickupMapPicker(true);
    } finally {
      setMapPickerOpening(false);
    }
  };

  const handlePickupMapConfirm = async (lat: number, lng: number) => {
    setShowPickupMapPicker(false);
    setPickupLatResolved(lat);
    setPickupLngResolved(lng);
    setPickupLatText(String(lat));
    setPickupLngText(String(lng));
    try {
      const [rev] = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (rev) {
        const label = formatGeocodeLabel(rev);
        if (label.trim()) {
          setPickupAddress(label);
          setPickupResolvedLabel(label.trim());
        } else {
          setPickupResolvedLabel(`${lat},${lng}`);
        }
      } else {
        setPickupResolvedLabel(`${lat},${lng}`);
      }
    } catch {
      setPickupResolvedLabel(`${lat},${lng}`);
    }
    setFeedback({
      type: 'success',
      message: 'Punto elegido en el mapa. Revisá que la dirección sea la correcta.',
    });
  };

  const handleCreateWalk = async () => {
    if (!session?.user?.id) return;
    if (!selectedPetId) {
      setFeedback({ type: 'error', message: 'Selecciona una mascota para continuar.' });
      return;
    }
    if (!selectedWalker) {
      setFeedback({
        type: 'error',
        message: 'Aún no hay paseadores configurados. Crea uno en Supabase para poder agendar.',
      });
      return;
    }
    if (!pickupAddress.trim()) {
      setFeedback({ type: 'error', message: 'Indica la dirección o referencia del punto de recogida.' });
      return;
    }
    if (!hasPickupCoords) {
      setFeedback({
        type: 'error',
        message:
          'Toca “Buscar ubicación”, “Elegir en el mapa”, o “Estoy ahí (GPS)” para fijar el punto de recogida.',
      });
      return;
    }
    if (pickupLat! < -90 || pickupLat! > 90 || pickupLng! < -180 || pickupLng! > 180) {
      setFeedback({ type: 'error', message: 'Las coordenadas están fuera de rango.' });
      return;
    }
    if (!scheduledAt) {
      setFeedback({ type: 'error', message: 'Indica fecha y hora del paseo.' });
      return;
    }
    const isoString = scheduledAt.toISOString();
    const scheduledDate = isoString ? new Date(isoString) : null;
    if (!scheduledDate || Number.isNaN(scheduledDate.getTime())) {
      setFeedback({ type: 'error', message: 'No se pudo interpretar la fecha y hora del paseo.' });
      return;
    }
    if (scheduledDate.getTime() <= Date.now()) {
      setFeedback({ type: 'error', message: 'El paseo debe programarse en una fecha y hora futura.' });
      return;
    }

    setSaving(true);
    const price = estimateWalkPrice(selectedWalker.hourly_rate, selectedDuration);
    const { data: created, error } = await supabase.from('walks').insert({
      pet_id: selectedPetId,
      walker_id: selectedWalker.id,
      scheduled_at: isoString,
      duration_minutes: selectedDuration,
      status: 'pending',
      price,
      notes: notes.trim() || null,
      pickup_address: pickupAddress.trim(),
      pickup_lat: pickupLat!,
      pickup_lng: pickupLng!,
    }).select('id').maybeSingle();
    setSaving(false);

    if (error) {
      setFeedback({ type: 'error', message: 'No se pudo agendar el paseo. Intenta de nuevo.' });
      return;
    }

    await notifyUser({
      userId: selectedWalker.user_id,
      title: 'Nueva solicitud de paseo',
      body: `Te pidieron un paseo de ${selectedDuration} min.`,
      walkId: created?.id,
    });
    await saveUserAddress(session.user.id, {
      street: pickupAddress.trim(),
      city: ownerCityHint ?? '',
      lat: pickupLat,
      lng: pickupLng,
    });

    setFeedback({ type: 'success', message: 'Tu paseo quedó agendado correctamente.' });
    setNotes('');
    setScheduledAt(new Date());
    await saveDefaultPickup(session.user.id, {
      address: pickupAddress.trim(),
      lat: pickupLat!,
      lng: pickupLng!,
    });
    loadWalks();
  };

  const openWebDateTimeModal = () => {
    if (!isWeb) return;
    const current = scheduledAt ?? new Date();
    setWebDateDraft(formatDateInputValue(current));
    setWebTimeDraft(formatTimeInputValue(current));
    setShowWebDateTimeModal(true);
  };

  const handleWebDateTimeConfirm = () => {
    const base = scheduledAt ?? new Date();
    const withDate = parseDateInput(webDateDraft.trim(), base);
    if (!withDate) {
      setFeedback({ type: 'error', message: 'Fecha inválida. Usa formato AAAA-MM-DD.' });
      return;
    }
    const withTime = parseTimeInput(webTimeDraft.trim(), withDate);
    if (!withTime) {
      setFeedback({ type: 'error', message: 'Hora inválida. Usa formato HH:MM en 24 horas.' });
      return;
    }
    setScheduledAt(withTime);
    setFeedback(null);
    setShowWebDateTimeModal(false);
  };

  const priceLabel =
    selectedWalker?.hourly_rate != null
      ? `Tarifa aprox: $${Number(selectedWalker.hourly_rate).toLocaleString('es-CO')} / hora`
      : 'Tarifa sujeta a confirmación con el paseador.';

  const walkWalker = (walk?: WalkItem | null) => {
    if (!walk) return null;
    return Array.isArray(walk.walkers) ? walk.walkers[0] ?? null : walk.walkers ?? null;
  };
  const walkerNameForWalk = (walk?: WalkItem | null) => {
    if (!walk) return undefined;
    const nested = walkerDisplayName(
      profileFromJoin(walkWalker(walk)?.profiles ?? null)?.full_name,
    );
    if (nested) return nested;
    const listed = walkers.find((w) => w.id === walk.walker_id);
    return walkerDisplayName(profileFromJoin(listed?.profiles ?? null)?.full_name) ?? undefined;
  };
  const walkReview = (walk: WalkItem) => {
    const r = walk.reviews;
    if (!r) return null;
    return Array.isArray(r) ? r[0] ?? null : r;
  };

  const handleCancelWalk = (walk: WalkItem) => {
    Alert.alert('Cancelar paseo', '¿Seguro que quieres cancelar este paseo?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('walks').update({ status: 'cancelled' }).eq('id', walk.id);
          if (error) {
            Alert.alert('Error', 'No se pudo cancelar. ¿Ejecutaste el SQL de mvp_features?');
            return;
          }
          await notifyUser({
            userId: walkWalker(walk)?.user_id,
            title: 'Paseo cancelado',
            body: `El dueño canceló el paseo de ${petNameFromJoin(walk.pets)}.`,
            walkId: walk.id,
          });
          void loadWalks();
        },
      },
    ]);
  };

  const handleSubmitReview = async (walk: WalkItem) => {
    if (!session?.user?.id) return;
    const draft = ratingDraft[walk.id] ?? { rating: 5, comment: '' };
    if (!draft.rating) {
      Alert.alert('Valoración', 'Elige de 1 a 5 estrellas.');
      return;
    }
    setRatingSaving(walk.id);
    const { error } = await supabase.from('reviews').insert({
      walk_id: walk.id,
      owner_id: session.user.id,
      walker_id: walk.walker_id,
      rating: draft.rating,
      comment: draft.comment.trim() || null,
    });
    setRatingSaving(null);
    if (error) {
      Alert.alert('Valoración', 'No se pudo enviar. Ejecuta supabase/mvp_features.sql y asegúrate de que el paseo esté completado.');
      return;
    }
    await notifyUser({
      userId: walkWalker(walk)?.user_id,
      title: 'Nueva valoración',
      body: `Te calificaron con ${draft.rating} estrellas.`,
      walkId: walk.id,
    });
    void loadWalks();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Cargando opciones para tu paseo...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Paseos</Text>
          <Text style={styles.subtitle}>
            {tab === 'nuevo' ? 'Programa un paseo' : 'Historial y valoraciones'}
          </Text>
        </View>
        <MaterialCommunityIcons name="paw" size={28} color={theme.primary} />
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'nuevo' && styles.tabActive]}
          onPress={() => setTab('nuevo')}
        >
          <MaterialCommunityIcons
            name="plus-circle-outline"
            size={20}
            color={tab === 'nuevo' ? theme.textLight : theme.primaryDark}
          />
          <Text style={[styles.tabText, tab === 'nuevo' && styles.tabTextActive]}>
            Agendar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'historial' && styles.tabActive]}
          onPress={() => setTab('historial')}
        >
          <MaterialCommunityIcons
            name="format-list-bulleted"
            size={20}
            color={tab === 'historial' ? theme.textLight : theme.primaryDark}
          />
          <Text style={[styles.tabText, tab === 'historial' && styles.tabTextActive]}>
            Historial
          </Text>
        </TouchableOpacity>
      </View>
      {feedback ? (
        <View style={[styles.feedbackBox, feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess]}>
          <Text style={styles.feedbackText}>{feedback.message}</Text>
        </View>
      ) : null}

      {tab === 'historial' ? (
        <View style={styles.historialSection}>
          {loadingWalks ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={styles.loadingText}>Cargando historial...</Text>
            </View>
          ) : walks.length === 0 ? (
            <View style={[styles.emptyBox, styles.emptyBoxCentered]}>
              <MaterialCommunityIcons name="dog-side" size={40} color={theme.cardBorder} />
              <Text style={styles.emptyTitle}>Sin paseos agendados</Text>
              <Text style={styles.emptyText}>
                Toca "Agendar" para programar tu primer paseo.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.historyTabs}>
                <TouchableOpacity
                  style={[styles.historyTab, historyTab === 'completados' && styles.historyTabActive]}
                  onPress={() => setHistoryTab('completados')}
                >
                  <Text style={[styles.historyTabText, historyTab === 'completados' && styles.historyTabTextActive]}>
                    Completados
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.historyTab, historyTab === 'proximos' && styles.historyTabActive]}
                  onPress={() => setHistoryTab('proximos')}
                >
                  <Text style={[styles.historyTabText, historyTab === 'proximos' && styles.historyTabTextActive]}>
                    Próximos
                  </Text>
                </TouchableOpacity>
              </View>
              {visibleWalks.length === 0 ? (
                <View style={[styles.emptyBox, styles.emptyBoxCentered]}>
                  <Text style={styles.emptyText}>
                    {historyTab === 'proximos' ? 'No hay paseos próximos.' : 'Aún no hay paseos completados.'}
                  </Text>
                </View>
              ) : (
            visibleWalks.map((walk) => {
              const d = new Date(walk.scheduled_at);
              const dateStr = d.toLocaleDateString('es-CO', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });
              const timeStr = d.toLocaleTimeString('es-CO', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              });
              const petName = petNameFromJoin(walk.pets);
              const walkerProfile = profileFromJoin(walkWalker(walk)?.profiles ?? null);
              const review = walkReview(walk);
              const draft = ratingDraft[walk.id] ?? { rating: 5, comment: '' };
              return (
                <View key={walk.id} style={styles.walkCard}>
                  <View style={styles.walkCardHeader}>
                    <Text style={styles.walkCardPet}>{petName}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(walk.status) }]}>
                      <Text style={styles.statusBadgeText}>
                        {STATUS_LABELS[walk.status] ?? walk.status}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.walkCardMeta}>
                    <MaterialCommunityIcons name="calendar" size={16} color="#6b7280" />
                    <Text style={styles.walkCardMetaText}>{dateStr} · {timeStr}</Text>
                  </View>
                  <Text style={styles.walkCardDuration}>
                    {walk.duration_minutes} min
                    {walk.price != null ? ` · $${Number(walk.price).toLocaleString('es-CO')}` : ''}
                    {walkerProfile?.full_name ? ` · ${walkerProfile.full_name}` : ''}
                  </Text>
                  {walk.pickup_address ? (
                    <Text style={styles.walkCardPickup} numberOfLines={2}>
                      Recogida: {walk.pickup_address}
                    </Text>
                  ) : null}
                  {walk.notes ? (
                    <Text style={styles.walkCardNotes} numberOfLines={2}>{walk.notes}</Text>
                  ) : null}

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    {walk.status === 'in_progress' ? (
                      <TouchableOpacity style={styles.walkActionPrimary} onPress={() => setTrackingWalkId(walk.id)}>
                        <Text style={styles.walkActionPrimaryText}>Ver seguimiento</Text>
                      </TouchableOpacity>
                    ) : null}
                    {walk.status !== 'cancelled' ? (
                      <TouchableOpacity style={styles.walkAction} onPress={() => setChatWalkId(walk.id)}>
                        <Text style={styles.walkActionText}>Chat</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity style={styles.walkAction} onPress={() => callPhone(walkerProfile?.phone)}>
                      <Text style={styles.walkActionText}>Llamar</Text>
                    </TouchableOpacity>
                    {walk.status === 'pending' || walk.status === 'confirmed' ? (
                      <TouchableOpacity style={styles.walkActionDanger} onPress={() => handleCancelWalk(walk)}>
                        <Text style={styles.walkActionDangerText}>Cancelar</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {walk.status === 'completed' ? (
                    review ? (
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.walkCardPickup}>Tu valoración</Text>
                        <StarRating value={review.rating} />
                        {review.comment ? <Text style={styles.walkCardNotes}>{review.comment}</Text> : null}
                      </View>
                    ) : (
                      <View style={{ marginTop: 12 }}>
                        <Text style={styles.walkCardPickup}>Valora el paseo</Text>
                        <StarRating
                          value={draft.rating}
                          onChange={(rating) =>
                            setRatingDraft((prev) => ({ ...prev, [walk.id]: { ...draft, rating } }))
                          }
                        />
                        <TextInput
                          style={[styles.input, { marginTop: 8 }]}
                          placeholder="Comentario (opcional)"
                          placeholderTextColor="#9ca3af"
                          value={draft.comment}
                          onChangeText={(comment) =>
                            setRatingDraft((prev) => ({ ...prev, [walk.id]: { ...draft, comment } }))
                          }
                        />
                        <TouchableOpacity
                          style={styles.walkActionPrimary}
                          onPress={() => handleSubmitReview(walk)}
                          disabled={ratingSaving === walk.id}
                        >
                          <Text style={styles.walkActionPrimaryText}>
                            {ratingSaving === walk.id ? 'Enviando...' : 'Enviar valoración'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )
                  ) : null}
                </View>
              );
            })
              )}
            </>
          )}
        </View>
      ) : (
        <>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Mascota</Text>
        {pets.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Aún no tienes mascotas registradas. Ve a \"Mis mascotas\" para agregar una.
            </Text>
          </View>
        ) : (
          <View style={styles.chipRow}>
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[
                  styles.chip,
                  selectedPetId === pet.id && styles.chipActive,
                ]}
                onPress={() => setSelectedPetId(pet.id)}
              >
                <Text
                  style={[
                    styles.chipText,
                    selectedPetId === pet.id && styles.chipTextActive,
                  ]}
                >
                  {pet.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Punto de recogida (donde están las mascotas)</Text>
        <Text style={styles.pickupHint}>
          Escribe una dirección clara (barrio, ciudad). Nosotros ubicamos el punto en el mapa; no necesitas saber latitud/longitud.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. Calle 80 #12-34, Bogotá"
          placeholderTextColor="#9ca3af"
          value={pickupAddress}
          onChangeText={setPickupAddress}
        />
        <View style={styles.pickupActionsRow}>
          <TouchableOpacity
            style={[styles.pickupPrimaryButton, geocodingPickup && styles.pickupPrimaryButtonDisabled]}
            onPress={geocodePickupAddress}
            disabled={geocodingPickup}
            activeOpacity={0.85}
          >
            {geocodingPickup ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.pickupPrimaryButtonText}>Buscar ubicación</Text>
            )}
          </TouchableOpacity>
          {!isWeb ? (
            <>
              <TouchableOpacity
                style={[styles.pickupSecondaryButton, gpsPickupLoading && styles.pickupSecondaryButtonDisabled]}
                onPress={fillPickupFromDevice}
                disabled={gpsPickupLoading}
                activeOpacity={0.85}
              >
                {gpsPickupLoading ? (
                  <ActivityIndicator color={theme.primaryDark} size="small" />
                ) : (
                  <MaterialCommunityIcons name="crosshairs-gps" size={18} color={theme.primaryDark} />
                )}
                <Text style={styles.pickupSecondaryButtonText}>
                  {gpsPickupLoading ? 'Leyendo GPS…' : 'Estoy ahí (GPS)'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pickupSecondaryButton, mapPickerOpening && styles.pickupSecondaryButtonDisabled]}
                onPress={openPickupMapPicker}
                disabled={mapPickerOpening}
                activeOpacity={0.85}
              >
                {mapPickerOpening ? (
                  <ActivityIndicator color={theme.primaryDark} size="small" />
                ) : (
                  <MaterialCommunityIcons name="map-marker-radius" size={18} color={theme.primaryDark} />
                )}
                <Text style={styles.pickupSecondaryButtonText}>
                  {mapPickerOpening ? 'Abriendo mapa…' : 'Elegir en el mapa'}
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>
        {hasPickupCoords ? (
          <Text style={styles.pickupOkHint}>
            Ubicación lista para calcular distancias. Si cambias el texto, vuelve a buscar.
          </Text>
        ) : (
          <Text style={styles.pickupWarnHint}>
            Aún falta ubicar el punto: buscá la dirección, elegí en el mapa o usá GPS si estás en el lugar.
          </Text>
        )}
        {hasPickupCoords && pickupLat != null && pickupLng != null ? (
          <PickupMapPreview latitude={pickupLat} longitude={pickupLng} />
        ) : null}
        <TouchableOpacity onPress={() => setShowPickupAdvanced((v) => !v)} activeOpacity={0.7}>
          <Text style={styles.pickupAdvancedToggle}>
            {showPickupAdvanced ? 'Ocultar opciones avanzadas' : 'Opciones avanzadas (lat/lng manual)'}
          </Text>
        </TouchableOpacity>
        {showPickupAdvanced ? (
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Latitud (manual)</Text>
              <TextInput
                style={styles.input}
                placeholder="ej. 4.7110"
                placeholderTextColor="#9ca3af"
                value={pickupLatText}
                onChangeText={setPickupLatText}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={styles.spacer} />
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Longitud (manual)</Text>
              <TextInput
                style={styles.input}
                placeholder="ej. -74.0721"
                placeholderTextColor="#9ca3af"
                value={pickupLngText}
                onChangeText={setPickupLngText}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Fecha y hora</Text>
        <View style={styles.row}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Fecha</Text>
            <TouchableOpacity
              style={styles.inputButton}
              onPress={() => {
                if (isWeb) {
                  openWebDateTimeModal();
                  return;
                }
                setShowDatePicker(true);
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={18}
                color="#6b7280"
                style={styles.inputIcon}
              />
              <Text style={styles.inputButtonText}>
                {scheduledAt ? formatDateLabel(scheduledAt) : 'Elegir fecha'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.spacer} />
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Hora</Text>
            <TouchableOpacity
              style={styles.inputButton}
              onPress={() => {
                if (isWeb) {
                  openWebDateTimeModal();
                  return;
                }
                setShowTimePicker(true);
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="clock-outline"
                size={18}
                color="#6b7280"
                style={styles.inputIcon}
              />
              <Text style={styles.inputButtonText}>
                {scheduledAt ? formatTimeLabel(scheduledAt) : 'Elegir hora'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Duración</Text>
        <View style={styles.chipRow}>
          {DURATION_OPTIONS.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.chip,
                selectedDuration === m && styles.chipActive,
              ]}
              onPress={() => setSelectedDuration(m)}
            >
              <Text
                style={[
                  styles.chipText,
                  selectedDuration === m && styles.chipTextActive,
                ]}
              >
                {m} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Notas para el paseador</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          placeholder="Indica detalles especiales (puerta, comportamiento, etc.)."
          placeholderTextColor="#9ca3af"
          value={notes}
          onChangeText={setNotes}
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Paseadores disponibles</Text>
        {sortedWalkers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>No hay paseadores registrados todavía.</Text>
          </View>
        ) : (
          <View style={styles.chipRow}>
            {sortedWalkers.map((w) => {
              const name =
                (Array.isArray(w.profiles) ? w.profiles[0]?.full_name : w.profiles?.full_name)?.trim() || 'Paseador';
              const rating =
                w.rating_avg != null && w.rating_avg > 0 ? `⭐ ${Number(w.rating_avg).toFixed(1)}` : '⭐ —';
              const rate =
                w.hourly_rate != null ? `$${Number(w.hourly_rate).toLocaleString('es-CO')}/h` : 'Tarifa a convenir';
              const dist =
                hasPickupCoords && w.last_lat != null && w.last_lng != null
                  ? `${haversineKm(pickupLat!, pickupLng!, w.last_lat, w.last_lng).toFixed(1)} km`
                  : 'Dist: —';
              return (
                <TouchableOpacity
                  key={w.id}
                  style={[styles.walkerSelectChip, selectedWalkerId === w.id && styles.walkerSelectChipActive]}
                  onPress={() => setSelectedWalkerId(w.id)}
                >
                  <Text style={[styles.chipText, selectedWalkerId === w.id && styles.chipTextActive]}>
                    {name}
                  </Text>
                  <Text style={[styles.walkerChipMeta, selectedWalkerId === w.id && styles.walkerChipMetaActive]}>
                    {rating} · {rate} · {dist}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        {selectedWalker ? (
          <View style={styles.walkerBox}>
            <Text style={styles.walkerTitle}>Paseador seleccionado</Text>
            <Text style={styles.walkerText}>{selectedWalker.bio || 'Paseador de confianza.'}</Text>
            <Text style={styles.walkerPrice}>{priceLabel}</Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity
        style={[styles.submitButton, saving && styles.submitButtonDisabled]}
        onPress={handleCreateWalk}
        disabled={saving || !selectedPetId || !selectedWalker}
      >
        {saving ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.submitButtonText}>Agendar paseo</Text>
        )}
      </TouchableOpacity>

      {!isWeb && showDatePicker && scheduledAt && (
        <DateTimePicker
          value={scheduledAt}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(_, date) => {
            setShowDatePicker(Platform.OS === 'ios');
            if (date) {
              const prev = scheduledAt || new Date();
              const merged = new Date(
                date.getFullYear(),
                date.getMonth(),
                date.getDate(),
                prev.getHours(),
                prev.getMinutes()
              );
              setScheduledAt(merged);
            }
          }}
        />
      )}

      {!isWeb && showTimePicker && scheduledAt && (
        <DateTimePicker
          value={scheduledAt}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(_, date) => {
            setShowTimePicker(Platform.OS === 'ios');
            if (date) {
              const prev = scheduledAt || new Date();
              const merged = new Date(
                prev.getFullYear(),
                prev.getMonth(),
                prev.getDate(),
                date.getHours(),
                date.getMinutes()
              );
              setScheduledAt(merged);
            }
          }}
        />
      )}
      {isWeb && (
        <Modal
          visible={showWebDateTimeModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowWebDateTimeModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Seleccionar fecha y hora</Text>
              <Text style={styles.modalLabel}>Fecha</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="AAAA-MM-DD"
                placeholderTextColor="#9ca3af"
                value={webDateDraft}
                onChangeText={setWebDateDraft}
              />
              <Text style={styles.modalLabel}>Hora</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="HH:MM"
                placeholderTextColor="#9ca3af"
                value={webTimeDraft}
                onChangeText={setWebTimeDraft}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowWebDateTimeModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalConfirmButton} onPress={handleWebDateTimeConfirm}>
                  <Text style={styles.modalConfirmText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <Modal
        visible={showPickupCandidateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPickupCandidateModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, styles.modalCardTall]}>
            <Text style={styles.modalTitle}>Elige la dirección correcta</Text>
            <Text style={styles.modalHint}>Encontramos varias coincidencias. Selecciona la que coincida con la recogida.</Text>
            <ScrollView style={{ maxHeight: 360 }} keyboardShouldPersistTaps="handled">
              {pickupCandidates.map((c, idx) => (
                <TouchableOpacity
                  key={`${c.lat}-${c.lng}-${idx}`}
                  style={styles.pickupCandidateRow}
                  onPress={() => {
                    setPickupLatResolved(c.lat);
                    setPickupLngResolved(c.lng);
                    setPickupLatText(String(c.lat));
                    setPickupLngText(String(c.lng));
                    setPickupAddress(c.label);
                    setPickupResolvedLabel(c.label.trim());
                    setShowPickupCandidateModal(false);
                    setPickupCandidates([]);
                    setFeedback({ type: 'success', message: 'Ubicación seleccionada.' });
                  }}
                >
                  <Text style={styles.pickupCandidateText}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowPickupCandidateModal(false);
                  setPickupCandidates([]);
                }}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
        </>
      )}
      <PickupMapPickerModal
        visible={showPickupMapPicker}
        initialLatitude={mapPickerInitial.latitude}
        initialLongitude={mapPickerInitial.longitude}
        onClose={() => setShowPickupMapPicker(false)}
        onConfirm={handlePickupMapConfirm}
      />
      <WalkTrackingScreen
        visible={!!trackingWalkId}
        walkId={trackingWalkId}
        seed={
          trackingWalkId
            ? (() => {
                const walk = walks.find((w) => w.id === trackingWalkId);
                if (!walk) return null;
                const walker = walkWalker(walk);
                const profile = profileFromJoin(walker?.profiles ?? null);
                return {
                  pickup_address: walk.pickup_address,
                  pickup_lat: walk.pickup_lat,
                  pickup_lng: walk.pickup_lng,
                  duration_minutes: walk.duration_minutes,
                  status: walk.status,
                  walker_id: walk.walker_id,
                  petName: petNameFromJoin(walk.pets),
                  walkerName: walkerNameForWalk(walk),
                  walkerPhone: profile?.phone ?? undefined,
                  walkerLat: walker?.last_lat,
                  walkerLng: walker?.last_lng,
                  started_at: walk.started_at,
                };
              })()
            : null
        }
        contactPhone={
          profileFromJoin(walkWalker(walks.find((w) => w.id === trackingWalkId))?.profiles ?? null)?.phone
        }
        onClose={() => setTrackingWalkId(null)}
        onOpenChat={() => {
          if (trackingWalkId) setChatWalkId(trackingWalkId);
          setTrackingWalkId(null);
        }}
      />
      <WalkChatModal
        visible={!!chatWalkId}
        walkId={chatWalkId}
        otherUserId={walkWalker(walks.find((w) => w.id === chatWalkId))?.user_id}
        otherName={
          profileFromJoin(walkWalker(walks.find((w) => w.id === chatWalkId))?.profiles ?? null)
            ?.full_name ?? 'Paseador'
        }
        onClose={() => setChatWalkId(null)}
      />
    </ScrollView>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#FEF3C7',
    confirmed: '#D7F0E2',
    in_progress: '#BBF7D0',
    completed: '#A7F3D0',
    cancelled: '#F3F4F6',
  };
  return colors[status] ?? '#f3f4f6';
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function formatTimeLabel(d: Date): string {
  return d.toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTimeInputValue(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function parseDateInput(value: string, base: Date): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const parsed = new Date(y, m - 1, d, base.getHours(), base.getMinutes());
  if (parsed.getFullYear() !== y || parsed.getMonth() !== m - 1 || parsed.getDate() !== d) return null;
  return parsed;
}

function parseTimeInput(value: string, base: Date): Date | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh, mm);
}

function buildIsoFromDateTime(date: string, time: string): string | null {
  try {
    if (!date || !time) return null;
    const [y, m, d] = date.split('-').map((n) => parseInt(n, 10));
    const [hh, mm] = time.split(':').map((n) => parseInt(n, 10));
    if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null;
    if (m < 1 || m > 12 || d < 1 || d > 31 || hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
    // Hora local del usuario (ej. Bogotá); toISOString() la convierte a UTC para guardar
    const dt = new Date(y, m - 1, d, hh, mm);
    if (
      dt.getFullYear() !== y ||
      dt.getMonth() !== m - 1 ||
      dt.getDate() !== d ||
      dt.getHours() !== hh ||
      dt.getMinutes() !== mm
    ) {
      return null;
    }
    return dt.toISOString();
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.textDark,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.textDark,
  },
  subtitle: {
    fontSize: 16,
    color: '#4b5563',
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
    backgroundColor: theme.cardSurface,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 20,
    padding: 14,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textDark,
    marginBottom: 8,
  },
  pickupHint: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  pickupGpsButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: '#FAFBFC',
  },
  pickupGpsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primaryDark,
  },
  pickupActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  pickupPrimaryButton: {
    flexGrow: 1,
    minWidth: 140,
    backgroundColor: theme.primaryDark,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickupPrimaryButtonDisabled: {
    opacity: 0.7,
  },
  pickupPrimaryButtonText: {
    color: theme.textLight,
    fontSize: 15,
    fontWeight: '700',
  },
  pickupSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: '#FAFBFC',
  },
  pickupSecondaryButtonDisabled: {
    opacity: 0.65,
  },
  pickupSecondaryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.primaryDark,
  },
  pickupOkHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#047857',
    fontWeight: '600',
  },
  pickupWarnHint: {
    marginTop: 8,
    fontSize: 12,
    color: '#b45309',
    fontWeight: '600',
  },
  pickupAdvancedToggle: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
    color: theme.primaryDark,
    textDecorationLine: 'underline',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: '#FAFBFC',
  },
  chipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
  },
  chipTextActive: {
    color: theme.textLight,
    fontWeight: '700',
  },
  walkerSelectChip: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: '#FAFBFC',
  },
  walkerSelectChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  walkerChipMeta: {
    marginTop: 4,
    fontSize: 12,
    color: '#6b7280',
  },
  walkerChipMetaActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  emptyBox: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: '#FAFBFC',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  emptyBoxCentered: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  inputGroup: {
    flex: 1,
  },
  spacer: {
    width: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.textDark,
  },
  notesInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  walkerBox: {
    marginTop: 8,
    padding: 14,
    borderRadius: 20,
    backgroundColor: theme.cardSurface,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  walkerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.textDark,
    marginBottom: 4,
  },
  walkerText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  walkerPrice: {
    fontSize: 13,
    color: '#047857',
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: theme.primaryDark,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: theme.textLight,
    fontSize: 18,
    fontWeight: '600',
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputButtonText: {
    fontSize: 16,
    color: theme.textDark,
  },
  inputIcon: {
    marginRight: 8,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 20,
    backgroundColor: theme.primarySurface,
    borderRadius: 14,
    padding: 4,
  },
  feedbackBox: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  feedbackError: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  feedbackSuccess: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  feedbackText: {
    fontSize: 14,
    color: theme.textDark,
    fontWeight: '500',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 11,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  tabActive: {
    backgroundColor: theme.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primaryDark,
  },
  tabTextActive: {
    color: theme.textLight,
  },
  historyTabs: {
    flexDirection: 'row',
    backgroundColor: theme.primarySurface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  historyTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 11,
    alignItems: 'center',
  },
  historyTabActive: {
    backgroundColor: theme.primary,
  },
  historyTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primaryDark,
  },
  historyTabTextActive: {
    color: theme.textLight,
  },
  historialSection: {
    marginTop: 8,
  },
  walkCard: {
    backgroundColor: theme.cardSurface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  walkCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  walkCardPet: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.textDark,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.textDark,
  },
  walkCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  walkCardMetaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  walkCardDuration: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },
  walkCardPickup: {
    fontSize: 13,
    color: '#374151',
    marginBottom: 4,
  },
  walkCardNotes: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.textDark,
    marginTop: 12,
    marginBottom: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  modalCardTall: {
    maxHeight: 560,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textDark,
    marginBottom: 12,
  },
  modalHint: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 10,
    lineHeight: 18,
  },
  pickupCandidateRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: '#FAFBFC',
    marginBottom: 8,
  },
  pickupCandidateText: {
    fontSize: 14,
    color: theme.textDark,
    lineHeight: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 4,
  },
  modalInput: {
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.textDark,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
  },
  modalCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  modalCancelText: {
    color: '#4b5563',
    fontSize: 14,
    fontWeight: '600',
  },
  modalConfirmButton: {
    backgroundColor: theme.primaryDark,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  modalConfirmText: {
    color: theme.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
  walkActionPrimary: {
    backgroundColor: theme.primary,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  walkActionPrimaryText: {
    color: theme.textLight,
    fontWeight: '700',
    fontSize: 13,
  },
  walkAction: {
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  walkActionText: {
    color: theme.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
  walkActionDanger: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  walkActionDangerText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 13,
  },
});

