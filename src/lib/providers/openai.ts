import type { ProviderDefinition } from "./types";
import { streamOpenAiCompatible } from "./openai-compat";

export const openaiProvider: ProviderDefinition = {
  id: "openai",
  name: "GPT 5.5",
  defaultModel: "gpt-5.5",
  builtIn: true,
  models: [
    { id: "gpt-5.5", label: "GPT 5.5" },
    { id: "gpt-5.5-pro", label: "GPT 5.5 Pro" },
    { id: "gpt-4.1", label: "GPT 4.1" },
  ],
  streamChat: (ctx) =>
    streamOpenAiCompatible(ctx, {
      baseUrl: "https://api.openai.com/v1",
      authStyle: "bearer",
    }),
};
