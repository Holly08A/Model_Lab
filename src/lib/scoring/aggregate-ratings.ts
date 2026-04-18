import { defaultModels } from "@/lib/constants/default-models";
import type { SavedRun } from "@/types";
import {
  normalizeSavedRunsForRatings,
  type NormalizedRatingRecord,
} from "@/lib/scoring/normalize-ratings";

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
  contextWindow?: number;
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
  contextWindow?: number;
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

const defaultContextWindows = new Map(
  defaultModels
    .filter((model) => model.contextWindow !== undefined)
    .map((model) => [`${model.provider}:${model.modelId}`, model.contextWindow as number]),
);

const defaultDisplayNames = new Map(
  defaultModels.map((model) => [`${model.provider}:${model.modelId}`, model.displayName]),
);

function aggregateNormalizedRatings(records: NormalizedRatingRecord[]): AggregateModelRating[] {
  const modelMap = new Map<string, ModelAccumulator>();

  for (const record of records) {
      const modelKey = `${record.provider}:${record.modelId}`;
      const current =
        modelMap.get(modelKey) ??
        {
          modelKey,
          displayName: defaultDisplayNames.get(modelKey) ?? record.displayName,
          provider: record.provider,
          contextWindow: record.contextWindow ?? defaultContextWindows.get(modelKey),
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

      if (current.contextWindow === undefined && record.contextWindow !== undefined) {
        current.contextWindow = record.contextWindow;
      }

      if (defaultDisplayNames.has(modelKey)) {
        current.displayName = defaultDisplayNames.get(modelKey) ?? current.displayName;
      }

      current.runIds.add(record.sourceId);
      current.responseCount += 1;

      if (record.timing.fullResponseTimeMs !== undefined) {
        current.fullResponseTimeTotal += record.timing.fullResponseTimeMs;
        current.fullResponseTimeCount += 1;
      }

      if (record.usage.totalTokens !== undefined) {
        current.totalTokensTotal += record.usage.totalTokens;
        current.totalTokensCount += 1;
      }

      if (record.estimatedCost.totalCost !== undefined) {
        current.estimatedCostTotal += record.estimatedCost.totalCost;
        current.estimatedCostCount += 1;
      }

      const scoredValues = Object.entries(record.scores).filter((entry) => entry[1] !== null) as Array<
        [string, number]
      >;

      if (scoredValues.length > 0) {
        current.scoredResponseCount += 1;
        for (const [metricId, score] of scoredValues) {
          const metricMeta = record.metrics.find((metric) => metric.id === metricId);
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

  return [...modelMap.values()]
    .map((model) => ({
      modelKey: model.modelKey,
      displayName: model.displayName,
      provider: model.provider,
      contextWindow: model.contextWindow,
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

export function aggregateModelRatings(savedRuns: SavedRun[]): AggregateModelRating[] {
  return aggregateNormalizedRatings(normalizeSavedRunsForRatings(savedRuns));
}
