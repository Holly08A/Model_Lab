import Dexie, { type Table } from "dexie";
import type { BatchRun, BatchSuite, SavedRun } from "@/types";

export class ComparatorDatabase extends Dexie {
  savedRuns!: Table<SavedRun, string>;
  batchSuites!: Table<BatchSuite, string>;
  batchRuns!: Table<BatchRun, string>;

  constructor() {
    super("llm-comparator-db");

    this.version(1).stores({
      savedRuns: "id, createdAt, savedAt",
    });

    this.version(2).stores({
      savedRuns: "id, createdAt, savedAt",
      batchSuites: "id, createdAt, name",
      batchRuns: "id, createdAt, savedAt, suiteId, status",
    });
  }
}

export const db = new ComparatorDatabase();

export async function saveRun(record: SavedRun) {
  await db.savedRuns.put(record);
}

export async function saveRuns(records: SavedRun[]) {
  await db.savedRuns.bulkPut(records);
}

export async function listSavedRuns() {
  return db.savedRuns.orderBy("savedAt").reverse().toArray();
}

export async function getSavedRun(id: string) {
  return db.savedRuns.get(id);
}

export async function deleteSavedRun(id: string) {
  await db.savedRuns.delete(id);
}

export async function saveBatchSuite(record: BatchSuite) {
  await db.batchSuites.put(record);
}

export async function listBatchSuites() {
  return db.batchSuites.orderBy("createdAt").reverse().toArray();
}

export async function saveBatchRun(record: BatchRun) {
  await db.batchRuns.put(record);
}

export async function listBatchRuns() {
  return db.batchRuns.orderBy("savedAt").reverse().toArray();
}

export async function deleteBatchRun(id: string) {
  await db.batchRuns.delete(id);
}
