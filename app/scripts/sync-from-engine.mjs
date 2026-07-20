#!/usr/bin/env node
/**
 * Fetches the full data tree (manifest, series, results) from a running
 * Atlas Engine instance and writes it to app/public/data/.
 *
 * Usage:
 *   node scripts/sync-from-engine.mjs [engine-url]
 *
 * Set NEXT_PUBLIC_ENGINE_URL env var to override.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const projectRoot = join(new URL(".", import.meta.url).pathname, "..");
const DEST = join(projectRoot, "public", "data");

const ENGINE_URL = process.env.NEXT_PUBLIC_ENGINE_URL
  || process.argv[2]
  || "http://localhost:8000/api/v1";

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} from ${url}`);
  }
  return response.json();
}

async function syncFromEngine() {
  console.log(`[sync-from-engine] Fetching from ${ENGINE_URL} ...`);

  const manifest = await fetchJson(`${ENGINE_URL}/data/manifest`);
  console.log(`[sync-from-engine] Manifest: ${manifest.series_catalog.length} series, ${manifest.pairs.length} pairs`);

  mkdirSync(join(DEST, "series"), { recursive: true });
  mkdirSync(join(DEST, "results"), { recursive: true });

  let seriesCount = 0;
  let resultCount = 0;

  for (const entry of manifest.series_catalog) {
    try {
      const series = await fetchJson(`${ENGINE_URL}/data/series/${entry.id}.json`);
      writeFileSync(join(DEST, "series", `${entry.id}.json`), JSON.stringify(series, null, 2), "utf-8");
      seriesCount++;
    } catch (err) {
      console.error(`[sync-from-engine] Failed series ${entry.id}: ${err.message}`);
    }
  }

  for (const pair of manifest.pairs) {
    try {
      const result = await fetchJson(`${ENGINE_URL}/data/results/${pair.pair_id}.json`);
      writeFileSync(join(DEST, "results", `${pair.pair_id}.json`), JSON.stringify(result, null, 2), "utf-8");
      resultCount++;
    } catch (err) {
      console.error(`[sync-from-engine] Failed result ${pair.pair_id}: ${err.message}`);
    }
  }

  writeFileSync(join(DEST, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");

  console.log(`[sync-from-engine] Done: ${seriesCount} series, ${resultCount} results`);
}

syncFromEngine().catch((err) => {
  console.error(`[sync-from-engine] Fatal: ${err.message}`);
  process.exit(1);
});
