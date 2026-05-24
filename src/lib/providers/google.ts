import type { ChatMessage, StreamChunk, StreamContext } from "./types";
import { parseSseLines } from "@/lib/utils/sse";

function toGeminiContents(messages: ChatMessage[]) {
  return messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
}

function extractSystemInstruction(messages: ChatMessage[]) {
  const system = messages.find((m) => m.role === "system");
  return system ? { parts: [{ text: system.content }] } : undefined;
}

export async function* streamGemini(
  ctx: StreamContext,
): AsyncGenerator<StreamChunk, void, unknown> {
  const model = ctx.model;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(ctx.apiKey)}`;

  const systemInstruction = extractSystemInstruction(ctx.messages);
  const body: Record<string, unknown> = {
    contents: toGeminiContents(ctx.messages),
  };
  if (systemInstruction) body.systemInstruction = systemInstruction;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: ctx.signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(parseGeminiError(errText, response.status));
  }

  if (!response.body) {
    throw new Error("No response body from Gemini");
  }

  for await (const data of parseSseLines(response.body)) {
    if (data === "[DONE]") break;
    try {
      const parsed = JSON.parse(data) as {
        candidates?: {
          content?: { parts?: { text?: string }[] };
        }[];
        error?: { message?: string };
      };
      if (parsed.error?.message) throw new Error(parsed.error.message);
      const parts = parsed.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.text) yield { text: part.text };
      }
    } catch (error) {
      if (error instanceof SyntaxError) continue;
      throw error;
    }
  }
}

function parseGeminiError(body: string, status: number): string {
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    return parsed.error?.message ?? `Request failed (${status})`;
  } catch {
    return body || `Request failed (${status})`;
  }
}
