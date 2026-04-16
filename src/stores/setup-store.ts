"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";
import { defaultMetrics, defaultModels } from "@/lib/constants/default-models";
import { STORAGE_KEYS, localStore } from "@/lib/storage/local";
import type {
  MetricConfig,
  ModelConfig,
  ProviderType,
  SetupState,
} from "@/types";

type SetupStore = SetupState & {
  hydrated: boolean;
  hydrate: () => void;
  setProviderKey: (provider: ProviderType, apiKey: string) => void;
  toggleModel: (id: string) => void;
  addCustomModel: (
    model: Omit<ModelConfig, "id" | "createdAt" | "updatedAt" | "enabled" | "isDefault">,
  ) => { ok: true } | { ok: false; message: string };
  deleteCustomModel: (id: string) => void;
  toggleMetric: (metric: MetricConfig) => void;
  addCustomMetric: (label: string, description?: string) => { ok: true } | { ok: false; message: string };
  removeMetric: (id: string) => void;
  renameMetric: (id: string, label: string) => void;
  resetMetrics: () => void;
  markOnboardingComplete: () => void;
  getActiveModels: () => ModelConfig[];
  getUsedProviders: () => ProviderType[];
  validateSetup: () => { ok: true } | { ok: false; message: string };
};

function writeOnboardingComplete(value: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEYS.onboardingComplete, JSON.stringify(value));
}

function getOnboardingComplete() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEYS.onboardingComplete) ?? "false") as boolean;
  } catch {
    return false;
  }
}

export const useSetupStore = create<SetupStore>((set, get) => ({
  hydrated: false,
  providerKeys: {},
  models: defaultModels,
  selectedMetrics: defaultMetrics,
  onboardingComplete: false,
  hydrate: () => {
    if (get().hydrated || typeof window === "undefined") {
      return;
    }

    const providerRecords = localStore.getProviderKeys();
    const providerKeys = Object.fromEntries(
      Object.entries(providerRecords).map(([provider, config]) => [provider, config?.apiKey ?? ""]),
    ) as Partial<Record<ProviderType, string>>;

    set({
      hydrated: true,
      providerKeys,
      models: localStore.getModels(),
      selectedMetrics: localStore.getSelectedMetrics(),
      onboardingComplete: getOnboardingComplete(),
    });
  },
  setProviderKey: (provider, apiKey) => {
    localStore.setProviderKey(provider, apiKey);
    set((state) => ({
      providerKeys: {
        ...state.providerKeys,
        [provider]: apiKey,
      },
    }));
  },
  toggleModel: (id) => {
    const models = get().models.map((model) =>
      model.id === id ? { ...model, enabled: !model.enabled, updatedAt: new Date().toISOString() } : model,
    );
    localStore.setModels(models);
    set({ models });
  },
  addCustomModel: (model) => {
    const existing = get().models.some(
      (item) => item.provider === model.provider && item.modelId.toLowerCase() === model.modelId.toLowerCase(),
    );

    if (existing) {
      return {
        ok: false,
        message: "That provider/model ID combination already exists.",
      };
    }

    const timestamp = new Date().toISOString();
    const nextModel: ModelConfig = {
      ...model,
      id: `${model.provider}-${model.modelId}`.replace(/[^a-zA-Z0-9-_]/g, "-").toLowerCase(),
      enabled: true,
      isDefault: false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const models = [...get().models, nextModel];
    localStore.setModels(models);
    set({ models });

    return { ok: true };
  },
  deleteCustomModel: (id) => {
    const models = get().models.filter((model) => model.id !== id || model.isDefault);
    localStore.setModels(models);
    set({ models });
  },
  toggleMetric: (metric) => {
    const current = get().selectedMetrics;
    const exists = current.some((item) => item.id === metric.id);
    let nextMetrics: MetricConfig[];

    if (exists) {
      nextMetrics = current.filter((item) => item.id !== metric.id);
    } else {
      if (current.length >= 5) {
        return;
      }
      nextMetrics = [...current, metric];
    }

    localStore.setSelectedMetrics(nextMetrics);
    set({ selectedMetrics: nextMetrics });
  },
  addCustomMetric: (label, description) => {
    const trimmedLabel = label.trim();
    const trimmedDescription = description?.trim();

    if (!trimmedLabel) {
      return { ok: false, message: "Custom metric label is required." };
    }

    const current = get().selectedMetrics;
    if (current.length >= 5) {
      return { ok: false, message: "You can compare up to five metrics at a time." };
    }

    const exists = current.some((metric) => metric.label.trim().toLowerCase() === trimmedLabel.toLowerCase());
    if (exists) {
      return { ok: false, message: "That metric label is already in use." };
    }

    const nextMetrics: MetricConfig[] = [
      ...current,
      {
        id: `custom-${nanoid(8)}`,
        key: "custom",
        label: trimmedLabel,
        description: trimmedDescription || "Custom scoring dimension defined by the reviewer.",
      },
    ];

    localStore.setSelectedMetrics(nextMetrics);
    set({ selectedMetrics: nextMetrics });
    return { ok: true };
  },
  removeMetric: (id) => {
    const nextMetrics = get().selectedMetrics.filter((metric) => metric.id !== id);
    localStore.setSelectedMetrics(nextMetrics);
    set({ selectedMetrics: nextMetrics });
  },
  renameMetric: (id, label) => {
    const nextMetrics = get().selectedMetrics.map((metric) =>
      metric.id === id ? { ...metric, label } : metric,
    );
    localStore.setSelectedMetrics(nextMetrics);
    set({ selectedMetrics: nextMetrics });
  },
  resetMetrics: () => {
    localStore.setSelectedMetrics(defaultMetrics);
    set({ selectedMetrics: defaultMetrics });
  },
  markOnboardingComplete: () => {
    writeOnboardingComplete(true);
    set({ onboardingComplete: true });
  },
  getActiveModels: () => get().models.filter((model) => model.enabled),
  getUsedProviders: () => {
    const activeProviders = new Set(get().models.filter((model) => model.enabled).map((model) => model.provider));
    return [...activeProviders];
  },
  validateSetup: () => {
    const activeModels = get().getActiveModels();
    if (activeModels.length === 0) {
      return { ok: false, message: "Enable at least one model to continue." };
    }

    const metrics = get().selectedMetrics.map((metric) => metric.label.trim()).filter(Boolean);
    if (metrics.length === 0) {
      return { ok: false, message: "Choose at least one metric." };
    }
    if (metrics.length > 5) {
      return { ok: false, message: "You can compare up to five metrics at a time." };
    }
    if (new Set(metrics.map((metric) => metric.toLowerCase())).size !== metrics.length) {
      return { ok: false, message: "Metric labels must be unique." };
    }

    for (const provider of get().getUsedProviders()) {
      const apiKey = get().providerKeys[provider]?.trim();
      if (!apiKey) {
        return {
          ok: false,
          message: `Add the ${provider === "openrouter" ? "OpenRouter" : "NVIDIA NIM"} API key for your active models.`,
        };
      }
    }

    return { ok: true };
  },
}));
