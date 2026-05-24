import type { AppSettings } from "@/lib/providers/types";
import { readJson, writeJson } from "./client";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "./constants";
import { notifyStorage } from "./subscribe";

export function loadSettings(): AppSettings {
  const stored = readJson<Partial<AppSettings>>(STORAGE_KEYS.settings, {});
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    customProviders:
      stored.customProviders ?? DEFAULT_SETTINGS.customProviders,
    customInstructions:
      stored.customInstructions ?? DEFAULT_SETTINGS.customInstructions,
  };
}

export function saveSettings(settings: AppSettings): void {
  writeJson(STORAGE_KEYS.settings, settings);
  notifyStorage();
}
