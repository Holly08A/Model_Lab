"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CustomModelForm } from "@/components/setup/custom-model-form";
import { MetricsSection } from "@/components/setup/metrics-section";
import { ProviderKeysSection } from "@/components/setup/provider-keys-section";
import { RecommendedModelsSection } from "@/components/setup/recommended-models-section";
import type { CustomModelFormValues } from "@/lib/validation/setup";
import { useSetupStore } from "@/stores/setup-store";
import type { MetricConfig } from "@/types";

export function SetupWizardPage() {
  const router = useRouter();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const {
    hydrate,
    hydrated,
    providerKeys,
    models,
    selectedMetrics,
    setProviderKey,
    toggleModel,
    addCustomModel,
    deleteCustomModel,
    toggleMetric,
    addCustomMetric,
    removeMetric,
    renameMetric,
    getActiveModels,
    getUsedProviders,
    validateSetup,
    markOnboardingComplete,
  } = useSetupStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const activeModels = useMemo(() => getActiveModels(), [getActiveModels, models]);
  const usedProviders = useMemo(() => getUsedProviders(), [getUsedProviders, models]);

  const handleContinue = () => {
    const result = validateSetup();
    if (!result.ok) {
      setStatusMessage(result.message);
      return;
    }

    markOnboardingComplete();
    setStatusMessage("Setup saved in this browser. Opening workspace...");
    router.push("/workspace");
  };

  const handleToggleMetric = (metric: MetricConfig) => {
    if (!selectedMetrics.some((item) => item.id === metric.id) && selectedMetrics.length >= 5) {
      setStatusMessage("You can select up to five metrics at a time.");
      return;
    }

    toggleMetric(metric);
    setStatusMessage(null);
  };

  const handleAddCustomModel = (values: CustomModelFormValues) => {
    const result = addCustomModel(values);
    if (!result.ok) {
      setStatusMessage(result.message);
      return result;
    }

    setStatusMessage(`Added ${values.displayName}.`);
    return result;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="space-y-6">
        <div className="rounded-[32px] border border-[color:var(--border)] bg-[color:var(--card)] p-8 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-stone-500">
            Guided Setup
          </p>
          <h2 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-stone-900">
            Configure the models and scoring dimensions before you compare responses.
          </h2>
          <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600">
            This setup is stored only in your current browser. You can prefill defaults, add custom models,
            and adjust metric labels before moving into the comparison workspace.
          </p>
        </div>

        {hydrated ? (
          <>
            <ProviderKeysSection onChange={setProviderKey} providerKeys={providerKeys} />
            <RecommendedModelsSection
              models={models}
              onDeleteCustomModel={deleteCustomModel}
              onToggle={toggleModel}
            />
            <CustomModelForm onSubmitModel={handleAddCustomModel} />
            <MetricsSection
              onAddCustomMetric={addCustomMetric}
              onRenameMetric={renameMetric}
              onRemoveMetric={removeMetric}
              onToggleMetric={handleToggleMetric}
              selectedMetrics={selectedMetrics}
            />
          </>
        ) : (
          <div className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-8 text-stone-600">
            Loading saved setup...
          </div>
        )}
      </section>

      <aside className="space-y-6">
        <section className="rounded-[28px] border border-[color:var(--border)] bg-stone-900 p-6 text-stone-50 shadow-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-stone-300">Current Setup</p>
          <div className="mt-5 space-y-4 text-sm leading-6 text-stone-200">
            <div className="rounded-3xl bg-white/5 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Active models</p>
              <p className="mt-2 text-3xl font-semibold text-white">{activeModels.length}</p>
            </div>
            <div className="rounded-3xl bg-white/5 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Selected metrics</p>
              <p className="mt-2 text-3xl font-semibold text-white">{selectedMetrics.length}</p>
            </div>
            <div className="rounded-3xl bg-white/5 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-stone-400">Providers in use</p>
              <p className="mt-2 text-base text-white">
                {usedProviders.length > 0
                  ? usedProviders.map((provider) => (provider === "openrouter" ? "OpenRouter" : "NVIDIA NIM")).join(", ")
                  : "None yet"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[color:var(--border)] bg-[color:var(--card)] p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-stone-900">Ready for the workspace?</h3>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            To continue, make sure at least one model is enabled, at least one metric is selected,
            and each active provider has an API key entered.
          </p>
          {statusMessage ? (
            <p className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-700">
              {statusMessage}
            </p>
          ) : null}
          <button
            className="mt-5 w-full rounded-full bg-[color:var(--accent)] px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            onClick={handleContinue}
            type="button"
          >
            Save setup and open workspace
          </button>
        </section>
      </aside>
    </div>
  );
}
