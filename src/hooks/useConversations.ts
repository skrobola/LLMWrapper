"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import type { ChatMessage, Conversation } from "@/lib/providers/types";
import {
  createConversationId,
  createMessageId,
  loadConversations,
  saveConversations,
} from "@/lib/storage/conversations";
import { conversationsExternalStore } from "@/lib/storage/external-store";
import { subscribeStorage } from "@/lib/storage/subscribe";
import {
  deleteConversationDoc,
  saveConversation,
  subscribeToConversations,
} from "@/lib/firebase/conversations";
import type { User } from "firebase/auth";

function sortConversations(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
}

function mergeWithStreaming(
  remote: Conversation[],
  local: Conversation[],
  streamingId: string | null,
): Conversation[] {
  if (!streamingId) return remote;
  const streamingLocal = local.find((c) => c.id === streamingId);
  if (!streamingLocal) return remote;
  return remote.map((c) => (c.id === streamingId ? streamingLocal : c));
}

interface UseConversationsOptions {
  firebaseUser: User | null;
  firebaseReady: boolean;
}

export function useConversations({
  firebaseUser,
  firebaseReady,
}: UseConversationsOptions) {
  const useCloud = Boolean(firebaseUser);
  const userId = firebaseUser?.uid;

  const localConversations = useSyncExternalStore(
    subscribeStorage,
    conversationsExternalStore.getSnapshot,
    conversationsExternalStore.getServerSnapshot,
  );

  const [cloudConversations, setCloudConversations] = useState<Conversation[]>(
    [],
  );
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const streamingIdRef = useRef<string | null>(null);
  const cloudConversationsRef = useRef<Conversation[]>([]);

  useEffect(() => {
    cloudConversationsRef.current = cloudConversations;
  }, [cloudConversations]);

  const applyCloudConversations = useCallback(
    (updater: (prev: Conversation[]) => Conversation[]) => {
      setCloudConversations((prev) => {
        const next = updater(prev);
        cloudConversationsRef.current = next;
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    if (!useCloud || !userId) {
      setCloudConversations([]);
      setCloudReady(true);
      setCloudError(null);
      return;
    }

    setCloudReady(false);
    const unsubscribe = subscribeToConversations(
      userId,
      (remote) => {
        setCloudConversations((prev) => {
          const next = mergeWithStreaming(
            remote,
            prev,
            streamingIdRef.current,
          );
          cloudConversationsRef.current = next;
          return next;
        });
        setCloudReady(true);
        setCloudError(null);
      },
      (error) => {
        setCloudError(error.message);
        setCloudReady(true);
      },
    );

    return unsubscribe;
  }, [useCloud, userId]);

  const conversations = useCloud ? cloudConversations : localConversations;
  const ready = useCloud ? cloudReady && firebaseReady : true;

  const [activeId, setActiveId] = useState<string | null>(null);
  const resolvedActiveId = activeId ?? conversations[0]?.id ?? null;
  const activeConversation =
    conversations.find((c) => c.id === resolvedActiveId) ?? null;

  const persistLocal = useCallback((next: Conversation[]) => {
    saveConversations(sortConversations(next));
  }, []);

  const persistCloud = useCallback(
    async (conversation: Conversation) => {
      if (!userId) return;
      await saveConversation(userId, conversation);
    },
    [userId],
  );

  const setStreamingConversationId = useCallback((id: string | null) => {
    streamingIdRef.current = id;
  }, []);

  const flushConversation = useCallback(
    async (conversationId: string) => {
      if (!useCloud || !userId) return;
      const conversation = cloudConversationsRef.current.find(
        (c) => c.id === conversationId,
      );
      if (conversation) {
        await persistCloud(conversation);
      }
      streamingIdRef.current = null;
    },
    [useCloud, userId, persistCloud],
  );

  const createConversation = useCallback(
    (providerId: string, model: string): Conversation => {
      const now = Date.now();
      const conversation: Conversation = {
        id: createConversationId(),
        providerId,
        model,
        title: "New chat",
        messages: [],
        createdAt: now,
        updatedAt: now,
      };

      if (useCloud) {
        applyCloudConversations((prev) =>
          sortConversations([conversation, ...prev]),
        );
        void persistCloud(conversation);
      } else {
        persistLocal([conversation, ...loadConversations()]);
      }

      setActiveId(conversation.id);
      return conversation;
    },
    [useCloud, applyCloudConversations, persistCloud, persistLocal],
  );

  const updateConversation = useCallback(
    (id: string, updater: (conv: Conversation) => Conversation) => {
      if (useCloud) {
        let updated!: Conversation;
        applyCloudConversations((prev) => {
          const next = prev.map((c) => {
            if (c.id !== id) return c;
            updated = updater(c);
            return updated;
          });
          return sortConversations(next);
        });
        if (updated && streamingIdRef.current !== id) {
          void persistCloud(updated);
        }
        return;
      }

      const current = loadConversations();
      const next = current.map((c) => (c.id === id ? updater(c) : c));
      persistLocal(next);
    },
    [useCloud, applyCloudConversations, persistCloud, persistLocal],
  );

  const deleteConversation = useCallback(
    (id: string) => {
      if (useCloud && userId) {
        applyCloudConversations((prev) => {
          const next = prev.filter((c) => c.id !== id);
          if (resolvedActiveId === id) {
            setActiveId(next[0]?.id ?? null);
          }
          return next;
        });
        void deleteConversationDoc(userId, id);
      } else {
        const next = loadConversations().filter((c) => c.id !== id);
        persistLocal(next);
        if (resolvedActiveId === id) {
          setActiveId(next[0]?.id ?? null);
        }
      }
    },
    [useCloud, userId, resolvedActiveId, persistLocal],
  );

  const appendMessage = useCallback(
    (conversationId: string, message: Omit<ChatMessage, "id" | "createdAt">) => {
      const msg: ChatMessage = {
        ...message,
        id: createMessageId(),
        createdAt: Date.now(),
      };

      if (useCloud) {
        let updated!: Conversation;
        applyCloudConversations((prev) => {
          const next = prev.map((c) => {
            if (c.id !== conversationId) return c;
            const title =
              c.title === "New chat" && message.role === "user"
                ? message.content.slice(0, 48) || "New chat"
                : c.title;
            updated = {
              ...c,
              title,
              messages: [...c.messages, msg],
              updatedAt: Date.now(),
            };
            return updated;
          });
          return sortConversations(next);
        });
        if (updated && message.role === "user") {
          void persistCloud(updated);
        }
        return msg;
      }

      updateConversation(conversationId, (conv) => {
        const title =
          conv.title === "New chat" && message.role === "user"
            ? message.content.slice(0, 48) || "New chat"
            : conv.title;
        return {
          ...conv,
          title,
          messages: [...conv.messages, msg],
          updatedAt: Date.now(),
        };
      });
      return msg;
    },
    [useCloud, applyCloudConversations, persistCloud, updateConversation],
  );

  const updateMessageContent = useCallback(
    (conversationId: string, messageId: string, content: string) => {
      if (useCloud) {
        applyCloudConversations((prev) =>
          sortConversations(
            prev.map((c) =>
              c.id === conversationId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === messageId ? { ...m, content } : m,
                    ),
                    updatedAt: Date.now(),
                  }
                : c,
            ),
          ),
        );
        return;
      }

      updateConversation(conversationId, (conv) => ({
        ...conv,
        messages: conv.messages.map((m) =>
          m.id === messageId ? { ...m, content } : m,
        ),
        updatedAt: Date.now(),
      }));
    },
    [useCloud, applyCloudConversations, updateConversation],
  );

  const getConversationById = useCallback(
    (id: string): Conversation | undefined => {
      if (useCloud) {
        return cloudConversationsRef.current.find((c) => c.id === id);
      }
      return loadConversations().find((c) => c.id === id);
    },
    [useCloud],
  );

  return {
    conversations,
    activeId: resolvedActiveId,
    activeConversation,
    ready,
    cloudError,
    useCloud,
    setActiveId,
    createConversation,
    updateConversation,
    deleteConversation,
    appendMessage,
    updateMessageContent,
    setStreamingConversationId,
    flushConversation,
    getConversationById,
  };
}
