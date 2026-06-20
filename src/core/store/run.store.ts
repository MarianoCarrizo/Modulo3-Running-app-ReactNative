import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
import i18n from '../i18n';
import { RunState, RunConfig, Run } from '../types';
import { RunMetricsCalculator } from '../../features/run/domain/RunMetricsCalculator';
import { RunRepository } from '../../features/run/data/RunRepository';
import { saveCheckpoint, clearCheckpoint } from '../../features/run/services/checkpoint';
import {
  initNotifications,
  showRunNotification,
  dismissRunNotification,
} from '../../features/run/services/runNotification';
import { formatDistance, formatPace as fmtPace } from '../utils/unitConverter';
import { updateUserStats } from '../services/challenge.service';
import { useAuthStore } from './auth.store';

const CONFIG_KEY = 'run_config';
const CHECKPOINT_INTERVAL_S = 30;

const calculator = new RunMetricsCalculator();

const defaultConfig: RunConfig = {
  unitSystem: 'metric',
  voiceAlerts: true,
  alertFrequencyKm: 1,
  countdown: 3,
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatPace(paceMinKm: number): string {
  if (!isFinite(paceMinKm) || isNaN(paceMinKm)) return '--';
  const totalSeconds = Math.round(paceMinKm * 60);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')} /km`;
}

interface RunStore {
  runState: RunState;
  timerSeconds: number;
  distanceMeters: number;
  averagePace: number;
  calories: number;
  steps: number;
  gpsLost: boolean;
  goalDistanceMeters: number;
  isGoalReached: boolean;
  config: RunConfig;
  weightKg: number;
  completedAt: number | null;
  startEpochMs: number | null;

  _timerInterval: ReturnType<typeof setInterval> | null;
  _checkpointCounter: number;
  _lastMilestoneKm: number;

  setConfig: (config: RunConfig) => Promise<void>;
  loadConfig: () => Promise<void>;
  setGoalDistance: (meters: number) => void;
  setWeightKg: (kg: number) => void;
  startCountdown: () => void;
  startRun: () => Promise<void>;
  pauseRun: () => void;
  resumeRun: () => void;
  stopRun: (userId: string) => Promise<string | null>;
  onLocationUpdate: (location: {
    coords: { latitude: number; longitude: number; accuracy: number | null; speed: number | null };
    timestamp: number;
  }) => void;
  onGpsLost: () => void;
  onGpsRestored: () => void;
  onStepsUpdate: (steps: number) => void;
  reset: () => void;
}

export const useRunStore = create<RunStore>((set, get) => ({
  runState: 'idle',
  timerSeconds: 0,
  distanceMeters: 0,
  averagePace: NaN,
  calories: 0,
  steps: 0,
  gpsLost: false,
  goalDistanceMeters: 0,
  isGoalReached: false,
  config: defaultConfig,
  weightKg: 70,
  completedAt: null,
  startEpochMs: null,

  _timerInterval: null,
  _checkpointCounter: 0,
  _lastMilestoneKm: 0,

  setConfig: async (config) => {
    set({ config });
    await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  },

  loadConfig: async () => {
    try {
      const raw = await AsyncStorage.getItem(CONFIG_KEY);
      if (raw) {
        const config = JSON.parse(raw) as RunConfig;
        set({ config });
      }
    } catch {
    }
  },

  setGoalDistance: (meters) => {
    set({ goalDistanceMeters: meters, isGoalReached: false });
  },

  setWeightKg: (kg) => {
    set({ weightKg: kg });
  },

  startCountdown: () => {
    set({ runState: 'countdown' });
  },

  startRun: async () => {
    await initNotifications().catch(() => {});
    const now = Date.now();
    calculator.reset();

    const interval = setInterval(() => {
      const state = get();
      if (state.runState !== 'running') return;

      const newSeconds = state.timerSeconds + 1;
      const distKm = state.distanceMeters / 1000;
      const weightKg = state.weightKg;
      const calories = RunMetricsCalculator.computeCalories(distKm, weightKg);

      const counter = state._checkpointCounter + 1;

      set({ timerSeconds: newSeconds, calories, _checkpointCounter: counter });

      const updatedState = get();

      const unit = updatedState.config.unitSystem;
      showRunNotification(
        formatDistance(updatedState.distanceMeters, unit),
        fmtPace(updatedState.averagePace, unit),
        formatTime(updatedState.timerSeconds)
      ).catch(() => {});

      if (counter >= CHECKPOINT_INTERVAL_S) {
        set({ _checkpointCounter: 0 });
        const user = useAuthStore.getState().user;
        if (user) {
          saveCheckpoint({
            userId: user.uid,
            distanceMeters: updatedState.distanceMeters,
            durationSeconds: updatedState.timerSeconds,
            pace: updatedState.averagePace,
            calories: updatedState.calories,
            steps: updatedState.steps,
            updatedAt: Date.now(),
          }).catch(() => {});
        }
      }
    }, 1000);

    set({
      runState: 'running',
      startEpochMs: now,
      gpsLost: false,
      _timerInterval: interval,
      _checkpointCounter: 0,
      _lastMilestoneKm: 0,
    });
  },

  pauseRun: () => {
    const state = get();
    if (state._timerInterval) {
      clearInterval(state._timerInterval);
    }
    calculator.resetPaceWindow();
    showRunNotification(
      formatDistance(state.distanceMeters, state.config.unitSystem),
      i18n.t('run.paused'),
      formatTime(state.timerSeconds)
    ).catch(() => {});
    set({ runState: 'paused', _timerInterval: null });
  },

  resumeRun: () => {
    const interval = setInterval(() => {
      const state = get();
      if (state.runState !== 'running') return;

      const newSeconds = state.timerSeconds + 1;
      const distKm = state.distanceMeters / 1000;
      const calories = RunMetricsCalculator.computeCalories(distKm, state.weightKg);
      const counter = state._checkpointCounter + 1;

      set({ timerSeconds: newSeconds, calories, _checkpointCounter: counter });

      const updatedState = get();
      const unit2 = updatedState.config.unitSystem;
      showRunNotification(
        formatDistance(updatedState.distanceMeters, unit2),
        fmtPace(updatedState.averagePace, unit2),
        formatTime(updatedState.timerSeconds)
      ).catch(() => {});

      if (counter >= CHECKPOINT_INTERVAL_S) {
        set({ _checkpointCounter: 0 });
        const user = useAuthStore.getState().user;
        if (user) {
          saveCheckpoint({
            userId: user.uid,
            distanceMeters: updatedState.distanceMeters,
            durationSeconds: updatedState.timerSeconds,
            pace: updatedState.averagePace,
            calories: updatedState.calories,
            steps: updatedState.steps,
            updatedAt: Date.now(),
          }).catch(() => {});
        }
      }
    }, 1000);

    set({ runState: 'running', _timerInterval: interval });
  },

  stopRun: async (userId) => {
    const state = get();
    if (state._timerInterval) {
      clearInterval(state._timerInterval);
    }

    dismissRunNotification().catch(() => {});
    clearCheckpoint().catch(() => {});

    if (state.distanceMeters < 50) {
      get().reset();
      return null;
    }

    const now = Date.now();
    const startEpochMs = state.startEpochMs ?? now;

    const run: Run = {
      id: `${userId}_${startEpochMs}`,
      userId,
      distance: state.distanceMeters,
      pace: isNaN(state.averagePace) ? 0 : state.averagePace,
      duration: state.timerSeconds,
      calories: state.calories,
      steps: state.steps,
      date: startEpochMs,
      points: 0,
    };

    try {
      const runId = await RunRepository.saveRun(run);
      get().reset();
      updateUserStats(
        userId,
        state.distanceMeters / 1000,
        state.calories,
        state.steps,
        isNaN(state.averagePace) ? 0 : state.averagePace,
      ).catch((e) => console.error('[RunStore] updateUserStats failed:', e));
      return runId;
    } catch (e) {
      console.error('[RunStore] saveRun failed:', e);
      get().reset();
      return null;
    }
  },

  onLocationUpdate: (location) => {
    const state = get();
    if (state.runState !== 'running') return;

    const isAccurate = location.coords.accuracy === null || location.coords.accuracy <= 20;
    if (!isAccurate) {
      if (!state.gpsLost) set({ gpsLost: true });
      return;
    }
    if (state.gpsLost) set({ gpsLost: false });

    const result = calculator.updateMetrics(location);
    const distKm = result.distanceMeters / 1000;
    const calories = RunMetricsCalculator.computeCalories(distKm, state.weightKg);

    const { config, _lastMilestoneKm } = state;
    let lastMilestoneKm = _lastMilestoneKm;

    if (config.voiceAlerts && isFinite(result.averagePace) && !isNaN(result.averagePace)) {
      const nextMilestone = lastMilestoneKm + config.alertFrequencyKm;
      if (distKm >= nextMilestone) {
        lastMilestoneKm = nextMilestone;
        const paceStr = formatPace(result.averagePace);
        Speech.speak(
          `${distKm.toFixed(1)} kilómetros. Ritmo: ${paceStr}`,
          { language: 'es-ES' }
        );
      }
    }

    const goalDistanceMeters = state.goalDistanceMeters;
    const isGoalReached = goalDistanceMeters > 0 && result.distanceMeters >= goalDistanceMeters;

    set({
      distanceMeters: result.distanceMeters,
      averagePace: result.averagePace,
      calories,
      isGoalReached,
      _lastMilestoneKm: lastMilestoneKm,
    });
  },

  onGpsLost: () => {
    set({ gpsLost: true });
  },

  onGpsRestored: () => {
    set({ gpsLost: false });
  },

  onStepsUpdate: (totalSteps) => {
    const state = get();
    const prevSteps = state.steps;
    const delta = totalSteps - prevSteps;
    if (delta <= 0) return;

    if (state.gpsLost && state.runState === 'running') {
      const newDistance = calculator.addDeadReckoningSteps(delta);
      const distKm = newDistance / 1000;
      const calories = RunMetricsCalculator.computeCalories(distKm, state.weightKg);
      set({ steps: totalSteps, distanceMeters: newDistance, calories });
    } else {
      set({ steps: totalSteps });
    }
  },

  reset: () => {
    const state = get();
    if (state._timerInterval) {
      clearInterval(state._timerInterval);
    }
    calculator.reset();
    set({
      runState: 'idle',
      timerSeconds: 0,
      distanceMeters: 0,
      averagePace: NaN,
      calories: 0,
      steps: 0,
      gpsLost: false,
      isGoalReached: false,
      completedAt: null,
      startEpochMs: null,
      _timerInterval: null,
      _checkpointCounter: 0,
      _lastMilestoneKm: 0,
    });
  },
}));
