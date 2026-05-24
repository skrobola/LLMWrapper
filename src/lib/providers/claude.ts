import type { ProviderDefinition } from "./types";
import { streamAnthropic } from "./anthropic";

export const claudeProvider: ProviderDefinition = {
  id: "anthropic",
  name: "Claude",
  defaultModel: "claude-sonnet-4-6",
  builtIn: true,
  models: [
    { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6" },
    { id: "claude-opus-4-7", label: "Claude Opus 4.7" },
    { id: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
  ],
  streamChat: streamAnthropic,
};
