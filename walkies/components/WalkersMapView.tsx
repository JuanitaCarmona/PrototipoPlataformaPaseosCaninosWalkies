import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export type MapWalker = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rating?: number | null;
  rateLabel?: string;
};

export type WalkersMapViewProps = {
  walkers: MapWalker[];
  centerLat?: number | null;
  centerLng?: number | null;
  onSelect: (walkerId: string) => void;
};

export function WalkersMapView({ walkers }: WalkersMapViewProps) {
  return (
    <View style={styles.box}>
      <Text style={styles.text}>
        El mapa de paseadores está disponible en el emulador o celular Android.
        {walkers.length > 0 ? ` Hay ${walkers.length} con ubicación.` : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: theme.primarySurface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  text: {
    color: theme.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});

