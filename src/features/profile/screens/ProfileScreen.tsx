import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Image, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../core/store/auth.store';
import { updateUser } from '../../../core/services/user.service';
import { uploadProfileImage } from '../../../core/services/cloudinary.service';
import { colors, spacing, fontSizes, radii } from '../../../core/theme';

export default function ProfileScreen() {
  const { user, setUser } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');

  if (!user) return null;

  const startEdit = () => {
    setName(user.name ?? '');
    setBio(user.bio ?? '');
    setWeight(user.weightKg?.toString() ?? '');
    setHeight(user.heightCm?.toString() ?? '');
    setEditing(true);
  };

  const handlePickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setUploadingPhoto(true);
      try {
        const url = await uploadProfileImage(uri);
        await updateUser(user.uid, { photoUrl: url });
        setUser({ ...user, photoUrl: url });
      } catch {
        Alert.alert('Error', 'No se pudo subir la foto. Intentá de nuevo.');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handleSave = async () => {
    const w = parseFloat(weight);
    const h = parseInt(height, 10);
    if (isNaN(w) || w <= 0 || isNaN(h) || h <= 0) {
      Alert.alert('Valores inválidos', 'Ingresá un peso y altura válidos.');
      return;
    }
    setSaving(true);
    try {
      const updates = { name: name.trim(), bio: bio.trim(), weightKg: w, heightCm: h };
      await updateUser(user.uid, updates);
      setUser({ ...user, ...updates });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <TouchableOpacity
        style={styles.avatarWrap}
        onPress={editing ? handlePickPhoto : undefined}
        activeOpacity={editing ? 0.7 : 1}
      >
        {user.photoUrl ? (
          <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={48} color={colors.textMuted} />
          </View>
        )}
        {editing && (
          <View style={styles.cameraOverlay}>
            {uploadingPhoto
              ? <ActivityIndicator color={colors.text} size="small" />
              : <Ionicons name="camera" size={30} color={colors.text} />
            }
          </View>
        )}
      </TouchableOpacity>

      {!editing ? (
        <>
          <Text style={styles.nameText}>{user.name || 'Runner'}</Text>

          <View style={styles.pointsRow}>
            <Ionicons name="trophy" size={18} color="#FFD700" />
            <Text style={styles.pointsText}>{user.points ?? 0} PUNTOS</Text>
          </View>

          <Text style={styles.bioText}>{user.bio || 'Sin biografía'}</Text>

          <View style={styles.statsCard}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Peso</Text>
              <Text style={styles.statValue}>{user.weightKg} kg</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Altura</Text>
              <Text style={styles.statValue}>{user.heightCm} cm</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.editBtn} onPress={startEdit}>
            <Text style={styles.editBtnText}>Editar perfil</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Biografía</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={3}
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Peso (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Altura (cm)</Text>
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="number-pad"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving
                ? <ActivityIndicator color={colors.text} size="small" />
                : <Text style={styles.saveBtnText}>Guardar</Text>
              }
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.background },
  content: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xxl },

  avatarWrap: { marginBottom: spacing.lg },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarFallback: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  nameText:   { color: colors.text, fontSize: fontSizes.xl, fontWeight: '900', marginBottom: spacing.sm },
  pointsRow:  { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  pointsText: { color: '#FFD700', fontSize: fontSizes.md, fontWeight: '900' },
  bioText:    { color: colors.textSecondary, fontSize: fontSizes.md, textAlign: 'center', marginBottom: spacing.xl },

  statsCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  statRow:     { flexDirection: 'row', justifyContent: 'space-between' },
  statDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  statLabel:   { color: colors.textMuted, fontSize: fontSizes.sm, fontWeight: '700' },
  statValue:   { color: colors.text, fontSize: fontSizes.md, fontWeight: '900' },

  editBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  editBtnText: { color: colors.text, fontWeight: 'bold', fontSize: fontSizes.md },

  field:         { width: '100%', marginBottom: spacing.md },
  fieldLabel:    { color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '600', marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSizes.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },

  editActions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: { color: colors.text, fontSize: fontSizes.md, fontWeight: '600' },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveBtnText: { color: colors.text, fontWeight: 'bold', fontSize: fontSizes.md },
});
