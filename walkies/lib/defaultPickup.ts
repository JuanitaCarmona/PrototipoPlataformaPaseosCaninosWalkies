import AsyncStorage from '@react-native-async-storage/async-storage';

export type DefaultPickup = {
  address: string;
  lat: number;
  lng: number;
};

function key(userId: string) {
  return `walkies_default_pickup_${userId}`;
}

export async function loadDefaultPickup(userId: string): Promise<DefaultPickup | null> {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DefaultPickup;
    if (
      typeof parsed?.address !== 'string' ||
      typeof parsed?.lat !== 'number' ||
      typeof parsed?.lng !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function saveDefaultPickup(userId: string, pickup: DefaultPickup): Promise<void> {
  await AsyncStorage.setItem(key(userId), JSON.stringify(pickup));
}
