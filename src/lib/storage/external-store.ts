import type { AppSettings, Conversation } from "@/lib/providers/types";
import type { ApiKeysStore } from "./keys";
import { DEFAULT_SETTINGS, STORAGE_KEYS } from "./constants";

const SERVER_API_KEYS: ApiKeysStore = {};
const SERVER_CONVERSATIONS: readonly Conversation[] = [];
const SERVER_SETTINGS: AppSettings = DEFAULT_SETTINGS;

function createCachedSnapshot<T>(storageKey: string, fallback: T, serverSnapshot: T) {
  let cachedRaw: string | null = null;
  let cachedValue: T = fallback;

  const getSnapshot = (): T => {
    if (typeof window === "undefined") {
      return serverSnapshot;
    }

    const raw = localStorage.getItem(storageKey);
    const normalized = raw ?? "__empty__";

    if (normalized === cachedRaw) {
      return cachedValue;
    }

    cachedRaw = normalized;

    if (raw === null) {
      cachedValue = fallback;
      return cachedValue;
    }

    try {
      cachedValue = JSON.parse(raw) as T;
    } catch {
      cachedValue = fallback;
    }

    return cachedValue;
  };

  const getServerSnapshot = (): T => serverSnapshot;

  const invalidate = () => {
    cachedRaw = null;
  };

  return { getSnapshot, getServerSnapshot, invalidate };
}

export const apiKeysExternalStore = createCachedSnapshot(
  STORAGE_KEYS.keys,
  SERVER_API_KEYS,
  SERVER_API_KEYS,
);

export const settingsExternalStore = createCachedSnapshot(
  STORAGE_KEYS.settings,
  DEFAULT_SETTINGS,
  SERVER_SETTINGS,
);

export const conversationsExternalStore = createCachedSnapshot(
  STORAGE_KEYS.conversations,
  [] as Conversation[],
  SERVER_CONVERSATIONS as Conversation[],
);

export function invalidateExternalStores(): void {
  apiKeysExternalStore.invalidate();
  settingsExternalStore.invalidate();
  conversationsExternalStore.invalidate();
}
