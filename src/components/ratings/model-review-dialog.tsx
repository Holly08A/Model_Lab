"use client";

import { useEffect, useMemo, useState } from "react";
import type { AggregateModelRating } from "@/lib/scoring/aggregate-ratings";
import type { SampledModelResponse } from "@/lib/ratings/sample-model-responses";

type ModelReviewDialogProps = {
  model: AggregateModelRating | null;
  note: string;
  onNoteChange: (value: string) => void;
  sampledResponses: SampledModelResponse[];
  onShuffle: () => void;
  onClose: () => void;
};

function formatScore(value?: number) {
  if (value === undefined) {
    return "Not scored";
  }

  return `${value.toFixed(1)} / 10`;
}

export function ModelReviewDialog({
  model,
  note,
  onNoteChange,
  sampledResponses,
  onShuffle,
  onClose,
}: ModelReviewDialogProps) {
  const [expandedPromptIds, setExpandedPromptIds] = useState<string[]>([]);

  useEffect(() => {
    setExpandedPromptIds([]);
  }, [model?.modelKey, sampledResponses]);

  const expandedPromptSet = useMemo(() => new Set(expandedPromptIds), [expandedPromptIds]);

  if (!model) {
    return null;
  }

  const togglePrompt = (id: string) => {
    setExpandedPromptIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-2xl">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-500">{model.provider}</p>
            <h3 className="mt-2 text-2xl font-semibold text-stone-900">{model.displayName}</h3>
            <p className="mt-2 text-sm text-stone-500">{model.modelKey}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
              onClick={onShuffle}
              type="button"
            >
              Shuffle
            </button>
            <button
              className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-stone-100"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-stone-200 bg-stone-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Model notes</p>
              <textarea
                className="mt-3 min-h-40 w-full rounded-[24px] border border-stone-200 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
                onChange={(event) => onNoteChange(event.target.value)}
                placeholder="Add ongoing notes about this model's strengths, weaknesses, and patterns."
                value={note}
              />
            </section>

            <section className="rounded-[28px] border border-stone-200 bg-stone-50 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Aggregate snapshot</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Overall average</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">{formatScore(model.averageOverallScore)}</p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Runs included</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">{model.runCount}</p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Responses seen</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">{model.responseCount}</p>
                </div>
                <div className="rounded-2xl border border-stone-200 bg-white px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Scored responses</p>
                  <p className="mt-2 text-lg font-semibold text-stone-900">{model.scoredResponseCount}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <section className="rounded-[28px] border border-stone-200 bg-stone-50 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-stone-500">Random responses</p>
                  <h4 className="mt-2 text-lg font-semibold text-stone-900">
                    10 saved-run samples for this model
                  </h4>
                </div>
                <p className="text-sm text-stone-500">{sampledResponses.length} shown</p>
              </div>
            </section>

            {sampledResponses.length === 0 ? (
              <div className="rounded-[28px] border border-dashed border-stone-300 bg-white p-8 text-sm leading-7 text-stone-600">
                No saved-run responses are available for this model under the current Ratings filters.
              </div>
            ) : (
              sampledResponses.map((sample) => {
                const isExpanded = expandedPromptSet.has(sample.id);

                return (
                  <article
                    className="rounded-[28px] border border-stone-200 bg-white p-5"
                    key={sample.id}
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Saved run</p>
                        <h5 className="mt-2 text-lg font-semibold text-stone-900">{sample.runTitle}</h5>
                      </div>
                      <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700">
                        {formatScore(sample.overallScore)}
                      </div>
                    </div>

                    <section className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Prompt</p>
                          <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                            {isExpanded ? sample.promptText : sample.promptPreview || "No prompt available."}
                          </div>
                        </div>
                        <button
                          className="rounded-full border border-stone-200 px-4 py-2 text-sm text-stone-700 transition hover:bg-white"
                          onClick={() => togglePrompt(sample.id)}
                          type="button"
                        >
                          {isExpanded ? "Collapse" : "Expand"}
                        </button>
                      </div>
                    </section>

                    <section className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Response</p>
                      <div className="mt-2 whitespace-pre-wrap text-sm leading-6 text-stone-700">
                        {sample.responseText || sample.errorMessage || "No response available."}
                      </div>
                    </section>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
