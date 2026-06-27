import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ImageBackground, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { loginWithEmail, registerWithEmail } from '../../../core/services/auth.service';
import { colors, spacing, fontSizes, radii } from '../../../core/theme';

const { height } = Dimensions.get('window');

const RUN_IMAGES = [
  require('../../../../assets/run1.png'),
  require('../../../../assets/run2.png'),
  require('../../../../assets/run3.png'),
];

type AuthView = 'landing' | 'login' | 'register';

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [view, setView] = useState<AuthView>('landing');
  const [imageIndex, setImageIndex] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setImageIndex((i) => (i + 1) % RUN_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const reset = () => { setError(''); setEmail(''); setPassword(''); setConfirmPassword(''); };

  const handleLogin = async () => {
    if (!email || !password) { setError(t('auth.fillAllFields')); return; }
    setError(''); setLoading(true);
    try { await loginWithEmail(email, password); }
    catch (e: unknown) { setError(e instanceof Error ? friendlyError(e.message, t) : t('auth.errorGeneric')); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) { setError(t('auth.fillAllFields')); return; }
    if (password !== confirmPassword) { setError(t('auth.passwordMismatch')); return; }
    if (password.length < 6) { setError(t('auth.passwordTooShort')); return; }
    setError(''); setLoading(true);
    try { await registerWithEmail(email, password); }
    catch (e: unknown) { setError(e instanceof Error ? friendlyError(e.message, t) : t('auth.errorGeneric')); }
    finally { setLoading(false); }
  };

  return (
    <ImageBackground source={RUN_IMAGES[imageIndex]} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: spacing.xl + insets.bottom }]}
            keyboardShouldPersistTaps="handled"
          >

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.brandTitle}>ALAMUTT</Text>
              <Text style={styles.brandSub}>RUNNING CLUB</Text>
            </View>

            {/* Quote */}
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>{t('auth.quote')}</Text>
            </View>

            <View style={styles.spacer} />

            {/* LANDING */}
            {view === 'landing' && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.primaryBtn} onPress={() => { reset(); setView('register'); }}>
                  <Text style={styles.primaryBtnText}>{t('auth.joinClub')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => { reset(); setView('login'); }}>
                  <Text style={styles.secondaryBtnText}>{t('auth.login')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* LOGIN */}
            {view === 'login' && (
              <View style={styles.actions}>
                <AuthInput icon="mail-outline" placeholder={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" />
                <AuthInput icon="lock-closed-outline" placeholder={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry />
                {error !== '' && <Text style={styles.error}>{error}</Text>}
                <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin} disabled={loading}>
                  {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.primaryBtnText}>{t('auth.enterClub')}</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { reset(); setView('landing'); }}>
                  <Text style={styles.backText}>{t('auth.goBack')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* REGISTER */}
            {view === 'register' && (
              <View style={styles.actions}>
                <AuthInput icon="mail-outline" placeholder={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" />
                <AuthInput icon="lock-closed-outline" placeholder={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry />
                <AuthInput icon="lock-closed-outline" placeholder={t('auth.confirmPassword')} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
                {error !== '' && <Text style={styles.error}>{error}</Text>}
                <TouchableOpacity style={styles.primaryBtn} onPress={handleRegister} disabled={loading}>
                  {loading ? <ActivityIndicator color={colors.text} /> : <Text style={styles.primaryBtnText}>{t('auth.registerMe')}</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { reset(); setView('landing'); }}>
                  <Text style={styles.backText}>{t('auth.goBack')}</Text>
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

function friendlyError(msg: string, t: (key: string) => string): string {
  if (msg.includes('user-not-found') || msg.includes('wrong-password') || msg.includes('invalid-credential'))
    return t('auth.errorInvalidCredential');
  if (msg.includes('email-already-in-use')) return t('auth.errorEmailInUse');
  if (msg.includes('invalid-email')) return t('auth.errorInvalidEmail');
  return t('auth.errorGeneric');
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
  error: { color: colors.error, fontSize: fontSizes.sm, textAlign: 'center' },
  backText: { color: colors.textSecondary, fontSize: fontSizes.sm, textAlign: 'center', marginTop: spacing.sm },
});
