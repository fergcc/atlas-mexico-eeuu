"use client";

import type { Manifest, SeriesFile, ResultFile } from "./types";
import type { Topology } from "topojson-specification";

/**
 * Client-side data fetchers.
 *
 * Two modes, controlled by NEXT_PUBLIC_ENGINE_URL:
 *   1. Engine mode (NEXT_PUBLIC_ENGINE_URL set):
 *      Fetches from a running Atlas Engine API.
 *      Example: NEXT_PUBLIC_ENGINE_URL=http://localhost:8000/api/v1
 *   2. Static mode (default, no NEXT_PUBLIC_ENGINE_URL):
 *      Fetches local files from /data/*.json (static export).
 */

function resolvePath(localPath: string): string {
  const engine = process.env.NEXT_PUBLIC_ENGINE_URL;
  if (!engine) return localPath;
  const base = engine.replace(/\/+$/, "");
  if (localPath === "/data/manifest.json") return `${base}/data/manifest`;
  return `${base}/data/${localPath.replace(/^\/data\//, "")}`;
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const url = resolvePath(path);
    const res = await fetch(url, { cache: "force-cache" });
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

/** TopoJSON with the 32 Mexican states (`data/geo/mx-states.topojson`, synced by `scripts/sync-data.mjs`). */
export function fetchMxStatesTopology(): Promise<Topology | null> {
  return fetchJson<Topology>("/data/geo/mx-states.topojson");
}
