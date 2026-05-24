import { getProvider } from "@/lib/providers/registry";
import type { ChatMessage, CustomProviderConfig } from "@/lib/providers/types";
import { createNormalizedSseStream } from "@/lib/utils/sse";

export const runtime = "nodejs";

interface ChatRequestBody {
  providerId: string;
  model: string;
  messages: ChatMessage[];
  customProviders?: CustomProviderConfig[];
}

export async function POST(request: Request) {
  const apiKey = request.headers.get("x-provider-api-key")?.trim();
  if (!apiKey) {
    return Response.json({ error: "Missing API key" }, { status: 400 });
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { providerId, model, messages, customProviders = [] } = body;

  if (!providerId || !model || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const provider = getProvider(providerId, customProviders);
  if (!provider) {
    return Response.json({ error: "Unknown provider" }, { status: 400 });
  }

  const customProvider = customProviders.find((p) => p.id === providerId);

  const stream = createNormalizedSseStream(
    provider.streamChat({
      apiKey,
      model,
      messages,
      signal: request.signal,
      customProvider,
    }),
  );

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
