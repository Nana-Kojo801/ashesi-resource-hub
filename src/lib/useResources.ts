import { useEffect, useSyncExternalStore } from "react";
import type { Resource } from "./types";

// Share the request and resolved snapshot across routes. Cached navigation
// renders synchronously without briefly falling back to placeholders.
let snapshot: { resources: Resource[] | null; loading: boolean; error: Error | null } = {
  resources: null, loading: true, error: null,
};
let request: Promise<void> | null = null;
const listeners = new Set<() => void>();
const getSnapshot = () => snapshot;
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function publish(next: typeof snapshot) {
  snapshot = next;
  listeners.forEach((listener) => listener());
}
function fetchResources() {
  if (request) return;
  publish({ resources: null, loading: true, error: null });
  request = fetch("/data/resources.json")
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load resources.json: ${res.status}`);
      return res.json();
    })
    .then((resources: Resource[]) => publish({ resources, loading: false, error: null }))
    .catch((err) => publish({ resources: null, loading: false,
      error: err instanceof Error ? err : new Error(String(err)) }))
    .finally(() => { request = null; });
}
export function useResources() {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  useEffect(() => {
    if (!snapshot.resources && !snapshot.error) fetchResources();
  }, []);
  return { ...state, retry: fetchResources };
}
