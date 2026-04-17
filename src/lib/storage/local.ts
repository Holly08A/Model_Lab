import { defaultMetrics, defaultModels } from "@/lib/constants/default-models";
import { createEmptyKnowledgeSourceConfig } from "@/lib/validation/setup";
import type {
  KnowledgeSourceConfig,
  MetricConfig,
  ModelConfig,
  ProviderConfig,
  ProviderType,
} from "@/types";

export const STORAGE_KEYS = {
  providerKeys: "llm-comparator.provider-keys",
  models: "llm-comparator.models",
  selectedMetrics: "llm-comparator.selected-metrics",
  knowledgeSource: "llm-comparator.knowledge-source",
  onboardingComplete: "llm-comparator.onboarding-complete",
  workspacePrefs: "llm-comparator.workspace-prefs",
} as const;

type ProviderKeyMap = Partial<Record<ProviderType, ProviderConfig>>;

const LEGACY_GEMINI_DEFAULT_ID = "or-gemini-2-flash-exp";
const CURRENT_GEMINI_DEFAULT_ID = "or-gemini-3-flash-preview";

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

function migrateSavedModels(savedModels: ModelConfig[]) {
  return savedModels.map((model) => {
    if (model.id !== LEGACY_GEMINI_DEFAULT_ID) {
      return model;
    }

    return {
      ...model,
      id: CURRENT_GEMINI_DEFAULT_ID,
      modelId: "google/gemini-3-flash-preview",
      displayName: "Gemini 3 Flash Preview",
      contextWindow: 1048576,
      inputPricePer1k: 0.0005,
      outputPricePer1k: 0.003,
      isDefault: true,
    };
  });
}

function normalizeKnowledgeSource(
  savedKnowledgeSource: KnowledgeSourceConfig | null,
): KnowledgeSourceConfig | null {
  if (!savedKnowledgeSource) {
    return null;
  }

  const fallback = createEmptyKnowledgeSourceConfig();

  return {
    ...fallback,
    ...savedKnowledgeSource,
    provider: "local-file",
    fileName: typeof savedKnowledgeSource.fileName === "string" ? savedKnowledgeSource.fileName : "",
    rows: Array.isArray(savedKnowledgeSource.rows)
      ? savedKnowledgeSource.rows.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
      : [],
    columns: Array.isArray(savedKnowledgeSource.columns)
      ? savedKnowledgeSource.columns.map((column) => `${column}`.trim()).filter(Boolean)
      : [],
  };
}

function mergeModelsWithDefaults(savedModels: ModelConfig[]) {
  const migratedSavedModels = migrateSavedModels(savedModels);
  const savedById = new Map(migratedSavedModels.map((model) => [model.id, model]));
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
  const customModels = migratedSavedModels.filter((model) => !defaultIds.has(model.id));

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
  getKnowledgeSource(): KnowledgeSourceConfig | null {
    const savedKnowledgeSource = readJson<KnowledgeSourceConfig | null>(STORAGE_KEYS.knowledgeSource, null);
    const normalized = normalizeKnowledgeSource(savedKnowledgeSource);

    if (isBrowser()) {
      if (normalized) {
        writeJson(STORAGE_KEYS.knowledgeSource, normalized);
      } else {
        window.localStorage.removeItem(STORAGE_KEYS.knowledgeSource);
      }
    }

    return normalized;
  },
  setKnowledgeSource(knowledgeSource: KnowledgeSourceConfig | null) {
    if (!isBrowser()) {
      return;
    }

    if (!knowledgeSource) {
      window.localStorage.removeItem(STORAGE_KEYS.knowledgeSource);
      return;
    }

    writeJson(STORAGE_KEYS.knowledgeSource, normalizeKnowledgeSource(knowledgeSource));
  },
};
