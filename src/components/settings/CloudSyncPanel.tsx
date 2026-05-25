"use client";

import { Cloud, CloudOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "firebase/auth";

interface CloudSyncPanelProps {
  configured: boolean;
  loading: boolean;
  user: User | null;
  error: string | null;
  useCloud: boolean;
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export function CloudSyncPanel({
  configured,
  loading,
  user,
  error,
  useCloud,
  onSignIn,
  onSignOut,
}: CloudSyncPanelProps) {
  if (!configured) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        <div className="mb-1 flex items-center gap-2 font-medium text-foreground">
          <CloudOff className="size-4" />
          Cloud sync not configured
        </div>
        <p className="text-xs">
          Add Firebase environment variables to enable chat history across
          devices. See README for setup steps.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex items-center gap-2">
        <Cloud className="size-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Cloud chat history</p>
          <p className="text-xs text-muted-foreground">
            Sign in to sync conversations with Firebase Firestore.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Checking account...
        </div>
      ) : useCloud && user ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Signed in as{" "}
            <span className="font-medium text-foreground">
              {user.email ?? user.displayName ?? "Google account"}
            </span>
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            Chats are syncing to the cloud.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void onSignOut()}
          >
            Sign out of cloud sync
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          size="sm"
          className="w-full"
          onClick={() => void onSignIn()}
        >
          Sign in with Google
        </Button>
      )}

      {error && (
        <div className="space-y-1 text-xs text-destructive" role="alert">
          <p>{error}</p>
          {/permission/i.test(error) && (
            <p className="text-muted-foreground">
              In Firebase Console → Firestore → Rules, set the allowed email to
              match <span className="font-medium text-foreground">{user?.email}</span>{" "}
              and click Publish.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
