import { z } from "zod";

export const customModelSchema = z.object({
  provider: z.enum(["openrouter", "nvidia-nim"]),
  modelId: z.string().trim().min(1, "Model ID is required."),
  displayName: z.string().trim().min(1, "Display name is required."),
  inputPricePer1k: z.coerce.number().min(0, "Input price must be 0 or higher."),
  outputPricePer1k: z.coerce.number().min(0, "Output price must be 0 or higher."),
});

export type CustomModelFormValues = z.infer<typeof customModelSchema>;
