import type { BatchTestCase, DeterministicCheckResult, MetricConfig } from "@/types";

export function buildJudgePrompt(params: {
  testCase: BatchTestCase;
  metrics: MetricConfig[];
  responseText: string;
  deterministicChecks: DeterministicCheckResult[];
}) {
  const { testCase, metrics, responseText, deterministicChecks } = params;

  return JSON.stringify(
    {
      instructions: [
        "Score the candidate response against the provided metrics on a 1-10 scale.",
        "Higher scores must always mean better performance on the metric.",
        "For hallucination-related metrics, a higher score means lower risk and fewer unsupported or invented claims.",
        "Use only the provided prompt, rubric, reference answer, and deterministic check results.",
        "Return strict JSON only with keys: metricScores, overallScore, confidence, shortRationale, flags.",
        "metricScores must contain every metric id, with numeric scores from 1 to 10.",
        "confidence must be between 0 and 1.",
        "shortRationale must be concise and under 240 characters.",
        "flags must be a short array of strings and may be empty.",
      ],
      testCase: {
        id: testCase.id,
        name: testCase.name,
        systemPrompt: testCase.systemPrompt,
        userPrompt: testCase.userPrompt,
        referenceAnswer: testCase.referenceAnswer,
        rubric: testCase.rubric,
        tags: testCase.tags,
      },
      metrics: metrics.map((metric) => ({
        id: metric.id,
        label: metric.label,
        description: metric.description,
      })),
      deterministicChecks,
      candidateResponse: responseText,
    },
    null,
    2,
  );
}
