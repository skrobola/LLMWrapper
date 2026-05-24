"use client";

import { useCallback, useRef, useState } from "react";
import { streamChatRequest } from "@/lib/chat/stream-client";
import type {
  AppSettings,
  ChatMessage,
  Conversation,
} from "@/lib/providers/types";
import { getApiKey } from "@/lib/storage/keys";
import { loadConversations } from "@/lib/storage/conversations";

interface UseChatOptions {
  settings: AppSettings;
  activeConversation: Conversation | null;
  createConversation: (providerId: string, model: string) => Conversation;
  appendMessage: (
    conversationId: string,
    message: { role: "user" | "assistant"; content: string },
  ) => ChatMessage;
  updateMessageContent: (
    conversationId: string,
    messageId: string,
    content: string,
  ) => void;
}

export function useChat({
  settings,
  activeConversation,
  createConversation,
  appendMessage,
  updateMessageContent,
}: UseChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
  }, []);

  const sendMessage = useCallback(
    async (content: string, providerId: string, model: string) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) return;

      const apiKey = getApiKey(providerId);
      if (!apiKey) {
        setError("Add an API key for this provider in Settings.");
        return;
      }

      setError(null);

      let conversation = activeConversation;
      if (
        !conversation ||
        conversation.providerId !== providerId ||
        conversation.model !== model
      ) {
        conversation = createConversation(providerId, model);
      }

      const userMessage = appendMessage(conversation.id, {
        role: "user",
        content: trimmed,
      });

      const assistantMessage = appendMessage(conversation.id, {
        role: "assistant",
        content: "",
      });

      const freshConversation = loadConversations().find(
        (c) => c.id === conversation.id,
      );
      const messagesForApi = (
        freshConversation?.messages ?? [userMessage]
      ).filter(
        (m) =>
          m.id !== assistantMessage.id &&
          m.content.trim().length > 0,
      );

      const controller = new AbortController();
      abortRef.current = controller;
      setIsStreaming(true);

      let accumulated = "";

      await streamChatRequest(
        {
          providerId,
          model,
          messages: messagesForApi,
          customProviders: settings.customProviders,
        },
        apiKey,
        {
          onToken: (text) => {
            accumulated += text;
            updateMessageContent(
              conversation!.id,
              assistantMessage.id,
              accumulated,
            );
          },
          onError: (message) => {
            setError(message);
            if (!accumulated) {
              updateMessageContent(
                conversation!.id,
                assistantMessage.id,
                `Error: ${message}`,
              );
            }
            setIsStreaming(false);
          },
          onDone: () => {
            setIsStreaming(false);
            abortRef.current = null;
          },
        },
        controller.signal,
      );
    },
    [
      activeConversation,
      appendMessage,
      createConversation,
      isStreaming,
      settings.customProviders,
      updateMessageContent,
    ],
  );

  return { sendMessage, stop, isStreaming, error, setError };
}
