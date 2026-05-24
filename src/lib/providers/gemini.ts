import type { ProviderDefinition } from "./types";
import { streamGemini } from "./google";

export const geminiProvider: ProviderDefinition = {
  id: "google",
  name: "Gemini",
  defaultModel: "gemini-2.5-pro",
  builtIn: true,
  models: [
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  ],
  streamChat: streamGemini,
};
