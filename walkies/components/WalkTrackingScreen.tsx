import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { haversineKm, toCoord } from '../lib/geo';
import { callPhone } from '../lib/phone';
import { petNameFromJoin, profileFromJoin, walkElapsedLabel, walkerDisplayName } from '../lib/walkDisplay';
import { TrackingMap } from './TrackingMap';

export type TrackingSeed = {
  pickup_address?: string | null;
  pickup_lat?: number | null;
  pickup_lng?: number | null;
  started_at?: string | null;
  duration_minutes?: number;
  status?: string;
  walker_id?: string | null;
  petName?: string;
  walkerName?: string;
  walkerPhone?: string | null;
  walkerLat?: number | null;
  walkerLng?: number | null;
};

type Props = {
  visible: boolean;
  walkId: string | null;
  seed?: TrackingSeed | null;
  onClose: () => void;
  onOpenChat?: () => void;
  contactPhone?: string | null;
};

type TrackingData = {
  pickup_address: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  started_at: string | null;
  duration_minutes: number;
  status: string;
  walkerId: string | null;
  petName: string;
  walkerName: string;
  walkerPhone: string | null;
  walkerLat: number | null;
  walkerLng: number | null;
};

const WALK_SELECTS = [
  'id, pickup_address, pickup_lat, pickup_lng, started_at, scheduled_at, duration_minutes, status, walker_id, pets(name), walkers(user_id, last_lat, last_lng, profiles(full_name, phone))',
  'id, pickup_address, pickup_lat, pickup_lng, started_at, duration_minutes, status, walker_id, pets(name)',
  'id, pickup_address, pickup_lat, pickup_lng, duration_minutes, status, walker_id, pets(name)',
  'id, pickup_address, pickup_lat, pickup_lng, duration_minutes, status, walker_id',
];

function bestWalkerName(...names: (string | null | undefined)[]): string {
  for (const name of names) {
    const pretty = walkerDisplayName(name);
    if (pretty) return pretty;
  }
  return 'Paseador';
}

function walkerFromJoin(walkers: unknown): {
  name?: string;
  phone?: string | null;
  lat?: number | null;
  lng?: number | null;
} {
  const raw = Array.isArray(walkers) ? walkers[0] : walkers;
  if (!raw || typeof raw !== 'object') return {};
  const rec = raw as {
    last_lat?: unknown;
    last_lng?: unknown;
    profiles?: { full_name?: string | null; phone?: string | null } | { full_name?: string | null; phone?: string | null }[] | null;
  };
  const profile = profileFromJoin(rec.profiles ?? null);
  const coords = toCoord(rec.last_lat, rec.last_lng);
  return {
    name: walkerDisplayName(profile?.full_name) ?? undefined,
    phone: profile?.phone ?? null,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
  };
}

function mergeTracking(prev: TrackingData | null, next: TrackingData): TrackingData {
  if (!prev) return next;
  return {
    ...next,
    walkerName: bestWalkerName(next.walkerName, prev.walkerName),
    walkerPhone: next.walkerPhone ?? prev.walkerPhone,
    started_at: next.started_at ?? prev.started_at,
    walkerLat: next.walkerLat ?? prev.walkerLat,
    walkerLng: next.walkerLng ?? prev.walkerLng,
  };
}

function seedToData(seed: TrackingSeed): TrackingData {
  const pickup = toCoord(seed.pickup_lat, seed.pickup_lng);
  const walker = toCoord(seed.walkerLat, seed.walkerLng);
  return {
    pickup_address: seed.pickup_address ?? null,
    pickup_lat: pickup?.lat ?? null,
    pickup_lng: pickup?.lng ?? null,
    started_at: seed.started_at ?? null,
    duration_minutes: seed.duration_minutes ?? 30,
    status: seed.status ?? 'in_progress',
    walkerId: seed.walker_id ?? null,
    petName: seed.petName?.trim() || 'Mascota',
    walkerName: bestWalkerName(seed.walkerName),
    walkerPhone: seed.walkerPhone ?? null,
    walkerLat: walker?.lat ?? null,
    walkerLng: walker?.lng ?? null,
  };
}

