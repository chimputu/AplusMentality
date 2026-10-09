// Offline assessment answer queue using IndexedDB
// Queues answers when offline, flushes when connection restored
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AssessmentAnswer {
  attemptId: string;
  questionId: string;
  selectedOptionId?: string;
  textAnswer?: string;
  numericAnswer?: number;
  matchingAnswer?: Record<string, string>;
  answeredAt: string;
}

interface AssessmentQueueDB extends DBSchema {
  answers: {
    key: string;
    value: AssessmentAnswer & { id: string; synced: boolean };
    indexes: { synced: boolean };
  };
}

const DB_NAME = 'assessment-queue';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<AssessmentQueueDB>> | null = null;

async function getDB(): Promise<IDBPDatabase<AssessmentQueueDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AssessmentQueueDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('answers')) {
          const store = db.createObjectStore('answers', { keyPath: 'id' });
          store.createIndex('synced', 'synced');
        }
      },
    });
  }
  return dbPromise;
}

// Queue an answer for later sync
export async function queueAnswer(answer: AssessmentAnswer): Promise<void> {
  const db = await getDB();
  const id = crypto.randomUUID();
  await db.put('answers', {
    ...answer,
    id,
    synced: false,
  });
}

// Get all unsynced answers
export async function getUnsyncedAnswers(): Promise<(AssessmentAnswer & { id: string })[]> {
  const db = await getDB();
  const tx = db.transaction('answers', 'readonly');
  const index = tx.store.index('synced');
  return index.getAll(false);
}

// Mark answers as synced
export async function markSynced(ids: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('answers', 'readwrite');
  for (const id of ids) {
    const existing = await tx.store.get(id);
    if (existing) {
      await tx.store.put({ ...existing, synced: true });
    }
  }
  await tx.done;
}

// Clear synced answers older than 24 hours
export async function cleanupOldAnswers(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('answers', 'readwrite');
  const index = tx.store.index('synced');
  const syncedAnswers = await index.getAll(true);
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;

  for (const answer of syncedAnswers) {
    if (new Date(answer.answeredAt).getTime() < cutoff) {
      await tx.store.delete(answer.id);
    }
  }
  await tx.done;
}

// Flush unsynced answers to the server
export async function flushAnswers(): Promise<{ success: number; failed: number }> {
  const unsynced = await getUnsyncedAnswers();
  if (unsynced.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;
  const syncedIds: string[] = [];

  for (const answer of unsynced) {
    try {
      const res = await fetch('/api/attempts/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: answer.attemptId,
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          textAnswer: answer.textAnswer,
          numericAnswer: answer.numericAnswer,
          matchingAnswer: answer.matchingAnswer,
        }),
      });

      if (res.ok) {
        syncedIds.push(answer.id);
        success++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  if (syncedIds.length > 0) {
    await markSynced(syncedIds);
  }

  return { success, failed };
}

// Check if online
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// Listen for online event and flush
export function setupOnlineListener(): void {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', () => {
    flushAnswers().then(({ success, failed }) => {
      if (success > 0) {
        console.log(`[AssessmentQueue] Synced ${success} answers`);
      }
      if (failed > 0) {
        console.warn(`[AssessmentQueue] Failed to sync ${failed} answers`);
      }
    });
  });
}

// Get queue size
export async function getQueueSize(): Promise<number> {
  const answers = await getUnsyncedAnswers();
  return answers.length;
}
