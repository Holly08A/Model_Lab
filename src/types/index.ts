export type ProviderType = "openrouter" | "nvidia-nim";
export type KnowledgeSourceProvider = "local-file";
export type BatchSuiteSourceFormat = "csv" | "json";
export type DeterministicCheckType =
  | "keyword_contains"
  | "keyword_absent"
  | "regex_match"
  | "max_length"
  | "json_parse";
export type BatchRunStatus = "draft" | "running" | "completed" | "partial-error";
export type BatchItemStatus = "pending" | "running" | "success" | "error";
export type RatingsSourceFilter = "all" | "manual" | "batch";

export type ProviderConfig = {
  provider: ProviderType;
  apiKey: string;
};

export type ModelConfig = {
  id: string;
  provider: ProviderType;
  modelId: string;
  displayName: string;
  contextWindow?: number;
  inputPricePer1k: number;
  outputPricePer1k: number;
  enabled: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeSourceConfig = {
  provider: KnowledgeSourceProvider;
  fileName: string;
  rows: Array<Record<string, unknown>>;
  columns: string[];
  rowLimit: number;
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
  contextWindow?: number;
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
  title?: string;
  prompt?: string;
  systemPrompt?: string;
  userPrompt?: string;
  useKnowledgeSource?: boolean;
  createdAt: string;
  models: ModelRunResult[];
  metrics: MetricConfig[];
};

export type SavedRun = RunResult & {
  title: string;
  savedAt: string;
  source?: {
    type: "manual" | "batch-generated";
    batchRunId?: string;
    caseId?: string;
  };
};

export type SetupState = {
  providerKeys: Partial<Record<ProviderType, string>>;
  models: ModelConfig[];
  selectedMetrics: MetricConfig[];
  knowledgeSource: KnowledgeSourceConfig | null;
  judgeConfig: JudgeConfig;
  onboardingComplete: boolean;
};

export type JudgeConfig = {
  provider: ProviderType;
  modelId: string;
  displayName: string;
  enabled: boolean;
  systemPromptTemplate?: string;
};

export type DeterministicCheck =
  | {
      type: "keyword_contains";
      value: string;
      label?: string;
    }
  | {
      type: "keyword_absent";
      value: string;
      label?: string;
    }
  | {
      type: "regex_match";
      value: string;
      flags?: string;
      label?: string;
    }
  | {
      type: "max_length";
      value: number;
      label?: string;
    }
  | {
      type: "json_parse";
      label?: string;
    };

export type BatchTestCase = {
  id: string;
  name: string;
  systemPrompt: string;
  userPrompt: string;
  useKnowledgeSource: boolean;
  referenceAnswer?: string;
  rubric?: string;
  tags: string[];
  checks: DeterministicCheck[];
  enabled: boolean;
};

export type BatchSuite = {
  id: string;
  name: string;
  sourceFormat: BatchSuiteSourceFormat;
  createdAt: string;
  cases: BatchTestCase[];
};

export type DeterministicCheckResult = {
  type: DeterministicCheckType;
  label: string;
  passed: boolean;
  message: string;
};

export type JudgeScoreResult = {
  metricScores: Record<string, number | null>;
  overallScore?: number;
  confidence?: number;
  shortRationale: string;
  flags: string[];
};

export type BatchCaseModelResult = {
  caseId: string;
  caseName: string;
  modelConfigId: string;
  provider: ProviderType;
  modelId: string;
  displayName: string;
  contextWindow?: number;
  status: BatchItemStatus;
  responseText?: string;
  responsePreview?: string;
  generationError?: string;
  judgeError?: string;
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
  deterministicChecks: DeterministicCheckResult[];
  judge: JudgeScoreResult;
};

export type BatchRun = {
  id: string;
  title: string;
  createdAt: string;
  savedAt?: string;
  status: BatchRunStatus;
  useKnowledgeSource: boolean;
  suiteId: string;
  suiteName: string;
  suiteSourceFormat: BatchSuiteSourceFormat;
  suiteCases: BatchTestCase[];
  candidateModels: ModelConfig[];
  judgeConfig: JudgeConfig;
  metrics: MetricConfig[];
  results: BatchCaseModelResult[];
  summary?: {
    totalCases: number;
    enabledCases: number;
    totalEvaluations: number;
    completedEvaluations: number;
    errorEvaluations: number;
  };
};
