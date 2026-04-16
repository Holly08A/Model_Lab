"use client";

import type { RankingItem } from "@/lib/scoring/rankings";

type RankingDetailDialogProps = {
  title: string;
  valueFormatter: (value?: number) => string;
  items: RankingItem[];
  onClose: () => void;
};

export function RankingDetailDialog({
  title,
  valueFormatter,
  items,
  onClose,
}: RankingDetailDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Full ranking</p>
            <h3 className="mt-2 text-2xl font-semibold text-stone-900">{title}</h3>
          </div>
          <button
            className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <ol className="mt-6 space-y-3">
          {items.map((item, index) => (
            <li
              className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4"
              key={item.modelConfigId}
            >
              <span className="text-sm text-stone-700">
                {index + 1}. {item.displayName}
              </span>
              <span className="text-sm font-medium text-stone-900">
                {valueFormatter(item.value)}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
