"use client";

import { useEffect, useMemo } from "react";
import { aggregateModelRatings } from "@/lib/scoring/aggregate-ratings";
import { formatCurrency, formatDuration, formatNumber } from "@/lib/utils/format";
import { useSavedRunsStore } from "@/stores/saved-runs-store";

function formatScore(value?: number) {
  if (value === undefined) {
    return "Not enough ratings";
  }

  return `${value.toFixed(1)} / 10`;
}

export function RatingsPage() {
  const { items, loading, error, load } = useSavedRunsStore();

  useEffect(() => {
    void load();
  }, [load]);

  const aggregates = useMemo(() => aggregateModelRatings(items), [items]);

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card)] p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Ratings</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">
          See how each LLM has performed across all saved comparisons.
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
          This view aggregates saved browser-local runs by model, so you can track average overall scores,
          per-metric performance, and how many times each LLM has been reviewed.
        </p>
      </section>

      {loading ? (
        <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 text-stone-600 shadow-sm">
          Loading aggregated ratings...
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
          {error}
        </div>
      ) : aggregates.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-stone-300 bg-[color:var(--card)] p-8 text-sm leading-7 text-stone-600 shadow-sm">
          No saved scored runs yet. Save a few comparisons with scores and this tab will show cross-run LLM performance.
        </div>
      ) : (
        <div className="space-y-4">
          {aggregates.map((model, index) => (
            <article
              className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm"
              key={model.modelKey}
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-stone-900 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white">
                      Rank {index + 1}
                    </span>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                      {model.provider}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-stone-900">{model.displayName}</h3>
                    <p className="mt-2 text-sm text-stone-500">{model.modelKey}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Overall average</p>
                    <p className="mt-2 text-lg font-semibold text-stone-900">
                      {formatScore(model.averageOverallScore)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Runs included</p>
                    <p className="mt-2 text-lg font-semibold text-stone-900">{model.runCount}</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Responses seen</p>
                    <p className="mt-2 text-lg font-semibold text-stone-900">{model.responseCount}</p>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Scored responses</p>
                    <p className="mt-2 text-lg font-semibold text-stone-900">{model.scoredResponseCount}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Average full time</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">
                    {formatDuration(
                      model.averageFullResponseTimeMs !== undefined
                        ? Math.round(model.averageFullResponseTimeMs)
                        : undefined,
                    )}
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Average total tokens</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">
                    {formatNumber(
                      model.averageTotalTokens !== undefined
                        ? Math.round(model.averageTotalTokens)
                        : undefined,
                    )}
                  </p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Average estimated cost</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">
                    {formatCurrency(model.averageEstimatedCost)}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Per metric</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {model.metrics.length > 0 ? (
                    model.metrics.map((metric) => (
                      <div
                        className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4"
                        key={`${model.modelKey}-${metric.metricId}`}
                      >
                        <p className="text-sm font-medium text-stone-900">{metric.label}</p>
                        <p className="mt-2 text-lg font-semibold text-stone-900">
                          {formatScore(metric.averageScore)}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-stone-400">
                          {metric.scoreCount} rating{metric.scoreCount === 1 ? "" : "s"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-stone-300 px-4 py-4 text-sm text-stone-600">
                      No scored metrics yet for this model.
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
