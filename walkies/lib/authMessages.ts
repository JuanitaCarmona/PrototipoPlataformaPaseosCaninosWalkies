import type { AuthError } from '@supabase/supabase-js';

function normalizeMessage(message: string): string {
  return message.toLowerCase();
}

export function formatAuthError(error: AuthError, mode: 'signIn' | 'signUp'): string {
  const msg = normalizeMessage(error.message);

  if (msg.includes('invalid login credentials') || msg.includes('invalid credentials')) {
    return 'Correo o contraseña incorrectos. Revisá los datos o registrate si aún no tienes cuenta.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Debes confirmar tu correo antes de ingresar. Revisá tu bandeja (y spam) o pedile al admin que confirme el usuario en Supabase.';
  }
  if (
    msg.includes('user already registered') ||
    msg.includes('already been registered') ||
    msg.includes('already exists')
  ) {
    return 'Ese correo ya tiene una cuenta. Usá otro email o ingresá con la contraseña existente.';
  }
  if (msg.includes('password') && (msg.includes('short') || msg.includes('least'))) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (msg.includes('rate limit') || msg.includes('too many requests')) {
    return 'Demasiados intentos seguidos. Esperá un minuto e intentá de nuevo.';
  }
  if (msg.includes('signup') && msg.includes('disabled')) {
    return 'El registro está deshabilitado en el proyecto. Revisá la configuración de Supabase.';
  }

  if (mode === 'signUp') {
    return error.message || 'No se pudo crear la cuenta. Intentá de nuevo.';
  }
  return error.message || 'No se pudo iniciar sesión. Intentá de nuevo.';
}

export const AUTH_INFO = {
  emailConfirmation:
    'Cuenta creada. Revisá tu correo y abrí el enlace de confirmación. Después volvé e ingresá con tu email y contraseña.',
  emailAlreadyRegistered:
    'Ese correo ya está registrado. Cambiá a "Ingresar" o usá otro correo (por ejemplo con +dueno o +paseador en Gmail).',
} as const;
