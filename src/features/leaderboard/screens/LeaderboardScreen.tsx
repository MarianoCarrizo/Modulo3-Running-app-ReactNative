import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image,
} from 'react-native';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { db } from '../../../core/config/firebase';
import { colors, spacing, fontSizes, radii } from '../../../core/theme';
import { CenteredLoader } from '../../../core/components';
import { RootStackParamList } from '../../../navigation';
import { useRunStore } from '../../../core/store/run.store';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterKey = 'totalDistance' | 'totalCalories' | 'totalSteps' | 'points' | 'bestPace';
type UnitSystem = 'metric' | 'imperial';

interface LeaderboardUser {
  uid: string;
  name: string;
  photoUrl: string;
  totalDistance: number;
  totalCalories: number;
  totalSteps: number;
  points: number;
  bestPace: number;
}

const RANK_COLORS = [colors.medal.gold, colors.medal.silver, colors.medal.bronze];
const MEDALS = ['🥇', '🥈', '🥉'];

function formatPace(paceMinKm: number, unitSystem: UnitSystem): string {
  if (!paceMinKm || paceMinKm <= 0) return 'N/A';
  const pace = unitSystem === 'imperial' ? paceMinKm * 1.60934 : paceMinKm;
  const totalSeconds = Math.round(pace * 60);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getValue(user: LeaderboardUser, filter: FilterKey, unitSystem: UnitSystem): string {
  switch (filter) {
    case 'totalDistance': {
      const display = unitSystem === 'imperial' ? user.totalDistance * 0.621371 : user.totalDistance;
      return display.toFixed(1);
    }
    case 'totalCalories': return user.totalCalories.toString();
    case 'totalSteps':    return user.totalSteps.toLocaleString();
    case 'points':        return user.points.toString();
    case 'bestPace':      return formatPace(user.bestPace, unitSystem);
  }
}

function getUnit(filter: FilterKey, unitSystem: UnitSystem, t: (k: string) => string): string {
  switch (filter) {
    case 'totalDistance': return unitSystem === 'imperial' ? 'MI' : 'KM';
    case 'totalCalories': return 'KCAL';
    case 'totalSteps':    return t('leaderboard.unitSteps');
    case 'points':        return t('leaderboard.unitPts');
    case 'bestPace':      return unitSystem === 'imperial' ? 'MIN/MI' : 'MIN/KM';
  }
}

export default function LeaderboardScreen() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const unitSystem = useRunStore((s) => s.config.unitSystem);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('totalDistance');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [queryError, setQueryError] = useState<string | null>(null);

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'totalDistance', label: t('leaderboard.distance') },
    { key: 'totalCalories', label: t('leaderboard.calories') },
    { key: 'totalSteps',    label: t('leaderboard.steps') },
    { key: 'points',        label: t('leaderboard.points') },
    { key: 'bestPace',      label: t('leaderboard.pace') },
  ];

  const load = useCallback(async (filter: FilterKey) => {
    setLoading(true);
    setQueryError(null);
    try {
      const direction = filter === 'bestPace' ? 'asc' : 'desc';
      const snap = await getDocs(
        query(
          collection(db, 'users'),
          where(filter, '>', 0),
          orderBy(filter, direction),
          limit(50)
        )
      );
      setUsers(
        snap.docs.map((d) => ({
          uid:           d.id,
          name:          d.data().name          ?? '',
          photoUrl:      d.data().photoUrl       ?? '',
          totalDistance: d.data().totalDistance  ?? 0,
          totalCalories: d.data().totalCalories  ?? 0,
          totalSteps:    d.data().totalSteps     ?? 0,
          points:        d.data().points         ?? 0,
          bestPace:      d.data().bestPace       ?? 0,
        }))
      );
    } catch (e) {
      setUsers([]);
      setQueryError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(activeFilter); }, [activeFilter, load]);

  return (
    <View style={styles.root}>
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, activeFilter === f.key && styles.chipActive]}
            onPress={() => setActiveFilter(f.key)}
          >
            <Text style={[styles.chipText, activeFilter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <CenteredLoader />
      ) : queryError ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Error: {queryError}</Text>
        </View>
      ) : users.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{t('leaderboard.noData')}</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.uid}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const rankColor = index < 3 ? RANK_COLORS[index] : colors.border;
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('RunnerProfile', { uid: item.uid })}
              >
                <View style={[styles.rankBadge, { borderColor: rankColor, backgroundColor: rankColor + '33' }]}>
                  <Text style={index < 3 ? styles.rankMedal : styles.rankNum}>
                    {index < 3 ? MEDALS[index] : (index + 1).toString()}
                  </Text>
                </View>

                <View style={[styles.avatar, { borderColor: rankColor }]}>
                  {item.photoUrl ? (
                    <Image source={{ uri: item.photoUrl }} style={styles.avatarImg} />
                  ) : (
                    <Ionicons name="person" size={22} color={colors.textMuted} />
                  )}
                </View>

                <Text style={styles.name} numberOfLines={1}>{item.name || 'Runner'}</Text>

                <View style={styles.stat}>
                  <Text style={[styles.statValue, { color: index < 3 ? rankColor : colors.text }]}>
                    {getValue(item, activeFilter, unitSystem)}
                  </Text>
                  <Text style={styles.statUnit}>{getUnit(activeFilter, unitSystem, t)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: colors.background },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive:     { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText:       { color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '700' },
  chipTextActive: { color: colors.text },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText:      { color: colors.textMuted, fontSize: fontSizes.md },
  list:           { padding: spacing.md, gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
    elevation: 2,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankMedal: { fontSize: 18 },
  rankNum:   { color: colors.text, fontSize: fontSizes.sm, fontWeight: '900' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImg: { width: 48, height: 48 },
  name:      { flex: 1, color: colors.text, fontSize: fontSizes.md, fontWeight: '900' },
  stat:      { alignItems: 'flex-end' },
  statValue: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  statUnit:  { color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '800', letterSpacing: 0.5 },
});
