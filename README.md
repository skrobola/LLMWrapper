# LLM Wrapper

A minimalist universal AI chat web app built with Next.js, TypeScript, and Tailwind CSS. Switch between Grok, Claude, GPT 5.5, and Gemini from a single interface.

## Features

- Sidebar to pick provider and model
- Streaming chat with markdown, syntax highlighting, and copy buttons
- Conversation history stored in your browser (`localStorage`)
- API keys stored locally and sent only with each chat request (proxied through Next.js API routes to avoid CORS)
- Add custom providers (OpenAI-compatible, Anthropic, or Gemini format)

## Getting started

```bash
npm install
cp .env.example .env.local
# Edit .env.local: set SITE_PASSWORD and AUTH_SECRET
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in with your site password, then open **Settings** and paste API keys for the providers you use.

## Password protection

The app requires a shared site password before anyone can use the chat UI or call `/api/chat`. Configure these environment variables:

| Variable | Description |
|----------|-------------|
| `SITE_PASSWORD` | Password users enter on the login page |
| `AUTH_SECRET` | Random string (16+ chars) used to sign session cookies |

**Vercel:** Project → Settings → Environment Variables → add both for Production, then redeploy.

Without these variables, visitors are redirected to `/login` and API requests return `401` / `503`.

## API keys

| Provider | Where to get a key |
|----------|-------------------|
| Grok (xAI) | [console.x.ai](https://console.x.ai) |
| Claude | [console.anthropic.com](https://console.anthropic.com) |
| GPT 5.5 | [platform.openai.com](https://platform.openai.com) |
| Gemini | [aistudio.google.com](https://aistudio.google.com) |

Keys are saved under `llm-wrapper:keys:v1` in localStorage. They are not written to the server filesystem.

## Adding a built-in provider

1. Create an adapter in `src/lib/providers/` implementing `ProviderDefinition`.
2. Register it in `src/lib/providers/registry.ts`.

Example:

```ts
// src/lib/providers/my-provider.ts
import type { ProviderDefinition } from "./types";
import { streamOpenAiCompatible } from "./openai-compat";

export const myProvider: ProviderDefinition = {
  id: "my-provider",
  name: "My Provider",
  defaultModel: "my-model",
  builtIn: true,
  models: [{ id: "my-model", label: "My Model" }],
  streamChat: (ctx) =>
    streamOpenAiCompatible(ctx, {
      baseUrl: "https://api.example.com/v1",
      authStyle: "bearer",
    }),
};
```

## Adding a provider without code

Use **Settings → Add provider** and choose the API format (OpenAI, Anthropic, or Gemini). Custom providers are stored in settings and merged into the provider list at runtime.

## Project structure

```
src/
  app/api/chat/route.ts    # Streaming proxy
  lib/providers/           # Provider adapters
  lib/storage/             # localStorage helpers
  components/              # UI
  hooks/                   # Chat and persistence hooks
```

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint

## Security note

localStorage is convenient but not hardened against XSS. Do not treat browser storage as a secrets vault. For production deployments with untrusted scripts, prefer a server-side key store.
