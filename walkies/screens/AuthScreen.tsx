import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
  useWindowDimensions,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth, type UserRole } from '../contexts/AuthContext';
import { AUTH_INFO } from '../lib/authMessages';
import { theme } from '../theme';

const MIN_PASSWORD_LENGTH = 6;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;

  const { signIn, signUp } = useAuth();
  const [step, setStep] = useState<'welcome' | 'form'>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<UserRole>('owner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const openForm = (register: boolean) => {
    setIsRegister(register);
    setError(null);
    setInfo(null);
    setStep('form');
  };

  const handleSocial = (provider: 'Google' | 'Apple') => {
    Alert.alert('Próximamente', `El acceso con ${provider} estará disponible pronto.`);
  };

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Completa email y contraseña.');
      return;
    }
    if (!isValidEmail(trimmedEmail)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    if (isRegister && trimmedPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (isRegister && !fullName.trim()) {
      setError('Escribe tu nombre.');
      return;
    }
    setError(null);
    setInfo(null);
    setLoading(true);

    if (isRegister) {
      const result = await signUp(trimmedEmail, password, fullName.trim(), role);
      setLoading(false);

      if (result.error) {
        setError(result.error.message);
        return;
      }
      if (result.emailAlreadyRegistered) {
        setError(AUTH_INFO.emailAlreadyRegistered);
        return;
      }
      if (result.needsEmailConfirmation) {
        setInfo(AUTH_INFO.emailConfirmation);
        setIsRegister(false);
        return;
      }
      return;
    }

    const { error: err } = await signIn(trimmedEmail, password);
    setLoading(false);
    if (err) {
      setError(err.message ?? 'Error al iniciar sesión.');
    }
  };

  return (
    <>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'welcome' ? (
            <View style={styles.welcome}>
              <View style={styles.pawBadge}>
                <MaterialCommunityIcons name="paw" size={28} color={theme.textLight} />
              </View>
              <Text style={styles.brand}>Walkies</Text>
              <Text style={styles.tagline}>Paseos felices, perros más sanos</Text>

              <View style={styles.heroArt}>
                <Image
                  source={require('../assets/logo-walkies-azul.png')}
                  style={styles.heroDog}
                  resizeMode="contain"
                />
              </View>

              <TouchableOpacity style={styles.primaryButton} onPress={() => openForm(false)} activeOpacity={0.9}>
                <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.outlineButton} onPress={() => openForm(true)} activeOpacity={0.9}>
                <Text style={styles.outlineButtonText}>Crear cuenta</Text>
              </TouchableOpacity>

              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>O</Text>
                <View style={styles.orLine} />
              </View>

              <View style={styles.socialRow}>
                <TouchableOpacity style={styles.socialButton} onPress={() => handleSocial('Google')} activeOpacity={0.85}>
                  <Text style={styles.socialG}>G</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton} onPress={() => handleSocial('Apple')} activeOpacity={0.85}>
                  <MaterialCommunityIcons name="apple" size={22} color={theme.textDark} />
                </TouchableOpacity>
              </View>

              <Text style={styles.roleQuestion}>¿Qué tipo de cuenta quieres crear?</Text>
              <View style={styles.roleRow}>
                <TouchableOpacity
                  style={[styles.roleCard, role === 'owner' && styles.roleCardActive]}
                  onPress={() => setRole('owner')}
                  activeOpacity={0.85}
                >
                  <View style={styles.roleIcon}>
                    <MaterialCommunityIcons name="home-heart" size={22} color={theme.primaryDark} />
                  </View>
                  <Text style={styles.roleLabel}>Propietario</Text>
                  <Text style={styles.roleHint}>Encuentra paseadores cerca</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.roleCard, role === 'walker' && styles.roleCardActive]}
                  onPress={() => setRole('walker')}
                  activeOpacity={0.85}
                >
                  <View style={styles.roleIcon}>
                    <MaterialCommunityIcons name="paw" size={22} color={theme.primaryDark} />
                  </View>
                  <Text style={styles.roleLabel}>Paseador</Text>
                  <Text style={styles.roleHint}>Ofrece paseos y gana</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.formWrap}>
              <TouchableOpacity
                style={styles.backRow}
                onPress={() => {
                  setStep('welcome');
                  setError(null);
                  setInfo(null);
                }}
              >
                <MaterialIcons name="arrow-back" size={22} color={theme.primaryDark} />
                <Text style={styles.backText}>Volver</Text>
              </TouchableOpacity>

              <View style={styles.pawBadgeSmall}>
                <MaterialCommunityIcons name="paw" size={20} color={theme.textLight} />
              </View>
              <Text style={[styles.formTitle, isSmallScreen ? { fontSize: 24 } : null]}>
                {isRegister ? 'Crear cuenta' : 'Iniciar sesión'}
              </Text>
              <Text style={styles.formSubtitle}>
                {isRegister
                  ? role === 'walker'
                    ? 'Recibirás solicitudes de paseo. Después completa tu perfil de paseador.'
                    : 'Crea tu cuenta para agendar paseos y cuidar a tus mascotas.'
                  : 'Accede a tu cuenta de Walkies.'}
              </Text>

              {isRegister ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Nombre completo</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons name="person-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, isSmallScreen ? { fontSize: 15 } : null]}
                      placeholder="Tu nombre"
                      placeholderTextColor={theme.textMuted}
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              ) : null}

              {isRegister ? (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Tipo de cuenta</Text>
                  <View style={styles.roleChipRow}>
                    <TouchableOpacity
                      style={[styles.roleChip, role === 'owner' && styles.roleChipActive]}
                      onPress={() => setRole('owner')}
                    >
                      <Text style={[styles.roleChipText, role === 'owner' && styles.roleChipTextActive]}>
                        Propietario
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.roleChip, role === 'walker' && styles.roleChipActive]}
                      onPress={() => setRole('walker')}
                    >
                      <Text style={[styles.roleChipText, role === 'walker' && styles.roleChipTextActive]}>
                        Paseador
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.roleLockHint}>
                    El rol no se puede cambiar después. Usa otra cuenta si necesitas el otro tipo.
                  </Text>
                </View>
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Correo electrónico</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="alternate-email" size={20} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, isSmallScreen ? { fontSize: 15 } : null]}
                    placeholder="example@gmail.com"
                    placeholderTextColor={theme.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Contraseña</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock-outline" size={20} color={theme.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, isSmallScreen ? { fontSize: 15 } : null]}
                    placeholder="tu contraseña"
                    placeholderTextColor={theme.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialIcons
                      name={showPassword ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={theme.textMuted}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {info ? <Text style={styles.info}>{info}</Text> : null}
              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.9}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                  setInfo(null);
                }}
              >
                <Text style={styles.togglePrompt}>
                  {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta aún? '}
                  <Text style={styles.toggleLink}>{isRegister ? 'Ingresar' : 'Regístrate'}</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.footerText}>© 2026 WALKIES · UNIVERSIDAD LIBRE</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  welcome: {
    alignItems: 'center',
  },
  pawBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 8,
  },
  pawBadgeSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brand: {
    fontSize: 40,
    fontWeight: '800',
    color: theme.primaryDark,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: theme.textMuted,
    marginTop: 4,
    marginBottom: 8,
  },
  heroArt: {
    width: 210,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  heroDog: {
    width: 200,
    height: 170,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: theme.primary,
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryButtonText: {
    color: theme.textLight,
    fontSize: 17,
    fontWeight: '700',
  },
  outlineButton: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: theme.primary,
  },
  outlineButtonText: {
    color: theme.primary,
    fontSize: 17,
    fontWeight: '700',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 18,
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.cardBorder,
  },
  orText: {
    fontSize: 13,
    color: theme.textMuted,
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 22,
  },
  socialButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: theme.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialG: {
    fontSize: 20,
    fontWeight: '800',
    color: '#4285F4',
  },
  roleQuestion: {
    alignSelf: 'flex-start',
    fontSize: 15,
    fontWeight: '700',
    color: theme.textDark,
    marginBottom: 12,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  roleCard: {
    flex: 1,
    backgroundColor: theme.cardMint,
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roleCardActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primarySurface,
  },
  roleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.textDark,
  },
  roleHint: {
    fontSize: 11,
    color: theme.textMuted,
    marginTop: 2,
  },
  formWrap: {
    width: '100%',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.primaryDark,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.textDark,
    marginBottom: 6,
  },
  formSubtitle: {
    fontSize: 15,
    color: theme.textMuted,
    marginBottom: 22,
    lineHeight: 21,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textDark,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.textDark,
    paddingVertical: 2,
  },
  info: {
    color: '#047857',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 20,
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
    lineHeight: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  toggleRow: {
    alignItems: 'center',
    marginTop: 18,
  },
  togglePrompt: {
    fontSize: 15,
    color: theme.textMuted,
    textAlign: 'center',
  },
  toggleLink: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.primary,
  },
  footerText: {
    textAlign: 'center',
    color: theme.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 28,
  },
  roleChipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.cardBorder,
    backgroundColor: '#ffffff',
  },
  roleChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  roleChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textDark,
  },
  roleChipTextActive: {
    color: theme.textLight,
  },
  roleLockHint: {
    marginTop: 8,
    fontSize: 12,
    color: theme.textMuted,
    lineHeight: 17,
  },
});
