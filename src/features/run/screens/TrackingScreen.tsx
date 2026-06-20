import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler, StatusBar } from 'react-native';
import * as Location from 'expo-location';
import * as Speech from 'expo-speech';
import { Pedometer } from 'expo-sensors';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../../navigation';
import { colors } from '../../../core/theme';
import { useRunStore } from '../../../core/store/run.store';
import { LOCATION_TASK_NAME } from '../tasks/locationTask';
import { useAuthStore } from '../../../core/store/auth.store';
import { formatDistance, formatPace as formatPaceUnit } from '../../../core/utils/unitConverter';

type Props = NativeStackScreenProps<RootStackParamList, 'Tracking'>;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}


export default function TrackingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const runState = useRunStore((s) => s.runState);
  const timerSeconds = useRunStore((s) => s.timerSeconds);
  const distanceMeters = useRunStore((s) => s.distanceMeters);
  const goalDistanceMeters = useRunStore((s) => s.goalDistanceMeters);
  const averagePace = useRunStore((s) => s.averagePace);
  const calories = useRunStore((s) => s.calories);
  const steps = useRunStore((s) => s.steps);
  const gpsLost = useRunStore((s) => s.gpsLost);
  const isGoalReached = useRunStore((s) => s.isGoalReached);
  const config = useRunStore((s) => s.config);
  const pauseRun = useRunStore((s) => s.pauseRun);
  const resumeRun = useRunStore((s) => s.resumeRun);
  const stopRun = useRunStore((s) => s.stopRun);
  const onStepsUpdate = useRunStore((s) => s.onStepsUpdate);
  const user = useAuthStore((s) => s.user);
  const goalAlertFired = useRef(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handler = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => handler.remove();
  }, []);

  useEffect(() => {
    Location.requestBackgroundPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') return;
      Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 1,
        foregroundService: {
          notificationTitle: 'Alamutt Running',
          notificationBody: '',
          notificationColor: '#E8336D',
        },
      }).catch(() => {});
    });
    return () => {
      Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).then((started) => {
        if (started) Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => {});
      });
    };
  }, []);

  useEffect(() => {
    let subscription: ReturnType<typeof Pedometer.watchStepCount> | null = null;
    Pedometer.requestPermissionsAsync().then(({ status }) => {
      if (status !== 'granted') return;
      return Pedometer.isAvailableAsync();
    }).then((available) => {
      if (!available) return;
      subscription = Pedometer.watchStepCount((result) => {
        onStepsUpdate(result.steps);
      });
    }).catch(() => {});
    return () => { subscription?.remove(); };
  }, []);

  useEffect(() => {
    if (isGoalReached && !goalAlertFired.current) {
      goalAlertFired.current = true;
      Speech.speak('¡Objetivo alcanzado!', { language: 'es-ES' });
    }
  }, [isGoalReached]);

  const handleStop = async () => {
    if (!user) return;
    const runId = await stopRun(user.uid);
    if (runId) {
      navigation.replace('RunDetail', { runId });
    } else {
      navigation.replace('Main');
    }
  };

  const handlePauseResume = () => {
    if (runState === 'running') pauseRun();
    else if (runState === 'paused') resumeRun();
  };

  const hasGoal = goalDistanceMeters > 0;
  const distanceLabel = formatDistance(distanceMeters, config.unitSystem);
  const goalLabel = formatDistance(goalDistanceMeters, config.unitSystem);
  const paceLabel = formatPaceUnit(averagePace, config.unitSystem);
  const bannerTop = insets.top > 0 ? insets.top : (StatusBar.currentHeight ?? 24);

  return (
    <View style={styles.container}>
      {gpsLost && (
        <View style={[styles.gpsBanner, { top: bannerTop }]}>
          <Ionicons name="warning" size={20} color="#000" />
          <Text style={styles.gpsBannerText}>{t('run.gpsLost')}</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={styles.metricLabel}>{t('run.time')}</Text>
        <Text style={styles.timeValue}>{formatTime(timerSeconds)}</Text>

        <View style={styles.spacer24} />

        <Text style={styles.metricLabel}>{t('run.distance')}</Text>
        <Text style={[styles.distanceValue, hasGoal && styles.distanceValueGoal]}>
          {distanceLabel}{hasGoal ? ` / ${goalLabel}` : ''}
        </Text>

        <View style={styles.spacer32} />

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.metricLabel}>{t('run.steps')}</Text>
            <Text style={styles.statValue}>{steps}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.metricLabel}>{t('run.pace')}</Text>
            <Text style={styles.statValue}>{paceLabel}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.metricLabel}>{t('run.calories')}</Text>
            <Text style={styles.statValue}>{Math.round(calories)}</Text>
          </View>
        </View>

        <View style={styles.spacer56} />

        <View style={styles.controls}>
          <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
            <Ionicons name="stop" size={40} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.btnGap} />
          <TouchableOpacity style={styles.pauseBtn} onPress={handlePauseResume}>
            <Ionicons
              name={runState === 'running' ? 'pause' : 'play'}
              size={40}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gpsBanner: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  gpsBannerText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeValue: {
    color: colors.text,
    fontSize: 64,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  distanceValue: {
    color: colors.text,
    fontSize: 48,
    fontWeight: '900',
  },
  distanceValueGoal: {
    color: colors.primary,
    fontSize: 36,
  },
  spacer24: { height: 24 },
  spacer32: { height: 32 },
  spacer56: { height: 56 },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopBtn: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  btnGap: { width: 40 },
  pauseBtn: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});
