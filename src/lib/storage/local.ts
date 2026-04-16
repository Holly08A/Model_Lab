import { defaultMetrics, defaultModels } from "@/lib/constants/default-models";
import type { MetricConfig, ModelConfig, ProviderConfig, ProviderType } from "@/types";

export const STORAGE_KEYS = {
  providerKeys: "llm-comparator.provider-keys",
  models: "llm-comparator.models",
  selectedMetrics: "llm-comparator.selected-metrics",
  onboardingComplete: "llm-comparator.onboarding-complete",
  workspacePrefs: "llm-comparator.workspace-prefs",
} as const;

type ProviderKeyMap = Partial<Record<ProviderType, ProviderConfig>>;

function isBrowser() {
  return typeof window !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  const value = window.localStorage.getItem(key);
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function mergeModelsWithDefaults(savedModels: ModelConfig[]) {
  const savedById = new Map(savedModels.map((model) => [model.id, model]));
  const mergedDefaults = defaultModels.map((defaultModel) => {
    const savedModel = savedById.get(defaultModel.id);
    if (!savedModel) {
      return defaultModel;
    }

    return {
      ...defaultModel,
      ...savedModel,
      isDefault: true,
    };
  });

  const defaultIds = new Set(defaultModels.map((model) => model.id));
  const customModels = savedModels.filter((model) => !defaultIds.has(model.id));

  return [...mergedDefaults, ...customModels];
}

export const localStore = {
  getProviderKeys(): ProviderKeyMap {
    return readJson(STORAGE_KEYS.providerKeys, {});
  },
  setProviderKey(provider: ProviderType, apiKey: string) {
    const current = this.getProviderKeys();
    writeJson(STORAGE_KEYS.providerKeys, {
      ...current,
      [provider]: { provider, apiKey },
    });
  },
  getModels(): ModelConfig[] {
    const savedModels = readJson(STORAGE_KEYS.models, defaultModels);
    const mergedModels = mergeModelsWithDefaults(savedModels);

    if (isBrowser()) {
      writeJson(STORAGE_KEYS.models, mergedModels);
    }

    return mergedModels;
  },
  setModels(models: ModelConfig[]) {
    writeJson(STORAGE_KEYS.models, models);
  },
  getSelectedMetrics(): MetricConfig[] {
    return readJson(STORAGE_KEYS.selectedMetrics, defaultMetrics);
  },
  setSelectedMetrics(metrics: MetricConfig[]) {
    writeJson(STORAGE_KEYS.selectedMetrics, metrics);
  },
};
