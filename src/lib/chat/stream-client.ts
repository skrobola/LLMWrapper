export interface StreamCallbacks {
  onToken: (text: string) => void;
  onError: (message: string) => void;
  onDone: () => void;
}

export async function streamChatRequest(
  payload: {
    providerId: string;
    model: string;
    messages: { id: string; role: string; content: string; createdAt: number }[];
    customProviders?: unknown[];
  },
  apiKey: string,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-provider-api-key": apiKey,
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // ignore
    }
    callbacks.onError(message);
    return;
  }

  if (!response.body) {
    callbacks.onError("No response stream");
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        const line = part
          .split("\n")
          .find((l) => l.startsWith("data:"))
          ?.slice(5)
          .trim();
        if (!line) continue;
        if (line === "[DONE]") {
          callbacks.onDone();
          return;
        }
        try {
          const data = JSON.parse(line) as { text?: string; error?: string };
          if (data.error) {
            callbacks.onError(data.error);
            return;
          }
          if (data.text) callbacks.onToken(data.text);
        } catch {
          // skip malformed chunks
        }
      }
    }
    if (buffer.trim()) {
      const line = buffer
        .split("\n")
        .find((l) => l.startsWith("data:"))
        ?.slice(5)
        .trim();
      if (line && line !== "[DONE]") {
        try {
          const data = JSON.parse(line) as { text?: string; error?: string };
          if (data.error) {
            callbacks.onError(data.error);
            return;
          }
          if (data.text) callbacks.onToken(data.text);
        } catch {
          // ignore trailing partial chunk
        }
      }
    }
    callbacks.onDone();
  } catch (error) {
    if (signal?.aborted) return;
    callbacks.onError(
      error instanceof Error ? error.message : "Stream interrupted",
    );
  }
}
