import React, { createElement, useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { buildLeafletTrackingHtml } from '../lib/leafletTrackingHtml';
import type { TrackingMapProps } from './TrackingMap';

export function TrackingMap({ pickupLat, pickupLng, walkerLat, walkerLng }: TrackingMapProps) {
  const iframeRef = useRef<{ contentWindow?: { postMessage: (data: unknown, origin: string) => void } } | null>(
    null,
  );
  const html = useMemo(
    () => buildLeafletTrackingHtml({ pickupLat, pickupLng, walkerLat, walkerLng }),
    // Solo el HTML inicial: las actualizaciones van por postMessage para no parpadear.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pickupLat, pickupLng],
  );

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'walkies-track', pickupLat, pickupLng, walkerLat, walkerLng },
      '*',
    );
  }, [pickupLat, pickupLng, walkerLat, walkerLng]);

  return (
    <View style={styles.map}>
      {createElement('iframe', {
        ref: iframeRef,
        title: 'Seguimiento del paseo',
        srcDoc: html,
        style: {
          width: '100%',
          height: '100%',
          border: 'none',
          borderRadius: 18,
        },
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    width: '100%',
    height: 280,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#E6F6ED',
  },
});
