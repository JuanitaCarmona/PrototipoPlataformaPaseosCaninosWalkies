import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { theme } from '../theme';
import { readGoogleMapsAndroidApiKey } from '../lib/googleMapsConfig';
import type { WalkersMapViewProps } from './WalkersMapView';

const DELTA = { latitudeDelta: 0.05, longitudeDelta: 0.05 };

export function WalkersMapView({
  walkers,
  centerLat,
  centerLng,
  onSelect,
}: WalkersMapViewProps) {
  const mapsApiKey = readGoogleMapsAndroidApiKey();
  const first = walkers[0];
  const latitude = centerLat ?? first?.lat ?? 4.711;
  const longitude = centerLng ?? first?.lng ?? -74.072;

  if (!mapsApiKey) {
    return (
      <View style={[styles.map, styles.fallback]}>
        <Text style={styles.fallbackText}>
          Configura GOOGLE_MAPS_ANDROID_API_KEY para ver el mapa de paseadores.
        </Text>
      </View>
    );
  }

  return (
    <MapView
      style={styles.map}
      provider={PROVIDER_GOOGLE}
      initialRegion={{ latitude, longitude, ...DELTA }}
    >
      {centerLat != null && centerLng != null ? (
        <Marker
          coordinate={{ latitude: centerLat, longitude: centerLng }}
          title="Tu recogida"
          pinColor={theme.primary}
        />
      ) : null}
      {walkers.map((w) => (
        <Marker
          key={w.id}
          coordinate={{ latitude: w.lat, longitude: w.lng }}
          title={w.name}
          description={[
            w.rating != null && w.rating > 0 ? `⭐ ${Number(w.rating).toFixed(1)}` : null,
            w.rateLabel,
          ]
            .filter(Boolean)
            .join(' · ')}
          onPress={() => onSelect(w.id)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 260,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },
  fallback: {
    backgroundColor: theme.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fallbackText: {
    color: theme.textMuted,
    textAlign: 'center',
    fontSize: 13,
  },
});
