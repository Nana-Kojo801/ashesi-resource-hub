import { useEffect, useState } from 'react';
import type { Resource } from './types';

// The whole point of this branch is to compare against the static Astro
// site's build-time-known data, so here the resource list is fetched by the
// browser at runtime as plain JSON (generated at build time from the YAML
// source by scripts/build-data.mjs into public/data/resources.json — see
// that script and the root README for why). A module-level cache means the
// fetch only happens once per page load no matter how many components ask
// for it, but every consumer still gets an honest loading state on first
// mount (there is nothing to prerender here).
let cache: Promise<Resource[]> | null = null;

function fetchResources(): Promise<Resource[]> {
  if (!cache) {
    cache = fetch('/data/resources.json').then((res) => {
      if (!res.ok) throw new Error(`Failed to load resources.json: ${res.status}`);
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
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { resources, loading: resources === null && error === null, error };
}
