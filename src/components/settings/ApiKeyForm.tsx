"use client";

import { useState } from "react";
import type { ProviderDefinition } from "@/lib/providers/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyFormProps {
  providers: ProviderDefinition[];
  keys: Record<string, string>;
  onSave: (providerId: string, value: string) => void;
}

export function ApiKeyForm({ providers, keys, onSave }: ApiKeyFormProps) {
  return (
    <div className="space-y-5">
      {providers.map((provider) => (
        <ApiKeyField
          key={`${provider.id}-${keys[provider.id] ?? ""}`}
          provider={provider}
          initialValue={keys[provider.id] ?? ""}
          onSave={onSave}
        />
      ))}
    </div>
  );
}

function ApiKeyField({
  provider,
  initialValue,
  onSave,
}: {
  provider: ProviderDefinition;
  initialValue: string;
  onSave: (providerId: string, value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  return (
    <div className="space-y-2">
      <Label htmlFor={`key-${provider.id}`}>{provider.name}</Label>
      <Input
        id={`key-${provider.id}`}
        type="password"
        placeholder={`Paste ${provider.name} API key`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => onSave(provider.id, value)}
        autoComplete="off"
      />
    </div>
  );
}
