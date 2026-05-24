export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
}

export type ProviderId = string;

export type ProviderFormat = "openai" | "anthropic" | "gemini";

export interface ModelOption {
  id: string;
  label: string;
}

export interface CustomProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  defaultModel: string;
  models: ModelOption[];
  format: ProviderFormat;
  authStyle: "bearer" | "x-api-key" | "query";
}

export interface StreamContext {
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  signal?: AbortSignal;
  customProvider?: CustomProviderConfig;
}

export interface StreamChunk {
  text: string;
}

export interface ProviderDefinition {
  id: ProviderId;
  name: string;
  defaultModel: string;
  models: ModelOption[];
  builtIn: boolean;
  streamChat: (ctx: StreamContext) => AsyncGenerator<StreamChunk, void, unknown>;
}

export interface Conversation {
  id: string;
  providerId: ProviderId;
  model: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  lastProviderId: ProviderId;
  lastModelId: string;
  customProviders: CustomProviderConfig[];
}
