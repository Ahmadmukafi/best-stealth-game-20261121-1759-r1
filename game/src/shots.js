// VELVET SHADOW — screenshot staging for ?shot=.
// Each named shot arranges one fixed, deterministic scene and renders it
// once: these are real renders of the game's own code, with the game state
// placed by hand — the same states a player reaches by playing. The cover
// is the thief crouched behind a case; play shows a curious guard; alarm
// shows the chase; end shows the unseen victory screen.

import { GUARD_STATE } from './guard.js';

function faceGuard(g, x, y) {
  g.angle = Math.atan2(y - g.y, x - g.x);
}

export function stageShot(game, name) {
  const p = game.player;
  if (name === 'start') {
    // The heist begins: crouched behind the bottom display case, cones
    // sweeping the hall, three embers waiting.
    game.phase = 'playing';
    p.x = 300;
    p.y = 452;
    p.crouched = true;
    p.angle = -Math.PI / 2;
    game.meter = 0;
    game.elapsedMs = 8000;
    game.message = 'Steal the three embers. Stay out of the cones.';
    for (const g of game.guards) faceGuard(g, g.x + 60, g.y);
  } else if (name === 'play') {
    // Mid-heist: one ember stolen, the thief by the statue, Sena curious.
    game.phase = 'playing';
    game.relics[0].taken = true;
    game.relicsTaken = 1;
    p.x = 470;
    p.y = 300;
    p.crouched = false;
    p.angle = Math.PI / 2;
    game.meter = 45;
    game.elapsedMs = 64000;
    game.message = 'Ember Ruby stolen! 1 of 3.';
    const sena = game.guards[2];
    sena.x = 380;
    sena.y = 300;
    sena.state = GUARD_STATE.CURIOUS;
    sena.suspicion = 60;
    sena.lastSeenX = p.x;
    sena.lastSeenY = p.y;
    faceGuard(sena, p.x, p.y);
    for (const g of game.guards) if (g !== sena) faceGuard(g, g.x + 60, g.y);
  } else if (name === 'alarm') {
    // The chase: two embers stolen, exit open, Bram hunting the thief.
    game.phase = 'playing';
    game.relics[0].taken = true;
    game.relics[1].taken = true;
    game.relicsTaken = 2;
    game.exitOpen = true;
    p.x = 800;
    p.y = 500;
    p.crouched = false;
    p.angle = 0;
    game.meter = 100;
    game.elapsedMs = 131000;
    game.message = 'SPOTTED! Run — break line of sight!';
    const bram = game.guards[3];
    bram.x = 740;
    bram.y = 470;
    bram.state = GUARD_STATE.CHASE;
    bram.suspicion = 100;
    faceGuard(bram, p.x, p.y);
    for (const g of game.guards) if (g !== bram) faceGuard(g, g.x + 60, g.y);
  } else if (name === 'end') {
    // The unseen victory: all three embers, ghost run, 2:41 on the clock.
    game.phase = 'win';
    for (const r of game.relics) r.taken = true;
    game.relicsTaken = 3;
    game.exitOpen = true;
    game.ghost = true;
    game.elapsedMs = 161000;
    game.meter = 0;
    p.x = 790;
    p.y = 480;
    for (const g of game.guards) faceGuard(g, g.x + 60, g.y);
  }
}
