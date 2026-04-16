import { NextResponse } from "next/server";
import { providerAdapters } from "@/lib/providers";
import { ProviderRequestError } from "@/lib/providers/errors";
import type { ProviderType } from "@/types";

type CompareRequestBody = {
  provider: ProviderType;
  apiKey: string;
  modelId: string;
  prompt: string;
};

export async function POST(request: Request) {
  let body: CompareRequestBody;

  try {
    body = (await request.json()) as CompareRequestBody;
  } catch {
    return NextResponse.json(
      { message: "Invalid request body." },
      { status: 400 },
    );
  }

  if (!body.provider || !body.apiKey || !body.modelId || !body.prompt?.trim()) {
    return NextResponse.json(
      { message: "provider, apiKey, modelId, and prompt are required." },
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
      prompt: body.prompt,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ProviderRequestError) {
      return NextResponse.json(
        { message: error.details.message, code: error.details.code },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unexpected compare error." },
      { status: 500 },
    );
  }
}
