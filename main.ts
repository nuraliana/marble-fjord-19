// main.ts — entrypoint for the Palm Heat Cover Studio entry
// (gta6-cover-art-01, Node 22, standard library only).
//
// The app itself is plain static files under app/ (index.html plus its ES
// modules, no network request, no build step). This program hands it in:
// it copies app/ and screenshots/ from beside this file into the output
// directory and writes dossier.json there with the vendored make.fun
// library (vendor/makefun-app.ts).
//
//   MAKEFUN_OUTPUT_DIR=/tmp/dossier-test node main.ts
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output; with no
// env set it falls back to ./output beside this file.

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildDossier } from "./vendor/makefun-app.ts";

const repoRoot = resolve(".");
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? join(repoRoot, "output");

// Guard: refuse to hand in an entry with no screenshots at all.
const shotsDir = join(repoRoot, "screenshots");
const shotNames = existsSync(shotsDir)
  ? readdirSync(shotsDir).filter((name) => !name.startsWith("."))
  : [];
if (shotNames.length < 1) {
  throw new Error("screenshots/ is empty — capture the app first (see shots.json).");
}
for (const name of shotNames) {
  const bytes = statSync(join(shotsDir, name)).size;
  if (bytes > 262144) {
    throw new Error(`screenshots/${name} is ${bytes} bytes, over the 256 KiB gate cap.`);
  }
}

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, "app"), join(outDir, "app"), { recursive: true });
cpSync(shotsDir, join(outDir, "screenshots"), { recursive: true });

// Caps from the competition gate: dossier text 160 KiB, at most 4
// screenshots of at most 256 KiB each, app/ at most 993 files / 48 MiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});

const dossierPath = join(outDir, "dossier.json");
writeFileSync(dossierPath, dossier);
console.log(`screenshots: ${shotNames.length} (${shotNames.join(", ")})`);
console.log(`dossier: ${dossierPath} (${dossier.length} bytes)`);
