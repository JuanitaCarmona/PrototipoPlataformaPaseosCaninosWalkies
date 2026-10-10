import Constants from 'expo-constants';

/** Clave Maps para Android: manifest (android.config) + `extra` en app.config.js para lectura en JS. */
export function readGoogleMapsAndroidApiKey(): string {
  const extra = Constants.expoConfig?.extra as { googleMapsAndroidApiKey?: string } | undefined;
  const fromExtra = extra?.googleMapsAndroidApiKey?.trim();
  if (fromExtra) return fromExtra;
  const cfg = Constants.expoConfig?.android?.config as { googleMaps?: { apiKey?: string } } | undefined;
  return cfg?.googleMaps?.apiKey?.trim() ?? '';
}