export function WalkTrackingScreen({
  visible,
  walkId,
  seed,
  onClose,
  onOpenChat,
  contactPhone,
}: Props) {
  const insets = useSafeAreaInsets();
  const seedRef = useRef(seed);
  seedRef.current = seed;
  const localStarts = useRef<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TrackingData | null>(null);
  const [now, setNow] = useState(Date.now());

  const applyWalkerLocation = useCallback((lat: unknown, lng: unknown) => {
    const coords = toCoord(lat, lng);
    setData((prev) =>
      prev
        ? {
            ...prev,
            walkerLat: coords?.lat ?? null,
            walkerLng: coords?.lng ?? null,
          }
        : prev,
    );
  }, []);

  const loadWalker = useCallback(
    async (walkerId: string) => {
      type WalkerRow = {
        last_lat?: unknown;
        last_lng?: unknown;
        user_id?: string;
        profiles?: { full_name?: string | null; phone?: string | null } | { full_name?: string | null; phone?: string | null }[] | null;
      };
      let walker: WalkerRow | null = null;
      const withProfile = await supabase
        .from('walkers')
        .select('last_lat, last_lng, user_id, profiles(full_name, phone)')
        .eq('id', walkerId)
        .maybeSingle();
      if (!withProfile.error && withProfile.data) {
        walker = withProfile.data as unknown as WalkerRow;
      } else {
        const basic = await supabase
          .from('walkers')
          .select('last_lat, last_lng, user_id')
          .eq('id', walkerId)
          .maybeSingle();
        walker = (basic.data as unknown as WalkerRow | null) ?? null;
      }
      if (!walker) return;
      applyWalkerLocation(walker.last_lat, walker.last_lng);

      let name: string | null = walkerDisplayName(profileFromJoin(walker.profiles ?? null)?.full_name);
      let phone: string | null = profileFromJoin(walker.profiles ?? null)?.phone ?? null;
      if (!name && walker.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('id', walker.user_id)
          .maybeSingle();
        name = walkerDisplayName(profile?.full_name);
        phone = profile?.phone ?? phone;
      }

      setData((prev) =>
        prev
          ? {
              ...prev,
              walkerName: bestWalkerName(name, prev.walkerName),
              walkerPhone: phone ?? prev.walkerPhone,
            }
          : prev,
      );
    },
    [applyWalkerLocation],
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (!walkId) return;
      if (!isRefresh && !seedRef.current) {
        setLoading(true);
        setError(null);
      }

      let row: Record<string, unknown> | null = null;
      for (const select of WALK_SELECTS) {
        const res = await supabase.from('walks').select(select).eq('id', walkId).maybeSingle();
        if (!res.error && res.data) {
          row = res.data as unknown as Record<string, unknown>;
          break;
        }
      }

      if (!row) {
        if (seedRef.current) {
          const fallback = seedToData(seedRef.current);
          setData((prev) => mergeTracking(prev, fallback));
          setLoading(false);
          setError(null);
          if (fallback.walkerId) await loadWalker(fallback.walkerId);
          return;
        }
        setError('No se pudo cargar el paseo. Cierra y vuelve a entrar, o revisa que el paseo esté en curso.');
        setLoading(false);
        return;
      }

      const joined = walkerFromJoin(row.walkers);
      const pickup = toCoord(row.pickup_lat, row.pickup_lng);
      const walkerCoords = toCoord(
        joined.lat ?? seedRef.current?.walkerLat,
        joined.lng ?? seedRef.current?.walkerLng,
      );
      const next: TrackingData = {
        pickup_address: (row.pickup_address as string | null) ?? null,
        pickup_lat: pickup?.lat ?? null,
        pickup_lng: pickup?.lng ?? null,
        started_at:
          (row.started_at as string | null) ??
          seedRef.current?.started_at ??
          null,
        duration_minutes: Number(row.duration_minutes ?? 30),
        status: String(row.status ?? 'in_progress'),
        walkerId: (row.walker_id as string | null) ?? seedRef.current?.walker_id ?? null,
        petName:
          petNameFromJoin(row.pets as { name: string } | { name: string }[] | null) ||
          seedRef.current?.petName ||
          'Mascota',
        walkerName: bestWalkerName(joined.name, seedRef.current?.walkerName),
        walkerPhone: joined.phone ?? seedRef.current?.walkerPhone ?? null,
        walkerLat: walkerCoords?.lat ?? null,
        walkerLng: walkerCoords?.lng ?? null,
      };
      setData((prev) => mergeTracking(prev, next));
      setError(null);
      setLoading(false);
      if (next.walkerId) await loadWalker(next.walkerId);
    },
    [walkId, loadWalker],
  );

  useEffect(() => {
    if (!visible || !walkId) {
      setData(null);
      setError(null);
      setLoading(true);
      return;
    }
    if (seedRef.current) {
      const seeded = seedToData(seedRef.current);
      if (!seeded.started_at && localStarts.current[walkId]) {
        seeded.started_at = localStarts.current[walkId];
      }
      setData(seeded);
      setLoading(false);
      setError(null);
    }
    void load(!!seedRef.current);
    const poll = setInterval(() => void load(true), 3000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
    };
  }, [visible, walkId, load]);

  useEffect(() => {
    if (!visible || !walkId || !data || data.status !== 'in_progress') return;
    if (data.started_at) {
      localStarts.current[walkId] = data.started_at;
      return;
    }
    const iso = localStarts.current[walkId] ?? new Date().toISOString();
    localStarts.current[walkId] = iso;
    setData((prev) => (prev && !prev.started_at ? { ...prev, started_at: iso } : prev));
  }, [visible, walkId, data?.started_at, data?.status]);

  useEffect(() => {
    const walkerId = data?.walkerId;
    if (!visible || !walkerId) return;
    const channel = supabase
      .channel(`walker-live-${walkerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'walkers', filter: `id=eq.${walkerId}` },
        (payload) => {
          const row = payload.new as { last_lat?: number | null; last_lng?: number | null };
          applyWalkerLocation(row.last_lat, row.last_lng);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [visible, data?.walkerId, applyWalkerLocation]);

  const elapsed = walkElapsedLabel(data?.started_at, now);
  const shownWalkerName = walkerDisplayName(data?.walkerName);

  const remainingKm =
    data?.pickup_lat != null &&
    data?.pickup_lng != null &&
    data.walkerLat != null &&
    data.walkerLng != null
      ? haversineKm(data.walkerLat, data.walkerLng, data.pickup_lat, data.pickup_lng)
      : null;

  const openMaps = () => {
    if (data?.pickup_lat == null || data?.pickup_lng == null) return;
    const q = `${data.pickup_lat},${data.pickup_lng}`;
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Paseo en curso</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={24} color={theme.textDark} />
          </TouchableOpacity>
        </View>

        {loading && !data ? (
          <View style={styles.centered}>
            <ActivityIndicator color={theme.primary} />
            <Text style={styles.muted}>Cargando seguimiento...</Text>
          </View>
        ) : error && !data ? (
          <View style={styles.centered}>
            <Text style={styles.muted}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => void load(false)}>
              <Text style={styles.primaryBtnText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : data ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            {data.pickup_lat != null && data.pickup_lng != null ? (
              <TrackingMap
                pickupLat={data.pickup_lat}
                pickupLng={data.pickup_lng}
                walkerLat={data.walkerLat}
                walkerLng={data.walkerLng}
              />
            ) : (
              <View style={styles.mapFallback}>
                <Text style={styles.mapFallbackText}>
                  Este paseo no tiene punto de recogida. El mapa aparece cuando el dueño agenda con dirección.
                </Text>
              </View>
            )}

            <View style={styles.liveRow}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>
                {data.walkerLat != null
                  ? 'Ubicación del paseador en vivo (se actualiza cada 3 s)'
                  : 'Esperando GPS del paseador…'}
              </Text>
            </View>

            {Platform.OS !== 'android' && Platform.OS !== 'web' ? (
              <TouchableOpacity style={styles.mapFallback} onPress={openMaps}>
                <MaterialCommunityIcons name="map-marker-radius" size={22} color={theme.primary} />
                <Text style={styles.mapFallbackText}>Abrir punto de recogida en Google Maps</Text>
              </TouchableOpacity>
            ) : null}

            <View style={styles.card}>
              <Text style={styles.pet}>{data.petName}</Text>
              <Text style={styles.meta}>
                {shownWalkerName ? `Paseador ${shownWalkerName}` : 'Paseador'}
              </Text>
              {data.pickup_address ? (
                <Text style={styles.meta} numberOfLines={2}>
                  Recogida: {data.pickup_address}
                </Text>
              ) : null}
              {data.walkerLat == null ? (
                <Text style={styles.warn}>
                  El paseador debe tener la app abierta, con GPS activo, y el paseo en estado “En curso”.
                </Text>
              ) : null}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Tiempo</Text>
                <Text style={styles.statValue}>{elapsed}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Distancia</Text>
                <Text style={styles.statValue}>
                  {remainingKm != null ? `${remainingKm.toFixed(1)} km` : '—'}
                </Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statLabel}>Duración</Text>
                <Text style={styles.statValue}>{data.duration_minutes} min</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => callPhone(contactPhone ?? data.walkerPhone)}
              >
                <MaterialIcons name="call" size={18} color={theme.textLight} />
                <Text style={styles.primaryBtnText}>Llamar</Text>
              </TouchableOpacity>
              {onOpenChat ? (
                <TouchableOpacity style={styles.outlineBtn} onPress={onOpenChat}>
                  <MaterialCommunityIcons name="message-text-outline" size={18} color={theme.primary} />
                  <Text style={styles.outlineBtnText}>Chat</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </ScrollView>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.background,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.textDark,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  muted: {
    color: theme.textMuted,
    textAlign: 'center',
  },
  warn: {
    marginTop: 8,
    fontSize: 13,
    color: '#b45309',
    fontWeight: '600',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
  },
  liveText: {
    flex: 1,
    fontSize: 12,
    color: theme.primaryDark,
    fontWeight: '600',
  },
  card: {
    backgroundColor: theme.cardSurface,
    borderRadius: 18,
    padding: 14,
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  pet: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.textDark,
  },
  meta: {
    marginTop: 4,
    color: theme.textMuted,
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  stat: {
    flex: 1,
    backgroundColor: theme.primarySurface,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: theme.textMuted,
  },
  statValue: {
    marginTop: 4,
    fontSize: 16,
    fontWeight: '700',
    color: theme.primaryDark,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 12,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: theme.primary,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  retryBtn: {
    backgroundColor: theme.primary,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    alignSelf: 'center',
  },
  primaryBtnText: {
    color: theme.textLight,
    fontWeight: '700',
  },
  outlineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: theme.primary,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fff',
  },
  outlineBtnText: {
    color: theme.primary,
    fontWeight: '700',
  },
  mapFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.primarySurface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  mapFallbackText: {
    flex: 1,
    color: theme.primaryDark,
    fontWeight: '600',
  },
});
