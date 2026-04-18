"use client";

import { nanoid } from "nanoid";
import { create } from "zustand";
import { parseBatchImport } from "@/lib/batch/import";
import { materializeSavedRunsFromBatchRun } from "@/lib/batch/materialize-saved-runs";
import { buildKnowledgePrompt, getKnowledgeRows } from "@/lib/knowledge/source";
import { saveBatchRun, saveBatchSuite, listBatchRuns, deleteBatchRun, saveRuns } from "@/lib/storage/db";
import { calculateEstimatedCost } from "@/lib/utils/cost";
import { truncateText } from "@/lib/utils/format";
import { buildJudgePrompt } from "@/lib/judging/build-judge-prompt";
import { runDeterministicChecks } from "@/lib/judging/run-deterministic-checks";
import { useSetupStore } from "@/stores/setup-store";
import type {
  BatchCaseModelResult,
  BatchRun,
  BatchSuite,
  BatchTestCase,
  JudgeScoreResult,
  MetricConfig,
  ModelConfig,
} from "@/types";

const GENERATION_CONCURRENCY = 2;
const JUDGE_CONCURRENCY = 2;

function createEmptyJudge(metrics: MetricConfig[]): JudgeScoreResult {
  return {
    metricScores: Object.fromEntries(metrics.map((metric) => [metric.id, null])),
    overallScore: undefined,
    confidence: undefined,
    shortRationale: "",
    flags: [],
  };
}

function createPendingResults(cases: BatchTestCase[], models: ModelConfig[], metrics: MetricConfig[]): BatchCaseModelResult[] {
  return cases.flatMap((testCase) =>
    models.map((model) => ({
      caseId: testCase.id,
      caseName: testCase.name,
      modelConfigId: model.id,
      provider: model.provider,
      modelId: model.modelId,
      displayName: model.displayName,
      contextWindow: model.contextWindow,
      status: "pending" as const,
      responseText: "",
      responsePreview: "",
      usage: {},
      timing: {},
      estimatedCost: {},
      deterministicChecks: [],
      judge: createEmptyJudge(metrics),
    })),
  );
}

function summarizeRun(run: BatchRun) {
  const enabledCases = run.suiteCases.filter((testCase) => testCase.enabled).length;
  const totalEvaluations = run.results.length;
  const completedEvaluations = run.results.filter((result) => result.status === "success").length;
  const errorEvaluations = run.results.filter((result) => result.status === "error").length;

  return {
    totalCases: run.suiteCases.length,
    enabledCases,
    totalEvaluations,
    completedEvaluations,
    errorEvaluations,
  };
}

async function runWithConcurrency<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  const queue = [...items];

  await Promise.all(
    Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (!next) {
          break;
        }

        await worker(next);
      }
    }),
  );
}

type BatchRunsStore = {
  importedSuite: BatchSuite | null;
  currentRun: BatchRun | null;
  savedRuns: BatchRun[];
  loadingSavedRuns: boolean;
  isRunning: boolean;
  importError: string | null;
  runError: string | null;
  statusMessage: string | null;
  importSuite: (fileName: string, text: string) => Promise<void>;
  toggleCase: (caseId: string) => void;
  runImportedSuite: () => Promise<void>;
  saveCurrentRun: () => Promise<void>;
  loadSavedRuns: () => Promise<void>;
  openSavedRun: (run: BatchRun) => void;
  removeSavedRun: (id: string) => Promise<void>;
  reset: () => void;
};

