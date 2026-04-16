"use client";

import { formatCurrency, formatDuration, formatNumber } from "@/lib/utils/format";
import type { ModelRunResult } from "@/types";

type ModelResultCardProps = {
  result: ModelRunResult;
  onOpen: (modelConfigId: string) => void;
};

function scoreSummary(scores: Record<string, number | null>) {
  const values = Object.values(scores).filter((score): score is number => score !== null);
  if (values.length === 0) {
    return "Not scored";
  }

  const average = values.reduce((total, value) => total + value, 0) / values.length;
  return `${average.toFixed(1)} / 10 avg`;
}

export function ModelResultCard({ result, onOpen }: ModelResultCardProps) {
  return (
    <button
      className="flex h-full min-h-[320px] flex-col rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      onClick={() => onOpen(result.modelConfigId)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-stone-900">{result.displayName}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-500">{result.provider}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.2em] ${
            result.status === "success"
              ? "bg-emerald-100 text-emerald-800"
              : result.status === "error"
                ? "bg-rose-100 text-rose-700"
                : result.status === "running"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-stone-100 text-stone-500"
          }`}
        >
          {result.status}
        </span>
      </div>

      <div className="mt-4 flex-1 rounded-[24px] bg-stone-50 px-4 py-4">
        {result.status === "error" ? (
          <p className="text-sm leading-7 text-rose-700">{result.errorMessage}</p>
        ) : result.status === "running" ? (
          <p className="text-sm leading-7 text-stone-500">Waiting for this model to finish...</p>
        ) : result.responsePreview ? (
          <p className="line-clamp-6 text-sm leading-7 text-stone-700">{result.responsePreview}</p>
        ) : (
          <p className="text-sm leading-7 text-stone-500">No response yet.</p>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-stone-600">
        <div className="rounded-2xl border border-stone-200 bg-white px-3 py-3">
          <dt className="text-xs uppercase tracking-[0.2em] text-stone-400">Tokens</dt>
          <dd className="mt-2 font-medium text-stone-900">{formatNumber(result.usage.totalTokens)}</dd>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white px-3 py-3">
          <dt className="text-xs uppercase tracking-[0.2em] text-stone-400">Cost</dt>
          <dd className="mt-2 font-medium text-stone-900">{formatCurrency(result.estimatedCost.totalCost)}</dd>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white px-3 py-3">
          <dt className="text-xs uppercase tracking-[0.2em] text-stone-400">Full time</dt>
          <dd className="mt-2 font-medium text-stone-900">{formatDuration(result.timing.fullResponseTimeMs)}</dd>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white px-3 py-3">
          <dt className="text-xs uppercase tracking-[0.2em] text-stone-400">Scores</dt>
          <dd className="mt-2 font-medium text-stone-900">{scoreSummary(result.scores)}</dd>
        </div>
      </dl>
    </button>
  );
}
