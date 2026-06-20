export interface User {
  uid: string;
  name: string;
  bio: string;
  email: string;
  weightKg: number;
  heightCm: number;
  photoUrl?: string;
  totalDistance: number;
  totalCalories: number;
  totalSteps: number;
  totalRuns?: number;
  points?: number;
  bestPace?: number;
  onboardingCompleted: boolean;
  activeChallenges?: Record<string, number>;
  challengeWeekId?: string;
  challengeProgress?: number;
  completedChallenges?: string[];
}

export interface Run {
  id: string;
  userId: string;
  distance: number;
  pace: number;
  duration: number;
  calories: number;
  steps: number;
  date: number;
  points: number;
}

export type UnitSystem = 'Metric' | 'Imperial';

export type RunState = 'idle' | 'countdown' | 'running' | 'paused';

export interface RunConfig {
  unitSystem: 'metric' | 'imperial';
  voiceAlerts: boolean;
  alertFrequencyKm: number;
  countdown: number;
}

export interface RunCheckpoint {
  userId: string;
  distanceMeters: number;
  durationSeconds: number;
  pace: number;
  calories: number;
  steps: number;
  updatedAt: number;
}
