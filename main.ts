// VELVET SHADOW — the hand-in program (Node 22, standard library only).
// The game lives in game/ as plain static files and its screenshots in
// screenshots/. This program copies both into /output and writes the
// dossier the judge reads, using the kit's vendored library. It never
// reaches the network and it writes the same bytes on every run.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Fail loudly, with a readable reason, when the entry is incomplete:
// the grader gives no second chance and a silent partial copy would
// score 0 instead of telling the maker what is missing.
if (!existsSync(join(here, 'game'))) {
  throw new Error('VELVET SHADOW: game/ is missing from the repository');
}
if (!existsSync(join(here, 'screenshots'))) {
  throw new Error('VELVET SHADOW: screenshots/ is missing from the repository');
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The gate's caps: at most 4 screenshots of 256 KiB, game/ under 993 files
// and 48 MiB, no path under game/ over 1000 bytes, dossier under 1.5 MiB.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
