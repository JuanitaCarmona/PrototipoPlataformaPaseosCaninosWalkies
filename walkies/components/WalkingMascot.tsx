import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

const WIDTH = Dimensions.get('window').width - 80;

export function WalkingMascot() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(400),
        Animated.timing(progress, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.delay(200),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [8, Math.max(WIDTH - 120, 80)],
  });

  const bob = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -5, 0, -5, 0],
  });

  const dogBob = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -3, 1, -4, 0],
  });

  return (
    <View style={styles.scene}>
      <View style={styles.sun} />
      <View style={styles.cloud} />
      <View style={styles.path} />
      <View style={[styles.paw, { left: 28 }]} />
      <View style={[styles.paw, { left: 70, bottom: 22 }]} />
      <View style={[styles.paw, { left: 118 }]} />
      <Animated.View style={[styles.group, { transform: [{ translateX }] }]}>
        <Animated.View style={{ transform: [{ translateY: bob }] }}>
          <MaterialCommunityIcons name="walk" size={42} color={theme.primaryDark} />
        </Animated.View>
        <Animated.View style={{ transform: [{ translateY: dogBob }], marginLeft: -2 }}>
          <MaterialCommunityIcons name="dog-side" size={34} color={theme.primary} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    height: 118,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 8,
  },
  sun: {
    position: 'absolute',
    top: 8,
    right: 18,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFE08A',
  },
  cloud: {
    position: 'absolute',
    top: 18,
    left: 24,
    width: 46,
    height: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  path: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 18,
    backgroundColor: '#C9E6D3',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  paw: {
    position: 'absolute',
    bottom: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(20, 92, 56, 0.18)',
  },
  group: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
});
