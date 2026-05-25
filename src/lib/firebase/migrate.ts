import type { Conversation } from "@/lib/providers/types";
import { loadConversations } from "@/lib/storage/conversations";
import { saveAllConversations } from "./conversations";

const migrationKey = (userId: string) => `llm-wrapper:firebase-migrated:${userId}`;

export async function migrateLocalConversationsToFirestore(
  userId: string,
): Promise<number> {
  if (typeof window === "undefined") return 0;
  if (localStorage.getItem(migrationKey(userId))) return 0;

  const local = loadConversations();
  if (local.length === 0) {
    localStorage.setItem(migrationKey(userId), "1");
    return 0;
  }

  await saveAllConversations(userId, local);
  localStorage.setItem(migrationKey(userId), "1");
  return local.length;
}

export function mergeConversations(
  remote: Conversation[],
  local: Conversation[],
): Conversation[] {
  const byId = new Map<string, Conversation>();
  for (const conv of remote) byId.set(conv.id, conv);
  for (const conv of local) {
    const existing = byId.get(conv.id);
    if (!existing || conv.updatedAt > existing.updatedAt) {
      byId.set(conv.id, conv);
    }
  }
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt);
}
