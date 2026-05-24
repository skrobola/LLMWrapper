export const STORAGE_KEYS = {
  keys: "llm-wrapper:keys:v1",
  conversations: "llm-wrapper:conversations:v1",
  settings: "llm-wrapper:settings:v1",
} as const;

export const DEFAULT_SETTINGS = {
  theme: "system" as const,
  lastProviderId: "anthropic",
  lastModelId: "claude-sonnet-4-6",
  customProviders: [],
};
