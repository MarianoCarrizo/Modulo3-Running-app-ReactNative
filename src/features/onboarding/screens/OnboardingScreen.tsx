import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { updateUser } from '../../../core/services/user.service';
import { uploadProfileImage } from '../../../core/services/cloudinary.service';
import { useAuthStore } from '../../../core/store/auth.store';
import { colors, spacing, fontSizes, radii } from '../../../core/theme';

const TOTAL_STEPS = 3;

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1
  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');

  // Step 2
  const [weight, setWeight] = useState(user?.weightKg ? String(user.weightKg) : '');
  const [height, setHeight] = useState(user?.heightCm ? String(user.heightCm) : '');

  // Step 3
  const [photoUri, setPhotoUri] = useState<string | null>(user?.photoUrl ?? null);

  const nextStep = () => { setError(''); setStep((s) => s + 1); };
  const prevStep = () => { setError(''); setStep((s) => s - 1); };

  const validateStep1 = () => {
    if (!name.trim()) { setError('El nombre es obligatorio.'); return false; }
    return true;
  };

  const validateStep2 = () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (isNaN(w) || w <= 0) { setError('Ingresá un peso válido.'); return false; }
    if (isNaN(h) || h <= 0) { setError('Ingresá una altura válida.'); return false; }
    return true;
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleFinish = async () => {
    setError('');
    setLoading(true);
    try {
      // Upload to Cloudinary if user picked a local file
      let finalPhotoUrl = photoUri ?? '';
      if (photoUri && !photoUri.startsWith('http')) {
        finalPhotoUrl = await uploadProfileImage(photoUri);
      }

      await updateUser(user!.uid, {
        name: name.trim(),
        bio: bio.trim(),
        weightKg: parseFloat(weight),
        heightCm: parseFloat(height),
        photoUrl: finalPhotoUrl,
        onboardingCompleted: true,
      });
      setUser({
        ...user!,
        name: name.trim(),
        bio: bio.trim(),
        weightKg: parseFloat(weight),
        heightCm: parseFloat(height),
        photoUrl: finalPhotoUrl,
        onboardingCompleted: true,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.container, { paddingTop: spacing.lg + insets.top, paddingBottom: spacing.xl + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >

        {/* Header */}
        <Text style={styles.title}>CONFIGURA TU PERFIL</Text>
        <Text style={styles.stepLabel}>Paso {step} de {TOTAL_STEPS}</Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[styles.progressSegment, i < step && styles.progressActive]}
            />
          ))}
        </View>

        <View style={styles.content}>

          {/* STEP 1 — Name + Bio */}
          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>¡TE DAMOS LA BIENVENIDA AL CLUB!{'\n'}¿CÓMO TE LLAMÁS?</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre de usuario"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Biografía (opcional)"
                placeholderTextColor={colors.textMuted}
                value={bio}
                onChangeText={setBio}
              />
            </>
          )}

          {/* STEP 2 — Physical data */}
          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>INGRESA TUS DATOS FÍSICOS</Text>
              <Text style={styles.stepSubtitle}>Para un cálculo de calorías más preciso</Text>
              <FloatingInput label="Peso (kg)" value={weight} onChangeText={setWeight} keyboardType="decimal-pad" />
              <FloatingInput label="Altura (cm)" value={height} onChangeText={setHeight} keyboardType="decimal-pad" />
            </>
          )}

          {/* STEP 3 — Photo */}
          {step === 3 && (
            <>
              <Text style={styles.stepTitle}>AÑADE TU FOTO DE PERFIL</Text>
              <TouchableOpacity style={styles.photoCircle} onPress={handlePickPhoto}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoImage} />
                ) : (
                  <Ionicons name="camera" size={48} color={colors.textMuted} />
                )}
              </TouchableOpacity>
              <Text style={styles.photoHint}>Toca para seleccionar</Text>
            </>
          )}

          {error !== '' && <Text style={styles.error}>{error}</Text>}
        </View>

        {/* Footer buttons */}
        <View style={styles.footer}>
          {step > 1 ? (
            <TouchableOpacity style={styles.backBtn} onPress={prevStep}>
              <Text style={styles.backBtnText}>Atrás</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backBtn} />
          )}

          {step < TOTAL_STEPS ? (
            <TouchableOpacity
              style={styles.nextBtn}
              onPress={() => {
                if (step === 1 && !validateStep1()) return;
                if (step === 2 && !validateStep2()) return;
                nextStep();
              }}
            >
              <Text style={styles.nextBtnText}>Siguiente</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtn} onPress={handleFinish} disabled={loading}>
              {loading
                ? <ActivityIndicator color={colors.text} />
                : <Text style={styles.nextBtnText}>Finalizar</Text>
              }
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function FloatingInput({ label, value, onChangeText, keyboardType }: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'decimal-pad' | 'default';
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[floatStyles.wrapper, focused && floatStyles.wrapperFocused]}>
      <Text style={[floatStyles.label, focused && floatStyles.labelFocused]}>{label}</Text>
      <TextInput
        style={floatStyles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor={colors.primary}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const floatStyles = StyleSheet.create({
  wrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    marginBottom: spacing.md,
    backgroundColor: colors.inputBg,
  },
  wrapperFocused: { borderColor: colors.primary },
  label: { fontSize: fontSizes.xs, color: colors.textMuted, marginBottom: 2 },
  labelFocused: { color: colors.primary },
  input: { color: colors.text, fontSize: fontSizes.lg, paddingVertical: 0 },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, paddingHorizontal: spacing.lg },
  title: {
    fontSize: fontSizes.xl,
    fontWeight: '900',
    color: colors.primary,
    letterSpacing: 1,
  },
  stepLabel: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  progressTrack: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.xxl,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.border,
  },
  progressActive: { backgroundColor: colors.primary },
  content: { flex: 1 },
  stepTitle: {
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.lg,
    lineHeight: 26,
  },
  stepSubtitle: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    marginTop: -spacing.sm,
  },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: fontSizes.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.surface,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
    overflow: 'hidden',
  },
  photoImage: { width: 160, height: 160, borderRadius: 80 },
  photoHint: {
    color: colors.textMuted,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  error: {
    color: colors.error,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  backBtn: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  backBtnText: { color: colors.text, fontSize: fontSizes.md, fontWeight: '600' },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  nextBtnText: { color: colors.text, fontSize: fontSizes.md, fontWeight: 'bold' },
});
