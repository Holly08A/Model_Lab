import type { SavedRun } from "@/types";

export type AggregateMetricScore = {
  metricId: string;
  label: string;
  averageScore?: number;
  scoreCount: number;
};

export type AggregateModelRating = {
  modelKey: string;
  displayName: string;
  provider: string;
  runCount: number;
  responseCount: number;
  scoredResponseCount: number;
  averageOverallScore?: number;
  averageFullResponseTimeMs?: number;
  averageTotalTokens?: number;
  averageEstimatedCost?: number;
  metrics: AggregateMetricScore[];
};

type MetricAccumulator = {
  metricId: string;
  label: string;
  total: number;
  count: number;
};

type ModelAccumulator = {
  modelKey: string;
  displayName: string;
  provider: string;
  runIds: Set<string>;
  responseCount: number;
  scoredResponseCount: number;
  overallTotal: number;
  overallCount: number;
  fullResponseTimeTotal: number;
  fullResponseTimeCount: number;
  totalTokensTotal: number;
  totalTokensCount: number;
  estimatedCostTotal: number;
  estimatedCostCount: number;
  metrics: Map<string, MetricAccumulator>;
};

export function aggregateModelRatings(savedRuns: SavedRun[]): AggregateModelRating[] {
  const modelMap = new Map<string, ModelAccumulator>();

  for (const run of savedRuns) {
    for (const model of run.models) {
      const modelKey = `${model.provider}:${model.modelId}`;
      const current =
        modelMap.get(modelKey) ??
        {
          modelKey,
          displayName: model.displayName,
          provider: model.provider,
          runIds: new Set<string>(),
          responseCount: 0,
          scoredResponseCount: 0,
          overallTotal: 0,
          overallCount: 0,
          fullResponseTimeTotal: 0,
          fullResponseTimeCount: 0,
          totalTokensTotal: 0,
          totalTokensCount: 0,
          estimatedCostTotal: 0,
          estimatedCostCount: 0,
          metrics: new Map<string, MetricAccumulator>(),
        };

      current.runIds.add(run.id);
      current.responseCount += 1;

      if (model.timing.fullResponseTimeMs !== undefined) {
        current.fullResponseTimeTotal += model.timing.fullResponseTimeMs;
        current.fullResponseTimeCount += 1;
      }

      if (model.usage.totalTokens !== undefined) {
        current.totalTokensTotal += model.usage.totalTokens;
        current.totalTokensCount += 1;
      }

      if (model.estimatedCost.totalCost !== undefined) {
        current.estimatedCostTotal += model.estimatedCost.totalCost;
        current.estimatedCostCount += 1;
      }

      const scoredValues = Object.entries(model.scores).filter((entry) => entry[1] !== null) as Array<
        [string, number]
      >;

      if (scoredValues.length > 0) {
        current.scoredResponseCount += 1;
        for (const [metricId, score] of scoredValues) {
          const metricMeta = run.metrics.find((metric) => metric.id === metricId);
          const metric = current.metrics.get(metricId) ?? {
            metricId,
            label: metricMeta?.label ?? metricId,
            total: 0,
            count: 0,
          };

          metric.total += score;
          metric.count += 1;
          current.metrics.set(metricId, metric);

          current.overallTotal += score;
          current.overallCount += 1;
        }
      }

      modelMap.set(modelKey, current);
    }
  }

  return [...modelMap.values()]
    .map((model) => ({
      modelKey: model.modelKey,
      displayName: model.displayName,
      provider: model.provider,
      runCount: model.runIds.size,
      responseCount: model.responseCount,
      scoredResponseCount: model.scoredResponseCount,
      averageOverallScore:
        model.overallCount > 0 ? model.overallTotal / model.overallCount : undefined,
      averageFullResponseTimeMs:
        model.fullResponseTimeCount > 0
          ? model.fullResponseTimeTotal / model.fullResponseTimeCount
          : undefined,
      averageTotalTokens:
        model.totalTokensCount > 0 ? model.totalTokensTotal / model.totalTokensCount : undefined,
      averageEstimatedCost:
        model.estimatedCostCount > 0
          ? model.estimatedCostTotal / model.estimatedCostCount
          : undefined,
      metrics: [...model.metrics.values()]
        .map((metric) => ({
          metricId: metric.metricId,
          label: metric.label,
          averageScore: metric.count > 0 ? metric.total / metric.count : undefined,
          scoreCount: metric.count,
        }))
        .sort((a, b) => {
          const scoreA = a.averageScore ?? -1;
          const scoreB = b.averageScore ?? -1;
          return scoreB - scoreA;
        }),
    }))
    .sort((a, b) => {
      const scoreA = a.averageOverallScore ?? -1;
      const scoreB = b.averageOverallScore ?? -1;
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return b.runCount - a.runCount;
    });
}
