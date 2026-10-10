import { StatusBar } from 'expo-status-bar';
import React, { useState, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
  ViewStyle,
  TextInput,
  Modal,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useProfile } from './hooks/useProfile';
import { AuthScreen } from './screens/AuthScreen';
import { MascotasScreen } from './screens/MascotasScreen';
import { PerfilScreen } from './screens/PerfilScreen';
import { AgendarScreen } from './screens/AgendarScreen';
import { WalkerHomeScreen } from './screens/WalkerHomeScreen';
import { SplashScreen } from './screens/SplashScreen';
import { supabase } from './lib/supabase';
import { haversineKm } from './lib/geo';
import { loadDefaultPickup, type DefaultPickup } from './lib/defaultPickup';
import { styles } from './styles';
import { theme } from './theme';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WalkersMapView } from './components/WalkersMapView';
import { NotificationsBell } from './components/NotificationsBell';
import { StarRating } from './components/StarRating';
import { OwnerHomeHero } from './components/OwnerHomeHero';
import { petNameFromJoin } from './lib/walkDisplay';

type Screen = 'inicio' | 'mascotas' | 'agendar' | 'perfil';
type WalkerScreen = 'inicio' | 'perfil';

type WalkerProfileInfo = { full_name: string | null; avatar_url?: string | null };

type WalkerListItem = {
  id: string;
  user_id: string;
  bio: string | null;
  rating_avg: number | null;
  hourly_rate: number | null;
  last_lat: number | null;
  last_lng: number | null;
  profiles?: WalkerProfileInfo[] | WalkerProfileInfo | null;
  city?: string | null;
  distance_km?: number | null;
};

type WalkerFilter = 'none' | 'price_asc' | 'price_desc' | 'rating_desc' | 'distance_asc';

const FILTER_OPTIONS: { key: WalkerFilter; label: string }[] = [
  { key: 'none', label: 'Sin filtro' },
  { key: 'price_asc', label: 'Precio: menor a mayor' },
  { key: 'price_desc', label: 'Precio: mayor a menor' },
  { key: 'rating_desc', label: 'Mejor calificación' },
  { key: 'distance_asc', label: 'Más cercanos' },
];

type NavButtonProps = {
  label: string;
  isActive: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
};

function walkerName(w: WalkerListItem) {
  return (Array.isArray(w.profiles) ? w.profiles[0]?.full_name : w.profiles?.full_name)?.trim() || 'Paseador';
}

function walkerAvatar(w: WalkerListItem) {
  return Array.isArray(w.profiles) ? w.profiles[0]?.avatar_url : w.profiles?.avatar_url;
}

function formatRate(rate: number | null) {
  if (rate == null) return 'A convenir';
  return `$${Number(rate).toLocaleString('es-CO')}/h`;
}

