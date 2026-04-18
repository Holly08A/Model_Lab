import { NextResponse } from "next/server";
import { parseJudgeResponse } from "@/lib/judging/parse-judge-response";
import { providerAdapters } from "@/lib/providers";
import { ProviderRequestError } from "@/lib/providers/errors";
import type { MetricConfig, ProviderType } from "@/types";

type JudgeRequestBody = {
  provider: ProviderType;
  apiKey: string;
  modelId: string;
  systemPrompt?: string;
  userPrompt: string;
  metrics: MetricConfig[];
};

export async function POST(request: Request) {
  let body: JudgeRequestBody;

  try {
    body = (await request.json()) as JudgeRequestBody;
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 },
    );
  }

  if (!body.provider || !body.apiKey || !body.modelId || !body.userPrompt?.trim() || !Array.isArray(body.metrics)) {
    return NextResponse.json(
      { message: "provider, apiKey, modelId, userPrompt, and metrics are required." },
      { status: 400 },
    );
  }

  const adapter = providerAdapters[body.provider];
  if (!adapter) {
    return NextResponse.json(
      { message: "Unsupported provider." },
      { status: 400 },
    );
  }

  try {
    const result = await adapter.generate({
      apiKey: body.apiKey,
      modelId: body.modelId,
      systemPrompt: body.systemPrompt,
      userPrompt: body.userPrompt,
    });

    const parsed = parseJudgeResponse(result.responseText, body.metrics);
    return NextResponse.json({
      ...parsed,
      rawResponseText: result.responseText,
      usage: result.usage,
      timing: result.timing,
    });
  } catch (error) {
    if (error instanceof ProviderRequestError) {
      return NextResponse.json(
        { message: error.details.message, code: error.details.code },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unexpected judge error." },
      { status: 500 },
    );
  }
}
