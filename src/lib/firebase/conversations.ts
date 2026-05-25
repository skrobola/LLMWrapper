import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  writeBatch,
  type Unsubscribe,
} from "firebase/firestore";
import type { Conversation } from "@/lib/providers/types";
import { getFirestoreDb, isFirebaseConfigured } from "./config";

function conversationsRef(userId: string) {
  return collection(getFirestoreDb(), "users", userId, "conversations");
}

function conversationDoc(userId: string, conversationId: string) {
  return doc(getFirestoreDb(), "users", userId, "conversations", conversationId);
}

export function subscribeToConversations(
  userId: string,
  onUpdate: (conversations: Conversation[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(conversationsRef(userId), orderBy("updatedAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      const conversations = snapshot.docs.map(
        (d) => d.data() as Conversation,
      );
      onUpdate(conversations);
    },
    (error) => onError?.(error),
  );
}

export async function saveConversation(
  userId: string,
  conversation: Conversation,
): Promise<void> {
  await setDoc(conversationDoc(userId, conversation.id), conversation);
}

export async function deleteConversationDoc(
  userId: string,
  conversationId: string,
): Promise<void> {
  await deleteDoc(conversationDoc(userId, conversationId));
}

export async function saveAllConversations(
  userId: string,
  conversations: Conversation[],
): Promise<void> {
  const batch = writeBatch(getFirestoreDb());
  for (const conversation of conversations) {
    batch.set(conversationDoc(userId, conversation.id), conversation);
  }
  await batch.commit();
}

export function canUseFirestore(): boolean {
  return isFirebaseConfigured();
}