export const useBatchRunsStore = create<BatchRunsStore>((set, get) => ({
  importedSuite: null,
  currentRun: null,
  savedRuns: [],
  loadingSavedRuns: false,
  isRunning: false,
  importError: null,
  runError: null,
  statusMessage: null,
  importSuite: async (fileName, text) => {
    const parsed = parseBatchImport({ fileName, text });
    if (!parsed.ok) {
      set({ importError: parsed.message, statusMessage: null });
      return;
    }

    await saveBatchSuite(parsed.suite);
    set({
      importedSuite: parsed.suite,
      currentRun: null,
      importError: null,
      runError: null,
      statusMessage: `Imported ${parsed.suite.cases.length} test case${parsed.suite.cases.length === 1 ? "" : "s"} from ${fileName}.`,
    });
  },
  toggleCase: (caseId) =>
    set((state) => ({
      importedSuite: state.importedSuite
        ? {
            ...state.importedSuite,
            cases: state.importedSuite.cases.map((testCase) =>
              testCase.id === caseId ? { ...testCase, enabled: !testCase.enabled } : testCase,
            ),
          }
        : null,
      currentRun: null,
      statusMessage: null,
    })),
  runImportedSuite: async () => {
    const suite = get().importedSuite;
    useSetupStore.getState().hydrate();
    const setup = useSetupStore.getState();

    if (!suite) {
      set({ runError: "Import a batch suite before running it." });
      return;
    }

    const enabledCases = suite.cases.filter((testCase) => testCase.enabled);
    if (enabledCases.length === 0) {
      set({ runError: "Enable at least one imported test case before running the suite." });
      return;
    }

    const validation = setup.validateSetup();
    if (!validation.ok) {
      set({ runError: validation.message });
      return;
    }

    const hasKnowledgeSourceCases = enabledCases.some((testCase) => testCase.useKnowledgeSource);
    if (hasKnowledgeSourceCases && !setup.knowledgeSource) {
      set({ runError: "At least one test case requires the local capability catalog, but no catalog is configured in Setup." });
      return;
    }

    if (!setup.judgeConfig.enabled || !setup.judgeConfig.modelId.trim()) {
      set({ runError: "Enable and configure a judge model in setup before running batch auto-scoring." });
      return;
    }

    const judgeApiKey = setup.providerKeys[setup.judgeConfig.provider]?.trim();
    if (!judgeApiKey) {
      set({ runError: "Add the judge provider API key in setup before running batch auto-scoring." });
      return;
    }

    const candidateModels = setup.getActiveModels();
    const metrics = setup.selectedMetrics;
    const createdAt = new Date().toISOString();

    const currentRun: BatchRun = {
      id: nanoid(),
      title: `${suite.name} batch run`,
      createdAt,
      status: "running",
      useKnowledgeSource: hasKnowledgeSourceCases,
      suiteId: suite.id,
      suiteName: suite.name,
      suiteSourceFormat: suite.sourceFormat,
      suiteCases: suite.cases,
      candidateModels,
      judgeConfig: setup.judgeConfig,
      metrics,
      results: createPendingResults(enabledCases, candidateModels, metrics),
    };

    currentRun.summary = summarizeRun(currentRun);

    set({
      currentRun,
      isRunning: true,
      runError: null,
      statusMessage: `Running ${enabledCases.length} case${enabledCases.length === 1 ? "" : "s"} across ${candidateModels.length} model${candidateModels.length === 1 ? "" : "s"}.`,
    });

    const generationOutputs: Array<{
      testCase: BatchTestCase;
      model: ModelConfig;
      responseText: string;
      usage: BatchCaseModelResult["usage"];
      timing: BatchCaseModelResult["timing"];
      estimatedCost: BatchCaseModelResult["estimatedCost"];
      deterministicChecks: BatchCaseModelResult["deterministicChecks"];
    }> = [];

    const evaluations = enabledCases.flatMap((testCase) => candidateModels.map((model) => ({ testCase, model })));

    await runWithConcurrency(evaluations, GENERATION_CONCURRENCY, async ({ testCase, model }) => {
      set((state) => {
        if (!state.currentRun) {
          return state;
        }

        return {
          currentRun: {
            ...state.currentRun,
            results: state.currentRun.results.map((result) =>
              result.caseId === testCase.id && result.modelConfigId === model.id
                ? { ...result, status: "running" }
                : result,
            ),
          },
        };
      });

      try {
        const apiKey = setup.providerKeys[model.provider]?.trim();
        if (!apiKey) {
          throw new Error("Missing provider API key.");
        }

        const finalUserPrompt =
          testCase.useKnowledgeSource && setup.knowledgeSource
            ? buildKnowledgePrompt(
                setup.knowledgeSource,
                getKnowledgeRows(setup.knowledgeSource),
                testCase.userPrompt,
              )
            : testCase.userPrompt;

        const response = await fetch("/api/compare", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider: model.provider,
            apiKey,
            modelId: model.modelId,
            systemPrompt: testCase.systemPrompt,
            userPrompt: finalUserPrompt,
          }),
        });

        const body = (await response.json()) as {
          message?: string;
          responseText?: string;
          usage?: BatchCaseModelResult["usage"];
          timing?: BatchCaseModelResult["timing"];
        };

        if (!response.ok || !body.responseText?.trim()) {
          throw new Error(body.message ?? "The comparison request failed.");
        }

        const responseText = body.responseText.trim();
        const deterministicChecks = runDeterministicChecks(testCase, responseText);
        const estimatedCost = calculateEstimatedCost({
          inputTokens: body.usage?.inputTokens,
          outputTokens: body.usage?.outputTokens,
          inputPricePer1k: model.inputPricePer1k,
          outputPricePer1k: model.outputPricePer1k,
        });

        generationOutputs.push({
          testCase,
          model,
          responseText,
          usage: body.usage ?? {},
          timing: body.timing ?? {},
          estimatedCost,
          deterministicChecks,
        });

        set((state) => {
          if (!state.currentRun) {
            return state;
          }

          const nextRun = {
            ...state.currentRun,
            results: state.currentRun.results.map((result) =>
              result.caseId === testCase.id && result.modelConfigId === model.id
                ? {
                    ...result,
                    responseText,
                    responsePreview: truncateText(responseText),
                    usage: body.usage ?? {},
                    timing: body.timing ?? {},
                    estimatedCost,
                    deterministicChecks,
                  }
                : result,
            ),
          };

          return {
            currentRun: {
              ...nextRun,
              summary: summarizeRun(nextRun),
            },
          };
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown generation error.";

        set((state) => {
          if (!state.currentRun) {
            return state;
          }

          const nextRun = {
            ...state.currentRun,
            results: state.currentRun.results.map((result) =>
              result.caseId === testCase.id && result.modelConfigId === model.id
                ? {
                    ...result,
                    status: "error" as const,
                    generationError: message,
                  }
                : result,
            ),
          };

          return {
            currentRun: {
              ...nextRun,
              summary: summarizeRun(nextRun),
            },
          };
        });
      }
    });

    await runWithConcurrency(generationOutputs, JUDGE_CONCURRENCY, async (item) => {
      try {
        const response = await fetch("/api/judge", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            provider: setup.judgeConfig.provider,
            apiKey: judgeApiKey,
            modelId: setup.judgeConfig.modelId,
            systemPrompt: setup.judgeConfig.systemPromptTemplate,
            userPrompt: buildJudgePrompt({
              testCase: item.testCase,
              metrics,
              responseText: item.responseText,
              deterministicChecks: item.deterministicChecks,
            }),
            metrics,
          }),
        });

        const body = (await response.json()) as JudgeScoreResult & { message?: string };
        if (!response.ok) {
          throw new Error(body.message ?? "Judge scoring failed.");
        }

        set((state) => {
          if (!state.currentRun) {
            return state;
          }

          const nextRun = {
            ...state.currentRun,
            results: state.currentRun.results.map((result) =>
              result.caseId === item.testCase.id && result.modelConfigId === item.model.id
                ? {
                    ...result,
                    status: "success" as const,
                    judge: {
                      metricScores: body.metricScores,
                      overallScore: body.overallScore,
                      confidence: body.confidence,
                      shortRationale: body.shortRationale,
                      flags: body.flags,
                    },
                  }
                : result,
            ),
          };

          return {
            currentRun: {
              ...nextRun,
              summary: summarizeRun(nextRun),
            },
          };
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown judge error.";
        set((state) => {
          if (!state.currentRun) {
            return state;
          }

          const nextRun = {
            ...state.currentRun,
            results: state.currentRun.results.map((result) =>
              result.caseId === item.testCase.id && result.modelConfigId === item.model.id
                ? {
                    ...result,
                    status: "error" as const,
                    judgeError: message,
                  }
                : result,
            ),
          };

          return {
            currentRun: {
              ...nextRun,
              summary: summarizeRun(nextRun),
            },
          };
        });
      }
    });

    let finalizedRun: BatchRun | null = null;
    let finalizedHasErrors = false;

    set((state) => {
      if (!state.currentRun) {
        return { isRunning: false };
      }

      const hasErrors = state.currentRun.results.some((result) => result.status === "error");
      finalizedHasErrors = hasErrors;
      const nextRun = {
        ...state.currentRun,
        savedAt: new Date().toISOString(),
        status: hasErrors ? "partial-error" : "completed",
      } satisfies BatchRun;
      finalizedRun = {
        ...nextRun,
        summary: summarizeRun(nextRun),
      };

      return {
        currentRun: finalizedRun,
        isRunning: false,
        statusMessage: hasErrors
          ? "Batch run finished with partial errors. Review the flagged items below."
          : "Batch run completed and auto-scored successfully.",
      };
    });

    const completedRun = finalizedRun;
    if (completedRun) {
      await saveBatchRun(completedRun);
      await saveRuns(materializeSavedRunsFromBatchRun(completedRun));
      await get().loadSavedRuns();
      set({
        currentRun: completedRun,
        statusMessage:
          finalizedHasErrors
            ? "Batch run finished with partial errors and each case has been added to Saved Runs."
            : "Batch run completed, auto-scored, and each case has been added to Saved Runs.",
      });
    }
  },
  saveCurrentRun: async () => {
    const currentRun = get().currentRun;
    if (!currentRun) {
      set({ statusMessage: "Run a batch suite before saving it." });
      return;
    }

    const record = {
      ...currentRun,
      savedAt: new Date().toISOString(),
    };

    await saveBatchRun(record);
    set({ currentRun: record, statusMessage: "Batch run saved in this browser." });
    await get().loadSavedRuns();
  },
  loadSavedRuns: async () => {
    set({ loadingSavedRuns: true });
    try {
      const savedRuns = await listBatchRuns();
      set({ savedRuns, loadingSavedRuns: false });
    } catch (error) {
      set({
        loadingSavedRuns: false,
        runError: error instanceof Error ? error.message : "Failed to load saved batch runs.",
      });
    }
  },
  openSavedRun: (run) =>
    set({
      currentRun: run,
      importedSuite: {
        id: run.suiteId,
        name: run.suiteName,
        sourceFormat: run.suiteSourceFormat,
        createdAt: run.createdAt,
        cases: run.suiteCases,
      },
      statusMessage: `Loaded saved batch run from ${new Date(run.savedAt ?? run.createdAt).toLocaleString()}.`,
      importError: null,
      runError: null,
    }),
  removeSavedRun: async (id) => {
    await deleteBatchRun(id);
    await get().loadSavedRuns();
  },
  reset: () =>
    set({
      importedSuite: null,
      currentRun: null,
      importError: null,
      runError: null,
      statusMessage: null,
      isRunning: false,
    }),
}));
