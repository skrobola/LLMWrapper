import type { ChatMessage } from "@/lib/providers/types";

const SYSTEM_MESSAGE_ID = "custom-instructions";

/** Prepend custom instructions as a system message (not shown in chat UI). */
export function applyCustomInstructions(
  messages: ChatMessage[],
  instructions: string | undefined,
): ChatMessage[] {
  const trimmed = instructions?.trim();
  if (!trimmed) return messages;

  const withoutPrior = messages.filter((m) => m.id !== SYSTEM_MESSAGE_ID);
  const systemMessage: ChatMessage = {
    id: SYSTEM_MESSAGE_ID,
    role: "system",
    content: trimmed,
    createdAt: 0,
  };

  return [systemMessage, ...withoutPrior];
}
