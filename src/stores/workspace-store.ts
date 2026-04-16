"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";
import { saveRun } from "@/lib/storage/db";
import { calculateEstimatedCost } from "@/lib/utils/cost";
import { createRunTitle } from "@/lib/utils/run-title";
import { truncateText } from "@/lib/utils/format";
import { useSetupStore } from "@/stores/setup-store";
import type { MetricConfig, ModelRunResult, SavedRun } from "@/types";

type WorkspaceStore = {
  testCaseName: string;
  systemPrompt: string;
  userPrompt: string;
  isRunning: boolean;
  activeTab: "llm" | "dashboard";
  currentRunId: string | null;
  results: ModelRunResult[];
  selectedResultId: string | null;
  runError: string | null;
  saveMessage: string | null;
  hasUnsavedChanges: boolean;
  setTestCaseName: (value: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setUserPrompt: (prompt: string) => void;
  setActiveTab: (tab: "llm" | "dashboard") => void;
  openResult: (modelConfigId: string) => void;
  closeResult: () => void;
  scoreMetric: (modelConfigId: string, metricId: string, score: number | null) => void;
  setNotes: (modelConfigId: string, notes: string) => void;
  startNewRun: () => void;
  runPrompt: () => Promise<void>;
  saveCurrentRun: () => Promise<void>;
  loadSavedRun: (run: SavedRun) => void;
  reuseSavedPrompts: (run: SavedRun) => void;
};

function createEmptyResult(metricConfigs: MetricConfig[], model: ReturnType<typeof useSetupStore.getState>["models"][number]): ModelRunResult {
  return {
    modelConfigId: model.id,
    provider: model.provider,
    modelId: model.modelId,
    displayName: model.displayName,
    status: "idle",
    responseText: "",
    responsePreview: "",
    usage: {},
    timing: {},
    estimatedCost: {},
    scores: Object.fromEntries(metricConfigs.map((metric) => [metric.id, null])),
    notes: "",
  };
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  testCaseName: "",
  systemPrompt: "",
  userPrompt: "",
  isRunning: false,
  activeTab: "llm",
  currentRunId: null,
  results: [],
  selectedResultId: null,
  runError: null,
  saveMessage: null,
  hasUnsavedChanges: false,
  setTestCaseName: (testCaseName) => set({ testCaseName }),
  setSystemPrompt: (systemPrompt) => set({ systemPrompt }),
  setUserPrompt: (userPrompt) => set({ userPrompt }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  openResult: (modelConfigId) => set({ selectedResultId: modelConfigId }),
  closeResult: () => set({ selectedResultId: null }),
  scoreMetric: (modelConfigId, metricId, score) =>
    set((state) => ({
      hasUnsavedChanges: true,
      results: state.results.map((result) =>
        result.modelConfigId === modelConfigId
          ? {
              ...result,
              scores: {
                ...result.scores,
                [metricId]: score,
              },
            }
          : result,
      ),
    })),
  setNotes: (modelConfigId, notes) =>
    set((state) => ({
      hasUnsavedChanges: true,
      results: state.results.map((result) =>
        result.modelConfigId === modelConfigId
          ? {
              ...result,
              notes,
            }
          : result,
        ),
      })),
  startNewRun: () =>
    set({
      currentRunId: null,
      testCaseName: "",
      systemPrompt: "",
      userPrompt: "",
      results: [],
      activeTab: "llm",
      runError: null,
      saveMessage: "Started a new comparison draft.",
      selectedResultId: null,
      isRunning: false,
      hasUnsavedChanges: false,
    }),
  runPrompt: async () => {
    const setup = useSetupStore.getState();
    const systemPrompt = get().systemPrompt.trim();
    const userPrompt = get().userPrompt.trim();

    if (!userPrompt) {
      set({ runError: "Enter a user prompt before running the comparison." });
      return;
    }

    const validation = setup.validateSetup();
    if (!validation.ok) {
      set({ runError: validation.message });
      return;
    }

    const activeModels = setup.models.filter((model) => model.enabled);
    const baseResults = activeModels.map((model) => ({
      ...createEmptyResult(setup.selectedMetrics, model),
      status: "running" as const,
    }));

    set({
      isRunning: true,
      runError: null,
      saveMessage: null,
      hasUnsavedChanges: true,
      currentRunId: nanoid(),
      results: baseResults,
      selectedResultId: null,
      activeTab: "llm",
    });

    await Promise.allSettled(
      activeModels.map(async (model) => {
        const apiKey = setup.providerKeys[model.provider]?.trim();
        if (!apiKey) {
          throw new Error("Missing provider API key.");
        }

        const response = await fetch("/api/compare", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider: model.provider,
            apiKey,
            modelId: model.modelId,
            systemPrompt,
            userPrompt,
          }),
        });

        const body = (await response.json()) as {
          message?: string;
          responseText?: string;
          usage?: {
            inputTokens?: number;
            outputTokens?: number;
            totalTokens?: number;
          };
          timing?: {
            latencyToFirstTokenMs?: number;
            fullResponseTimeMs?: number;
          };
        };

        const responseText = body.responseText?.trim();

        if (!response.ok || !responseText) {
          throw new Error(body.message ?? "The comparison request failed.");
        }

        const estimatedCost = calculateEstimatedCost({
          inputTokens: body.usage?.inputTokens,
          outputTokens: body.usage?.outputTokens,
          inputPricePer1k: model.inputPricePer1k,
          outputPricePer1k: model.outputPricePer1k,
        });

        set((state) => ({
          results: state.results.map((result) =>
            result.modelConfigId === model.id
                ? {
                    ...result,
                    status: "success",
                    responseText,
                    responsePreview: truncateText(responseText),
                    usage: body.usage ?? {},
                    timing: body.timing ?? {},
                    estimatedCost,
                  }
                : result,
          ),
        }));
      }).map((task, index) =>
        task.catch((error: unknown) => {
          const model = activeModels[index];
          const message =
            error instanceof Error ? error.message : "Unknown provider error.";

          set((state) => ({
            results: state.results.map((result) =>
              result.modelConfigId === model.id
                ? {
                    ...result,
                    status: "error",
                    errorMessage: message,
                  }
                : result,
            ),
          }));
        }),
      ),
    );

    set({ isRunning: false });
  },
  saveCurrentRun: async () => {
    const setup = useSetupStore.getState();
    const state = get();

    if (!state.userPrompt.trim()) {
      set({ saveMessage: "Run a comparison before saving." });
      return;
    }

    if (state.results.length === 0) {
      set({ saveMessage: "There is no comparison result to save yet." });
      return;
    }

    const createdAt = new Date().toISOString();
    const record: SavedRun = {
      id: state.currentRunId ?? nanoid(),
      title: createRunTitle(state.testCaseName, state.userPrompt, createdAt),
      prompt: state.userPrompt,
      systemPrompt: state.systemPrompt,
      userPrompt: state.userPrompt,
      createdAt,
      savedAt: createdAt,
      metrics: setup.selectedMetrics,
      models: state.results,
    };

    await saveRun(record);
    set({
      currentRunId: record.id,
      saveMessage: "Comparison saved to this browser.",
      hasUnsavedChanges: false,
    });
  },
  loadSavedRun: (run) =>
    set({
      currentRunId: run.id,
      testCaseName: run.title,
      systemPrompt: run.systemPrompt ?? "",
      userPrompt: run.userPrompt ?? run.prompt ?? "",
      results: run.models,
      activeTab: "llm",
      runError: null,
      saveMessage: `Loaded saved run from ${new Date(run.savedAt).toLocaleString()}.`,
      selectedResultId: null,
      isRunning: false,
      hasUnsavedChanges: false,
    }),
  reuseSavedPrompts: (run) =>
    set({
      currentRunId: null,
      testCaseName: run.title,
      systemPrompt: run.systemPrompt ?? "",
      userPrompt: run.userPrompt ?? run.prompt ?? "",
      results: [],
      activeTab: "llm",
      runError: null,
      saveMessage: "Prompts loaded into workspace. Run again to create a new comparison.",
      selectedResultId: null,
      isRunning: false,
      hasUnsavedChanges: false,
    }),
}));
