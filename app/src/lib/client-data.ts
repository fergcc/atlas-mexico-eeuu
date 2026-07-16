"use client";

import type { Manifest, SeriesFile, ResultFile } from "./types";

/**
 * Client-side counterparts to `data-loader.ts`, for Client Components that
 * need to fetch data after interaction (e.g. the /comparativa series
 * picker). Statically exported apps serve `public/data/**` as plain files,
 * so a relative `fetch` works with no server/API route involved.
 */

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path, { cache: "force-cache" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function fetchManifest(): Promise<Manifest | null> {
  return fetchJson<Manifest>("/data/manifest.json");
}

export function fetchSeries(seriesId: string): Promise<SeriesFile | null> {
  return fetchJson<SeriesFile>(`/data/series/${seriesId}.json`);
}

export function fetchResult(pairId: string): Promise<ResultFile | null> {
  return fetchJson<ResultFile>(`/data/results/${pairId}.json`);
}
