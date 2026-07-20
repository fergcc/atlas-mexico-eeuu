#!/usr/bin/env node
// Copies Engine/data/** into app/public/data/** so the Dashboard always
// reflects whatever the Engine pipeline has produced.
//
// Safe to run before Engine has run: if the Engine data dir doesn't exist
// yet, this is a no-op with a warning.

import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const monorepoRoot = join(projectRoot, "..");

const SRC = join(monorepoRoot, "..", "..", "Engine", "data");
const DEST = join(projectRoot, "public", "data");

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
  if (!existsSync(SRC)) {
    console.warn(
      `[sync-data] Engine data not found at ${SRC}. Run the Engine pipeline first.`
    );
    return;
  }

  if (!statSync(SRC).isDirectory()) {
    console.warn(`[sync-data] ${SRC} is not a directory, skipping.`);
    return;
  }

  if (existsSync(DEST)) {
    rmSync(DEST, { recursive: true, force: true });
  }

  copyRecursive(SRC, DEST);
  console.log(`[sync-data] Copied ${SRC} -> ${DEST}`);
}

main();
