import React, { useState, useEffect } from 'react';
import {
  Alert, View, Text, TextInput, TouchableOpacity, StyleSheet,
  ImageBackground, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Dimensions,
} from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import { loginWithEmail, registerWithEmail, loginWithGoogleCredential } from '../../../core/services/auth.service';
import { colors, spacing, fontSizes, radii } from '../../../core/theme';

WebBrowser.maybeCompleteAuthSession();

const { height } = Dimensions.get('window');
const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Isolated component so the Google hook never runs inside Expo Go.
// Hooks cannot be called conditionally, but a component can be conditionally rendered.
function GoogleAuthHandler({ triggerRef, onStart, onDone, onError }: {
  triggerRef: React.MutableRefObject<(() => void) | null>;
  onStart: () => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const [, response, promptAsync] = Google.useAuthRequest({ clientId: GOOGLE_CLIENT_ID });

  useEffect(() => {
    triggerRef.current = () => { onStart(); promptAsync(); };
  }, [promptAsync]);

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken ?? response.params?.id_token;
      if (idToken) {
        loginWithGoogleCredential(idToken)
          .then(onDone)
          .catch((e: unknown) => { onDone(); onError(e instanceof Error ? e.message : 'Google auth failed.'); });
      } else {
        onDone();
        onError('No se pudo obtener el token de Google.');
      }
    } else if (response?.type === 'error') {
      onDone();
      onError('Error al autenticar con Google. Intentá de nuevo.');
    }
  }, [response]);

  return null;
}

const RUN_IMAGES = [
  require('../../../../assets/run1.png'),
  require('../../../../assets/run2.png'),
  require('../../../../assets/run3.png'),
];

const QUOTE = '"Tus piernas no están cansadas,\ntu mente te miente."';

type AuthView = 'landing' | 'login' | 'register';

export default function AuthScreen() {
  const [view, setView] = useState<AuthView>('landing');
  const [imageIndex, setImageIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  const googleTrigger = React.useRef<(() => void) | null>(null);

  const handleGooglePress = () => {
    if (IS_EXPO_GO) {
      Alert.alert(
        'Google Sign-In',
        'Not available in Expo Go. Use email/password to test, or run an EAS build.',
        [{ text: 'OK' }]
      );
      return;
    }
    googleTrigger.current?.();
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setImageIndex((i) => (i + 1) % RUN_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const reset = () => { setError(''); setEmail(''); setPassword(''); setConfirmPassword(''); };

  const handleLogin = async () => {
    if (!email || !password) { setError('Completá todos los campos.'); return; }
    setError(''); setLoading(true);
    try { await loginWithEmail(email, password); }
    catch (e: unknown) { setError(e instanceof Error ? friendlyError(e.message) : 'Error al iniciar sesión.'); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) { setError('Completá todos los campos.'); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden.'); return; }
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return; }
    setError(''); setLoading(true);
    try { await registerWithEmail(email, password); }
    catch (e: unknown) { setError(e instanceof Error ? friendlyError(e.message) : 'Error al registrarse.'); }
    finally { setLoading(false); }
  };

  return (
    <ImageBackground source={RUN_IMAGES[imageIndex]} style={styles.bg} resizeMode="cover">
      {!IS_EXPO_GO && (
        <GoogleAuthHandler
          triggerRef={googleTrigger}
          onStart={() => setGoogleLoading(true)}
          onDone={() => setGoogleLoading(false)}
          onError={(msg) => { setError(friendlyError(msg)); }}
        />
      )}
      <View style={styles.overlay}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.brandTitle}>ALAMUTT</Text>
              <Text style={styles.brandSub}>RUNNING CLUB</Text>
            </View>

            {/* Quote */}
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>{QUOTE}</Text>
            </View>

            <View style={styles.spacer} />

            {/* LANDING */}
            {view === 'landing' && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => { reset(); setView('register'); }}>
                  <Text style={styles.primaryBtnText}>Unirse al club</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => { reset(); setView('login'); }}>
                  <Text style={styles.secondaryBtnText}>Iniciar sesión</Text>
                </TouchableOpacity>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>o</Text>
                  <View style={styles.dividerLine} />
                </View>
                <TouchableOpacity
                  style={[styles.googleBtn, googleLoading && styles.disabledBtn]}
                  disabled={googleLoading}
                  onPress={handleGooglePress}
                >
                  {googleLoading
                    ? <ActivityIndicator color={colors.text} size="small" />
                    : <Ionicons name="logo-google" size={20} color={colors.text} />
                  }
                  <Text style={styles.googleBtnText}>Continuar con Google</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* LOGIN */}
            {view === 'login' && (
              <View style={styles.actions}>
                <AuthInput icon="mail-outline" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
                <AuthInput icon="lock-closed-outline" placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
                {error !== '' && <Text style={styles.error}>{error}</Text>}
                <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
                  {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.primaryBtnText}>Entrar al club</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { reset(); setView('landing'); }}>
                  <Text style={styles.backText}>Volver atrás</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* REGISTER */}
            {view === 'register' && (
              <View style={styles.actions}>
                <AuthInput icon="mail-outline" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
                <AuthInput icon="lock-closed-outline" placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry />
                <AuthInput icon="lock-closed-outline" placeholder="Confirmar contraseña" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
                {error !== '' && <Text style={styles.error}>{error}</Text>}
                <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
                  {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.primaryBtnText}>Registrarme</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { reset(); setView('landing'); }}>
                  <Text style={styles.backText}>Volver atrás</Text>
                </TouchableOpacity>
              </View>
            )}

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

function AuthInput({ icon, placeholder, value, onChangeText, secureTextEntry, keyboardType }: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  placeholder: string;
  value: string;
  onChangeText: (t: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'email-address' | 'default';
}) {
  return (
    <View style={inputStyles.wrapper}>
      <Ionicons name={icon} size={18} color={colors.textMuted} style={inputStyles.icon} />
      <TextInput
        style={inputStyles.input}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

function friendlyError(msg: string): string {
  if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
    return 'Email o contraseña incorrectos.';
  if (msg.includes('email-already-in-use')) return 'Este email ya está registrado.';
  if (msg.includes('invalid-email')) return 'El email no es válido.';
  return 'Ocurrió un error. Intentá de nuevo.';
}

const inputStyles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  icon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: fontSizes.md,
    paddingVertical: spacing.md,
  },
});

const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: { flex: 1, backgroundColor: colors.overlay },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.lg, paddingTop: height * 0.07, paddingBottom: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  brandTitle: {
    fontSize: fontSizes.display,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 4,
  },
  brandSub: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 8,
    marginTop: -spacing.xs,
  },
  quoteBox: {
    backgroundColor: colors.quoteBox,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  quoteText: {
    color: colors.text,
    fontSize: fontSizes.md,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  spacer: { flex: 1, minHeight: spacing.xxl },
  actions: { gap: spacing.sm },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: { color: colors.text, fontSize: fontSizes.md, fontWeight: 'bold' },
  secondaryBtn: {
    backgroundColor: colors.inputBg,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: { color: colors.text, fontSize: fontSizes.md, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.xs },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textMuted, marginHorizontal: spacing.sm, fontSize: fontSizes.sm },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  googleBtnText: { color: colors.text, fontSize: fontSizes.md, fontWeight: '600' },
  disabledBtn: { opacity: 0.4 },
  error: { color: colors.error, fontSize: fontSizes.sm, textAlign: 'center' },
  backText: { color: colors.textSecondary, fontSize: fontSizes.sm, textAlign: 'center', marginTop: spacing.sm },
});
