import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getUser } from '../../../core/services/user.service';
import { User } from '../../../core/types';
import { RootStackParamList } from '../../../navigation';
import { colors, spacing, fontSizes, radii } from '../../../core/theme';

type Route = RouteProp<RootStackParamList, 'RunnerProfile'>;

function formatDistance(km: number) { return km.toFixed(1); }
function formatPace(s: number) {
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

interface StatCardProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  unit: string;
  label: string;
}

function StatCard({ icon, value, unit, label }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon} size={24} color={colors.primary} style={styles.statIcon} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statUnit}>{unit}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function RunnerProfileScreen() {
  const { params } = useRoute<Route>();
  const [runner, setRunner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getUser(params.uid)
      .then((u) => {
        if (u) setRunner(u);
        else setError(true);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [params.uid]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error || !runner) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No se pudo cargar el perfil.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.avatarWrap}>
        {runner.photoUrl ? (
          <Image source={{ uri: runner.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Ionicons name="person" size={48} color={colors.textMuted} />
          </View>
        )}
      </View>

      <Text style={styles.nameText}>{runner.name || 'Runner'}</Text>
      <Text style={styles.bioText}>{runner.bio || 'Sin biografía'}</Text>

      <View style={styles.sectionHeader}>
        <Ionicons name="bar-chart" size={18} color={colors.primary} />
        <Text style={styles.sectionTitle}>ESTADÍSTICAS TOTALES</Text>
      </View>

      <View style={styles.grid}>
        <StatCard
          icon="map-outline"
          value={formatDistance(runner.totalDistance)}
          unit="km"
          label="Distancia"
        />
        <StatCard
          icon="footsteps-outline"
          value={(runner.totalRuns ?? 0).toString()}
          unit=""
          label="Carreras"
        />
        <StatCard
          icon="flame-outline"
          value={runner.totalCalories.toString()}
          unit="kcal"
          label="Calorías"
        />
        <StatCard
          icon="walk-outline"
          value={runner.totalSteps.toLocaleString()}
          unit=""
          label="Pasos"
        />
        {(runner.bestPace ?? 0) > 0 && (
          <StatCard
            icon="timer-outline"
            value={formatPace(runner.bestPace!)}
            unit="min/km"
            label="Mejor paso"
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: colors.background },
  content: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.xxl },
  center:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },

  errorText: { color: colors.textMuted, fontSize: fontSizes.md },

  avatarWrap: { marginBottom: spacing.lg },
  avatar: { width: 120, height: 120, borderRadius: 60 },
  avatarFallback: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },

  nameText: { color: colors.text, fontSize: fontSizes.xl, fontWeight: '900', marginBottom: spacing.sm },
  bioText:  { color: colors.textSecondary, fontSize: fontSizes.md, textAlign: 'center', marginBottom: spacing.xl },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.text, fontSize: fontSizes.sm, fontWeight: '900', letterSpacing: 1 },

  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statIcon:  { marginBottom: spacing.sm },
  statValue: { color: colors.text, fontSize: fontSizes.xl, fontWeight: '900' },
  statUnit:  { color: colors.textSecondary, fontSize: fontSizes.sm, fontWeight: '800', letterSpacing: 0.5 },
  statLabel: { color: colors.textSecondary, fontSize: fontSizes.sm, marginTop: spacing.xs },
});
