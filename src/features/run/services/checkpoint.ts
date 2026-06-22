import AsyncStorage from '@react-native-async-storage/async-storage';
import { RunCheckpoint } from '../../../core/types';

export const CHECKPOINT_KEY = 'run_checkpoint';

export const saveCheckpoint = async (cp: RunCheckpoint): Promise<void> => {
  await AsyncStorage.setItem(CHECKPOINT_KEY, JSON.stringify(cp));
};

export const loadCheckpoint = async (): Promise<RunCheckpoint | null> => {
  const raw = await AsyncStorage.getItem(CHECKPOINT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as RunCheckpoint;
  } catch {
    return null;
  }
};

export const clearCheckpoint = async (): Promise<void> => {
  await AsyncStorage.removeItem(CHECKPOINT_KEY);
};
