import type { CustomProviderConfig, ProviderDefinition } from "./types";
import { openaiProvider } from "./openai";
import { claudeProvider } from "./claude";
import { geminiProvider } from "./gemini";
import { xaiProvider } from "./xai";
import { createCustomProviderAdapter } from "./custom";

const builtInProviders: ProviderDefinition[] = [
  xaiProvider,
  claudeProvider,
  openaiProvider,
  geminiProvider,
];

export function getBuiltInProviders(): ProviderDefinition[] {
  return builtInProviders;
}

export function resolveProviders(
  customProviders: CustomProviderConfig[] = [],
): ProviderDefinition[] {
  const custom = customProviders.map(createCustomProviderAdapter);
  return [...builtInProviders, ...custom];
}

export function getProvider(
  providerId: string,
  customProviders: CustomProviderConfig[] = [],
): ProviderDefinition | undefined {
  return resolveProviders(customProviders).find((p) => p.id === providerId);
}
