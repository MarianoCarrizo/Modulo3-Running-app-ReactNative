import { doc, getDoc, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const CHALLENGE_DISTANCES_KM = [5.0, 10.0, 21.0, 42.0];

export function getCurrentWeekId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const jan1 = new Date(year, 0, 1);
  const weekOneStart = new Date(jan1);
  weekOneStart.setDate(jan1.getDate() - jan1.getDay());
  const daysSince = Math.floor((now.getTime() - weekOneStart.getTime()) / 86400000);
  const week = Math.floor(daysSince / 7) + 1;
  return `${year}-W${week}`;
}

export interface ChallengeState {
  activeChallenges: Record<string, number>;
  challengeWeekId: string;
  completedChallenges: string[];
  points: number;
}

export async function fetchChallengeData(uid: string): Promise<ChallengeState> {
  const currentWeekId = getCurrentWeekId();
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return { activeChallenges: {}, challengeWeekId: currentWeekId, completedChallenges: [], points: 0 };
  }

  const data = snap.data();
  const storedWeekId = (data.challengeWeekId as string) ?? '';
  const completedChallenges = (data.completedChallenges as string[]) ?? [];
  const points = (data.points as number) ?? 0;

  if (storedWeekId !== currentWeekId) {
    await updateDoc(ref, { activeChallenges: {}, challengeWeekId: currentWeekId });
    return { activeChallenges: {}, challengeWeekId: currentWeekId, completedChallenges, points };
  }

  return {
    activeChallenges: (data.activeChallenges as Record<string, number>) ?? {},
    challengeWeekId: storedWeekId,
    completedChallenges,
    points,
  };
}

export async function subscribeToChallenge(uid: string, distance: number): Promise<void> {
  const currentWeekId = getCurrentWeekId();
  const ref = doc(db, 'users', uid);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const storedWeekId = (data.challengeWeekId as string) ?? '';
    const existing = (data.activeChallenges as Record<string, number>) ?? {};

    const activeChallenges = storedWeekId !== currentWeekId ? {} : { ...existing };
    const key = distance.toString();

    if (!(key in activeChallenges)) {
      activeChallenges[key] = 0.0;
    }

    transaction.update(ref, { activeChallenges, challengeWeekId: currentWeekId });
  });
}

export async function unsubscribeFromChallenge(uid: string, distance: number): Promise<void> {
  const ref = doc(db, 'users', uid);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const activeChallenges = { ...(data.activeChallenges as Record<string, number>) ?? {} };
    delete activeChallenges[distance.toString()];

    transaction.update(ref, { activeChallenges });
  });
}

export async function updateUserStats(
  uid: string,
  distanceKm: number,
  calories: number,
  steps: number,
  paceMinPerKm: number,
): Promise<number[]> {
  const currentWeekId = getCurrentWeekId();
  const ref = doc(db, 'users', uid);
  const completedDistances: number[] = [];

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const storedWeekId = (data.challengeWeekId as string) ?? '';
    const existing = (data.activeChallenges as Record<string, number>) ?? {};
    const completedChallenges = [...((data.completedChallenges as string[]) ?? [])];
    let points = (data.points as number) ?? 0;
    const bestPace = (data.bestPace as number) ?? 0;

    const activeChallenges = storedWeekId !== currentWeekId ? {} : { ...existing };

    for (const [key, progress] of Object.entries(activeChallenges)) {
      const target = parseFloat(key);
      const newProgress = progress + distanceKm;

      if (progress < target && newProgress >= target) {
        completedDistances.push(target);
        completedChallenges.push(`${key}-${currentWeekId}`);
        points += Math.round(target * 10);
        delete activeChallenges[key];
      } else {
        activeChallenges[key] = newProgress;
      }
    }

    const newBestPace =
      paceMinPerKm > 0 && (bestPace === 0 || paceMinPerKm < bestPace)
        ? paceMinPerKm
        : bestPace;

    transaction.update(ref, {
      activeChallenges,
      challengeWeekId: currentWeekId,
      completedChallenges,
      points,
      bestPace: newBestPace,
      totalDistance: ((data.totalDistance as number) ?? 0) + distanceKm,
      totalCalories: ((data.totalCalories as number) ?? 0) + calories,
      totalSteps: ((data.totalSteps as number) ?? 0) + steps,
      totalRuns: ((data.totalRuns as number) ?? 0) + 1,
    });
  });

  return completedDistances;
}
