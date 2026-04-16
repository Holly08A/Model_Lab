"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);

  useEffect(() => {
    void load();
  }, [load]);

  const availableTitles = useMemo(
    () =>
      [...new Set(items.map((run) => run.title).filter((title): title is string => Boolean(title)))]
        .sort((a, b) => a.localeCompare(b)),
    [items],
  );

  const filteredRuns = useMemo(() => {
    if (selectedTitles.length === 0) {
      return items;
    }

    const selected = new Set(selectedTitles);
    return items.filter((run) => run.title && selected.has(run.title));
  }, [items, selectedTitles]);

  const aggregates = useMemo(() => aggregateModelRatings(filteredRuns), [filteredRuns]);

  const toggleTitle = (title: string) => {
    setSelectedTitles((current) =>
      current.includes(title) ? current.filter((item) => item !== title) : [...current, title],
    );
  };

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

      <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Filter by test case</p>
            <h3 className="mt-2 text-xl font-semibold text-stone-900">
              Choose which saved test cases are included in the rating averages
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              Leave everything unselected to use all saved runs, or select one or more test case names such as
              `Test A` or `Test A + Test B`.
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
            {selectedTitles.length === 0
              ? `Using all ${items.length} saved run${items.length === 1 ? "" : "s"}`
              : `Using ${filteredRuns.length} selected run${filteredRuns.length === 1 ? "" : "s"}`}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedTitles.length === 0
                ? "bg-[color:var(--accent)] text-white"
                : "border border-stone-200 bg-stone-50 text-stone-700 hover:bg-white"
            }`}
            onClick={() => setSelectedTitles([])}
            type="button"
          >
            All test cases
          </button>
          {availableTitles.map((title) => {
            const isSelected = selectedTitles.includes(title);
            const runCount = items.filter((run) => run.title === title).length;
            return (
              <button
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isSelected
                    ? "bg-[color:var(--accent)] text-white"
                    : "border border-stone-200 bg-stone-50 text-stone-700 hover:bg-white"
                }`}
                key={title}
                onClick={() => toggleTitle(title)}
                type="button"
              >
                {title} ({runCount})
              </button>
            );
          })}
        </div>
      </section>

      {loading ? (
        <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 text-stone-600 shadow-sm">
          Loading aggregated ratings...
        </div>
      ) : error ? (
        <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700 shadow-sm">
          {error}
        </div>
      ) : filteredRuns.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-stone-300 bg-[color:var(--card)] p-8 text-sm leading-7 text-stone-600 shadow-sm">
          No saved runs match the selected test case filter.
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
