import type { ChatMessage, StreamChunk, StreamContext } from "./types";
import { parseSseLines } from "@/lib/utils/sse";

function toAnthropicMessages(messages: ChatMessage[]) {
  return messages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        m.content.trim().length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content }));
}

function extractSystem(messages: ChatMessage[]): string | undefined {
  const system = messages.find((m) => m.role === "system");
  return system?.content;
}

export async function* streamAnthropic(
  ctx: StreamContext,
): AsyncGenerator<StreamChunk, void, unknown> {
  const messages = toAnthropicMessages(ctx.messages);
  if (messages.length === 0) {
    throw new Error("No messages to send");
  }

  const system = extractSystem(ctx.messages);
  const body: Record<string, unknown> = {
    model: ctx.model,
    max_tokens: 8192,
    messages,
    stream: true,
  };
  if (system) body.system = system;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ctx.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
    signal: ctx.signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(parseAnthropicError(errText, response.status));
  }

  if (!response.body) {
    throw new Error("No response body from Anthropic");
  }

  let receivedText = false;

  for await (const data of parseSseLines(response.body)) {
    if (data === "[DONE]") break;
    try {
      const event = JSON.parse(data) as {
        type?: string;
        delta?: { type?: string; text?: string; stop_reason?: string };
        error?: { type?: string; message?: string };
        message?: { content?: unknown };
      };

      if (event.type === "error" || event.error?.message) {
        throw new Error(event.error?.message ?? "Anthropic stream error");
      }

      if (event.type === "content_block_delta") {
        const text = event.delta?.text;
        if (text) {
          receivedText = true;
          yield { text };
        }
      }
    } catch (error) {
      if (error instanceof SyntaxError) continue;
      throw error;
    }
  }

  if (!receivedText) {
    throw new Error(
      "Anthropic returned an empty response. Check your model name and API key.",
    );
  }
}

function parseAnthropicError(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    return parsed.error?.message ?? `Request failed (${status})`;
  } catch {
    return body || `Request failed (${status})`;
  }
}
