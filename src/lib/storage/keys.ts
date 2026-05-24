import { readJson, writeJson } from "./client";
import { STORAGE_KEYS } from "./constants";
import { notifyStorage } from "./subscribe";

export type ApiKeysStore = Record<string, string>;

export function loadApiKeys(): ApiKeysStore {
  return readJson<ApiKeysStore>(STORAGE_KEYS.keys, {});
}

export function saveApiKeys(keys: ApiKeysStore): void {
  writeJson(STORAGE_KEYS.keys, keys);
}

export function getApiKey(providerId: string): string | undefined {
  const keys = loadApiKeys();
  const value = keys[providerId];
  return value?.trim() ? value : undefined;
}

export function setApiKey(providerId: string, apiKey: string): void {
  const keys = loadApiKeys();
  if (apiKey.trim()) {
    keys[providerId] = apiKey.trim();
  } else {
    delete keys[providerId];
  }
  saveApiKeys(keys);
  notifyStorage();
}
