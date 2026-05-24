"use client";

import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { CustomProviderConfig, ProviderDefinition } from "@/lib/providers/types";
import { ApiKeyForm } from "./ApiKeyForm";
import { AddProviderDialog } from "./AddProviderDialog";
import { Separator } from "@/components/ui/separator";

interface SettingsDialogProps {
  providers: ProviderDefinition[];
  keys: Record<string, string>;
  customProviders: CustomProviderConfig[];
  onSaveKey: (providerId: string, value: string) => void;
  onAddProvider: (provider: CustomProviderConfig) => void;
  onRemoveProvider: (id: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
}

export function SettingsDialog({
  providers,
  keys,
  customProviders,
  onSaveKey,
  onAddProvider,
  onRemoveProvider,
  open,
  onOpenChange,
  showTrigger = true,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger && (
        <DialogTrigger
          render={
            <Button type="button" variant="ghost" size="sm" className="w-full justify-start gap-2">
              <Settings className="size-4" />
              Settings
            </Button>
          }
        />
      )}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            API keys are stored in your browser&apos;s local storage. They are
            sent to your Next.js server only with each chat request and are not
            persisted on the server.
          </DialogDescription>
        </DialogHeader>

        <ApiKeyForm providers={providers} keys={keys} onSave={onSaveKey} />

        <Separator className="my-4" />

        <div className="space-y-3">
          <h4 className="text-sm font-medium">Custom providers</h4>
          {customProviders.length > 0 && (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {customProviders.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2"
                >
                  <span>{p.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemoveProvider(p.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <AddProviderDialog onAdd={onAddProvider} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
