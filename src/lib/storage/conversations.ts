import type { Conversation } from "@/lib/providers/types";
import { readJson, writeJson } from "./client";
import { STORAGE_KEYS } from "./constants";
import { notifyStorage } from "./subscribe";

export function loadConversations(): Conversation[] {
  return readJson<Conversation[]>(STORAGE_KEYS.conversations, []);
}

export function saveConversations(conversations: Conversation[]): void {
  writeJson(STORAGE_KEYS.conversations, conversations);
  notifyStorage();
}

export function createConversationId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createMessageId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
