import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types';

export const getUser = async (uid: string): Promise<User | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...snap.data() } as User;
};

export const createUser = async (uid: string, data: Partial<Omit<User, 'uid'>>) =>
  setDoc(doc(db, 'users', uid), { ...data, onboardingCompleted: false }, { merge: true });

export const updateUser = async (uid: string, data: Partial<Omit<User, 'uid'>>) =>
  updateDoc(doc(db, 'users', uid), data as Record<string, unknown>);
