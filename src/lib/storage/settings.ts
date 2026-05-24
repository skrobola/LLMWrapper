import type { AppSettings } from "@/lib/providers/types";
import { readJson, writeJson } from "./client";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "./constants";
import { notifyStorage } from "./subscribe";

export function loadSettings(): AppSettings {
  return readJson<AppSettings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
}

export function saveSettings(settings: AppSettings): void {
  writeJson(STORAGE_KEYS.settings, settings);
  notifyStorage();
}
