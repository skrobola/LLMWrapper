"use client";

import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/providers/types";
import { MessageBubble } from "./MessageBubble";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  return (
    <ScrollArea className="h-full flex-1">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6">
        {messages.map((message, index) => {
          const isLast = index === messages.length - 1;
          const streaming =
            isStreaming && isLast && message.role === "assistant";
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isStreaming={streaming}
            />
          );
        })}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
