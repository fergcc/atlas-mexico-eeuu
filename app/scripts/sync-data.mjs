#!/usr/bin/env node
// Copies data files into app/public/data/ for the static Next.js export.
//
// Source priority:
//   1. Engine/data/ (local dev — monorepo sibling)
//   2. ../data/     (versioned Dashboard data, used in Vercel/CI builds)
//
// On Vercel, only the Dashboard repo is cloned, so Engine data is unavailable.
// The Dashboard's data/ directory is kept in sync with Engine via git.

import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const dashboardRoot = join(appRoot, "..");

// Try Engine data first (local dev), fall back to Dashboard data (CI/Vercel)
const ENGINE_SRC = join(dashboardRoot, "..", "..", "Engine", "data");
const LOCAL_SRC = join(dashboardRoot, "data");
const DEST = join(appRoot, "public", "data");

function getSource() {
  if (existsSync(ENGINE_SRC) && statSync(ENGINE_SRC).isDirectory()) {
    return ENGINE_SRC;
  }
  if (existsSync(LOCAL_SRC) && statSync(LOCAL_SRC).isDirectory()) {
    return LOCAL_SRC;
  }
  return null;
}

function copyRecursive(src, dest) {
  const entries = readdirSync(src, { withFileTypes: true });
  mkdirSync(dest, { recursive: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  const src = getSource();
  if (!src) {
    console.warn(
      `[sync-data] No data source found. Run the Engine pipeline first, ` +
        `or ensure data/ exists in the Dashboard repo.`
    );
    return;
  }

  console.log(`[sync-data] Source: ${src}`);

  if (existsSync(DEST)) {
    rmSync(DEST, { recursive: true, force: true });
  }

  copyRecursive(src, DEST);
  console.log(`[sync-data] Done: ${src} -> ${DEST}`);
}

main();
