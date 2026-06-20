import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../../navigation';
import { colors, fontSizes, spacing, radii } from '../../../core/theme';
import { Run } from '../../../core/types';
import { RunRepository } from '../data/RunRepository';

type Props = NativeStackScreenProps<RootStackParamList, 'RunDetail'>;

function formatDate(epochMs: number): string {
  const d = new Date(epochMs);
  return d.toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatPace(paceMinKm: number): string {
  if (!isFinite(paceMinKm) || isNaN(paceMinKm) || paceMinKm === 0) return '--';
  const totalSeconds = Math.round(paceMinKm * 60);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')} min/km`;
}

export default function RunDetailScreen({ navigation, route }: Props) {
  const { runId } = route.params;
  const [run, setRun] = useState<Run | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    RunRepository.getRunById(runId)
      .then((r) => setRun(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [runId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('runDetail.title')}</Text>
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {!loading && !run && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{t('runDetail.notFound')}</Text>
        </View>
      )}

      {!loading && run && (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.dateLabel}>{formatDate(run.date)}</Text>

          <View style={styles.distanceCard}>
            <Text style={styles.distanceLabel}>{t('run.distance')}</Text>
            <Text style={styles.distanceValue}>
              {(run.distance / 1000).toFixed(2)} km
            </Text>
          </View>

          <View style={styles.grid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t('run.pace')}</Text>
              <Text style={styles.gridValue}>{formatPace(run.pace)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t('run.time')}</Text>
              <Text style={styles.gridValue}>{formatTime(run.duration)}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t('run.calories')}</Text>
              <Text style={styles.gridValue}>{Math.round(run.calories)} kcal</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t('run.steps')}</Text>
              <Text style={styles.gridValue}>{run.steps}</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  backBtn: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSizes.xl,
    fontWeight: 'bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  dateLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    marginBottom: spacing.lg,
    textTransform: 'capitalize',
  },
  distanceCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  distanceLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  distanceValue: {
    color: colors.primary,
    fontSize: fontSizes.display,
    fontWeight: 'bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  gridItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  gridLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  gridValue: {
    color: colors.text,
    fontSize: fontSizes.lg,
    fontWeight: 'bold',
  },
});
