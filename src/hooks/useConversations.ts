"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import type { ChatMessage, Conversation } from "@/lib/providers/types";
import {
  createConversationId,
  createMessageId,
  loadConversations,
  saveConversations,
} from "@/lib/storage/conversations";
import { conversationsExternalStore } from "@/lib/storage/external-store";
import { subscribeStorage } from "@/lib/storage/subscribe";

export function useConversations() {
  const conversations = useSyncExternalStore(
    subscribeStorage,
    conversationsExternalStore.getSnapshot,
    conversationsExternalStore.getServerSnapshot,
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const resolvedActiveId = activeId ?? conversations[0]?.id ?? null;
  const activeConversation =
    conversations.find((c) => c.id === resolvedActiveId) ?? null;

  const persist = useCallback((next: Conversation[]) => {
    const sorted = [...next].sort((a, b) => b.updatedAt - a.updatedAt);
    saveConversations(sorted);
  }, []);

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
      persist([conversation, ...loadConversations()]);
      setActiveId(conversation.id);
      return conversation;
    },
    [persist],
  );

  const updateConversation = useCallback(
    (id: string, updater: (conv: Conversation) => Conversation) => {
      const current = loadConversations();
      const next = current.map((c) => (c.id === id ? updater(c) : c));
      persist(next);
    },
    [persist],
  );

  const deleteConversation = useCallback(
    (id: string) => {
      const next = loadConversations().filter((c) => c.id !== id);
      persist(next);
      if (resolvedActiveId === id) {
        setActiveId(next[0]?.id ?? null);
      }
    },
    [persist, resolvedActiveId],
  );

  const appendMessage = useCallback(
    (conversationId: string, message: Omit<ChatMessage, "id" | "createdAt">) => {
      const msg: ChatMessage = {
        ...message,
        id: createMessageId(),
        createdAt: Date.now(),
      };
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
    [updateConversation],
  );

  const updateMessageContent = useCallback(
    (conversationId: string, messageId: string, content: string) => {
      updateConversation(conversationId, (conv) => ({
        ...conv,
        messages: conv.messages.map((m) =>
          m.id === messageId ? { ...m, content } : m,
        ),
        updatedAt: Date.now(),
      }));
    },
    [updateConversation],
  );

  return {
    conversations,
    activeId: resolvedActiveId,
    activeConversation,
    setActiveId,
    createConversation,
    updateConversation,
    deleteConversation,
    appendMessage,
    updateMessageContent,
  };
}
