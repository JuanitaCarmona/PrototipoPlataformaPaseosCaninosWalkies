import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { readGoogleMapsAndroidApiKey } from '../lib/googleMapsConfig';
import { getDeviceMapCenter } from '../lib/deviceLocation';
import type { PickupMapPickerModalProps } from './PickupMapPickerModal';

const MAP_DELTA = { latitudeDelta: 0.012, longitudeDelta: 0.012 };

export function PickupMapPickerModal({
  visible,
  initialLatitude,
  initialLongitude,
  onClose,
  onConfirm,
}: PickupMapPickerModalProps) {
  const insets = useSafeAreaInsets();
  const mapsApiKey = readGoogleMapsAndroidApiKey();
  const mapRef = useRef<MapView>(null);
  const [marker, setMarker] = useState({
    latitude: initialLatitude,
    longitude: initialLongitude,
  });
  const [region, setRegion] = useState({
    latitude: initialLatitude,
    longitude: initialLongitude,
    ...MAP_DELTA,
  });
  const [centering, setCentering] = useState(false);

  useEffect(() => {
    if (visible) {
      const next = {
        latitude: initialLatitude,
        longitude: initialLongitude,
        ...MAP_DELTA,
      };
      setMarker({ latitude: initialLatitude, longitude: initialLongitude });
      setRegion(next);
      mapRef.current?.animateToRegion(next, 300);
    }
  }, [visible, initialLatitude, initialLongitude]);

  const goToMyLocation = async () => {
    setCentering(true);
    try {
      const center = await getDeviceMapCenter();
      if (!center) {
        Alert.alert(
          'Ubicación',
          'Activa el permiso de ubicación y el GPS para centrar el mapa donde estás.'
        );
        return;
      }
      const next = { ...center, ...MAP_DELTA };
      setMarker(center);
      setRegion(next);
      mapRef.current?.animateToRegion(next, 400);
    } finally {
      setCentering(false);
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerBtn} hitSlop={12}>
            <Text style={styles.headerBtnText}>Cancelar</Text>
          </Pressable>
          <Text style={styles.title}>Elegir en el mapa</Text>
          <Pressable
            onPress={goToMyLocation}
            style={styles.headerBtn}
            hitSlop={12}
            disabled={centering || !mapsApiKey}
          >
            <Text style={[styles.headerBtnText, styles.headerBtnTextRight]}>
              {centering ? '…' : 'Mi ubicación'}
            </Text>
          </Pressable>
        </View>

        {mapsApiKey ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            region={region}
            onRegionChangeComplete={setRegion}
            onPress={(e) => {
              const c = e.nativeEvent.coordinate;
              setMarker({ latitude: c.latitude, longitude: c.longitude });
            }}
            showsUserLocation
            showsMyLocationButton
          >
            <Marker
              coordinate={marker}
              title="Recogida"
              draggable
              onDragEnd={(e) => {
                const c = e.nativeEvent.coordinate;
                setMarker({ latitude: c.latitude, longitude: c.longitude });
              }}
            />
          </MapView>
        ) : (
          <View style={[styles.map, styles.fallback]}>
            <Text style={styles.fallbackText}>
              Configurá GOOGLE_MAPS_ANDROID_API_KEY en walkies/.env y volvé a compilar para usar el mapa.
            </Text>
          </View>
        )}

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <Text style={styles.hint}>
            Tocá el mapa o arrastrá el pin. Usá «Mi ubicación» arriba a la derecha para ir donde estás.
          </Text>
          <Pressable
            style={[styles.confirm, !mapsApiKey && styles.confirmDisabled]}
            onPress={() => onConfirm(marker.latitude, marker.longitude)}
            disabled={!mapsApiKey}
          >
            <Text style={styles.confirmText}>Usar este punto</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  headerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    minWidth: 88,
  },
  headerBtnText: {
    fontSize: 16,
    color: theme.primaryDark,
    fontWeight: '600',
  },
  headerBtnTextRight: {
    textAlign: 'right',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: theme.textDark,
  },
  map: {
    flex: 1,
    width: '100%',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f3f4f6',
  },
  fallbackText: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 18,
  },
  confirm: {
    backgroundColor: theme.primaryDark,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmDisabled: {
    opacity: 0.45,
  },
  confirmText: {
    color: theme.textLight,
    fontSize: 16,
    fontWeight: '700',
  },
});
