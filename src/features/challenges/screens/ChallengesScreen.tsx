import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../core/store/auth.store';
import {
  ChallengeState,
  CHALLENGE_DISTANCES_KM,
  getCurrentWeekId,
  fetchChallengeData,
  subscribeToChallenge,
  unsubscribeFromChallenge,
} from '../../../core/services/challenge.service';
import { colors, spacing, fontSizes, radii } from '../../../core/theme';

export default function ChallengesScreen() {
  const currentWeek = getCurrentWeekId();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { t } = useTranslation();
  const [state, setState] = useState<ChallengeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const parseCompletedLabel = (id: string): string => {
    const parts = id.split('-');
    const km = parseFloat(parts[0]);
    const year = parts[1];
    const week = parts[2]?.replace('W', '');
    return t('challenges.completedLabel', { km: km.toFixed(2), year, week });
  };

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await fetchChallengeData(user.uid);
      setState(data);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleSubscribe = async (distance: number) => {
    if (!user) return;
    setActionLoading(distance);
    try {
      await subscribeToChallenge(user.uid, distance);
      await load();
    } catch {
      Alert.alert(t('common.error'), t('challenges.errorJoin'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnsubscribe = async (distance: number) => {
    if (!user) return;
    setActionLoading(distance);
    try {
      await unsubscribeFromChallenge(user.uid, distance);
      await load();
    } catch {
      Alert.alert(t('common.error'), t('challenges.errorLeave'));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const active = state?.activeChallenges ?? {};
  const completed = state?.completedChallenges ?? [];
  const points = state?.points ?? user?.points ?? 0;
  const available = CHALLENGE_DISTANCES_KM.filter((d) => !(d.toString() in active));

  return (
    <ScrollView style={styles.root} contentContainerStyle={[styles.content, { paddingBottom: spacing.xxl + insets.bottom }]}>

      {/* Points card */}
      <View style={styles.pointsCard}>
        <Ionicons name="trophy" size={36} color={colors.primary} />
        <Text style={styles.pointsNumber}>{points}</Text>
        <Text style={styles.pointsLabel}>{t('challenges.points')}</Text>
        <Text style={styles.pointsSub}>{t('challenges.totalPoints')}</Text>
      </View>

      {/* Weekly disclaimer */}
      <View style={styles.disclaimerRow}>
        <Ionicons name="calendar-outline" size={13} color={colors.textMuted} />
        <Text style={styles.disclaimerText}>
          {t('challenges.weeklyReset', { week: currentWeek })}
        </Text>
      </View>

      {/* Active challenges */}
      {Object.keys(active).length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Ionicons name="walk" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('challenges.active')}</Text>
          </View>
          {Object.entries(active).map(([key, progress]) => {
            const target = parseFloat(key);
            const safeProg = progress ?? 0;
            const pct = Math.round(Math.min(safeProg / target, 1) * 100);
            return (
              <View key={key} style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardTitle}>{target.toFixed(2)} km Runner</Text>
                  <TouchableOpacity
                    onPress={() => handleUnsubscribe(target)}
                    disabled={actionLoading === target}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {actionLoading === target
                      ? <ActivityIndicator color={colors.textMuted} size="small" />
                      : <Ionicons name="close-circle" size={24} color={colors.textMuted} />
                    }
                  </TouchableOpacity>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${pct}%` }]} />
                </View>
                <View style={styles.progressFooter}>
                  <Text style={styles.progressText}>
                    {t('challenges.progressText', { current: safeProg.toFixed(2), target: target.toFixed(2) })}
                  </Text>
                  <Text style={styles.progressPct}>{pct}%</Text>
                </View>
              </View>
            );
          })}
        </>
      )}

      {/* Available challenges */}
      {available.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>{t('challenges.available')}</Text>
          </View>
          {available.map((distance) => (
            <View key={distance} style={styles.card}>
              <View style={styles.cardRow}>
                <View>
                  <Text style={styles.cardTitle}>{distance.toFixed(2)} km Runner</Text>
                  <Text style={styles.rewardText}>
                    {t('challenges.reward', { points: Math.round(distance * 10) })}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleSubscribe(distance)}
                  disabled={actionLoading === distance}
                  style={styles.retarBtn}
                >
                  {actionLoading === distance
                    ? <ActivityIndicator color={colors.text} size="small" />
                    : <Text style={styles.retarBtnText}>{t('challenges.join')}</Text>
                  }
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </>
      )}

      {/* Completed challenges */}
      {completed.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Ionicons name="checkmark-circle-outline" size={18} color={colors.success} />
            <Text style={[styles.sectionTitle, { color: colors.success }]}>{t('challenges.completed')}</Text>
          </View>
          {[...completed].reverse().map((id) => (
            <View key={id} style={[styles.card, styles.completedCard]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.completedText}>{parseCompletedLabel(id)}</Text>
            </View>
          ))}
        </>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  pointsCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  pointsNumber: { color: colors.text, fontSize: fontSizes.xxl, fontWeight: '900' },
  pointsLabel:  { color: colors.primary, fontSize: fontSizes.md, fontWeight: '700' },
  pointsSub:    { color: colors.textSecondary, fontSize: fontSizes.sm },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.primary,
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle:  { color: colors.text, fontSize: fontSizes.md, fontWeight: '700' },
  rewardText: { color: colors.primary, fontSize: fontSizes.sm, marginTop: 2 },

  progressTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  progressFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  progressText: { color: colors.textSecondary, fontSize: fontSizes.xs },
  progressPct:  { color: colors.primary, fontSize: fontSizes.xs, fontWeight: '700' },

  retarBtn: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  retarBtnText: { color: colors.text, fontSize: fontSizes.sm, fontWeight: '700' },

  completedCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  completedText: { color: colors.textSecondary, fontSize: fontSizes.sm, flex: 1 },

  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  disclaimerText: { color: colors.textMuted, fontSize: fontSizes.xs },
});
