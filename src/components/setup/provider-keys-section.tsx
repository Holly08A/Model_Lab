"use client";

import type { ProviderType } from "@/types";

const providerMeta: Array<{
  provider: ProviderType;
  title: string;
  helper: string;
  placeholder: string;
}> = [
  {
    provider: "openrouter",
    title: "OpenRouter",
    helper: "Used for OpenRouter models. Stored only in this browser.",
    placeholder: "sk-or-v1-...",
  },
  {
    provider: "nvidia-nim",
    title: "NVIDIA NIM",
    helper: "Used for NVIDIA NIM models. Stored only in this browser.",
    placeholder: "nvapi-...",
  },
];

type ProviderKeysSectionProps = {
  providerKeys: Partial<Record<ProviderType, string>>;
  onChange: (provider: ProviderType, value: string) => void;
};

export function ProviderKeysSection({
  providerKeys,
  onChange,
}: ProviderKeysSectionProps) {
  return (
    <section className="rounded-[28px] border border-[color:var(--border)] bg-stone-50 p-6">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.3em] text-stone-500">API Keys</p>
        <h3 className="mt-2 text-xl font-semibold text-stone-900">
          Add the provider keys you plan to use
        </h3>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {providerMeta.map((item) => (
          <label
            className="rounded-3xl border border-stone-200 bg-white p-4"
            key={item.provider}
          >
            <div className="mb-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-stone-900">{item.title}</span>
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-500">
                  browser only
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-600">{item.helper}</p>
            </div>
            <input
              className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-[color:var(--accent)] focus:bg-white"
              onChange={(event) => onChange(item.provider, event.target.value)}
              placeholder={item.placeholder}
              type="password"
              value={providerKeys[item.provider] ?? ""}
            />
          </label>
        ))}
      </div>
    </section>
  );
}
