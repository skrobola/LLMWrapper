import type { ChatMessage, StreamChunk, StreamContext } from "./types";
import { parseSseLines } from "@/lib/utils/sse";

interface OpenAiCompatOptions {
  baseUrl: string;
  authStyle?: "bearer" | "x-api-key";
}

function toOpenAiMessages(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "system")
    .map((m) => ({ role: m.role, content: m.content }));
}

export async function* streamOpenAiCompatible(
  ctx: StreamContext,
  options: OpenAiCompatOptions,
): AsyncGenerator<StreamChunk, void, unknown> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (options.authStyle === "x-api-key") {
    headers["x-api-key"] = ctx.apiKey;
  } else {
    headers.Authorization = `Bearer ${ctx.apiKey}`;
  }

  const url = `${options.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: ctx.model,
      messages: toOpenAiMessages(ctx.messages),
      stream: true,
    }),
    signal: ctx.signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(parseApiError(errText, response.status));
  }

  if (!response.body) {
    throw new Error("No response body from provider");
  }

  for await (const data of parseSseLines(response.body)) {
    if (data === "[DONE]") break;
    try {
      const parsed = JSON.parse(data) as {
        choices?: { delta?: { content?: string } }[];
        error?: { message?: string };
      };
      if (parsed.error?.message) {
        throw new Error(parsed.error.message);
      }
      const text = parsed.choices?.[0]?.delta?.content;
      if (text) yield { text };
    } catch (error) {
      if (error instanceof SyntaxError) continue;
      throw error;
    }
  }
}

function parseApiError(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string };
      message?: string;
    };
    return parsed.error?.message ?? parsed.message ?? `Request failed (${status})`;
  } catch {
    return body || `Request failed (${status})`;
  }
}
