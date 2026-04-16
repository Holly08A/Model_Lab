"use client";

import { format } from "date-fns";
import type { SavedRun } from "@/types";

type SavedRunListProps = {
  items: SavedRun[];
  onOpen: (run: SavedRun) => void;
  onDelete: (id: string) => void;
};

function averageScore(run: SavedRun) {
  const values = run.models.flatMap((model) =>
    Object.values(model.scores).filter((score): score is number => score !== null),
  );

  if (values.length === 0) {
    return "Not scored";
  }

  return `${(values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)} / 10`;
}

export function SavedRunList({ items, onOpen, onDelete }: SavedRunListProps) {
  return (
    <div className="space-y-4">
      {items.map((run) => (
        <article
          className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-sm"
          key={run.id}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-stone-500">
                  {format(new Date(run.savedAt), "MMM d, yyyy h:mm a")}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-stone-900">
                  {run.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {run.prompt.length > 140 ? `${run.prompt.slice(0, 140)}...` : run.prompt}
                </p>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-stone-600">
                <span>{run.models.length} models</span>
                <span>{run.metrics.length} metrics</span>
                <span>{averageScore(run)} average score</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                onClick={() => onOpen(run)}
                type="button"
              >
                Open in workspace
              </button>
              <button
                className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
                onClick={() => onDelete(run.id)}
                type="button"
              >
                Delete
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
