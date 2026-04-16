"use client";

import { formatCurrency, formatDuration, formatNumber } from "@/lib/utils/format";
import type { MetricConfig, ModelRunResult } from "@/types";

type ModelDetailDialogProps = {
  result: ModelRunResult | null;
  metrics: MetricConfig[];
  onClose: () => void;
  onScore: (modelConfigId: string, metricId: string, score: number | null) => void;
  onNotesChange: (modelConfigId: string, notes: string) => void;
};

export function ModelDetailDialog({
  result,
  metrics,
  onClose,
  onScore,
  onNotesChange,
}: ModelDetailDialogProps) {
  if (!result) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">{result.provider}</p>
            <h3 className="mt-2 text-2xl font-semibold text-stone-900">{result.displayName}</h3>
            <p className="mt-2 text-sm text-stone-500">{result.modelId}</p>
          </div>
          <button
            className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-stone-200 bg-stone-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Full response</p>
              <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-700">
                {result.responseText || result.errorMessage || "No response available."}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-stone-200 bg-stone-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Usage</p>
              <dl className="mt-4 space-y-3 text-sm text-stone-700">
                <div className="flex items-center justify-between gap-3">
                  <dt>Input tokens</dt>
                  <dd>{formatNumber(result.usage.inputTokens)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Output tokens</dt>
                  <dd>{formatNumber(result.usage.outputTokens)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Total tokens</dt>
                  <dd>{formatNumber(result.usage.totalTokens)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Estimated cost</dt>
                  <dd>{formatCurrency(result.estimatedCost.totalCost)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Full response time</dt>
                  <dd>{formatDuration(result.timing.fullResponseTimeMs)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-[28px] border border-stone-200 bg-stone-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Score this response</p>
              <div className="mt-4 space-y-4">
                {metrics.map((metric) => (
                  <div key={metric.id}>
                    <div className="mb-2">
                      <p className="text-sm font-medium text-stone-900">{metric.label}</p>
                      {metric.description ? (
                        <p className="mt-1 text-xs leading-5 text-stone-500">{metric.description}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 10 }, (_, index) => index + 1).map((score) => {
                        const isSelected = result.scores[metric.id] === score;
                        return (
                          <button
                            className={`h-10 w-10 rounded-full text-sm font-medium transition ${
                              isSelected
                                ? "bg-[color:var(--accent)] text-white"
                                : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
                            }`}
                            key={score}
                            onClick={() =>
                              onScore(
                                result.modelConfigId,
                                metric.id,
                                isSelected ? null : score,
                              )
                            }
                            type="button"
                          >
                            {score}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-stone-200 bg-stone-50 p-5">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.2em] text-stone-500">Reviewer notes</span>
                <textarea
                  className="mt-3 min-h-28 w-full rounded-[24px] border border-stone-200 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
                  onChange={(event) => onNotesChange(result.modelConfigId, event.target.value)}
                  placeholder="Optional notes about what stood out in this response."
                  value={result.notes ?? ""}
                />
              </label>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
