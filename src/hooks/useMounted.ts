"use client";

import { useEffect, useState } from "react";

/** Avoid hydration mismatches for browser-only values (theme, relative dates). */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
