import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
};

export function useProfile() {
  const { session } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, phone, role, created_at, updated_at')
      .eq('id', session.user.id)
      .maybeSingle();
    setLoading(false);
    if (error) {
      setProfile(null);
      return;
    }
    if (data) {
      setProfile(data as Profile);
      // Si es paseador, asegurar que exista fila en walkers (por si no corre el trigger)
      if ((data as Profile).role === 'walker') {
        const { data: walkerRow } = await supabase
          .from('walkers')
          .select('id')
          .eq('user_id', data.id)
          .maybeSingle();
        if (!walkerRow) {
          await supabase.from('walkers').insert({ user_id: data.id });
        }
      }
      return;
    }
    // No existe perfil (usuario creado antes del trigger): crearlo
    const name =
      (session.user.user_metadata?.full_name as string) ||
      session.user.email?.split('@')[0] ||
      'Usuario';
    const metaRole = session.user.user_metadata?.role;
    const role =
      metaRole === 'walker' || metaRole === 'owner' ? metaRole : 'owner';
    const { error: insertError } = await supabase.from('profiles').insert({
      id: session.user.id,
      full_name: name,
      phone: null,
      role,
    });
    if (!insertError) {
      if (role === 'walker') {
        await supabase.from('walkers').insert({ user_id: session.user.id });
      }
      const { data: newData } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, phone, role, created_at, updated_at')
        .eq('id', session.user.id)
        .single();
      setProfile((newData as Profile) ?? null);
    } else {
      setProfile(null);
    }
  }, [session?.user?.id, session?.user?.email, session?.user?.user_metadata]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, refetch: fetchProfile };
}
