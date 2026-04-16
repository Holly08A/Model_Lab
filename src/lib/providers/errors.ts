import type { ProviderError } from "@/types";

export class ProviderRequestError extends Error {
  details: ProviderError;

  constructor(details: ProviderError) {
    super(details.message);
    this.name = "ProviderRequestError";
    this.details = details;
  }
}

export function toProviderError(status: number, fallbackMessage: string): ProviderError {
  if (status === 401 || status === 403) {
    return {
      code: "invalid_api_key",
      message: "The API key was rejected by the provider.",
    };
  }

  if (status === 404) {
    return {
      code: "unsupported_model",
      message: "The selected model could not be found for this provider.",
    };
  }

  if (status === 408) {
    return {
      code: "timeout",
      message: "The provider timed out while generating a response.",
    };
  }

  if (status === 429) {
    return {
      code: "rate_limited",
      message: "The provider rate-limited this request. Please retry in a moment.",
    };
  }

  return {
    code: "unknown",
    message: fallbackMessage,
  };
}
