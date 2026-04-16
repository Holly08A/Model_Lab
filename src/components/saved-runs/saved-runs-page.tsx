"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SavedRunList } from "@/components/saved-runs/saved-run-list";
import { useSavedRunsStore } from "@/stores/saved-runs-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function SavedRunsPage() {
  const router = useRouter();
  const { items, loading, error, load, remove } = useSavedRunsStore();
  const { loadSavedRun } = useWorkspaceStore();

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card)] p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Saved Runs</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
          Reopen or clean up previous browser-local comparisons.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600">
          Every saved comparison stays only in this browser. Open any run to continue reviewing responses and scores in the workspace.
        </p>
      </section>

      {loading ? (
        <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 text-stone-600 shadow-sm">
          Loading saved runs...
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-stone-300 bg-[color:var(--card)] p-8 text-sm leading-7 text-stone-600 shadow-sm">
          No saved runs yet. Run a comparison in the workspace and use the save action to keep it here.
        </div>
      ) : (
        <SavedRunList
          items={items}
          onDelete={(id) => {
            void remove(id);
          }}
          onOpen={(run) => {
            loadSavedRun(run);
            router.push("/workspace");
          }}
        />
      )}
    </div>
  );
}
