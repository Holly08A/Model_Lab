import type { SavedRun } from "@/types";

export type NormalizedRatingRecord = {
  sourceType: "manual";
  sourceName: string;
  sourceId: string;
  createdAt: string;
  modelKey: string;
  displayName: string;
  provider: string;
  modelId: string;
  contextWindow?: number;
  scores: Record<string, number | null>;
  timing: {
    fullResponseTimeMs?: number;
  };
  usage: {
    totalTokens?: number;
  };
  estimatedCost: {
    totalCost?: number;
  };
  metrics: SavedRun["metrics"];
};

export function normalizeSavedRunsForRatings(savedRuns: SavedRun[]): NormalizedRatingRecord[] {
  return savedRuns.flatMap((run) =>
    run.models.map((model) => ({
      sourceType: "manual" as const,
      sourceName: run.title,
      sourceId: run.id,
      createdAt: run.createdAt,
      modelKey: `${model.provider}:${model.modelId}`,
      displayName: model.displayName,
      provider: model.provider,
      modelId: model.modelId,
      contextWindow: model.contextWindow,
      scores: model.scores,
      timing: {
        fullResponseTimeMs: model.timing.fullResponseTimeMs,
      },
      usage: {
        totalTokens: model.usage.totalTokens,
      },
      estimatedCost: {
        totalCost: model.estimatedCost.totalCost,
      },
      metrics: run.metrics,
    })),
  );
}
