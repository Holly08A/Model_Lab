"use client";

import { create } from "zustand";
import { deleteSavedRun, listSavedRuns } from "@/lib/storage/db";
import type { SavedRun } from "@/types";

type SavedRunsStore = {
  items: SavedRun[];
  loading: boolean;
  error: string | null;
  load: () => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useSavedRunsStore = create<SavedRunsStore>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  load: async () => {
    set({ loading: true, error: null });
    try {
      const items = await listSavedRuns();
      set({ items, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Failed to load saved runs.",
      });
    }
  },
  remove: async (id) => {
    await deleteSavedRun(id);
    await get().load();
  },
}));
