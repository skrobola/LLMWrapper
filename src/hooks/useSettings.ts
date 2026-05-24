"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { AppSettings, CustomProviderConfig } from "@/lib/providers/types";
import { loadSettings, saveSettings } from "@/lib/storage/settings";
import { settingsExternalStore } from "@/lib/storage/external-store";
import { subscribeStorage } from "@/lib/storage/subscribe";

export function useSettings() {
  const settings = useSyncExternalStore(
    subscribeStorage,
    settingsExternalStore.getSnapshot,
    settingsExternalStore.getServerSnapshot,
  );

  const persist = useCallback((next: AppSettings) => {
    saveSettings(next);
  }, []);

  const setTheme = useCallback(
    (theme: AppSettings["theme"]) => {
      persist({ ...loadSettings(), theme });
    },
    [persist],
  );

  const setLastProvider = useCallback(
    (providerId: string, modelId: string) => {
      const current = loadSettings();
      persist({
        ...current,
        lastProviderId: providerId,
        lastModelId: modelId,
      });
    },
    [persist],
  );

  const addCustomProvider = useCallback(
    (provider: CustomProviderConfig) => {
      const current = loadSettings();
      persist({
        ...current,
        customProviders: [...current.customProviders, provider],
      });
    },
    [persist],
  );

  const removeCustomProvider = useCallback(
    (id: string) => {
      const current = loadSettings();
      persist({
        ...current,
        customProviders: current.customProviders.filter((p) => p.id !== id),
      });
    },
    [persist],
  );

  return {
    settings,
    setTheme,
    setLastProvider,
    addCustomProvider,
    removeCustomProvider,
    persist,
  };
}
