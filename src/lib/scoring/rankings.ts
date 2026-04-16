import type { MetricConfig, ModelRunResult } from "@/types";

export type RankingItem = {
  modelConfigId: string;
  displayName: string;
  value?: number;
};

function compareAscending(a?: number, b?: number) {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return a - b;
}

function compareDescending(a?: number, b?: number) {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return b - a;
}

export function rankByOperationalMetric(
  results: ModelRunResult[],
  metric: "tokens" | "cost" | "full-time",
): RankingItem[] {
  const mapped = results.map((result) => ({
    modelConfigId: result.modelConfigId,
    displayName: result.displayName,
    value:
      metric === "tokens"
        ? result.usage.totalTokens
        : metric === "cost"
          ? result.estimatedCost.totalCost
          : result.timing.fullResponseTimeMs,
  }));

  return mapped.sort((a, b) => compareAscending(a.value, b.value));
}

export function rankByMetricScore(
  results: ModelRunResult[],
  metric: MetricConfig,
): RankingItem[] {
  const mapped = results.map((result) => ({
    modelConfigId: result.modelConfigId,
    displayName: result.displayName,
    value: result.scores[metric.id] ?? undefined,
  }));

  return mapped.sort((a, b) => compareDescending(a.value, b.value));
}
