import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { haversineKm } from '../lib/geo';
import { notifyUser } from '../lib/notify';
import { callPhone } from '../lib/phone';
import { petNameFromJoin, profileFromJoin, STATUS_LABELS } from '../lib/walkDisplay';
import { WalkTrackingScreen } from '../components/WalkTrackingScreen';
import { WalkChatModal } from '../components/WalkChatModal';
import { WalkerHomeHero } from '../components/WalkerHomeHero';

type WalkRow = {
  id: string;
  scheduled_at: string;
  started_at?: string | null;
  duration_minutes: number;
  status: string;
  pickup_address: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  pets?:
    | { name: string; owner_id?: string; profiles?: { full_name: string | null; phone: string | null } | { full_name: string | null; phone: string | null }[] }
    | { name: string; owner_id?: string; profiles?: { full_name: string | null; phone: string | null } | { full_name: string | null; phone: string | null }[] }[]
    | null;
};

const NEXT_STATUS_BY_CURRENT: Partial<Record<string, string>> = {
  pending: 'confirmed',
  confirmed: 'in_progress',
  in_progress: 'completed',
};

const STATUS_ACTION_LABELS: Record<string, string> = {
  confirmed: 'Confirmar paseo',
  in_progress: 'Iniciar paseo',
  completed: 'Marcar completado',
};

type WalkerHomeScreenProps = {
  onOpenProfile?: () => void;
};

