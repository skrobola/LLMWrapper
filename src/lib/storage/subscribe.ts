type Listener = () => void;

const listeners = new Set<Listener>();

export function subscribeStorage(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

import { invalidateExternalStores } from "./external-store";

export function notifyStorage(): void {
  invalidateExternalStores();
  listeners.forEach((listener) => listener());
}
