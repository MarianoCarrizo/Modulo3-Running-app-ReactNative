import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  setDoc,
  startAfter,
  where,
} from 'firebase/firestore';
import { db } from '../../../core/config/firebase';
import { Run } from '../../../core/types';

const RUNS_COLLECTION = 'runs';

export const RunRepository = {
  async saveRun(run: Run): Promise<string> {
    const docId = `${run.userId}_${run.date}`;
    await setDoc(doc(db, RUNS_COLLECTION, docId), run);
    return docId;
  },

  async getHistory(
    userId: string,
    pageSize: number,
    lastDoc?: QueryDocumentSnapshot
  ): Promise<{ runs: Run[]; lastDoc: QueryDocumentSnapshot | null }> {
    const runsRef = collection(db, RUNS_COLLECTION);
    const q = lastDoc
      ? query(
          runsRef,
          where('userId', '==', userId),
          orderBy('date', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        )
      : query(
          runsRef,
          where('userId', '==', userId),
          orderBy('date', 'desc'),
          limit(pageSize)
        );
    const snap = await getDocs(q);
    const runs: Run[] = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Run));
    const nextLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return { runs, lastDoc: nextLastDoc };
  },

  async getRunById(runId: string): Promise<Run | null> {
    const snap = await getDoc(doc(db, RUNS_COLLECTION, runId));
    if (!snap.exists()) return null;
    return { ...snap.data(), id: snap.id } as Run;
  },
};
