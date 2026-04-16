import { nvidiaNimAdapter } from "@/lib/providers/nvidia-nim";
import { openRouterAdapter } from "@/lib/providers/openrouter";
import type { ProviderType } from "@/types";

export const providerAdapters = {
  openrouter: openRouterAdapter,
  "nvidia-nim": nvidiaNimAdapter,
} satisfies Record<ProviderType, (typeof openRouterAdapter) | (typeof nvidiaNimAdapter)>;
