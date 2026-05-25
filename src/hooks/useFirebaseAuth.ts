"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "@/lib/firebase/config";
import { migrateLocalConversationsToFirestore } from "@/lib/firebase/migrate";

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured());
  const [error, setError] = useState<string | null>(null);
  const configured = isFirebaseConfigured();

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setError(null);
      if (nextUser) {
        try {
          await migrateLocalConversationsToFirestore(nextUser.uid);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "Failed to sync local chats",
          );
        }
      }
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, [configured]);

  const signInWithGoogle = useCallback(async () => {
    if (!configured) {
      throw new Error("Firebase is not configured");
    }
    setError(null);
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, [configured]);

  const signOut = useCallback(async () => {
    if (!configured) return;
    setError(null);
    await firebaseSignOut(getFirebaseAuth());
  }, [configured]);

  return {
    user,
    loading,
    error,
    configured,
    signInWithGoogle,
    signOut,
    isSignedIn: Boolean(user),
  };
}
