import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../theme';

export type TrackingMapProps = {
  pickupLat: number;
  pickupLng: number;
  walkerLat?: number | null;
  walkerLng?: number | null;
};

/** iOS: el mapa interactivo está en `.web.tsx` y `.android.tsx`. */
export function TrackingMap({ pickupLat, pickupLng, walkerLat, walkerLng }: TrackingMapProps) {
  const hasWalker = walkerLat != null && walkerLng != null;
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Ubicaciones</Text>
      <Text style={styles.meta}>Recogida: {pickupLat.toFixed(5)}, {pickupLng.toFixed(5)}</Text>
      <Text style={styles.meta}>
        Paseador:{' '}
        {hasWalker ? `${walkerLat!.toFixed(5)}, ${walkerLng!.toFixed(5)}` : 'esperando GPS…'}
      </Text>
      <Text style={styles.hint}>
        El mapa en vivo se ve en Android (con clave de Google Maps) o en el navegador con npm run web.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: theme.primarySurface,
    borderRadius: 18,
    padding: 16,
    minHeight: 140,
  },
  title: {
    fontWeight: '700',
    color: theme.primaryDark,
    marginBottom: 6,
  },
  meta: {
    color: theme.textDark,
    fontSize: 13,
    marginTop: 2,
  },
  hint: {
    marginTop: 10,
    color: theme.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
});
