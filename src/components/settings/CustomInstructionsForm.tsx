"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CustomInstructionsFormProps {
  value: string;
  onSave: (value: string) => void;
}

export function CustomInstructionsForm({
  value,
  onSave,
}: CustomInstructionsFormProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label htmlFor="custom-instructions">Custom instructions</Label>
        <p className="text-xs text-muted-foreground">
          Tell the model about yourself, your preferences, and how you want
          replies formatted. This is sent with every message (like ChatGPT
          custom instructions).
        </p>
      </div>
      <Textarea
        id="custom-instructions"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onSave(draft)}
        placeholder="e.g. I'm a software engineer. Prefer concise answers with code examples when relevant."
        rows={5}
        className="resize-y min-h-[120px]"
      />
    </div>
  );
}
