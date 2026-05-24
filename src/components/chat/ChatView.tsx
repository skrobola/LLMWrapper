"use client";

import { useState } from "react";
import { KeyRound, Sparkles } from "lucide-react";
import type { ProviderDefinition } from "@/lib/providers/types";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { Button } from "@/components/ui/button";

interface ChatViewProps {
  provider: ProviderDefinition | undefined;
  model: string;
  hasApiKey: boolean;
  messages: import("@/lib/providers/types").ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  onSend: (content: string) => void;
  onStop: () => void;
  onOpenSettings: () => void;
}

export function ChatView({
  provider,
  model,
  hasApiKey,
  messages,
  isStreaming,
  error,
  onSend,
  onStop,
  onOpenSettings,
}: ChatViewProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
  };

  const providerName = provider?.name ?? "AI";
  const modelLabel =
    provider?.models.find((m) => m.id === model)?.label ?? model;

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h2 className="text-sm font-medium">{providerName}</h2>
          <p className="text-xs text-muted-foreground">{modelLabel}</p>
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        {!hasApiKey ? (
          <EmptyState
            title="API key required"
            description={`Add your ${providerName} API key in Settings to start chatting. Keys are stored in your browser and sent only with each request.`}
            actionLabel="Open Settings"
            onAction={onOpenSettings}
            icon={KeyRound}
          />
        ) : messages.length === 0 ? (
          <EmptyState
            title={`Chat with ${providerName}`}
            description="Ask anything. Your conversation is saved locally in this browser."
            icon={Sparkles}
          />
        ) : (
          <MessageList messages={messages} isStreaming={isStreaming} />
        )}
      </div>

      {error && (
        <div className="mx-auto max-w-3xl px-4 pb-2">
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        </div>
      )}

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        onStop={onStop}
        isStreaming={isStreaming}
        disabled={!hasApiKey}
        placeholder={
          hasApiKey ? `Message ${providerName}...` : "Add an API key to chat"
        }
      />
    </div>
  );
}

function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-5 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {actionLabel && onAction && (
        <Button className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
