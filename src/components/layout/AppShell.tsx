"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { resolveProviders } from "@/lib/providers/registry";
import { useConversations } from "@/hooks/useConversations";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useProviderKeys } from "@/hooks/useProviderKeys";
import { useSettings } from "@/hooks/useSettings";
import { useChat } from "@/hooks/useChat";
import { Sidebar } from "./Sidebar";
import { ChatView } from "@/components/chat/ChatView";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export function AppShell() {
  const {
    settings,
    setLastProvider,
    setTheme: persistTheme,
    addCustomProvider,
    removeCustomProvider,
    setCustomInstructions,
  } = useSettings();
  const { keys, updateKey, hasKey } = useProviderKeys();
  const {
    user: firebaseUser,
    loading: firebaseLoading,
    error: firebaseError,
    configured: firebaseConfigured,
    signInWithGoogle,
    signOut: signOutFirebase,
    isSignedIn: useCloud,
  } = useFirebaseAuth();

  const {
    conversations,
    activeId,
    activeConversation,
    ready: conversationsReady,
    cloudError,
    setActiveId,
    createConversation,
    deleteConversation,
    appendMessage,
    updateMessageContent,
    setStreamingConversationId,
    flushConversation,
    getConversationById,
  } = useConversations({
    firebaseUser,
    firebaseReady: !firebaseLoading,
  });

  const providers = useMemo(
    () => resolveProviders(settings.customProviders),
    [settings.customProviders],
  );

  const { setTheme: applyTheme } = useTheme();

  const [providerId, setProviderId] = useState(settings.lastProviderId);
  const [model, setModel] = useState(settings.lastModelId);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const activeProvider =
    providers.find((p) => p.id === providerId) ?? providers[0];
  const effectiveProviderId = activeProvider?.id ?? providerId;
  const effectiveModel =
    activeProvider?.models.some((m) => m.id === model)
      ? model
      : (activeProvider?.defaultModel ?? model);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme, applyTheme]);

  useEffect(() => {
    if (cloudError) toast.error(cloudError);
  }, [cloudError]);

  useEffect(() => {
    if (firebaseError) toast.error(firebaseError);
  }, [firebaseError]);

  const { sendMessage, stop, isStreaming, error, setError } = useChat({
    settings,
    activeConversation,
    createConversation,
    appendMessage,
    updateMessageContent,
    getConversationById,
    setStreamingConversationId,
    flushConversation,
  });

  useEffect(() => {
    if (error) toast.error(error);
  }, [error]);

  const handleProviderChange = useCallback(
    (id: string, nextModel: string) => {
      setProviderId(id);
      setModel(nextModel);
      setLastProvider(id, nextModel);
      setError(null);
    },
    [setLastProvider, setError],
  );

  const handleModelChange = useCallback(
    (nextModel: string) => {
      setModel(nextModel);
      setLastProvider(effectiveProviderId, nextModel);
    },
    [effectiveProviderId, setLastProvider],
  );

  const handleNewChat = useCallback(() => {
    const conv = createConversation(effectiveProviderId, effectiveModel);
    setActiveId(conv.id);
    setError(null);
  }, [
    createConversation,
    effectiveProviderId,
    effectiveModel,
    setActiveId,
    setError,
  ]);

  const handleFirebaseSignIn = useCallback(async () => {
    try {
      await signInWithGoogle();
      toast.success("Signed in — chats will sync to the cloud");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not sign in with Google",
      );
    }
  }, [signInWithGoogle]);

  const handleFirebaseSignOut = useCallback(async () => {
    await signOutFirebase();
    toast.message("Cloud sync off — chats saved on this device only");
  }, [signOutFirebase]);

  if (!conversationsReady) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-muted-foreground">
        Loading conversations...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        providers={providers}
        selectedProviderId={effectiveProviderId}
        selectedModel={effectiveModel}
        conversations={conversations}
        activeConversationId={activeId}
        keys={keys}
        customProviders={settings.customProviders}
        useCloud={useCloud}
        onProviderChange={handleProviderChange}
        onModelChange={handleModelChange}
        onNewChat={handleNewChat}
        onSelectConversation={(id) => {
          const conv = conversations.find((c) => c.id === id);
          setActiveId(id);
          if (conv) {
            setProviderId(conv.providerId);
            setModel(conv.model);
            setLastProvider(conv.providerId, conv.model);
          }
        }}
        onDeleteConversation={deleteConversation}
        onSaveKey={updateKey}
        onAddProvider={addCustomProvider}
        onRemoveProvider={removeCustomProvider}
        customInstructions={settings.customInstructions}
        onSaveCustomInstructions={setCustomInstructions}
        firebaseConfigured={firebaseConfigured}
        firebaseLoading={firebaseLoading}
        firebaseUser={firebaseUser}
        firebaseError={firebaseError}
        onFirebaseSignIn={handleFirebaseSignIn}
        onFirebaseSignOut={handleFirebaseSignOut}
        settingsOpen={settingsOpen}
        onSettingsOpenChange={setSettingsOpen}
        onThemeChange={persistTheme}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        <ChatView
          provider={activeProvider}
          model={effectiveModel}
          hasApiKey={hasKey(effectiveProviderId)}
          messages={activeConversation?.messages ?? []}
          isStreaming={isStreaming}
          error={error}
          onSend={(content) => {
            void sendMessage(content, effectiveProviderId, effectiveModel);
          }}
          onStop={stop}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </main>
      <Toaster position="top-center" />
    </div>
  );
}
