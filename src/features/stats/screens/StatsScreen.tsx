import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
} from 'react-native';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { db } from '../../../core/config/firebase';
import { useAuthStore } from '../../../core/store/auth.store';
import { useRunStore } from '../../../core/store/run.store';
import { metersToDisplay, unitLabel } from '../../../core/utils/unitConverter';
import { colors, spacing, fontSizes, radii } from '../../../core/theme';
import { CenteredLoader } from '../../../core/components';

interface Ranks {
  distance: number;
  runs: number;
  calories: number;
  steps: number;
  points: number;
}

interface StatCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  unit?: string;
  inlineUnit?: boolean;
  label: string;
  rank?: number;
  highlight?: boolean;
  flex?: number;
}

function StatCard({ icon, value, unit, inlineUnit, label, rank, highlight, flex = 1 }: StatCardProps) {
  const iconSize = highlight ? 24 : 18;
  const iconWrap = highlight ? 40 : 34;
  const valueFontSize = highlight ? 30 : 26;

  return (
    <View style={[styles.card, { flex }]}>
      {rank != null && rank > 0 && (
        <View style={styles.rankBadge}>
          <Ionicons name="trophy" size={10} color={colors.text} />
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
      )}

      <View style={[styles.iconCircle, { width: iconWrap, height: iconWrap, borderRadius: iconWrap / 2 }]}>
        <Ionicons name={icon} size={iconSize} color={colors.primary} />
      </View>

      <View style={styles.valueRow}>
        <Text style={[styles.valueText, { fontSize: valueFontSize }]}>{value}</Text>
        {unit && inlineUnit && (
          <Text style={styles.inlineUnit}>{unit.toUpperCase()}</Text>
        )}
      </View>

      {unit && !inlineUnit && (
        <Text style={styles.unitText}>{unit.toUpperCase()}</Text>
      )}

      <Text style={styles.labelText}>{label.toUpperCase()}</Text>
    </View>
  );
}

async function fetchRank(field: string, value: number): Promise<number> {
  const snap = await getCountFromServer(
    query(collection(db, 'users'), where(field, '>', value))
  );
  return snap.data().count + 1;
}

export default function StatsScreen() {
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();
  const unitSystem = useRunStore((s) => s.config.unitSystem);
  const [ranks, setRanks] = useState<Ranks | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    Promise.all([
      fetchRank('totalDistance', user.totalDistance ?? 0),
      fetchRank('totalRuns',     user.totalRuns     ?? 0),
      fetchRank('totalCalories', user.totalCalories ?? 0),
      fetchRank('totalSteps',    user.totalSteps    ?? 0),
      fetchRank('points',        user.points        ?? 0),
    ])
      .then(([distance, runs, calories, steps, points]) =>
        setRanks({ distance, runs, calories, steps, points })
      )
      .catch(() => setRanks(null))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  if (loading) {
    return <CenteredLoader />;
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <StatCard
        icon="star"
        value={Number(user.points ?? 0).toLocaleString()}
        label={t('stats.points')}
        rank={ranks?.points}
        highlight
        flex={0}
      />

      <View style={styles.row}>
        <StatCard
          icon="navigate"
          value={metersToDisplay((user.totalDistance ?? 0) * 1000, unitSystem).toFixed(1)}
          unit={unitLabel(unitSystem)}
          inlineUnit
          label={t('stats.totalDistance')}
          rank={ranks?.distance}
        />
        <StatCard
          icon="repeat"
          value={(user.totalRuns ?? 0).toString()}
          label={t('stats.runs')}
          rank={ranks?.runs}
        />
      </View>

      <View style={styles.row}>
        <StatCard
          icon="flame"
          value={(user.totalCalories ?? 0).toString()}
          label={t('stats.calories')}
          rank={ranks?.calories}
        />
        <StatCard
          icon="footsteps"
          value={(user.totalSteps ?? 0).toLocaleString()}
          label={t('stats.totalSteps')}
          rank={ranks?.steps}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  row:     { flexDirection: 'row', gap: spacing.md },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    padding: spacing.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    elevation: 2,
    overflow: 'hidden',
  },

  rankBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: radii.md,
    borderTopRightRadius: radii.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    gap: 3,
  },
  rankText: { color: colors.text, fontSize: 10, fontWeight: '900' },

  iconCircle: {
    backgroundColor: colors.primary + '1A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },

  valueRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  valueText:   { color: colors.text, fontWeight: '900', letterSpacing: -0.5 },
  inlineUnit:  { color: colors.textSecondary, fontSize: fontSizes.xs, fontWeight: '900', paddingBottom: 3 },
  unitText:    { color: colors.textSecondary, fontSize: fontSizes.xs, fontWeight: '900', letterSpacing: 0.5 },
  labelText:   { color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 2, textAlign: 'center' },
});
