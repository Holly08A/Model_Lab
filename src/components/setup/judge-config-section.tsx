"use client";

import type { JudgeConfig, ProviderType } from "@/types";

type JudgeConfigSectionProps = {
  judgeConfig: JudgeConfig;
  onChange: (config: Partial<JudgeConfig>) => void;
};

const providerOptions: Array<{ value: ProviderType; label: string }> = [
  { value: "openrouter", label: "OpenRouter" },
  { value: "nvidia-nim", label: "NVIDIA NIM" },
];

export function JudgeConfigSection({ judgeConfig, onChange }: JudgeConfigSectionProps) {
  return (
    <section className="rounded-[28px] border border-[color:var(--border)] bg-stone-50 p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-stone-500">Judge Model</p>
          <h3 className="mt-2 text-xl font-semibold text-stone-900">
            Configure the auto-scoring LLM for batch evaluation
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
            Batch runs can use one dedicated judge model to score each candidate response against your selected
            metrics. Leave this disabled if you only want manual single-run reviews.
          </p>
        </div>
        <button
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            judgeConfig.enabled
              ? "bg-[color:var(--accent)] text-white"
              : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
          }`}
          onClick={() => onChange({ enabled: !judgeConfig.enabled })}
          type="button"
        >
          {judgeConfig.enabled ? "Enabled" : "Enable judge"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm text-stone-700">
          <span>Judge provider</span>
          <select
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            onChange={(event) => onChange({ provider: event.target.value as ProviderType })}
            value={judgeConfig.provider}
          >
            {providerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm text-stone-700">
          <span>Judge display name</span>
          <input
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            onChange={(event) => onChange({ displayName: event.target.value })}
            placeholder="GPT-4o mini judge"
            value={judgeConfig.displayName}
          />
        </label>

        <label className="md:col-span-2 space-y-2 text-sm text-stone-700">
          <span>Judge model ID</span>
          <input
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 outline-none transition focus:border-[color:var(--accent)]"
            onChange={(event) => onChange({ modelId: event.target.value })}
            placeholder="openai/gpt-4o-mini"
            value={judgeConfig.modelId}
          />
        </label>

        <label className="md:col-span-2 space-y-2 text-sm text-stone-700">
          <span>Judge system prompt template</span>
          <textarea
            className="min-h-28 w-full rounded-[24px] border border-stone-200 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-[color:var(--accent)]"
            onChange={(event) => onChange({ systemPromptTemplate: event.target.value })}
            placeholder="You are a strict LLM evaluation judge..."
            value={judgeConfig.systemPromptTemplate ?? ""}
          />
        </label>
      </div>
    </section>
  );
}
