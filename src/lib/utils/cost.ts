export function calculateEstimatedCost(params: {
  inputTokens?: number;
  outputTokens?: number;
  inputPricePer1k: number;
  outputPricePer1k: number;
}) {
  const inputCost =
    params.inputTokens !== undefined ? (params.inputTokens / 1000) * params.inputPricePer1k : undefined;
  const outputCost =
    params.outputTokens !== undefined ? (params.outputTokens / 1000) * params.outputPricePer1k : undefined;

  const totalCost =
    inputCost !== undefined || outputCost !== undefined
      ? (inputCost ?? 0) + (outputCost ?? 0)
      : undefined;

  return {
    inputCost,
    outputCost,
    totalCost,
  };
}
