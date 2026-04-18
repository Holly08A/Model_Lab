import type { BatchRun, BatchTestCase, ModelRunResult, SavedRun } from "@/types";

function buildGeneratedRunId(batchRunId: string, caseId: string) {
  return `batch-generated:${batchRunId}:${caseId}`;
}

function toModelRunResult(
  result: BatchRun["results"][number],
): ModelRunResult {
  const status =
    result.status === "error"
      ? "error"
      : result.status === "success"
        ? "success"
        : result.status === "running"
          ? "running"
          : "idle";

  return {
    modelConfigId: result.modelConfigId,
    provider: result.provider,
    modelId: result.modelId,
    displayName: result.displayName,
    contextWindow: result.contextWindow,
    status,
    responseText: result.responseText ?? "",
    responsePreview: result.responsePreview ?? "",
    errorMessage: result.generationError ?? result.judgeError,
    usage: result.usage,
    timing: result.timing,
    estimatedCost: result.estimatedCost,
    scores: result.judge.metricScores,
    notes: result.judge.shortRationale || undefined,
  };
}

export function materializeSavedRunsFromBatchRun(batchRun: BatchRun): SavedRun[] {
  const savedAt = batchRun.savedAt ?? new Date().toISOString();

  return batchRun.suiteCases
    .filter((testCase) => testCase.enabled)
    .map((testCase: BatchTestCase) => {
      const models = batchRun.results
        .filter((result) => result.caseId === testCase.id)
        .map((result) => toModelRunResult(result));

      return {
        id: buildGeneratedRunId(batchRun.id, testCase.id),
        title: testCase.name,
        prompt: testCase.userPrompt,
        systemPrompt: testCase.systemPrompt,
        userPrompt: testCase.userPrompt,
        useKnowledgeSource: testCase.useKnowledgeSource,
        createdAt: batchRun.createdAt,
        savedAt,
        metrics: batchRun.metrics,
        models,
        source: {
          type: "batch-generated",
          batchRunId: batchRun.id,
          caseId: testCase.id,
        },
      };
    });
}
