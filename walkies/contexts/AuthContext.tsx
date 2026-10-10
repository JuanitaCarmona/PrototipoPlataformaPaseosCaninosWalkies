import React, { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { formatAuthError } from '../lib/authMessages';
import { supabase } from '../lib/supabase';

export type UserRole = 'owner' | 'walker';

export type SignUpResult = {
  error: Error | null;
  needsEmailConfirmation?: boolean;
  emailAlreadyRegistered?: boolean;
};

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string, role?: UserRole) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;
    let cancelled = false;

    // Si Supabase tarda o falla, después de 3s mostramos login igual
    const timeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 3000);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!cancelled) {
          setSession(session);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSession(null);
          setLoading(false);
        }
      });

    try {
      const { data: { subscription: sub } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!cancelled) setSession(session);
      });
      subscription = sub;
    } catch {
      if (!cancelled) setLoading(false);
    }

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return { error: null };
    return { error: new Error(formatAuthError(error, 'signIn')) };
  };

  const signUp = async (email: string, password: string, fullName?: string, role?: UserRole) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName ?? '',
          role: role ?? 'owner',
        },
      },
    });

    if (error) {
      return { error: new Error(formatAuthError(error, 'signUp')) };
    }

    if (data.user && data.user.identities?.length === 0) {
      return { error: null, emailAlreadyRegistered: true };
    }

    if (data.user && !data.session) {
      return { error: null, needsEmailConfirmation: true };
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
