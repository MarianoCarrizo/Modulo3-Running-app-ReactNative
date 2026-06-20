import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSizes, radii, typography } from '../../../core/theme';
import { useRunStore } from '../../../core/store/run.store';
import i18n from '../../../core/i18n';
import { useTranslation } from 'react-i18next';

type CountdownSeconds = 0 | 3 | 5 | 10;
const COUNTDOWN_OPTIONS: CountdownSeconds[] = [0, 3, 5, 10];

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const config = useRunStore((s) => s.config);
  const setConfig = useRunStore((s) => s.setConfig);
  const { t } = useTranslation();
  const [language, setLanguage] = useState(i18n.language?.startsWith('en') ? 'en' : 'es');

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingBottom: spacing.xxl + insets.bottom }]}
    >
      <Text style={styles.sectionLabel}>{t('settings.general')}</Text>

      <View style={styles.item}>
        <Text style={styles.itemTitle}>{t('settings.language')}</Text>
        <View style={styles.radioRow}>
          <RadioButton
            label="Español"
            selected={language === 'es'}
            onPress={() => handleLanguageChange('es')}
          />
          <RadioButton
            label="English"
            selected={language === 'en'}
            onPress={() => handleLanguageChange('en')}
          />
        </View>
      </View>

      <View style={styles.itemDivider} />

      <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>{t('settings.training')}</Text>

      <View style={styles.item}>
        <Text style={styles.itemTitle}>{t('settings.units')}</Text>
        <View style={styles.radioRow}>
          <RadioButton
            label={t('settings.metric')}
            selected={config.unitSystem === 'metric'}
            onPress={() => setConfig({ ...config, unitSystem: 'metric' })}
          />
          <RadioButton
            label={t('settings.imperial')}
            selected={config.unitSystem === 'imperial'}
            onPress={() => setConfig({ ...config, unitSystem: 'imperial' })}
          />
        </View>
      </View>

      <View style={styles.itemDivider} />

      <View style={[styles.item, styles.rowBetween]}>
        <Text style={styles.itemTitle}>{t('settings.voiceAlerts')}</Text>
        <Switch
          value={config.voiceAlerts}
          onValueChange={(v) => setConfig({ ...config, voiceAlerts: v })}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.text}
        />
      </View>

      {config.voiceAlerts && (
        <View style={styles.sliderSection}>
          <Text style={styles.freqLabel}>
            {t('settings.frequency', {
              value: config.alertFrequencyKm.toFixed(1),
              unit: config.unitSystem === 'imperial' ? 'mi' : 'km',
            })}
          </Text>
          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={5}
            step={0.5}
            value={config.alertFrequencyKm}
            onValueChange={(v) => setConfig({ ...config, alertFrequencyKm: v })}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />
        </View>
      )}

      <View style={styles.itemDivider} />

      <View style={styles.item}>
        <Text style={styles.itemTitle}>{t('settings.countdown')}</Text>
        <View style={styles.chipRow}>
          {COUNTDOWN_OPTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.chip, config.countdown === s && styles.chipActive]}
              onPress={() => setConfig({ ...config, countdown: s })}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, config.countdown === s && styles.chipTextActive]}>
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
