"use client";

import type { ModelConfig } from "@/types";

type RecommendedModelsSectionProps = {
  models: ModelConfig[];
  onToggle: (id: string) => void;
  onDeleteCustomModel: (id: string) => void;
};

function formatPrice(value: number) {
  return value === 0 ? "0.00" : value.toFixed(4);
}

export function RecommendedModelsSection({
  models,
  onToggle,
  onDeleteCustomModel,
}: RecommendedModelsSectionProps) {
  return (
    <section className="rounded-[28px] border border-[color:var(--border)] bg-stone-50 p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Models</p>
          <h3 className="mt-2 text-xl font-semibold text-stone-900">
            Choose which LLMs should appear in the comparison
          </h3>
        </div>
        <p className="text-sm text-stone-500">{models.filter((model) => model.enabled).length} active</p>
      </div>

      <div className="space-y-3">
        {models.map((model) => (
          <article
            className="rounded-3xl border border-stone-200 bg-white p-4"
            key={model.id}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-semibold text-stone-900">{model.displayName}</h4>
                  <span className="rounded-full bg-stone-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                    {model.provider}
                  </span>
                  {!model.isDefault ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-amber-800">
                      custom
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-stone-500">{model.modelId}</p>
                <div className="flex flex-wrap gap-3 text-xs text-stone-600">
                  <span>Input / 1K: ${formatPrice(model.inputPricePer1k)}</span>
                  <span>Output / 1K: ${formatPrice(model.outputPricePer1k)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!model.isDefault ? (
                  <button
                    className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-600 transition hover:bg-stone-100"
                    onClick={() => onDeleteCustomModel(model.id)}
                    type="button"
                  >
                    Delete
                  </button>
                ) : null}
                <button
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    model.enabled
                      ? "bg-[color:var(--accent)] text-white"
                      : "border border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                  }`}
                  onClick={() => onToggle(model.id)}
                  type="button"
                >
                  {model.enabled ? "Enabled" : "Enable"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
