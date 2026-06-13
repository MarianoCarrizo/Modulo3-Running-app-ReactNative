import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, Image,
} from 'react-native';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { db } from '../../../core/config/firebase';
import { colors, spacing, fontSizes, radii } from '../../../core/theme';
import { RootStackParamList } from '../../../navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type FilterKey = 'totalDistance' | 'totalCalories' | 'totalSteps' | 'points' | 'bestPace';

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

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'totalDistance', label: 'Distancia' },
  { key: 'totalCalories', label: 'Calorías' },
  { key: 'totalSteps',    label: 'Pasos' },
  { key: 'points',        label: 'Puntos' },
  { key: 'bestPace',      label: 'Paso' },
];

const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDALS = ['🥇', '🥈', '🥉'];

function formatDistance(km: number) { return km.toFixed(1); }
function formatPace(s: number) {
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getValue(user: LeaderboardUser, filter: FilterKey): string {
  switch (filter) {
    case 'totalDistance': return formatDistance(user.totalDistance);
    case 'totalCalories': return user.totalCalories.toString();
    case 'totalSteps':    return user.totalSteps.toLocaleString();
    case 'points':        return user.points.toString();
    case 'bestPace':      return user.bestPace > 0 ? formatPace(user.bestPace) : 'N/A';
  }
}

function getUnit(filter: FilterKey): string {
  switch (filter) {
    case 'totalDistance': return 'KM';
    case 'totalCalories': return 'KCAL';
    case 'totalSteps':    return 'PASOS';
    case 'points':        return 'PTS';
    case 'bestPace':      return 'MIN/KM';
  }
}

export default function LeaderboardScreen() {
  const navigation = useNavigation<Nav>();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('totalDistance');
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (filter: FilterKey) => {
    setLoading(true);
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
    } catch {
      setUsers([]);
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
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : users.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>Sin datos todavía</Text>
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
                    {getValue(item, activeFilter)}
                  </Text>
                  <Text style={styles.statUnit}>{getUnit(activeFilter)}</Text>
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
