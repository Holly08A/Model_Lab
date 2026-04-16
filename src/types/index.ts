export type ProviderType = "openrouter" | "nvidia-nim";

export type ProviderConfig = {
  provider: ProviderType;
  apiKey: string;
};

export type ModelConfig = {
  id: string;
  provider: ProviderType;
  modelId: string;
  displayName: string;
  inputPricePer1k: number;
  outputPricePer1k: number;
  enabled: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type MetricConfig = {
  id: string;
  key:
    | "accuracy"
    | "instruction_following"
    | "tone_style_fit"
    | "completeness"
    | "hallucination_risk"
    | "custom";
  label: string;
  description?: string;
};

export type RunStatus = "idle" | "running" | "completed" | "partial-error";

export type ProviderError = {
  code:
    | "missing_api_key"
    | "invalid_api_key"
    | "network_error"
    | "rate_limited"
    | "timeout"
    | "unsupported_model"
    | "unknown";
  message: string;
};

export type ModelRunResult = {
  modelConfigId: string;
  provider: ProviderType;
  modelId: string;
  displayName: string;
  status: "idle" | "running" | "success" | "error";
  responseText?: string;
  responsePreview?: string;
  errorMessage?: string;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
  timing: {
    latencyToFirstTokenMs?: number;
    fullResponseTimeMs?: number;
  };
  estimatedCost: {
    inputCost?: number;
    outputCost?: number;
    totalCost?: number;
  };
  scores: Record<string, number | null>;
  notes?: string;
};

export type RunResult = {
  id: string;
  prompt: string;
  createdAt: string;
  models: ModelRunResult[];
  metrics: MetricConfig[];
};

export type SavedRun = RunResult & {
  title: string;
  savedAt: string;
};

export type SetupState = {
  providerKeys: Partial<Record<ProviderType, string>>;
  models: ModelConfig[];
  selectedMetrics: MetricConfig[];
  onboardingComplete: boolean;
};
