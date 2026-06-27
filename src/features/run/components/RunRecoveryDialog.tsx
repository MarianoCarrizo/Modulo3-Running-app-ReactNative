import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fontSizes, spacing, radii } from '../../../core/theme';
import { formatTime } from '../../../core/utils/time';
import { RunCheckpoint } from '../../../core/types';
import { clearCheckpoint } from '../services/checkpoint';
import { RunRepository } from '../data/RunRepository';

interface Props {
  checkpoint: RunCheckpoint;
  onDismiss: () => void;
}

function formatPace(paceMinKm: number): string {
  if (!isFinite(paceMinKm) || isNaN(paceMinKm) || paceMinKm === 0) return '--';
  const totalSeconds = Math.round(paceMinKm * 60);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')} min/km`;
}

export default function RunRecoveryDialog({ checkpoint, onDismiss }: Props) {
  const [busy, setBusy] = useState(false);
  const { t } = useTranslation();

  const handleSave = async () => {
    if (checkpoint.distanceMeters < 50) {
      await clearCheckpoint();
      onDismiss();
      return;
    }
    setBusy(true);
    try {
      const run = {
        id: `${checkpoint.userId}_${checkpoint.updatedAt}`,
        userId: checkpoint.userId,
        distance: checkpoint.distanceMeters,
        pace: checkpoint.pace,
        duration: checkpoint.durationSeconds,
        calories: checkpoint.calories,
        steps: checkpoint.steps,
        date: checkpoint.updatedAt,
        points: 0,
      };
      await RunRepository.saveRun(run);
      await clearCheckpoint();
      onDismiss();
    } catch {
      setBusy(false);
    }
  };

  const handleDiscard = async () => {
    setBusy(true);
    try {
      await clearCheckpoint();
      onDismiss();
    } catch {
      setBusy(false);
    }
  };

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={() => {}}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('recovery.title')}</Text>
          <Text style={styles.subtitle}>{t('recovery.subtitle')}</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{t('run.distance')}</Text>
              <Text style={styles.metricValue}>
                {(checkpoint.distanceMeters / 1000).toFixed(2)} km
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>{t('run.time')}</Text>
              <Text style={styles.metricValue}>{formatTime(checkpoint.durationSeconds)}</Text>
            </View>
          </View>

          {busy ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
          ) : (
            <View style={styles.buttons}>
              <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard}>
                <Text style={styles.discardText}>{t('recovery.discard')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.modalScrim.heavy,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.xl,
    width: '100%',
  },
  title: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    marginBottom: spacing.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  metricValue: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  discardBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  discardText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: fontSizes.md,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveText: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: fontSizes.md,
  },
});