function MainApp() {
  const insets = useSafeAreaInsets();
  const safeBottom = Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 8);
  const { session } = useAuth();
  const { profile } = useProfile();
  const displayName = (profile?.full_name?.trim() || session?.user?.email?.split('@')[0] || 'amigo').split(/\s+/)[0];
  const [screen, setScreen] = useState<Screen>('inicio');
  const [walkers, setWalkers] = useState<WalkerListItem[]>([]);
  const [walkersLoading, setWalkersLoading] = useState(false);
  const [walkerSearch, setWalkerSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<WalkerFilter>('none');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [walkerView, setWalkerView] = useState<'lista' | 'mapa'>('lista');
  const [navHeight, setNavHeight] = useState(0);
  const [defaultPickup, setDefaultPickup] = useState<DefaultPickup | null>(null);
  const [ownerCity, setOwnerCity] = useState<string | null>(null);
  const [selectedWalker, setSelectedWalker] = useState<WalkerListItem | null>(null);
  const [pendingPetId, setPendingPetId] = useState<string | null>(null);
  const [pendingWalkerId, setPendingWalkerId] = useState<string | null>(null);
  const [walkerReviews, setWalkerReviews] = useState<{ rating: number; comment: string | null }[]>([]);
  const [nextWalk, setNextWalk] = useState<{ when: string; petName: string } | null>(null);

  useEffect(() => {
    const loadWalkers = async () => {
      if (!session?.user?.id) return;
      setWalkersLoading(true);
      const savedPickup = await loadDefaultPickup(session.user.id);
      setDefaultPickup(savedPickup);
      const [walkersRes, ownerAddressRes] = await Promise.all([
        supabase
          .from('walkers')
          .select('id, user_id, bio, rating_avg, hourly_rate, last_lat, last_lng, profiles(full_name, avatar_url)'),
        supabase
          .from('addresses')
          .select('city')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (walkersRes.error) {
        setWalkers([]);
        setWalkersLoading(false);
        return;
      }

      const baseWalkers = (walkersRes.data as WalkerListItem[]) ?? [];
      const walkerUserIds = baseWalkers.map((w) => w.user_id);

      const addressesRes = walkerUserIds.length > 0
        ? await supabase
            .from('addresses')
            .select('user_id, city, created_at')
            .in('user_id', walkerUserIds)
            .order('created_at', { ascending: false })
        : { data: [], error: null };

      const ownerCityValue = ownerAddressRes.data?.city?.trim() ?? null;
      setOwnerCity(ownerCityValue);
      const cityByUserId = new Map<string, string | null>();
      if (!addressesRes.error) {
        for (const row of (addressesRes.data as { user_id: string; city: string | null }[])) {
          if (!cityByUserId.has(row.user_id)) {
            cityByUserId.set(row.user_id, row.city);
          }
        }
      }

      const enriched = baseWalkers.map((w) => {
        const city = cityByUserId.get(w.user_id) ?? null;
        const distance_km =
          savedPickup && w.last_lat != null && w.last_lng != null
            ? haversineKm(savedPickup.lat, savedPickup.lng, w.last_lat, w.last_lng)
            : null;
        return {
          ...w,
          city,
          distance_km,
        };
      });
      setWalkers(enriched);
      setWalkersLoading(false);

      const walksRes = await supabase
        .from('walks')
        .select('scheduled_at, status, pets(name, owner_id)')
        .eq('pets.owner_id', session.user.id)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (!walksRes.error && walksRes.data) {
        const d = new Date(walksRes.data.scheduled_at);
        setNextWalk({
          petName: petNameFromJoin(walksRes.data.pets as { name: string } | { name: string }[] | null),
          when: d.toLocaleString('es-CO', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }),
        });
      } else {
        setNextWalk(null);
      }
    };

    loadWalkers();
  }, [session?.user?.id]);

  const filteredWalkers = useMemo(() => {
    const term = walkerSearch.trim().toLowerCase();
    const bySearch = walkers.filter((w) => {
      const fullName = walkerName(w).toLowerCase();
      const bio = w.bio?.toLowerCase() ?? '';
      const city = w.city?.toLowerCase() ?? '';
      return !term || fullName.includes(term) || bio.includes(term) || city.includes(term);
    });

    const sorted = [...bySearch];
    sorted.sort((a, b) => {
      switch (selectedFilter) {
        case 'price_asc':
          return (a.hourly_rate ?? Number.MAX_SAFE_INTEGER) - (b.hourly_rate ?? Number.MAX_SAFE_INTEGER);
        case 'price_desc':
          return (b.hourly_rate ?? 0) - (a.hourly_rate ?? 0);
        case 'rating_desc':
          return (b.rating_avg ?? 0) - (a.rating_avg ?? 0);
        case 'distance_asc':
          return (a.distance_km ?? Number.MAX_SAFE_INTEGER) - (b.distance_km ?? Number.MAX_SAFE_INTEGER);
        default:
          return 0;
      }
    });
    return sorted;
  }, [walkers, walkerSearch, selectedFilter]);

  useEffect(() => {
    if (!selectedWalker) {
      setWalkerReviews([]);
      return;
    }
    supabase
      .from('reviews')
      .select('rating, comment')
      .eq('walker_id', selectedWalker.id)
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setWalkerReviews((data as { rating: number; comment: string | null }[]) ?? []);
      });
  }, [selectedWalker?.id]);

  const goToAgendar = (opts?: { petId?: string; walkerId?: string }) => {
    setPendingPetId(opts?.petId ?? null);
    setPendingWalkerId(opts?.walkerId ?? selectedWalker?.id ?? null);
    setSelectedWalker(null);
    setScreen('agendar');
  };

  const renderWalkerCard = (w: WalkerListItem) => {
    const avatar = walkerAvatar(w);
    const available = w.last_lat != null && w.last_lng != null;
    return (
      <TouchableOpacity key={w.id} style={styles.walkerCard} activeOpacity={0.85} onPress={() => setSelectedWalker(w)}>
        <View style={styles.walkerAvatar}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.walkerAvatarImage} />
          ) : (
            <MaterialCommunityIcons name="account" size={28} color={theme.primaryDark} />
          )}
        </View>
        <View style={styles.walkerInfo}>
          <View style={styles.walkerNameRow}>
            <Text style={styles.walkerName}>{walkerName(w)}</Text>
            <Text style={styles.walkerPrice}>{formatRate(w.hourly_rate)}</Text>
          </View>
          <View style={styles.walkerRatingRow}>
            <MaterialIcons name="star" size={14} color="#F5B301" />
            <Text style={styles.walkerMeta}>
              {(w.rating_avg != null && w.rating_avg > 0) ? Number(w.rating_avg).toFixed(1) : 'Nuevo'}
              {w.distance_km != null ? `  ·  ${w.distance_km.toFixed(1)} km` : ''}
              {w.city?.trim() ? `  ·  ${w.city.trim()}` : ''}
            </Text>
          </View>
          <Text style={styles.walkerMeta} numberOfLines={2}>
            {w.bio?.trim() || 'Paseador de confianza. Paseos seguros y con cariño.'}
          </Text>
          {available ? (
            <View style={styles.availableBadge}>
              <Text style={styles.availableBadgeText}>Disponible hoy</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  const renderContent = () => {
    switch (screen) {
      case 'inicio':
        return (
          <ScrollView style={styles.content} contentContainerStyle={styles.homeContent}>
            <OwnerHomeHero
              displayName={displayName}
              locationLabel={
                defaultPickup?.address?.trim() || ownerCity || 'Define un punto de recogida al agendar un paseo'
              }
              nextWalk={nextWalk}
              onRequestWalk={() => goToAgendar()}
              onOpenPets={() => setScreen('mascotas')}
              onOpenWalks={() => setScreen('agendar')}
            />

            <Text style={styles.screenTitle}>Paseadores cercanos</Text>
            <Text style={styles.screenSubtitle}>Elige a alguien de confianza cerca de ti</Text>

            <View style={styles.walkerControlsRow}>
              <View style={styles.walkerSearchBox}>
                <MaterialIcons name="search" size={18} color={theme.textMuted} />
                <TextInput
                  style={styles.walkerSearchInput}
                  placeholder="Buscar por nombre, ciudad o bio"
                  placeholderTextColor={theme.textMuted}
                  value={walkerSearch}
                  onChangeText={setWalkerSearch}
                />
              </View>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilterOptions((v) => !v)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="tune-variant" size={18} color={theme.primaryDark} />
              </TouchableOpacity>
            </View>
            {showFilterOptions ? (
              <View style={styles.filterOptionsWrap}>
                {FILTER_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.filterOptionChip, selectedFilter === opt.key && styles.filterOptionChipActive]}
                    onPress={() => {
                      setSelectedFilter(opt.key);
                      setShowFilterOptions(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterOptionChipText,
                        selectedFilter === opt.key && styles.filterOptionChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}

            <View style={styles.segmented}>
              <TouchableOpacity
                style={[styles.segment, walkerView === 'lista' && styles.segmentActive]}
                onPress={() => setWalkerView('lista')}
              >
                <Text style={[styles.segmentText, walkerView === 'lista' && styles.segmentTextActive]}>Lista</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, walkerView === 'mapa' && styles.segmentActive]}
                onPress={() => setWalkerView('mapa')}
              >
                <Text style={[styles.segmentText, walkerView === 'mapa' && styles.segmentTextActive]}>Mapa</Text>
              </TouchableOpacity>
            </View>

            {walkersLoading ? (
              <View style={styles.walkerCard}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.walkerMeta, { marginLeft: 10 }]}>Cargando paseadores...</Text>
              </View>
            ) : filteredWalkers.length === 0 ? (
              <View style={styles.walkerCard}>
                <View style={styles.walkerAvatar}>
                  <MaterialCommunityIcons name="walk" size={26} color={theme.primaryDark} />
                </View>
                <View style={styles.walkerInfo}>
                  <Text style={styles.walkerName}>
                    {walkers.length === 0 ? 'Sin paseadores registrados' : 'Sin resultados'}
                  </Text>
                  <Text style={styles.walkerMeta}>
                    {walkers.length === 0
                      ? 'Cuando haya paseadores, aparecerán aquí.'
                      : 'Intenta con otro texto de búsqueda o cambia el filtro.'}
                  </Text>
                </View>
              </View>
            ) : walkerView === 'mapa' ? (
              <View>
                <WalkersMapView
                  walkers={filteredWalkers
                    .filter((w) => w.last_lat != null && w.last_lng != null)
                    .map((w) => ({
                      id: w.id,
                      name: walkerName(w),
                      lat: w.last_lat as number,
                      lng: w.last_lng as number,
                      rating: w.rating_avg,
                      rateLabel: formatRate(w.hourly_rate),
                    }))}
                  centerLat={defaultPickup?.lat}
                  centerLng={defaultPickup?.lng}
                  onSelect={(id) => {
                    const found = filteredWalkers.find((w) => w.id === id);
                    if (found) setSelectedWalker(found);
                  }}
                />
                {filteredWalkers.map(renderWalkerCard)}
              </View>
            ) : (
              filteredWalkers.map(renderWalkerCard)
            )}
          </ScrollView>
        );
      case 'mascotas':
        return <MascotasScreen onRequestWalk={(petId) => goToAgendar({ petId })} />;
      case 'agendar':
        return <AgendarScreen initialPetId={pendingPetId} initialWalkerId={pendingWalkerId} />;
      case 'perfil':
        return <PerfilScreen />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.mainAppWrapper, Platform.OS === 'web' && ({ minHeight: '100vh' } as unknown as ViewStyle)]}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={[styles.contentArea, { paddingBottom: Math.max(navHeight, 86) + 8 }]}>
          <View style={{ alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4 }}>
            <NotificationsBell />
          </View>
          {renderContent()}
        </View>

        <View
          style={[styles.navbar, { bottom: 0, paddingBottom: 8 + safeBottom }]}
          onLayout={(e) => setNavHeight(e.nativeEvent.layout.height)}
        >
          <NavButton
            label="Inicio"
            isActive={screen === 'inicio'}
            onPress={() => setScreen('inicio')}
            icon={
              <MaterialIcons
                name="home-filled"
                size={22}
                color={screen === 'inicio' ? theme.primary : theme.navInactive}
              />
            }
          />
          <NavButton
            label="Mascotas"
            isActive={screen === 'mascotas'}
            onPress={() => setScreen('mascotas')}
            icon={
              <MaterialCommunityIcons
                name="paw"
                size={22}
                color={screen === 'mascotas' ? theme.primary : theme.navInactive}
              />
            }
          />
          <NavButton
            label="Paseos"
            isActive={screen === 'agendar'}
            onPress={() => setScreen('agendar')}
            icon={
              <MaterialIcons
                name="calendar-today"
                size={20}
                color={screen === 'agendar' ? theme.primary : theme.navInactive}
              />
            }
          />
          <NavButton
            label="Perfil"
            isActive={screen === 'perfil'}
            onPress={() => setScreen('perfil')}
            icon={
              <MaterialIcons
                name={screen === 'perfil' ? 'person' : 'person-outline'}
                size={22}
                color={screen === 'perfil' ? theme.primary : theme.navInactive}
              />
            }
          />
        </View>
      </SafeAreaView>

      <Modal
        visible={!!selectedWalker}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedWalker(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalSheet, { paddingBottom: 24 + safeBottom }]}>
            <View style={styles.modalHandle} />
            {selectedWalker ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 16 }}>
                  <View style={[styles.walkerAvatar, { width: 96, height: 96, borderRadius: 48, marginRight: 0 }]}>
                    {walkerAvatar(selectedWalker) ? (
                      <Image
                        source={{ uri: walkerAvatar(selectedWalker)! }}
                        style={{ width: 96, height: 96, borderRadius: 48 }}
                      />
                    ) : (
                      <MaterialCommunityIcons name="account" size={48} color={theme.primaryDark} />
                    )}
                  </View>
                  <Text style={[styles.screenTitle, { fontSize: 24, marginTop: 12 }]}>{walkerName(selectedWalker)}</Text>
                  <View style={[styles.walkerRatingRow, { marginTop: 6 }]}>
                    <MaterialIcons name="star" size={16} color="#F5B301" />
                    <Text style={styles.walkerMeta}>
                      {(selectedWalker.rating_avg != null && selectedWalker.rating_avg > 0)
                        ? `${Number(selectedWalker.rating_avg).toFixed(1)} en valoraciones`
                        : 'Nuevo en Walkies'}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  <View style={styles.availableBadge}>
                    <Text style={styles.availableBadgeText}>{formatRate(selectedWalker.hourly_rate)}</Text>
                  </View>
                  {selectedWalker.distance_km != null ? (
                    <View style={styles.availableBadge}>
                      <Text style={styles.availableBadgeText}>{selectedWalker.distance_km.toFixed(1)} km</Text>
                    </View>
                  ) : null}
                  {selectedWalker.city?.trim() ? (
                    <View style={styles.availableBadge}>
                      <Text style={styles.availableBadgeText}>{selectedWalker.city.trim()}</Text>
                    </View>
                  ) : null}
                  {selectedWalker.last_lat != null ? (
                    <View style={styles.availableBadge}>
                      <Text style={styles.availableBadgeText}>Disponible hoy</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.sectionTitle}>Sobre mí</Text>
                <Text style={[styles.paragraph, { fontSize: 15, lineHeight: 22, marginBottom: 16 }]}>
                  {selectedWalker.bio?.trim() ||
                    'Paseador de confianza, atento y con experiencia cuidando perros de distintos tamaños.'}
                </Text>

                <Text style={styles.sectionTitle}>Reseñas</Text>
                {walkerReviews.length === 0 ? (
                  <Text style={[styles.walkerMeta, { marginBottom: 20 }]}>Aún no tiene valoraciones.</Text>
                ) : (
                  <View style={{ marginBottom: 20, gap: 10 }}>
                    {walkerReviews.map((review, idx) => (
                      <View key={`${review.rating}-${idx}`}>
                        <StarRating value={review.rating} size={18} />
                        {review.comment ? <Text style={styles.walkerMeta}>{review.comment}</Text> : null}
                      </View>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  style={{
                    backgroundColor: theme.primary,
                    borderRadius: 999,
                    paddingVertical: 15,
                    alignItems: 'center',
                    marginBottom: 10,
                  }}
                  onPress={() => goToAgendar({ walkerId: selectedWalker.id })}
                  activeOpacity={0.9}
                >
                  <Text style={{ color: theme.textLight, fontSize: 16, fontWeight: '700' }}>
                    Solicitar este paseador
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ paddingVertical: 12, alignItems: 'center' }}
                  onPress={() => setSelectedWalker(null)}
                >
                  <Text style={{ color: theme.textMuted, fontWeight: '600' }}>Cerrar</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function WalkerApp() {
  const insets = useSafeAreaInsets();
  const safeBottom = Platform.OS === 'ios' ? insets.bottom : Math.max(insets.bottom, 8);
  const [screen, setScreen] = useState<WalkerScreen>('inicio');
  const [navHeight, setNavHeight] = useState(0);

  return (
    <View style={[styles.mainAppWrapper, Platform.OS === 'web' && ({ minHeight: '100vh' } as unknown as ViewStyle)]}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={[styles.contentArea, { paddingBottom: Math.max(navHeight, 86) + 8 }]}>
          <View style={{ alignItems: 'flex-end', paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4 }}>
            <NotificationsBell />
          </View>
          {screen === 'inicio' ? (
            <WalkerHomeScreen onOpenProfile={() => setScreen('perfil')} />
          ) : (
            <PerfilScreen />
          )}
        </View>
        <View
          style={[styles.navbar, { bottom: 0, paddingBottom: 8 + safeBottom }]}
          onLayout={(e) => setNavHeight(e.nativeEvent.layout.height)}
        >
          <NavButton
            label="Paseos"
            isActive={screen === 'inicio'}
            onPress={() => setScreen('inicio')}
            icon={
              <MaterialCommunityIcons
                name="walk"
                size={22}
                color={screen === 'inicio' ? theme.primary : theme.navInactive}
              />
            }
          />
          <NavButton
            label="Perfil"
            isActive={screen === 'perfil'}
            onPress={() => setScreen('perfil')}
            icon={
              <MaterialIcons
                name={screen === 'perfil' ? 'person' : 'person-outline'}
                size={22}
                color={screen === 'perfil' ? theme.primary : theme.navInactive}
              />
            }
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

function NavButton({ label, isActive, onPress, icon }: NavButtonProps) {
  return (
    <TouchableOpacity style={[styles.navButton, isActive && styles.navButtonActive]} onPress={onPress}>
      <View style={[styles.navButtonIconWrapper, isActive && styles.navButtonIconWrapperActive]}>{icon}</View>
      <Text style={[styles.navButtonText, isActive && styles.navButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppWithAuth />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const SPLASH_MIN_MS = 2200;

function AppWithAuth() {
  const { session, loading } = useAuth();
  const { profile } = useProfile();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }
  if (loading) {
    return (
      <View
        style={[
          styles.container,
          styles.loadingScreen,
          Platform.OS === 'web' && { minHeight: '100vh' as unknown as number },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Cargando Walkies...</Text>
      </View>
    );
  }
  if (!session) {
    return <AuthScreen />;
  }
  if (profile?.role === 'walker') {
    return <WalkerApp />;
  }
  return <MainApp />;
}
