import React from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { readGoogleMapsAndroidApiKey } from '../lib/googleMapsConfig';
import { theme } from '../theme';

type Props = {
  latitude: number;
  longitude: number;
};

export function PickupMapPreview({ latitude, longitude }: Props) {
  const mapsApiKey = readGoogleMapsAndroidApiKey();
  const openInMaps = () => {
    const q = `${latitude},${longitude}`;
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.caption}>Mapa</Text>
      {!mapsApiKey ? (
        <Text style={styles.noKeyHint}>
          Falta la clave de Google Maps (variable GOOGLE_MAPS_ANDROID_API_KEY en .env y volvé a ejecutar{' '}
          <Text style={styles.mono}>npx expo run:android</Text>). Las coordenadas abajo sí son válidas.
        </Text>
      ) : null}
      {mapsApiKey ? (
        <MapView
          key={`${latitude.toFixed(5)}-${longitude.toFixed(5)}`}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.012,
            longitudeDelta: 0.012,
          }}
        >
          <Marker coordinate={{ latitude, longitude }} title="Recogida" />
        </MapView>
      ) : (
        <View style={[styles.map, styles.mapFallback]}>
          <Text style={styles.mapFallbackText}>Vista previa del mapa desactivada sin API key</Text>
        </View>
      )}
      <Pressable onPress={openInMaps} style={styles.linkBtn} accessibilityRole="button">
        <Text style={styles.linkBtnText}>Abrir este lugar en Google Maps</Text>
      </Pressable>
      <Text style={styles.coords} selectable>
        {latitude.toFixed(6)}, {longitude.toFixed(6)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 12,
  },
  caption: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  noKeyHint: {
    fontSize: 12,
    color: '#92400e',
    backgroundColor: '#fffbeb',
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    lineHeight: 18,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#78350f',
  },
  map: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapFallback: {
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  mapFallbackText: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
  },
  linkBtn: {
    marginTop: 10,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  linkBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.primary,
    textDecorationLine: 'underline',
  },
  coords: {
    marginTop: 4,
    fontSize: 12,
    color: '#4b5563',
  },
});
