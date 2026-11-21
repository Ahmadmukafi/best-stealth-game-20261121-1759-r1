# VELVET SHADOW — The Ember Gallery

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/Ahmadmukafi/best-stealth-game-20261121-1759-r1/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/Ahmadmukafi/best-stealth-game-20261121-1759-r1/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

A top-down stealth heist game built for a $50 bounty on [make.fun](https://make.fun/bounty/best-stealth-game-20261121-1759): steal three ember relics from a night museum gallery and reach the exit unseen, past five patrolling guards with vision cones.

## How to play

Open `game/index.html` in a desktop browser. Move with WASD or arrow keys, hold Shift to crouch (slower, silent, harder to spot), Space to dash. Stay out of the guards' vision cones and behind cover — display cases, statues and pillars block sight. Fill the detection meter and the guards give chase; get touched and you lose a life (3 lives). Steal all three embers, then reach the green EXIT.

## What is inside

- `main.ts` — the hand-in program (Node 22, standard library only): copies `game/` and `screenshots/` into the output and writes `dossier.json` via the kit's vendored library.
- `game/` — the playable game as static files, no network requests, synthesised WebAudio only.
- `screenshots/` — four real renders of the game's own code.
- `vendor/makefun-game.ts` — copied from the kit unchanged.

## License

MIT — see `LICENSE`.
