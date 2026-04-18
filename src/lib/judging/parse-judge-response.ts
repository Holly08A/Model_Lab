import type { JudgeScoreResult, MetricConfig } from "@/types";

function clampScore(value: unknown) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return Math.max(1, Math.min(10, Math.round(value)));
}

export function parseJudgeResponse(responseText: string, metrics: MetricConfig[]): JudgeScoreResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error("Judge output was not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Judge output must be a JSON object.");
  }

  const record = parsed as Record<string, unknown>;
  const metricScoresRecord =
    record.metricScores && typeof record.metricScores === "object"
      ? (record.metricScores as Record<string, unknown>)
      : null;

  if (!metricScoresRecord) {
    throw new Error("Judge output must include metricScores.");
  }

  const metricScores = Object.fromEntries(
    metrics.map((metric) => [metric.id, clampScore(metricScoresRecord[metric.id])]),
  );

  const overallScore = clampScore(record.overallScore) ?? undefined;
  const confidence =
    typeof record.confidence === "number" && !Number.isNaN(record.confidence)
      ? Math.max(0, Math.min(1, record.confidence))
      : undefined;
  const shortRationale =
    typeof record.shortRationale === "string" && record.shortRationale.trim()
      ? record.shortRationale.trim().slice(0, 240)
      : "No rationale provided.";
  const flags = Array.isArray(record.flags)
    ? record.flags.map((flag) => `${flag}`.trim()).filter(Boolean).slice(0, 5)
    : [];

  return {
    metricScores,
    overallScore,
    confidence,
    shortRationale,
    flags,
  };
}
