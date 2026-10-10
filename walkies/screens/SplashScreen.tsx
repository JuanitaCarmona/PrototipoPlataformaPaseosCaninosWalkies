import React from 'react';
import { View, Text, Image, ActivityIndicator, StyleSheet, Platform, type ImageStyle, type ViewStyle } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { theme } from '../theme';

export function SplashScreen() {
  const containerStyle: ViewStyle[] = [styles.container];
  if (Platform.OS === 'web') {
    containerStyle.push({ minHeight: '100vh' } as unknown as ViewStyle);
  }
  return (
    <View style={containerStyle}>
      <StatusBar style="light" />
      <Image
        source={require('../assets/Logo-walkies.png')}
        style={styles.logo as ImageStyle}
        resizeMode="contain"
      />
      <Text style={styles.brand}>Walkies!</Text>
      <Text style={styles.tagline}>Paseos felices, perros más sanos</Text>
      <ActivityIndicator
        size="large"
        color={theme.textLight}
        style={styles.spinner}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  brand: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.textLight,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 32,
  },
  spinner: {
    marginTop: 8,
  },
});
