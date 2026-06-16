import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSizes, radii, typography } from '../../../core/theme';

type UnitSystem = 'metric' | 'imperial';
type CountdownSeconds = 0 | 3 | 5 | 10;

const COUNTDOWN_OPTIONS: CountdownSeconds[] = [0, 3, 5, 10];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [voiceAlerts, setVoiceAlerts] = useState(true);
  const [alertFrequency, setAlertFrequency] = useState(1.0);
  const [countdown, setCountdown] = useState<CountdownSeconds>(3);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: spacing.xxl + insets.bottom }]}
    >
      <Text style={styles.sectionLabel}>General</Text>

      <View style={styles.item}>
        <Text style={styles.itemTitle}>Idioma</Text>
        <Text style={styles.itemSubtitle}>Español / English / Português / Русский</Text>
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>Entrenamiento</Text>

      <View style={styles.item}>
        <Text style={styles.itemTitle}>Sistema de unidades</Text>
        <View style={styles.radioRow}>
          <RadioButton
            label="Métrico (km)"
            selected={unitSystem === 'metric'}
            onPress={() => setUnitSystem('metric')}
          />
          <RadioButton
            label="Imperial (mi)"
            selected={unitSystem === 'imperial'}
            onPress={() => setUnitSystem('imperial')}
          />
        </View>
      </View>

      <View style={styles.itemDivider} />

      <View style={[styles.item, styles.rowBetween]}>
        <Text style={styles.itemTitle}>Alertas de voz</Text>
        <Switch
          value={voiceAlerts}
          onValueChange={setVoiceAlerts}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.text}
        />
      </View>

      {voiceAlerts && (
        <View style={styles.sliderSection}>
          <Text style={styles.freqLabel}>Frecuencia: cada {alertFrequency.toFixed(1)} km</Text>
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
        </View>
      )}

      <View style={styles.itemDivider} />

      <View style={styles.item}>
        <Text style={styles.itemTitle}>Cuenta regresiva</Text>
        <View style={styles.chipRow}>
          {COUNTDOWN_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, countdown === s && styles.chipActive]}
              onPress={() => setCountdown(s)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, countdown === s && styles.chipTextActive]}>
                {s}s
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function RadioButton({ label, selected, onPress }: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.radioOption} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.radioOuter, selected && styles.radioOuterSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  sectionLabel: { ...typography.sectionLabel, marginTop: spacing.lg, marginBottom: spacing.xs },

  item:      { paddingVertical: spacing.md },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemTitle:   { ...typography.itemTitle },
  itemSubtitle: { ...typography.caption, marginTop: spacing.xs },

  divider:     { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  itemDivider: { height: 1, backgroundColor: colors.border },

  radioRow: { flexDirection: 'row', marginTop: spacing.sm, gap: spacing.xl },
  radioOption: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: { borderColor: colors.primary },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  radioLabel: { ...typography.body },

  sliderSection: { paddingBottom: spacing.sm },
  freqLabel: { ...typography.caption, marginTop: spacing.xs },
  slider: { marginHorizontal: -spacing.sm },

  chipRow: { flexDirection: 'row', marginTop: spacing.sm, gap: spacing.sm },
  chip: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 52,
    alignItems: 'center',
  },
  chipActive:     { backgroundColor: colors.primary },
  chipText:       { ...typography.label },
  chipTextActive: { ...typography.label, fontWeight: '700' },
});
