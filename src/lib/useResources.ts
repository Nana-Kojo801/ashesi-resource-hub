import { useEffect, useState } from "react";
import type { Resource } from "./types";

// The build script generates the active directory from the source YAML. Cache
// the fetch promise so navigation shares one dataset; loading/error state is
// handled honestly on the first request.
let cache: Promise<Resource[]> | null = null;

function fetchResources(): Promise<Resource[]> {
  if (!cache) {
    cache = fetch("/data/resources.json").then((res) => {
      if (!res.ok)
        throw new Error(`Failed to load resources.json: ${res.status}`);
      return res.json();
    });
  }
  return cache;
}

export interface UseResourcesResult {
  resources: Resource[] | null;
  loading: boolean;
  error: Error | null;
}

export function useResources(): UseResourcesResult {
  const [resources, setResources] = useState<Resource[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchResources()
      .then((data) => {
        if (!cancelled) setResources(data);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err : new Error(String(err)));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { resources, loading: resources === null && error === null, error };
}
