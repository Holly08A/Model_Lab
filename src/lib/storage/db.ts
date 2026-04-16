import Dexie, { type Table } from "dexie";
import type { SavedRun } from "@/types";

export class ComparatorDatabase extends Dexie {
  savedRuns!: Table<SavedRun, string>;

  constructor() {
    super("llm-comparator-db");

    this.version(1).stores({
      savedRuns: "id, createdAt, savedAt",
    });
  }
}

export const db = new ComparatorDatabase();

export async function saveRun(record: SavedRun) {
  await db.savedRuns.put(record);
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
