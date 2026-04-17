import { z } from "zod";
import type { KnowledgeSourceConfig } from "@/types";

export const customModelSchema = z.object({
  provider: z.enum(["openrouter", "nvidia-nim"]),
  modelId: z.string().trim().min(1, "Model ID is required."),
  displayName: z.string().trim().min(1, "Display name is required."),
  contextWindow: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.coerce.number().int("Context window must be a whole number.").positive("Context window must be greater than 0.").optional(),
  ),
  inputPricePer1k: z.coerce.number().min(0, "Input price must be 0 or higher."),
  outputPricePer1k: z.coerce.number().min(0, "Output price must be 0 or higher."),
});

export type CustomModelFormValues = z.infer<typeof customModelSchema>;

const normalizeColumns = (value: unknown) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeRows = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null);
};

export const knowledgeSourceSchema = z.object({
  provider: z.literal("local-file"),
  fileName: z.string().trim().min(1, "Upload a JSON file."),
  rows: z.preprocess(
    normalizeRows,
    z.array(z.record(z.string(), z.unknown())).min(1, "The uploaded file must contain at least one row."),
  ),
  columns: z.preprocess(
    normalizeColumns,
    z.array(z.string().trim().min(1)).min(1, "Add at least one column."),
  ),
  rowLimit: z.coerce
    .number()
    .int("Row limit must be a whole number.")
    .min(1, "Row limit must be at least 1.")
    .max(500, "Row limit must be 500 or less."),
});

export function createEmptyKnowledgeSourceConfig(): KnowledgeSourceConfig {
  return {
    provider: "local-file",
    fileName: "",
    rows: [],
    columns: [],
    rowLimit: 200,
  };
}

export function validateKnowledgeSourceConfig(config: KnowledgeSourceConfig | null) {
  if (!config) {
    return { ok: true as const };
  }

  const result = knowledgeSourceSchema.safeParse(config);
  if (result.success) {
    return { ok: true as const };
  }

  return {
    ok: false as const,
    message: result.error.issues[0]?.message ?? "Knowledge source configuration is invalid.",
  };
}
