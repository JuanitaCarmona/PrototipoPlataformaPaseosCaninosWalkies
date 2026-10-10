import { supabase } from './supabase';
import { saveDefaultPickup } from './defaultPickup';

export type UserAddress = {
  id: string;
  label: string | null;
  street: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
};

export async function loadUserAddress(userId: string): Promise<UserAddress | null> {
  const { data, error } = await supabase
    .from('addresses')
    .select('id, label, street, city, lat, lng')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as UserAddress;
}

export async function saveUserAddress(
  userId: string,
  input: {
    street: string;
    city: string;
    lat?: number | null;
    lng?: number | null;
    label?: string;
  },
): Promise<{ error: Error | null }> {
  const payload = {
    user_id: userId,
    label: input.label?.trim() || 'Casa',
    street: input.street.trim() || null,
    city: input.city.trim() || null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    updated_at: new Date().toISOString(),
  };

  const existing = await loadUserAddress(userId);
  const result = existing
    ? await supabase.from('addresses').update(payload).eq('id', existing.id)
    : await supabase.from('addresses').insert(payload);

  if (result.error) return { error: new Error(result.error.message) };

  if (payload.lat != null && payload.lng != null) {
    const label = [payload.street, payload.city].filter(Boolean).join(', ');
    await saveDefaultPickup(userId, {
      address: label || 'Mi dirección',
      lat: payload.lat,
      lng: payload.lng,
    });
  }

  return { error: null };
}
