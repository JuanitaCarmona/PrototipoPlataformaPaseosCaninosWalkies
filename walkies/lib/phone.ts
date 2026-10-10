import { Alert, Linking, Platform } from 'react-native';

export function callPhone(phone: string | null | undefined) {
  const cleaned = phone?.replace(/[^\d+]/g, '') ?? '';
  if (!cleaned) {
    Alert.alert('Teléfono', 'Este usuario aún no cargó un número de contacto.');
    return;
  }
  const url = `tel:${cleaned}`;
  Linking.openURL(url).catch(() => {
    Alert.alert(
      'Teléfono',
      Platform.OS === 'web'
        ? `Número: ${phone}`
        : 'No se pudo abrir la app de llamadas.',
    );
  });
}
