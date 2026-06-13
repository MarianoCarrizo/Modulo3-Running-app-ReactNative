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
}

export type UnitSystem = 'Metric' | 'Imperial';
