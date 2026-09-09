import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'workshops_offline_db';
const STORE_NAME = 'draft_submissions';

interface OfflineDraft {
  activityId: string;
  workshopId: string;
  answers: Record<string, any>;
  savedAt: string;
  isSynced: boolean;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'activityId' });
        }
      }
    });
  }
  return dbPromise;
}

export async function saveLocalDraft(activityId: string, workshopId: string, answers: Record<string, any>): Promise<void> {
  const db = await getDB();
  const draft: OfflineDraft = {
    activityId,
    workshopId,
    answers,
    savedAt: new Date().toISOString(),
    isSynced: false
  };
  await db.put(STORE_NAME, draft);
}

export async function getLocalDraft(activityId: string): Promise<OfflineDraft | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, activityId);
}

export async function clearLocalDraft(activityId: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_NAME, activityId);
}
