import type { ProviderType } from "@/types";

export type GenerateParams = {
  apiKey: string;
  modelId: string;
  prompt: string;
  signal?: AbortSignal;
};

export type GenerateResult = {
  responseText: string;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  timing: {
    latencyToFirstTokenMs?: number;
    fullResponseTimeMs?: number;
  };
};

export interface ProviderAdapter {
  provider: ProviderType;
  generate(params: GenerateParams): Promise<GenerateResult>;
}
