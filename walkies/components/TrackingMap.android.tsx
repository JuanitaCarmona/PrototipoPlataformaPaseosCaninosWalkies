import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Image } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { theme } from '../theme';
import { readGoogleMapsAndroidApiKey } from '../lib/googleMapsConfig';
import type { TrackingMapProps } from './TrackingMap';

const DELTA = { latitudeDelta: 0.02, longitudeDelta: 0.02 };

export function TrackingMap({ pickupLat, pickupLng, walkerLat, walkerLng }: TrackingMapProps) {
  const mapsApiKey = readGoogleMapsAndroidApiKey();
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const hasWalker = walkerLat != null && walkerLng != null;
  const latitude = hasWalker ? walkerLat! : pickupLat;
  const longitude = hasWalker ? walkerLng! : pickupLng;

  useEffect(() => {
    if (!ready) return;
    const coords = [{ latitude: pickupLat, longitude: pickupLng }];
    if (hasWalker) coords.push({ latitude: walkerLat!, longitude: walkerLng! });
    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 48, right: 48, bottom: 48, left: 48 },
      animated: true,
    });
  }, [pickupLat, pickupLng, walkerLat, walkerLng, hasWalker, ready]);

  if (!mapsApiKey) {
    const markers = [`${pickupLat},${pickupLng},ol-marker`];
    if (hasWalker) markers.push(`${walkerLat},${walkerLng},lightblue1`);
    const uri = `https://staticmap.openstreetmap.de/staticmap.php?center=${latitude},${longitude}&zoom=15&size=640x400&markers=${markers.join('|')}`;
    return (
      <Image
        accessibilityLabel="Mapa de seguimiento"
        source={{ uri }}
        style={styles.map}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={styles.map}>
      {!ready ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={theme.primary} />
          <Text style={styles.placeholderText}>Cargando mapa…</Text>
        </View>
      ) : null}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={{ latitude, longitude, ...DELTA }}
        onMapReady={() => setReady(true)}
        loadingEnabled
        moveOnMarkerPress={false}
      >
        <Marker
          coordinate={{ latitude: pickupLat, longitude: pickupLng }}
          title="Recogida"
          pinColor={theme.primary}
        />
        {hasWalker ? (
          <Marker
            coordinate={{ latitude: walkerLat!, longitude: walkerLng! }}
            title="Paseador"
            pinColor="#2563eb"
          />
        ) : null}
        {hasWalker ? (
          <Polyline
            coordinates={[
              { latitude: pickupLat, longitude: pickupLng },
              { latitude: walkerLat!, longitude: walkerLng! },
            ]}
            strokeColor={theme.primary}
            strokeWidth={3}
          />
        ) : null}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 280,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: theme.primarySurface,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  placeholderText: {
    marginTop: 8,
    color: theme.textMuted,
    textAlign: 'center',
    fontSize: 13,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.primarySurface,
    zIndex: 1,
  },
});
