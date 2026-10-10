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
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { uploadPetPhoto } from '../lib/uploadPetPhoto';
import { theme } from '../theme';

type Pet = {
  id: string;
  name: string;
  breed: string | null;
  age_years: number | null;
  size: string | null;
  notes: string | null;
  photo_url: string | null;
  created_at: string;
};

type UpcomingWalk = {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  pets?: { name: string } | { name: string }[] | null;
};

type MascotasScreenProps = {
  onRequestWalk?: (petId: string) => void;
};

const SIZE_OPTIONS = [
  { value: 'small', label: 'Pequeño' },
  { value: 'medium', label: 'Mediano' },
  { value: 'large', label: 'Grande' },
];

const SIZE_LABELS: Record<string, string> = {
  small: 'Pequeño',
  medium: 'Mediano',
  large: 'Grande',
};

function parseAgeYears(rawAge: string): number | null {
  const trimmed = rawAge.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return NaN;
  const parsed = Number(trimmed);
  if (parsed < 0 || parsed > 40) return NaN;
  return parsed;
}

export function MascotasScreen({ onRequestWalk }: MascotasScreenProps) {
  const { session } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [upcomingWalks, setUpcomingWalks] = useState<UpcomingWalk[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    breed: '',
    age: '',
    size: 'medium' as 'small' | 'medium' | 'large',
    notes: '',
    photo_url: null as string | null,
  });

  const fetchPets = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('pets')
      .select('id, name, breed, age_years, size, notes, photo_url, created_at')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      setFeedback({ type: 'error', message: 'No se pudieron cargar las mascotas. Intenta nuevamente.' });
      return;
    }
    setFeedback(null);
    setPets(data ?? []);

    const walksRes = await supabase
      .from('walks')
      .select('id, scheduled_at, duration_minutes, status, pets(name, owner_id)')
      .eq('pets.owner_id', session.user.id)
      .in('status', ['pending', 'confirmed', 'in_progress'])
      .order('scheduled_at', { ascending: true })
      .limit(5);
    if (!walksRes.error) {
      setUpcomingWalks((walksRes.data as UpcomingWalk[]) ?? []);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  const openPhotoPicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso', 'Necesitamos acceso a la galería para elegir una foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const resetForm = () => {
    setForm({ name: '', breed: '', age: '', size: 'medium', notes: '', photo_url: null });
    setPhotoUri(null);
    setEditingPet(null);
    setShowForm(false);
  };

  const openFormForNew = () => {
    setFeedback(null);
    setEditingPet(null);
    setForm({ name: '', breed: '', age: '', size: 'medium', notes: '', photo_url: null });
    setPhotoUri(null);
    setShowForm(true);
  };

  const handleDeletePet = (pet: Pet) => {
    const run = async () => {
      const { error } = await supabase.from('pets').delete().eq('id', pet.id);
      if (error) {
        Alert.alert(
          'No se pudo eliminar',
          'Esta mascota tiene paseos asociados. Cancélalos o espera a que terminen.',
        );
        return;
      }
      fetchPets();
    };
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined' && window.confirm(`¿Eliminar a ${pet.name}?`);
      if (ok) void run();
      return;
    }
    Alert.alert('Eliminar mascota', `¿Eliminar a ${pet.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => void run() },
    ]);
  };

  const openFormForEdit = (pet: Pet) => {
    setFeedback(null);
    setEditingPet(pet);
    setForm({
      name: pet.name,
      breed: pet.breed ?? '',
      age: pet.age_years != null ? String(pet.age_years) : '',
      size: (pet.size as 'small' | 'medium' | 'large') ?? 'medium',
      notes: pet.notes ?? '',
      photo_url: pet.photo_url,
    });
    setPhotoUri(null);
    setShowForm(true);
  };

  const handleSavePet = async () => {
    if (!form.name.trim() || !session?.user?.id) return;
    const ageYears = parseAgeYears(form.age);
    if (Number.isNaN(ageYears)) {
      setFeedback({ type: 'error', message: 'Ingresa una edad válida entre 0 y 40 años.' });
      return;
    }
    setSaving(true);
    try {
      let photoUrl = form.photo_url ?? null;

      if (photoUri) {
        photoUrl = await uploadPetPhoto(session.user.id, photoUri);
      }

      if (editingPet) {
        const { error } = await supabase
          .from('pets')
          .update({
            name: form.name.trim(),
            breed: form.breed.trim() || null,
            age_years: ageYears,
            size: form.size,
            notes: form.notes.trim() || null,
            photo_url: photoUrl,
          })
          .eq('id', editingPet.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pets').insert({
          owner_id: session.user.id,
          name: form.name.trim(),
          breed: form.breed.trim() || null,
          age_years: ageYears,
          size: form.size,
          notes: form.notes.trim() || null,
          photo_url: photoUrl,
        });
        if (error) throw error;
      }
      resetForm();
      setFeedback({
        type: 'success',
        message: editingPet ? 'Mascota actualizada correctamente.' : 'Mascota guardada correctamente.',
      });
      fetchPets();
    } catch (e) {
      setFeedback({
        type: 'error',
        message: 'No se pudo guardar la mascota. Verifica el bucket "pet-photos" en Supabase.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!session?.user?.id) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerBlock}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={styles.title}>Mis mascotas</Text>
          <Text style={styles.headerSubtitle}>Tu bienestar, nuestra prioridad</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => (showForm ? resetForm() : openFormForNew())}
          disabled={loading}
        >
          <MaterialIcons name={showForm ? 'close' : 'add'} size={18} color={theme.textLight} />
          <Text style={styles.addButtonText}>{showForm ? 'Cerrar' : 'Añadir mascota'}</Text>
        </TouchableOpacity>
      </View>
      {feedback ? (
        <View style={[styles.feedbackBox, feedback.type === 'error' ? styles.feedbackError : styles.feedbackSuccess]}>
          <Text style={styles.feedbackText}>{feedback.message}</Text>
        </View>
      ) : null}

      {showForm && (
        <ScrollView
          style={styles.formScroll}
          contentContainerStyle={styles.form}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator
        >
          <Text style={styles.formLabel}>Foto</Text>
          <TouchableOpacity style={styles.photoButton} onPress={openPhotoPicker} disabled={saving}>
            {(photoUri || form.photo_url) ? (
              <Image
                source={{ uri: photoUri ?? form.photo_url ?? undefined }}
                style={styles.photoPreview}
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialCommunityIcons name="camera-plus" size={36} color="#8aa099" />
                <Text style={styles.photoPlaceholderText}>Elegir foto</Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Nombre de la mascota *"
            placeholderTextColor="#8aa099"
            value={form.name}
            onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Raza"
            placeholderTextColor="#8aa099"
            value={form.breed}
            onChangeText={(t) => setForm((f) => ({ ...f, breed: t }))}
          />
          <TextInput
            style={styles.input}
            placeholder="Edad (años)"
            placeholderTextColor="#8aa099"
            value={form.age}
            onChangeText={(t) => setForm((f) => ({ ...f, age: t }))}
            keyboardType="number-pad"
          />
          <View style={styles.sizeRow}>
            {SIZE_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.sizeChip,
                  form.size === opt.value && styles.sizeChipActive,
                ]}
                onPress={() => setForm((f) => ({ ...f, size: opt.value as 'small' | 'medium' | 'large' }))}
              >
                <Text
                  style={[
                    styles.sizeChipText,
                    form.size === opt.value && styles.sizeChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Notas (alergias, comportamiento...)"
            placeholderTextColor="#8aa099"
            value={form.notes}
            onChangeText={(t) => setForm((f) => ({ ...f, notes: t }))}
            multiline
          />
          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={resetForm}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.submitButton, saving && styles.submitButtonDisabled]}
              onPress={handleSavePet}
              disabled={saving || !form.name.trim()}
            >
              {saving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>{editingPet ? 'Actualizar' : 'Guardar'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {!showForm && (
        loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : pets.length === 0 ? (
          <View style={styles.centered}>
            <MaterialCommunityIcons name="dog-side" size={48} color="#c0d9c8" />
            <Text style={styles.emptyTitle}>Sin mascotas</Text>
            <Text style={styles.emptySubtitle}>
              Toca "Añadir mascota" para registrar a tu primera mascota.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {pets.map((pet) => (
              <View key={pet.id} style={styles.petCard}>
                <TouchableOpacity
                  style={styles.petCardMain}
                  onPress={() => openFormForEdit(pet)}
                  activeOpacity={0.7}
                >
                  <View style={styles.petPhotoWrap}>
                    {pet.photo_url ? (
                      <Image source={{ uri: pet.photo_url }} style={styles.petPhoto} />
                    ) : (
                      <MaterialCommunityIcons name="dog-side" size={36} color={theme.primaryDark} />
                    )}
                  </View>
                  <View style={styles.petInfo}>
                    <Text style={styles.petName}>{pet.name}</Text>
                    <Text style={styles.petMeta}>
                      {pet.breed || 'Mascota'}
                    </Text>
                    <Text style={styles.petMeta}>
                      {[
                        pet.age_years != null ? `${pet.age_years} años` : null,
                        pet.size ? (SIZE_LABELS[pet.size] ?? pet.size) : null,
                      ].filter(Boolean).join(' · ') || 'Sin datos'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.requestButton}
                  onPress={() => onRequestWalk?.(pet.id)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.requestButtonText}>Solicitar paseo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePet(pet)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            ))}

            <Text style={styles.upcomingTitle}>Próximos paseos</Text>
            {upcomingWalks.length === 0 ? (
              <View style={styles.upcomingEmpty}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={22} color={theme.textMuted} />
                <Text style={styles.upcomingEmptyText}>Aún no tienes paseos agendados.</Text>
              </View>
            ) : (
              upcomingWalks.map((walk) => {
                const d = new Date(walk.scheduled_at);
                const petName = Array.isArray(walk.pets) ? walk.pets[0]?.name : walk.pets?.name;
                return (
                  <View key={walk.id} style={styles.upcomingCard}>
                    <View style={styles.upcomingIcon}>
                      <MaterialCommunityIcons name="paw" size={18} color={theme.primaryDark} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.upcomingPet}>{petName || 'Mascota'}</Text>
                      <Text style={styles.upcomingMeta}>
                        {d.toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' })}
                        {' · '}
                        {d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        {' · '}
                        {walk.duration_minutes} min
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.textDark,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    gap: 4,
    maxWidth: 160,
  },
  addButtonText: {
    color: theme.textLight,
    fontSize: 13,
    fontWeight: '700',
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
  formScroll: {
    flex: 1,
    marginBottom: 0,
  },
  form: {
    backgroundColor: theme.cardSurface,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    borderRadius: 20,
    padding: 16,
    flexGrow: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textDark,
    marginBottom: 8,
  },
  photoButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.background,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#c0d9c8',
  },
  photoPlaceholderText: {
    fontSize: 14,
    color: '#8aa099',
    marginTop: 6,
  },
  input: {
    backgroundColor: '#FAFBFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: theme.textDark,
    marginBottom: 10,
  },
  notesInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  sizeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FAFBFC',
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  sizeChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  sizeChipText: {
    fontSize: 16,
    color: theme.textDark,
  },
  sizeChipTextActive: {
    color: theme.textLight,
    fontWeight: '700',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    color: theme.primaryDark,
    opacity: 0.75,
    fontSize: 18,
  },
  submitButton: {
    backgroundColor: theme.primaryDark,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    minWidth: 100,
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.textDark,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    color: theme.primaryDark,
    opacity: 0.75,
    marginTop: 4,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  petCard: {
    backgroundColor: theme.cardMint,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  petCardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petPhotoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  petPhoto: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textDark,
    marginBottom: 2,
  },
  petMeta: {
    fontSize: 14,
    color: theme.textMuted,
  },
  requestButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
    backgroundColor: theme.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  requestButtonText: {
    color: theme.textLight,
    fontSize: 13,
    fontWeight: '700',
  },
  deleteButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  deleteButtonText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '700',
  },
  upcomingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.textDark,
    marginTop: 12,
    marginBottom: 12,
  },
  upcomingEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  upcomingEmptyText: {
    color: theme.textMuted,
    fontSize: 14,
  },
  upcomingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  upcomingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upcomingPet: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.textDark,
  },
  upcomingMeta: {
    fontSize: 13,
    color: theme.textMuted,
    marginTop: 2,
  },
});
