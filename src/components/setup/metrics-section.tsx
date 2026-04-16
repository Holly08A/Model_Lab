"use client";

import { useState } from "react";
import { defaultMetrics } from "@/lib/constants/default-models";
import type { MetricConfig } from "@/types";

type MetricsSectionProps = {
  selectedMetrics: MetricConfig[];
  onToggleMetric: (metric: MetricConfig) => void;
  onAddCustomMetric: (label: string, description?: string) => { ok: true } | { ok: false; message: string };
  onRemoveMetric: (id: string) => void;
  onRenameMetric: (id: string, label: string) => void;
};

export function MetricsSection({
  selectedMetrics,
  onToggleMetric,
  onAddCustomMetric,
  onRemoveMetric,
  onRenameMetric,
}: MetricsSectionProps) {
  const [customLabel, setCustomLabel] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customError, setCustomError] = useState<string | null>(null);
  const selectedIds = new Set(selectedMetrics.map((metric) => metric.id));
  const customMetrics = selectedMetrics.filter((metric) => metric.key === "custom");

  const handleAddCustomMetric = () => {
    const result = onAddCustomMetric(customLabel, customDescription);
    if (!result.ok) {
      setCustomError(result.message);
      return;
    }

    setCustomLabel("");
    setCustomDescription("");
    setCustomError(null);
  };

  return (
    <section className="rounded-[28px] border border-[color:var(--border)] bg-stone-50 p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Metrics</p>
          <h3 className="mt-2 text-xl font-semibold text-stone-900">
            Choose the qualitative scoring dimensions you want to use
          </h3>
        </div>
        <p className="text-sm text-stone-500">{selectedMetrics.length} selected</p>
      </div>

      <div className="space-y-3">
        {defaultMetrics.map((metric) => {
          const isSelected = selectedIds.has(metric.id);
          const currentMetric = selectedMetrics.find((item) => item.id === metric.id) ?? metric;

          return (
            <article
              className={`rounded-3xl border p-4 transition ${
                isSelected
                  ? "border-[color:var(--accent)] bg-white"
                  : "border-stone-200 bg-white"
              }`}
              key={metric.id}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h4 className="text-base font-semibold text-stone-900">{metric.label}</h4>
                    {isSelected ? (
                      <span className="rounded-full bg-[color:var(--accent)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-white">
                        selected
                      </span>
                    ) : null}
                  </div>
                  <p className="max-w-2xl text-sm leading-6 text-stone-600">{metric.description}</p>
                  {isSelected ? (
                    <label className="mt-3 block max-w-md space-y-2 text-sm text-stone-700">
                      <span>Custom label</span>
                      <input
                        className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-[color:var(--accent)] focus:bg-white"
                        onChange={(event) => onRenameMetric(metric.id, event.target.value)}
                        value={currentMetric.label}
                      />
                    </label>
                  ) : null}
                </div>

                <button
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    isSelected
                      ? "bg-[color:var(--accent)] text-white"
                      : "border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                  }`}
                  onClick={() => onToggleMetric(metric)}
                  type="button"
                >
                  {isSelected ? "Selected" : "Select"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-6 rounded-[28px] border border-dashed border-stone-300 bg-white p-5">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Custom Dimension</p>
          <h4 className="mt-2 text-lg font-semibold text-stone-900">
            Add your own scoring dimension
          </h4>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Example: brand safety, persuasiveness, legal caution, audience fit, or any other review dimension your team cares about.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm text-stone-700">
            <span>Label</span>
            <input
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-[color:var(--accent)] focus:bg-white"
              onChange={(event) => setCustomLabel(event.target.value)}
              placeholder="Brand safety"
              value={customLabel}
            />
          </label>

          <label className="space-y-2 text-sm text-stone-700">
            <span>Helper text</span>
            <input
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 outline-none transition focus:border-[color:var(--accent)] focus:bg-white"
              onChange={(event) => setCustomDescription(event.target.value)}
              placeholder="How safe the answer is for public-facing use."
              value={customDescription}
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          {customError ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {customError}
            </p>
          ) : (
            <p className="text-sm text-stone-500">
              Custom dimensions are saved with your browser setup and appear in scoring and dashboards.
            </p>
          )}
          <button
            className="rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700"
            onClick={handleAddCustomMetric}
            type="button"
          >
            Add custom metric
          </button>
        </div>

        {customMetrics.length > 0 ? (
          <div className="mt-5 space-y-3">
            {customMetrics.map((metric) => (
              <article
                className="rounded-3xl border border-stone-200 bg-stone-50 p-4"
                key={metric.id}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h5 className="text-base font-semibold text-stone-900">{metric.label}</h5>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-800">
                        custom
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-stone-600">{metric.description}</p>
                    <label className="block max-w-md space-y-2 text-sm text-stone-700">
                      <span>Edit label</span>
                      <input
                        className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
                        onChange={(event) => onRenameMetric(metric.id, event.target.value)}
                        value={metric.label}
                      />
                    </label>
                  </div>

                  <button
                    className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
                    onClick={() => onRemoveMetric(metric.id)}
                    type="button"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
