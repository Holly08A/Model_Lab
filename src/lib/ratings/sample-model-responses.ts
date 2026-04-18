import { truncateText } from "@/lib/utils/format";
import type { AggregateModelRating } from "@/lib/scoring/aggregate-ratings";
import type { SavedRun } from "@/types";

export type SampledModelResponse = {
  id: string;
  runId: string;
  runTitle: string;
  promptText: string;
  promptPreview: string;
  responseText: string;
  errorMessage?: string;
  overallScore?: number;
};

function shuffle<T>(values: T[]) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    const current = copy[index];
    copy[index] = copy[swapIndex];
    copy[swapIndex] = current;
  }
  return copy;
}

export function sampleModelResponses(params: {
  savedRuns: SavedRun[];
  model: AggregateModelRating;
  limit?: number;
}): SampledModelResponse[] {
  const { savedRuns, model, limit = 10 } = params;

  const responses = savedRuns.flatMap((run) => {
    const modelResult = run.models.find(
      (candidate) => candidate.provider === model.provider && candidate.modelId === model.modelKey.split(":")[1],
    );

    if (!modelResult) {
      return [];
    }

    const promptText = run.userPrompt ?? run.prompt ?? "";
    const numericScores = Object.values(modelResult.scores).filter(
      (score): score is number => score !== null,
    );

    return [
      {
        id: `${run.id}:${model.modelKey}`,
        runId: run.id,
        runTitle: run.title,
        promptText,
        promptPreview: truncateText(promptText, 160),
        responseText: modelResult.responseText ?? "",
        errorMessage: modelResult.errorMessage,
        overallScore:
          numericScores.length > 0
            ? numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length
            : undefined,
      },
    ];
  });

  return shuffle(responses).slice(0, limit);
}
