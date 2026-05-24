import type { ProviderDefinition } from "./types";
import { streamOpenAiCompatible } from "./openai-compat";

export const xaiProvider: ProviderDefinition = {
  id: "xai",
  name: "Grok",
  defaultModel: "grok-4.3",
  builtIn: true,
  models: [
    { id: "grok-4.3", label: "Grok 4.3" },
    { id: "grok-4", label: "Grok 4" },
  ],
  streamChat: (ctx) =>
    streamOpenAiCompatible(ctx, {
      baseUrl: "https://api.x.ai/v1",
      authStyle: "bearer",
    }),
};
