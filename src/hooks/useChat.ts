"use client";

import { useCallback, useRef, useState } from "react";
import { streamChatRequest } from "@/lib/chat/stream-client";
import type {
  AppSettings,
  ChatMessage,
  Conversation,
} from "@/lib/providers/types";
import { getApiKey } from "@/lib/storage/keys";

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
  getConversationById: (id: string) => Conversation | undefined;
  setStreamingConversationId: (id: string | null) => void;
  flushConversation: (conversationId: string) => Promise<void>;
}

export function useChat({
  settings,
  activeConversation,
  createConversation,
  appendMessage,
  updateMessageContent,
  getConversationById,
  setStreamingConversationId,
  flushConversation,
}: UseChatOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    const conversationId = streamingConversationIdRef.current;
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setStreamingConversationId(null);
    if (conversationId) {
      void flushConversation(conversationId);
    }
  }, [flushConversation, setStreamingConversationId]);

  const streamingConversationIdRef = useRef<string | null>(null);

  const finishStream = useCallback(
    async (conversationId: string) => {
      setIsStreaming(false);
      abortRef.current = null;
      setStreamingConversationId(null);
      await flushConversation(conversationId);
    },
    [flushConversation, setStreamingConversationId],
  );

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

      const priorMessages = (
        getConversationById(conversation.id)?.messages ??
        conversation.messages ??
        []
      ).filter((m) => m.content.trim().length > 0);

      const userMessage = appendMessage(conversation.id, {
        role: "user",
        content: trimmed,
      });

      const assistantMessage = appendMessage(conversation.id, {
        role: "assistant",
        content: "",
      });

      const messagesForApi = [...priorMessages, userMessage];

      if (messagesForApi.length === 0) {
        setError("Could not prepare messages for the API. Please try again.");
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      streamingConversationIdRef.current = conversation.id;
      setStreamingConversationId(conversation.id);
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
          onError: async (message) => {
            setError(message);
            if (!accumulated) {
              updateMessageContent(
                conversation!.id,
                assistantMessage.id,
                `Error: ${message}`,
              );
            }
            await finishStream(conversation!.id);
          },
          onDone: async () => {
            await finishStream(conversation!.id);
          },
        },
        controller.signal,
      );
    },
    [
      activeConversation,
      appendMessage,
      createConversation,
      finishStream,
      getConversationById,
      isStreaming,
      setStreamingConversationId,
      settings.customProviders,
      updateMessageContent,
    ],
  );

  return { sendMessage, stop, isStreaming, error, setError };
}
