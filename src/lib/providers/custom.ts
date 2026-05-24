import type { CustomProviderConfig, StreamContext, StreamChunk } from "./types";
import { streamAnthropic } from "./anthropic";
import { streamGemini } from "./google";
import { streamOpenAiCompatible } from "./openai-compat";

export function createCustomProviderAdapter(config: CustomProviderConfig) {
  return {
    id: config.id,
    name: config.name,
    defaultModel: config.defaultModel,
    models: config.models.length
      ? config.models
      : [{ id: config.defaultModel, label: config.defaultModel }],
    builtIn: false as const,
    streamChat: (ctx: StreamContext) => streamCustom(ctx, config),
  };
}

async function* streamCustom(
  ctx: StreamContext,
  config: CustomProviderConfig,
): AsyncGenerator<StreamChunk, void, unknown> {
  const enriched: StreamContext = { ...ctx, customProvider: config };

  switch (config.format) {
    case "anthropic":
      yield* streamAnthropic(enriched);
      break;
    case "gemini":
      yield* streamGemini(enriched);
      break;
    case "openai":
    default:
      yield* streamOpenAiCompatible(enriched, {
        baseUrl: config.baseUrl,
        authStyle: config.authStyle === "x-api-key" ? "x-api-key" : "bearer",
      });
  }
}
