import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSizes, radii } from '../../../core/theme';

type UnitSystem = 'metric' | 'imperial';

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowControl}>{children}</View>
    </View>
  );
}

export default function SettingsScreen() {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [voiceAlerts, setVoiceAlerts] = useState(true);
  const [alertFrequency, setAlertFrequency] = useState(1);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>

      <SectionHeader title="ENTRENAMIENTO" />
      <View style={styles.card}>
        <View style={styles.unitRow}>
          {(['metric', 'imperial'] as UnitSystem[]).map((unit) => (
            <TouchableOpacity
              key={unit}
              style={[styles.unitOption, unitSystem === unit && styles.unitOptionActive]}
              onPress={() => setUnitSystem(unit)}
            >
              <Text style={[styles.unitLabel, unitSystem === unit && styles.unitLabelActive]}>
                {unit === 'metric' ? 'Kilómetros (km)' : 'Millas (mi)'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SectionHeader title="ALERTAS DE VOZ" />
      <View style={styles.card}>
        <SettingRow label="Activar alertas de voz">
          <Switch
            value={voiceAlerts}
            onValueChange={setVoiceAlerts}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.text}
          />
        </SettingRow>
        {voiceAlerts && (
          <>
            <View style={styles.cardDivider} />
            <View style={styles.freqSection}>
              <Text style={styles.rowLabel}>Frecuencia</Text>
              <Text style={styles.freqValue}>cada {alertFrequency.toFixed(1)} km</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0.5}
              maximumValue={5}
              step={0.5}
              value={alertFrequency}
              onValueChange={setAlertFrequency}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.border}
              thumbTintColor={colors.primary}
            />
          </>
        )}
      </View>

      <SectionHeader title="APLICACIÓN" />
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={20} color={colors.textMuted} />
          <Text style={styles.infoText}>Alamutt Running Club</Text>
          <Text style={styles.infoValue}>v2.0</Text>
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  sectionHeader: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  cardDivider: { height: 1, backgroundColor: colors.border, marginHorizontal: spacing.md },
  unitRow: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  unitOption: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  unitOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  unitLabel: { color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '500' },
  unitLabelActive: { color: colors.text, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  rowLabel: { color: colors.text, fontSize: fontSizes.md },
  rowControl: { flexDirection: 'row', alignItems: 'center' },
  freqSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  freqValue: { color: colors.primary, fontSize: fontSizes.md, fontWeight: '600' },
  slider: { marginHorizontal: spacing.sm, marginBottom: spacing.sm },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  infoText: { flex: 1, color: colors.text, fontSize: fontSizes.md },
  infoValue: { color: colors.textMuted, fontSize: fontSizes.sm },
});
