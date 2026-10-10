import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Configuración de la animación decorativa (microinteracción de marca)
const WALK_CONFIG = {
  duration: 12000,
  pauseAfter: 1800,
  pauseBefore: 500,
  travelStart: 24,
  travelEnd: SCREEN_WIDTH * 0.68,
  opacityPeak: 0.36,
  bobAmplitude: 2,
  iconSize: 18,
  personSize: 20,
};

const EASE_SMOOTH = Easing.bezier(0.33, 0.0, 0.2, 1);

/**
 * Animación decorativa de login: persona + perros sobre acera.
 * Microinteracción sutil, integrada al cierre visual del formulario.
 */
export function LoginAnimatedBackground() {
  const progress = useRef(new Animated.Value(0)).current;
  const bird1 = useRef(new Animated.Value(0)).current;
  const bird2 = useRef(new Animated.Value(0)).current;
  const bird3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const { duration, pauseAfter, pauseBefore } = WALK_CONFIG;

    const walkCycle = Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: EASE_SMOOTH,
        useNativeDriver: true,
      }),
      Animated.delay(pauseAfter),
      Animated.timing(progress, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
      Animated.delay(pauseBefore),
    ]);

    Animated.loop(walkCycle).start();

    const birdDuration = 9000;
    const birdLoop = (anim: Animated.Value, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: birdDuration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );

    birdLoop(bird1).start();
    birdLoop(bird2, 400).start();
    birdLoop(bird3, 1200).start();
  }, [progress, bird1, bird2, bird3]);

  const { travelStart, travelEnd, opacityPeak, bobAmplitude } = WALK_CONFIG;

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [travelStart, travelEnd],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, opacityPeak, opacityPeak, 0],
  });

  const bobBase = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, -bobAmplitude, 0, bobAmplitude, 0],
  });

  const b = bobAmplitude;
  const bob1 = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [0, b * 0.5, 0, -b * 0.5, 0],
  });
  const bob2 = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [b * 0.6, 0, -b * 0.6, 0, b * 0.6],
  });
  const bob3 = progress.interpolate({
    inputRange: [0, 0.25, 0.5, 0.75, 1],
    outputRange: [-b * 0.4, 0, b * 0.4, 0, -b * 0.4],
  });
  const birdTranslate = (anim: Animated.Value) =>
    anim.interpolate({
      inputRange: [0, 1],
      outputRange: [-40, SCREEN_WIDTH + 30],
    });

  const iconColor = 'rgba(0, 191, 99, 0.85)';

  return (
    <View style={styles.container}>
      <View style={styles.path} />

      <Animated.View
        style={[styles.birdWrap, styles.bird1, { transform: [{ translateX: birdTranslate(bird1) }] }]}
      >
        <View style={styles.bird} />
      </Animated.View>
      <Animated.View
        style={[styles.birdWrap, styles.bird2, { transform: [{ translateX: birdTranslate(bird2) }] }]}
      >
        <View style={styles.bird} />
      </Animated.View>
      <Animated.View
        style={[styles.birdWrap, styles.bird3, { transform: [{ translateX: birdTranslate(bird3) }] }]}
      >
        <View style={styles.bird} />
      </Animated.View>

      <Animated.View
        style={[
          styles.walkGroup,
          {
            opacity,
            transform: [{ translateX }],
          },
        ]}
      >
        <Animated.View style={[styles.walkItem, { transform: [{ translateY: bobBase }] }]}>
          <MaterialCommunityIcons
            name="walk"
            size={WALK_CONFIG.personSize}
            color={iconColor}
          />
        </Animated.View>
        <Animated.View style={[styles.walkItem, { transform: [{ translateY: bob1 }] }]}>
          <MaterialCommunityIcons name="dog-side" size={WALK_CONFIG.iconSize} color={iconColor} />
        </Animated.View>
        <Animated.View style={[styles.walkItem, { transform: [{ translateY: bob2 }] }]}>
          <MaterialCommunityIcons name="dog-side" size={WALK_CONFIG.iconSize} color={iconColor} />
        </Animated.View>
        <Animated.View style={[styles.walkItem, { transform: [{ translateY: bob3 }] }]}>
          <MaterialCommunityIcons name="dog-side" size={WALK_CONFIG.iconSize} color={iconColor} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    minHeight: 88,
    width: '100%',
    marginTop: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  path: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    backgroundColor: 'rgba(212, 216, 214, 0.85)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  birdWrap: {
    position: 'absolute',
    top: 6,
  },
  bird1: { top: 4 },
  bird2: { top: 20 },
  bird3: { top: 12 },
  bird: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  walkGroup: {
    position: 'absolute',
    bottom: 36,
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walkItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
