"use client";

import { useMounted } from "@/hooks/useMounted";
import {
  LogOut,
  MessageSquarePlus,
  Moon,
  Sun,
  Trash2,
  Monitor,
} from "lucide-react";
import { useTheme } from "next-themes";
import type { Conversation, ProviderDefinition } from "@/lib/providers/types";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import type { CustomProviderConfig } from "@/lib/providers/types";
import { cn } from "@/lib/utils";

interface SidebarProps {
  providers: ProviderDefinition[];
  selectedProviderId: string;
  selectedModel: string;
  conversations: Conversation[];
  activeConversationId: string | null;
  keys: Record<string, string>;
  customProviders: CustomProviderConfig[];
  onProviderChange: (providerId: string, model: string) => void;
  onModelChange: (model: string) => void;
  onNewChat: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onSaveKey: (providerId: string, value: string) => void;
  onAddProvider: (provider: CustomProviderConfig) => void;
  onRemoveProvider: (id: string) => void;
  customInstructions: string;
  onSaveCustomInstructions: (value: string) => void;
  settingsOpen?: boolean;
  onSettingsOpenChange?: (open: boolean) => void;
  onThemeChange?: (theme: "light" | "dark" | "system") => void;
}

export function Sidebar({
  providers,
  selectedProviderId,
  selectedModel,
  conversations,
  activeConversationId,
  keys,
  customProviders,
  onProviderChange,
  onModelChange,
  onNewChat,
  onSelectConversation,
  onDeleteConversation,
  onSaveKey,
  onAddProvider,
  onRemoveProvider,
  customInstructions,
  onSaveCustomInstructions,
  settingsOpen,
  onSettingsOpenChange,
  onThemeChange,
}: SidebarProps) {
  const { theme, setTheme } = useTheme();
  const activeProvider = providers.find((p) => p.id === selectedProviderId);

  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground">
      <div className="border-b border-sidebar-border px-4 py-4">
        <h1 className="text-base font-semibold tracking-tight">LLM Wrapper</h1>
        <p className="text-xs text-muted-foreground">Universal AI chat</p>
      </div>

      <div className="space-y-3 border-b border-sidebar-border p-3">
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Provider
          </label>
          <Select
            value={selectedProviderId}
            onValueChange={(id) => {
              if (!id) return;
              const provider = providers.find((p) => p.id === id);
              if (provider) onProviderChange(id, provider.defaultModel);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Model
          </label>
          <Select
            value={selectedModel}
            onValueChange={(id) => id && onModelChange(id)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {activeProvider?.models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full gap-2"
          onClick={onNewChat}
        >
          <MessageSquarePlus className="size-4" />
          New chat
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 p-2">
          {conversations.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              No conversations yet
            </p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={cn(
                  "group flex items-center gap-1 rounded-lg",
                  activeConversationId === conv.id && "bg-sidebar-accent",
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm"
                  onClick={() => onSelectConversation(conv.id)}
                >
                  <span className="block truncate">{conv.title}</span>
                  <RelativeTime timestamp={conv.updatedAt} />
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mr-1 size-7 shrink-0 opacity-0 group-hover:opacity-100"
                  onClick={() => onDeleteConversation(conv.id)}
                  aria-label="Delete conversation"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="space-y-1 border-t border-sidebar-border p-2">
        <SettingsDialog
          providers={providers}
          keys={keys}
          customProviders={customProviders}
          onSaveKey={onSaveKey}
          onAddProvider={onAddProvider}
          onRemoveProvider={onRemoveProvider}
          customInstructions={customInstructions}
          onSaveCustomInstructions={onSaveCustomInstructions}
          open={settingsOpen}
          onOpenChange={onSettingsOpenChange}
        />
        <ThemeToggle
          theme={theme}
          setTheme={(next) => {
            setTheme(next);
            onThemeChange?.(next as "light" | "dark" | "system");
          }}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={async () => {
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}

function ThemeToggle({
  theme,
  setTheme,
}: {
  theme?: string;
  setTheme: (theme: string) => void;
}) {
  const mounted = useMounted();

  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  if (!mounted) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-2"
        disabled
        aria-hidden
      >
        <Monitor className="size-4" />
        Theme
      </Button>
    );
  }

  const Icon =
    theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;
  const label =
    theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="w-full justify-start gap-2"
      onClick={cycle}
    >
      <Icon className="size-4" />
      Theme: {label}
    </Button>
  );
}

function RelativeTime({ timestamp }: { timestamp: number }) {
  const mounted = useMounted();
  if (!mounted) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <span className="text-xs text-muted-foreground">
      {formatRelativeTime(timestamp)}
    </span>
  );
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
