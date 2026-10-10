import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../lib/supabase';
import { theme } from '../theme';
import { uploadAvatar } from '../lib/uploadAvatar';
import { loadUserAddress, saveUserAddress } from '../lib/addresses';

type WalkerProfile = {
  bio: string | null;
  hourly_rate: number | null;
};

export function PerfilScreen() {
  const { session, signOut } = useAuth();
  const { profile, loading, refetch } = useProfile();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [walkerBio, setWalkerBio] = useState('');
  const [walkerRate, setWalkerRate] = useState('');
  const [walkerLoading, setWalkerLoading] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [addrLat, setAddrLat] = useState<number | null>(null);
  const [addrLng, setAddrLng] = useState<number | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const isWalker = profile?.role === 'walker';

  const loadWalkerProfile = useCallback(async () => {
    if (!session?.user?.id || !isWalker) return;
    setWalkerLoading(true);
    const { data } = await supabase
      .from('walkers')
      .select('bio, hourly_rate')
      .eq('user_id', session.user.id)
      .maybeSingle();
    setWalkerLoading(false);
    if (data) {
      setWalkerBio((data as WalkerProfile).bio ?? '');
      setWalkerRate(
        (data as WalkerProfile).hourly_rate != null
          ? String((data as WalkerProfile).hourly_rate)
          : ''
      );
    }
  }, [session?.user?.id, isWalker]);

  const loadAddress = useCallback(async () => {
    if (!session?.user?.id) return;
    const addr = await loadUserAddress(session.user.id);
    if (addr) {
      setStreet(addr.street ?? '');
      setCity(addr.city ?? '');
      setAddrLat(addr.lat);
      setAddrLng(addr.lng);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    loadWalkerProfile();
  }, [loadWalkerProfile]);

  useEffect(() => {
    void loadAddress();
  }, [loadAddress]);

  const startEditing = () => {
    setFullName(profile?.full_name ?? '');
    setPhone(profile?.phone ?? '');
    void loadAddress();
    if (isWalker) {
      void loadWalkerProfile();
    }
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const saveProfile = async () => {
    if (!session?.user?.id) return;
    if (isWalker) {
      const rateNum = walkerRate.trim() ? parseFloat(walkerRate.replace(',', '.')) : null;
      if (walkerRate.trim() && (rateNum == null || Number.isNaN(rateNum) || rateNum < 0)) {
        Alert.alert('Tarifa', 'Ingresa una tarifa por hora válida (número mayor o igual a 0).');
        return;
      }
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.user.id);

    if (error) {
      setSaving(false);
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
      return;
    }

    if (isWalker) {
      const rateNum = walkerRate.trim() ? parseFloat(walkerRate.replace(',', '.')) : null;
      const { data: existing } = await supabase
        .from('walkers')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      const walkerPayload = {
        bio: walkerBio.trim() || null,
        hourly_rate: rateNum,
        updated_at: new Date().toISOString(),
      };

      const walkerError = existing
        ? (
            await supabase.from('walkers').update(walkerPayload).eq('user_id', session.user.id)
          ).error
        : (
            await supabase.from('walkers').insert({ user_id: session.user.id, ...walkerPayload })
          ).error;

      if (walkerError) {
        setSaving(false);
        Alert.alert('Error', 'No se pudo guardar el perfil de paseador.');
        return;
      }
    }

    let addrError: Error | null = null;
    if (street.trim() || city.trim() || addrLat != null) {
      const addrResult = await saveUserAddress(session.user.id, {
        street,
        city,
        lat: addrLat,
        lng: addrLng,
      });
      addrError = addrResult.error;
    }
    setSaving(false);
    setEditing(false);
    refetch();
    void loadWalkerProfile();
    if (addrError) {
      Alert.alert('Dirección', 'El perfil se guardó, pero no se pudo guardar la dirección.');
    }
  };

  const pickAvatar = async () => {
    if (!session?.user?.id) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso', 'Necesitamos acceso a la galería para la foto de perfil.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(session.user.id, result.assets[0].uri);
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: url, updated_at: new Date().toISOString() })
        .eq('id', session.user.id);
      if (error) throw error;
      refetch();
    } catch {
      Alert.alert('Foto', 'No se pudo subir la foto. Revisa el bucket pet-photos.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const fillAddressFromGps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ubicación', 'Activa el permiso de ubicación.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setAddrLat(pos.coords.latitude);
      setAddrLng(pos.coords.longitude);
      const [rev] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (rev) {
        const line = [rev.streetNumber, rev.street].filter(Boolean).join(' ');
        if (line) setStreet(line);
        if (rev.city) setCity(rev.city);
      }
    } catch {
      Alert.alert('Ubicación', 'No se pudo leer el GPS.');
    }
  };

  const walkerProfileIncomplete =
    isWalker && (!walkerBio.trim() || !walkerRate.trim());

  if (loading && !profile) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Cargando perfil...</Text>
      </View>
    );
  }

  const displayName = profile?.full_name?.trim() || session?.user?.email?.split('@')[0] || 'Usuario';
  const email = session?.user?.email ?? '';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.pageTitle}>Perfil</Text>
      <View style={styles.avatarSection}>
        <TouchableOpacity onPress={pickAvatar} activeOpacity={0.85} disabled={uploadingAvatar}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {(displayName || 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.avatarHint}>{uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}</Text>
        </TouchableOpacity>
        <Text style={styles.displayName}>{displayName}</Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}
        {profile?.role ? (
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>
              {profile.role === 'walker' ? 'Paseador' : 'Dueño de mascotas'}
            </Text>
          </View>
        ) : null}
      </View>

      {isWalker && walkerProfileIncomplete && !editing ? (
        <View style={styles.onboardingBanner}>
          <MaterialIcons name="info-outline" size={22} color={theme.primaryDark} />
          <Text style={styles.onboardingBannerText}>
            Completa tu bio y tarifa por hora para que los dueños te encuentren al agendar.
          </Text>
        </View>
      ) : null}

      {editing ? (
        <View style={styles.form}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Tu nombre"
            placeholderTextColor="#8aa099"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 300 123 4567"
            placeholderTextColor="#8aa099"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <Text style={styles.sectionDivider}>Mi dirección</Text>
          <Text style={styles.label}>Calle y número</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Calle 80 #12-34"
            placeholderTextColor="#8aa099"
            value={street}
            onChangeText={setStreet}
          />
          <Text style={styles.label}>Ciudad</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Bogotá"
            placeholderTextColor="#8aa099"
            value={city}
            onChangeText={setCity}
          />
          <TouchableOpacity style={styles.gpsButton} onPress={fillAddressFromGps}>
            <MaterialIcons name="my-location" size={18} color={theme.primaryDark} />
            <Text style={styles.gpsButtonText}>Usar ubicación actual</Text>
          </TouchableOpacity>
          {isWalker ? (
            <>
              <Text style={styles.sectionDivider}>Perfil de paseador</Text>
              <Text style={styles.label}>Presentación (bio)</Text>
              <TextInput
                style={[styles.input, styles.inputMultiline]}
                placeholder="Ej: Paseador con experiencia en perros medianos y grandes."
                placeholderTextColor="#8aa099"
                value={walkerBio}
                onChangeText={setWalkerBio}
                multiline
                numberOfLines={3}
              />
              <Text style={styles.label}>Tarifa por hora (COP)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 25000"
                placeholderTextColor="#8aa099"
                value={walkerRate}
                onChangeText={setWalkerRate}
                keyboardType="decimal-pad"
              />
            </>
          ) : null}
          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelButton} onPress={cancelEditing} disabled={saving}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveButtonText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MaterialIcons name="person-outline" size={22} color={theme.primaryDark} />
            <Text style={styles.infoLabel}>Nombre</Text>
            <Text style={styles.infoValue}>{profile?.full_name || '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={22} color={theme.primaryDark} />
            <Text style={styles.infoLabel}>Teléfono</Text>
            <Text style={styles.infoValue}>{profile?.phone || '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="place" size={22} color={theme.primaryDark} />
            <Text style={styles.infoLabel}>Dirección</Text>
            <Text style={styles.infoValue}>
              {[street, city].filter(Boolean).join(', ') || '—'}
            </Text>
          </View>
          {isWalker ? (
            <>
              {walkerLoading ? (
                <ActivityIndicator style={{ marginVertical: 12 }} color={theme.primary} />
              ) : (
                <>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="notes" size={22} color={theme.primaryDark} />
                    <Text style={styles.infoLabel}>Bio</Text>
                    <Text style={styles.infoValue}>{walkerBio.trim() || '—'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <MaterialIcons name="attach-money" size={22} color={theme.primaryDark} />
                    <Text style={styles.infoLabel}>Tarifa</Text>
                    <Text style={styles.infoValue}>
                      {walkerRate.trim()
                        ? `$${Number(walkerRate).toLocaleString('es-CO')}/h`
                        : '—'}
                    </Text>
                  </View>
                </>
              )}
            </>
          ) : null}
          <TouchableOpacity style={styles.editButton} onPress={startEditing}>
            <MaterialIcons name="edit" size={20} color={theme.primaryDark} />
            <Text style={styles.editButtonText}>
              {isWalker ? 'Editar perfil y tarifas' : 'Editar perfil'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.signOutButton} onPress={() => signOut()}>
        <MaterialIcons name="logout" size={22} color={theme.primaryDark} />
        <Text style={styles.signOutButtonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: 40,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.textDark,
    marginBottom: 16,
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.primarySurface,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  avatarHint: {
    textAlign: 'center',
    color: theme.primary,
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 8,
  },
  avatarLetter: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.textDark,
  },
  displayName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textDark,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: theme.primaryDark,
    opacity: 0.75,
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: theme.primarySurface,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 14,
    color: theme.textDark,
    fontWeight: '600',
  },
  onboardingBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  onboardingBannerText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: theme.cardSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  infoLabel: {
    fontSize: 16,
    color: theme.primaryDark,
    opacity: 0.75,
    width: 80,
  },
  infoValue: {
    flex: 1,
    fontSize: 17,
    color: theme.textDark,
    fontWeight: '500',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: theme.primarySurface,
    borderRadius: 12,
  },
  editButtonText: {
    fontSize: 16,
    color: theme.primaryDark,
    fontWeight: '600',
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  gpsButtonText: {
    color: theme.primaryDark,
    fontWeight: '700',
    fontSize: 14,
  },
  form: {
    backgroundColor: theme.cardSurface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    padding: 16,
    marginBottom: 20,
  },
  sectionDivider: {
    marginTop: 16,
    marginBottom: 4,
    fontSize: 15,
    fontWeight: '700',
    color: theme.primaryDark,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textDark,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: theme.textDark,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#FAFBFC',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  cancelButtonText: {
    fontSize: 16,
    color: theme.textDark,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: theme.primaryDark,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: theme.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: theme.cardSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  signOutButtonText: {
    color: theme.primaryDark,
    fontSize: 18,
    fontWeight: '600',
  },
});
