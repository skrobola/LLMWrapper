"use client";

import { useState } from "react";
import type { CustomProviderConfig, ProviderFormat } from "@/lib/providers/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface AddProviderDialogProps {
  onAdd: (provider: CustomProviderConfig) => void;
}

export function AddProviderDialog({ onAdd }: AddProviderDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://api.openai.com/v1");
  const [defaultModel, setDefaultModel] = useState("");
  const [format, setFormat] = useState<ProviderFormat>("openai");
  const [authStyle, setAuthStyle] = useState<"bearer" | "x-api-key" | "query">(
    "bearer",
  );

  const reset = () => {
    setName("");
    setId("");
    setBaseUrl("https://api.openai.com/v1");
    setDefaultModel("");
    setFormat("openai");
    setAuthStyle("bearer");
  };

  const handleSubmit = () => {
    const slug =
      id.trim() ||
      name
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    if (!slug || !name.trim() || !defaultModel.trim() || !baseUrl.trim()) return;

    onAdd({
      id: `custom-${slug}`,
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      defaultModel: defaultModel.trim(),
      models: [{ id: defaultModel.trim(), label: defaultModel.trim() }],
      format,
      authStyle,
    });
    reset();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="sm" className="w-full gap-2">
            <Plus className="size-4" />
            Add provider
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add custom provider</DialogTitle>
          <DialogDescription>
            Register an OpenAI-compatible, Anthropic, or Gemini endpoint.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="provider-name">Display name</Label>
            <Input
              id="provider-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My LLM"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="provider-id">ID slug (optional)</Label>
            <Input
              id="provider-id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="my-llm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="base-url">Base URL</Label>
            <Input
              id="base-url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default-model">Default model</Label>
            <Input
              id="default-model"
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
              placeholder="model-id"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>API format</Label>
              <Select
                value={format}
                onValueChange={(v) => setFormat(v as ProviderFormat)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Auth style</Label>
              <Select
                value={authStyle}
                onValueChange={(v) =>
                  setAuthStyle(v as "bearer" | "x-api-key" | "query")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bearer">Bearer</SelectItem>
                  <SelectItem value="x-api-key">x-api-key</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit}>
            Save provider
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