export function WalkerHomeScreen({ onOpenProfile }: WalkerHomeScreenProps) {
  const insets = useSafeAreaInsets();
  const safeBottom = Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 24);
  const { session } = useAuth();
  const { profile } = useProfile();
  const displayName = (profile?.full_name?.trim() || session?.user?.email?.split('@')[0] || 'paseador').split(/\s+/)[0];
  const [walks, setWalks] = useState<WalkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [myLat, setMyLat] = useState<number | null>(null);
  const [myLng, setMyLng] = useState<number | null>(null);
  const [walkerId, setWalkerId] = useState<string | null>(null);
  const [trackingWalkId, setTrackingWalkId] = useState<string | null>(null);
  const [chatWalkId, setChatWalkId] = useState<string | null>(null);
  const [profileIncomplete, setProfileIncomplete] = useState(false);

  const loadWalks = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    const { data: walkerRow } = await supabase
      .from('walkers')
      .select('id')
      .eq('user_id', session.user.id)
      .maybeSingle();
    if (!walkerRow) {
      setWalks([]);
      setWalkerId(null);
      setProfileIncomplete(true);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const walkerPk = (walkerRow as { id: string }).id;
    setWalkerId(walkerPk);

    const { data: walkerProfile } = await supabase
      .from('walkers')
      .select('bio, hourly_rate')
      .eq('id', walkerPk)
      .maybeSingle();
    const wp = walkerProfile as { bio: string | null; hourly_rate: number | null } | null;
    setProfileIncomplete(!wp?.bio?.trim() || wp?.hourly_rate == null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setMyLat(pos.coords.latitude);
        setMyLng(pos.coords.longitude);
        await supabase
          .from('walkers')
          .update({
            last_lat: pos.coords.latitude,
            last_lng: pos.coords.longitude,
            last_location_at: new Date().toISOString(),
          })
          .eq('id', walkerPk);
      }
    } catch {
      // En web el navegador puede negar geolocalización; el seguimiento sigue con la última ubicación guardada.
    }

    const selects = [
      'id, scheduled_at, started_at, duration_minutes, status, pickup_address, pickup_lat, pickup_lng, pets(name, owner_id, profiles(full_name, phone))',
      'id, scheduled_at, duration_minutes, status, pickup_address, pickup_lat, pickup_lng, pets(name, owner_id, profiles(full_name, phone))',
      'id, scheduled_at, started_at, duration_minutes, status, pickup_address, pickup_lat, pickup_lng, pets(name, owner_id)',
      'id, scheduled_at, duration_minutes, status, pickup_address, pickup_lat, pickup_lng, pets(name, owner_id)',
    ];
    let data: unknown = null;
    let error: { message: string } | null = null;
    for (const select of selects) {
      const res = await supabase
        .from('walks')
        .select(select)
        .eq('walker_id', walkerPk)
        .order('scheduled_at', { ascending: false });
      data = res.data;
      error = res.error;
      if (!error) break;
    }
    setLoading(false);
    setRefreshing(false);
    if (error) {
      Alert.alert('Error', 'No se pudieron cargar los paseos.');
      return;
    }
    const rows = ((data as WalkRow[] | null) ?? []).map((row) => {
      const petRaw = row.pets as unknown;
      const pet =
        Array.isArray(petRaw) ? (petRaw[0] as WalkRow['pets']) : (petRaw as WalkRow['pets']);
      return { ...row, pets: pet } as WalkRow;
    });
    setWalks(rows);
  }, [session?.user?.id]);

  useEffect(() => {
    loadWalks();
  }, [loadWalks]);

  useEffect(() => {
    const inProgress = walks.some((w) => w.status === 'in_progress');
    if (!inProgress || !walkerId) return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted' || cancelled) return;
        sub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 3000, distanceInterval: 8 },
          (pos) => {
            setMyLat(pos.coords.latitude);
            setMyLng(pos.coords.longitude);
            void supabase
              .from('walkers')
              .update({
                last_lat: pos.coords.latitude,
                last_lng: pos.coords.longitude,
                last_location_at: new Date().toISOString(),
              })
              .eq('id', walkerId);
          },
        );
      } catch {
        // Geolocalización denegada o no disponible.
      }
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [walks, walkerId]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadWalks();
  };

  const enableLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Ubicación',
          'Activa el GPS en los permisos de la app para que el dueño pueda seguir el paseo en el mapa.',
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setMyLat(pos.coords.latitude);
      setMyLng(pos.coords.longitude);
      if (walkerId) {
        await supabase
          .from('walkers')
          .update({
            last_lat: pos.coords.latitude,
            last_lng: pos.coords.longitude,
            last_location_at: new Date().toISOString(),
          })
          .eq('id', walkerId);
      }
    } catch {
      Alert.alert('Ubicación', 'No se pudo leer el GPS. Revisa que esté encendido e inténtalo de nuevo.');
    }
  };

  const ownerFromWalk = (walk?: WalkRow | null) => {
    if (!walk) return { name: 'Mascota', ownerId: null as string | null, profile: null };
    const pet = Array.isArray(walk.pets) ? walk.pets[0] : walk.pets;
    return {
      name: petNameFromJoin(walk.pets),
      ownerId: pet?.owner_id ?? null,
      profile: profileFromJoin(pet?.profiles ?? null),
    };
  };

  const handleUpdateStatus = async (walk: WalkRow) => {
    const nextStatus = NEXT_STATUS_BY_CURRENT[walk.status];
    if (!nextStatus) return;
    setUpdatingId(walk.id);
    const extra: Record<string, string> = { status: nextStatus };
    const startedIso = new Date().toISOString();
    if (nextStatus === 'in_progress') extra.started_at = startedIso;
    if (nextStatus === 'completed') extra.completed_at = new Date().toISOString();
    let { error } = await supabase.from('walks').update(extra).eq('id', walk.id);
    if (error) {
      const retry = await supabase.from('walks').update({ status: nextStatus }).eq('id', walk.id);
      error = retry.error;
      if (!retry.error && nextStatus === 'in_progress') {
        await supabase.from('walks').update({ started_at: startedIso }).eq('id', walk.id);
      }
    }
    setUpdatingId(null);
    if (error) {
      Alert.alert('Error', 'No se pudo actualizar el estado del paseo.');
      return;
    }
    const owner = ownerFromWalk(walk);
    await notifyUser({
      userId: owner.ownerId,
      title: 'Actualización de paseo',
      body: `El paseo de ${owner.name} ahora está ${STATUS_LABELS[nextStatus] ?? nextStatus}.`,
      walkId: walk.id,
    });
    setWalks((prev) =>
      prev.map((item) =>
        item.id === walk.id
          ? {
              ...item,
              status: nextStatus,
              started_at: nextStatus === 'in_progress' ? startedIso : item.started_at,
            }
          : item,
      ),
    );
  };

  const handleCancelWalk = (walk: WalkRow) => {
    Alert.alert('Cancelar paseo', '¿Quieres cancelar este paseo?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Sí, cancelar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('walks').update({ status: 'cancelled' }).eq('id', walk.id);
          if (error) {
            Alert.alert('Error', 'No se pudo cancelar.');
            return;
          }
          const owner = ownerFromWalk(walk);
          await notifyUser({
            userId: owner.ownerId,
            title: 'Paseo cancelado',
            body: `El paseador canceló el paseo de ${owner.name}.`,
            walkId: walk.id,
          });
          void loadWalks();
        },
      },
    ]);
  };

  const pendingCount = walks.filter((w) => w.status === 'pending').length;
  const inProgressCount = walks.filter((w) => w.status === 'in_progress').length;
  const nextAssigned = [...walks]
    .filter((w) => w.status === 'pending' || w.status === 'confirmed' || w.status === 'in_progress')
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
  const nextWalk = nextAssigned
    ? {
        petName: petNameFromJoin(nextAssigned.pets),
        when: new Date(nextAssigned.scheduled_at).toLocaleString('es-CO', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
      }
    : null;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Cargando tus paseos...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: 32 + safeBottom }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
      }
    >
      <WalkerHomeHero
        displayName={displayName}
        locationOn={myLat != null && myLng != null}
        pendingCount={pendingCount}
        inProgressCount={inProgressCount}
        profileIncomplete={profileIncomplete}
        nextWalk={nextWalk}
        onOpenProfile={onOpenProfile ?? (() => {})}
        onEnableLocation={() => void enableLocation()}
      />

      <Text style={styles.sectionTitle}>Tus paseos</Text>

      {walks.length === 0 ? (
        <View style={styles.emptyBox}>
          <MaterialCommunityIcons name="dog-side" size={48} color={theme.primary} />
          <Text style={styles.emptyTitle}>Aún no tienes paseos</Text>
          <Text style={styles.emptyText}>
            Cuando un dueño te agende, la solicitud aparece aquí para confirmarla.
          </Text>
        </View>
      ) : (
        walks.map((walk) => {
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
          const owner = ownerFromWalk(walk);
          const distKm =
            myLat != null &&
            myLng != null &&
            walk.pickup_lat != null &&
            walk.pickup_lng != null
              ? haversineKm(myLat, myLng, walk.pickup_lat, walk.pickup_lng)
              : null;
          return (
            <View key={walk.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.cardPet}>{petName}</Text>
                  {owner.profile?.full_name?.trim() ? (
                    <Text style={styles.cardOwner}>Dueño: {owner.profile.full_name.trim()}</Text>
                  ) : null}
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(walk.status) }]}>
                  <Text style={styles.statusText}>{STATUS_LABELS[walk.status] ?? walk.status}</Text>
                </View>
              </View>
              <Text style={styles.cardDateTime}>{dateStr} · {timeStr}</Text>
              <Text style={styles.cardDuration}>{walk.duration_minutes} min</Text>
              {walk.pickup_address ? (
                <Text style={styles.cardPickup} numberOfLines={2}>
                  Recogida: {walk.pickup_address}
                </Text>
              ) : null}
              {distKm != null ? (
                <Text style={styles.cardDistance}>Distancia a recogida: {distKm.toFixed(1)} km</Text>
              ) : (
                <Text style={styles.cardDistanceMuted}>
                  Activa ubicación para ver distancia real a la recogida.
                </Text>
              )}
              {NEXT_STATUS_BY_CURRENT[walk.status] ? (
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    updatingId === walk.id && styles.actionButtonDisabled,
                  ]}
                  onPress={() => handleUpdateStatus(walk)}
                  disabled={updatingId === walk.id}
                  activeOpacity={0.85}
                >
                  {updatingId === walk.id ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.actionButtonText}>
                      {STATUS_ACTION_LABELS[NEXT_STATUS_BY_CURRENT[walk.status] ?? ''] ?? 'Actualizar estado'}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null}
              <View style={styles.secondaryRow}>
                {walk.status === 'in_progress' ? (
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setTrackingWalkId(walk.id)}>
                    <Text style={styles.secondaryBtnText}>Seguimiento</Text>
                  </TouchableOpacity>
                ) : null}
                {walk.status !== 'cancelled' ? (
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setChatWalkId(walk.id)}>
                    <Text style={styles.secondaryBtnText}>Chat</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => callPhone(owner.profile?.phone)}>
                  <Text style={styles.secondaryBtnText}>Llamar</Text>
                </TouchableOpacity>
                {walk.status === 'pending' || walk.status === 'confirmed' ? (
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleCancelWalk(walk)}>
                    <Text style={[styles.secondaryBtnText, { color: '#b91c1c' }]}>Cancelar</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })
      )}
      <WalkTrackingScreen
        visible={!!trackingWalkId}
        walkId={trackingWalkId}
        seed={
          trackingWalkId
            ? (() => {
                const walk = walks.find((w) => w.id === trackingWalkId);
                if (!walk) return null;
                const owner = ownerFromWalk(walk);
                return {
                  pickup_address: walk.pickup_address,
                  pickup_lat: walk.pickup_lat,
                  pickup_lng: walk.pickup_lng,
                  duration_minutes: walk.duration_minutes,
                  status: walk.status,
                  walker_id: walkerId,
                  petName: owner.name,
                  walkerName: 'Tú',
                  walkerPhone: null,
                  walkerLat: myLat,
                  walkerLng: myLng,
                  started_at: walk.started_at,
                };
              })()
            : null
        }
        onClose={() => setTrackingWalkId(null)}
        onOpenChat={() => {
          if (trackingWalkId) setChatWalkId(trackingWalkId);
          setTrackingWalkId(null);
        }}
        contactPhone={ownerFromWalk(walks.find((w) => w.id === trackingWalkId)).profile?.phone}
      />
      <WalkChatModal
        visible={!!chatWalkId}
        walkId={chatWalkId}
        otherUserId={ownerFromWalk(walks.find((w) => w.id === chatWalkId)).ownerId}
        otherName="Dueño"
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 24, paddingVertical: 16, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.textDark,
    marginBottom: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: { marginTop: 12, fontSize: 16, color: theme.textDark },
  emptyBox: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: theme.primarySurface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: theme.textDark, marginTop: 12, marginBottom: 4 },
  emptyText: { fontSize: 14, color: theme.textMuted, textAlign: 'center', lineHeight: 20 },
  card: {
    backgroundColor: theme.cardSurface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardPet: { fontSize: 17, fontWeight: '700', color: theme.textDark },
  cardOwner: { fontSize: 13, color: theme.textMuted, marginTop: 2 },
  statusBadge: {
    backgroundColor: theme.primarySurface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: { fontSize: 12, fontWeight: '600', color: theme.textDark },
  cardDateTime: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  cardDuration: { fontSize: 13, color: '#4b5563' },
  cardPickup: { fontSize: 13, color: '#374151', marginTop: 4 },
  cardDistance: { fontSize: 13, color: '#047857', marginTop: 4, fontWeight: '600' },
  cardDistanceMuted: { fontSize: 12, color: '#9ca3af', marginTop: 4 },
  actionButton: {
    marginTop: 10,
    backgroundColor: theme.primary,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: theme.textLight,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#fff',
  },
  secondaryBtnText: {
    color: theme.primaryDark,
    fontWeight: '700',
    fontSize: 13,
  },
});
