import * as Location from 'expo-location';

/** Coordenadas por defecto del emulador Android / Android Studio (Googleplex). */
export function isLikelyGoogleplexMock(lat: number, lng: number): boolean {
  return Math.abs(lat - 37.4219983) < 0.004 && Math.abs(lng - -122.0840575) < 0.004;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Ubicación actual del dispositivo (GPS). En emulador reintenta si sigue en Mountain View.
 */
export async function readFreshDeviceLocation(): Promise<Location.LocationObject> {
  const readOnce = () =>
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      mayShowUserSettingsDialog: true,
    });

  let pos = await readOnce();
  for (let i = 0; i < 12; i++) {
    if (!isLikelyGoogleplexMock(pos.coords.latitude, pos.coords.longitude)) {
      return pos;
    }
    await sleep(1000);
    pos = await readOnce();
  }
  return pos;
}

/** Centro de mapa: GPS actual o última conocida; null si no hay permiso/lectura. */
export async function getDeviceMapCenter(): Promise<{ latitude: number; longitude: number } | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      mayShowUserSettingsDialog: true,
    });
    return { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
  } catch {
    const last = await Location.getLastKnownPositionAsync();
    if (!last) return null;
    return { latitude: last.coords.latitude, longitude: last.coords.longitude };
  }
}
