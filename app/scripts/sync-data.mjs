#!/usr/bin/env node
// Copies (never symlinks) ../data/** into app/public/data/** so that the
// statically-exported Next.js app can `fetch('/data/...')` client-side and
// Server Components can read the same files from `public/data` via `fs` at
// build time. This runs in `predev`/`prebuild` so `public/data` always
// mirrors whatever the pipeline has produced in the monorepo root, without
// ever hardcoding which sectors/pairs/series exist.
//
// Safe to run before the pipeline has produced anything: if `../data`
// doesn't exist yet, this is a no-op (with a warning) rather than a failure,
// so `npm install` / first-time clones don't break.

import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");
const monorepoRoot = join(projectRoot, "..");

const SRC = join(monorepoRoot, "data");
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
      `[sync-data] No se encontró ${SRC}. El pipeline aún no ha generado datos; ` +
        `se omite la sincronización (la app usará solo lo que ya exista en public/data, si algo).`
    );
    return;
  }

  if (!statSync(SRC).isDirectory()) {
    console.warn(`[sync-data] ${SRC} no es un directorio, se omite.`);
    return;
  }

  // Start clean so deleted/renamed source files don't linger in public/data.
  if (existsSync(DEST)) {
    rmSync(DEST, { recursive: true, force: true });
  }

  copyRecursive(SRC, DEST);
  console.log(`[sync-data] Copiado ${SRC} -> ${DEST}`);
}

main();
