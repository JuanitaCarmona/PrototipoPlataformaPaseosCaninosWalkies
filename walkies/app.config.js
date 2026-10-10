// Cargar .env antes de que Expo construya el bundle (así process.env.EXPO_PUBLIC_* está disponible)
require('dotenv').config();

const baseConfig = require('./app.json');
const { expo } = baseConfig;

const googleMapsAndroidKey = process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? '';

module.exports = {
  expo: {
    ...expo,
    // En runtime, `Constants.expoConfig.android.config.googleMaps` a veces no viene en JS;
    // `extra` sí está disponible para saber si hay clave y evitar el fallback gris en modales.
    extra: {
      ...(expo.extra ?? {}),
      googleMapsAndroidApiKey: googleMapsAndroidKey,
    },
    android: {
      ...expo.android,
      // Debe coincidir con el "nombre de paquete" de la restricción Android de tu clave en Google Cloud.
      package: expo.android?.package ?? 'com.walkies.app',
      config: {
        ...expo.android?.config,
        googleMaps: {
          apiKey: googleMapsAndroidKey,
        },
      },
    },
  },
  plugins: [
    ...(baseConfig.plugins || []),
    '@react-native-community/datetimepicker',
  ],
};
