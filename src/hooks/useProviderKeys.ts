"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getApiKey, setApiKey } from "@/lib/storage/keys";
import { apiKeysExternalStore } from "@/lib/storage/external-store";
import { subscribeStorage } from "@/lib/storage/subscribe";

export function useProviderKeys() {
  const keys = useSyncExternalStore(
    subscribeStorage,
    apiKeysExternalStore.getSnapshot,
    apiKeysExternalStore.getServerSnapshot,
  );

  const updateKey = useCallback((providerId: string, value: string) => {
    setApiKey(providerId, value);
  }, []);

  const hasKey = useCallback(
    (providerId: string) => Boolean(keys[providerId]?.trim()),
    [keys],
  );

  return { keys, updateKey, hasKey, getKey: getApiKey };
}
