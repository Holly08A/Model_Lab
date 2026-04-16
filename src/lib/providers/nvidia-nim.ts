import { ProviderRequestError, toProviderError } from "@/lib/providers/errors";
import type { GenerateParams, GenerateResult, ProviderAdapter } from "@/lib/providers/base";

type NvidiaNimResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
  };
};

type MessageContent = string | Array<{ type?: string; text?: string }> | undefined;

function normalizeContent(content: MessageContent) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => item.text ?? "")
      .join("\n")
      .trim();
  }

  return "";
}

export const nvidiaNimAdapter: ProviderAdapter = {
  provider: "nvidia-nim",
  async generate({ apiKey, modelId, prompt, signal }: GenerateParams): Promise<GenerateResult> {
    const start = performance.now();
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
      signal,
    });

    const body = (await response.json()) as NvidiaNimResponse;

    if (!response.ok) {
      throw new ProviderRequestError(
        toProviderError(
          response.status,
          body.error?.message ?? "NVIDIA NIM returned an unexpected error.",
        ),
      );
    }

    const responseText = normalizeContent(body.choices?.[0]?.message?.content).trim();

    return {
      responseText,
      usage: {
        inputTokens: body.usage?.prompt_tokens,
        outputTokens: body.usage?.completion_tokens,
        totalTokens: body.usage?.total_tokens,
      },
      timing: {
        fullResponseTimeMs: Math.round(performance.now() - start),
      },
    };
  },
};
