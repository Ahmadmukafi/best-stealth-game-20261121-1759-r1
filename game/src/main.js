// VELVET SHADOW — the game itself: loop, input, states and scoring.
// Phases: title → playing → caught → win. The detection meter is global:
// it fills while ANY guard sees the thief and drains while none does.
// At 100 the chase starts; a chasing guard that touches the thief ends the
// run. Steal all three relics, the exit opens, reach it unseen to win.

import {
  VIEW_W, VIEW_H, CONE_RANGE, CONE_HALF_ANGLE, CONE_RANGE_CROUCH,
  DETECT_FILL_PER_SEC, DETECT_FILL_CROUCH_PER_SEC, DETECT_DRAIN_PER_SEC,
  SUSPICIOUS_AT, ALERT_AT, MAX_LIVES, RELICS_TO_WIN,
} from './config.js';
import { GUARDS, RELICS, EXIT, PLAYER_START } from './level.js';
import { guardSeesPlayer } from './vision.js';
import { Guard, GUARD_STATE } from './guard.js';
import { Player } from './player.js';
import { SoundBank } from './audio.js';
import { render } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const sounds = new SoundBank();

const game = {
  phase: 'title', // title | playing | caught | win
  player: new Player(PLAYER_START),
  guards: GUARDS.map((g) => new Guard(g)),
  relics: RELICS.map((r) => ({ ...r })),
  meter: 0,
  lives: MAX_LIVES,
  elapsedMs: 0,
  relicsTaken: 0,
  exitOpen: false,
  ghost: true, // stays true until any guard is ever alerted
  message: 'Steal the three embers. Stay out of the cones.',
  timeSec: 0,
  alarmed: false, // an alarm sting is playing this chase
};

// Exposed for local play-testing only (read the state, never the code).
window.__game = game;

const keys = { up: false, down: false, left: false, right: false, crouch: false, dash: false };

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'crouch', ShiftRight: 'crouch',
  Space: 'dash',
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

window.addEventListener('keydown', (e) => {
  sounds.ensure();
  if (e.code === 'Enter') {
    if (game.phase === 'title') startRun(true);
    else if (game.phase === 'caught') respawn();
    else if (game.phase === 'win') startRun(true);
    e.preventDefault();
    return;
  }
  if (e.code === 'KeyM') {
    sounds.muted = !sounds.muted;
    return;
  }
  if (e.code === 'KeyR' && game.phase === 'playing') {
    startRun(false);
    return;
  }
  const k = KEYMAP[e.code];
  if (k) {
    keys[k] = true;
    e.preventDefault();
  }
});
window.addEventListener('keyup', (e) => {
  const k = KEYMAP[e.code];
  if (k) keys[k] = false;
});

function startRun(fullReset) {
  game.player.reset(PLAYER_START);
  game.guards = GUARDS.map((g) => new Guard(g));
  game.meter = 0;
  game.elapsedMs = 0;
  game.exitOpen = false;
  game.ghost = true;
  game.alarmed = false;
  if (fullReset) {
    game.lives = MAX_LIVES;
    game.relics = RELICS.map((r) => ({ ...r }));
    game.relicsTaken = 0;
  }
  game.message = 'Steal the three embers. Stay out of the cones.';
  game.phase = 'playing';
  announce('Playing. Steal three embers, then reach the exit unseen.');
}

function respawn() {
  // After being caught: same run, relics kept, guards and thief reset.
  game.player.reset(PLAYER_START);
  game.guards = GUARDS.map((g) => new Guard(g));
  game.meter = 0;
  game.alarmed = false;
  game.message = game.relicsTaken > 0
    ? `Back at the door. ${game.relicsTaken} of ${RELICS_TO_WIN} embers kept.`
    : 'Back at the door. Stay out of the cones.';
  game.phase = 'playing';
  announce('Playing again after being caught.');
}

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function relicAtPlayer() {
  for (const r of game.relics) {
    if (r.taken) continue;
    if (Math.hypot(game.player.x - r.x, game.player.y - r.y) < 26) return r;
  }
  return null;
}

function update(dt) {
  if (game.phase !== 'playing') return;
  game.elapsedMs += dt * 1000;
  const stepped = game.player.update(dt, keys);
  if (stepped) sounds.footstep(false);

  // Vision: does any guard see the thief right now?
  let anyoneSees = false;
  for (const g of game.guards) {
    const range = game.player.crouched ? CONE_RANGE_CROUCH : CONE_RANGE;
    const sees = guardSeesPlayer(g, game.player, range, CONE_HALF_ANGLE);
    if (sees) anyoneSees = true;
    g.notice(dt, sees, game.meter);
  }

  // The global detection meter.
  if (anyoneSees) {
    const fill = game.player.crouched ? DETECT_FILL_CROUCH_PER_SEC : DETECT_FILL_PER_SEC;
    game.meter = Math.min(ALERT_AT, game.meter + fill * dt);
    if (game.meter >= SUSPICIOUS_AT) game.ghost = false;
  } else {
    game.meter = Math.max(0, game.meter - DETECT_DRAIN_PER_SEC * dt);
  }

  // Alarm sting once, when the meter first tops out.
  if (game.meter >= ALERT_AT && !game.alarmed) {
    game.alarmed = true;
    sounds.alarm();
    game.message = 'SPOTTED! Run — break line of sight!';
  } else if (game.meter < ALERT_AT) {
    game.alarmed = false;
  }

  // Noise pulls curious guards even when they cannot see.
  if (game.player.noise > 0) {
    for (const g of game.guards) {
      if (g.state !== GUARD_STATE.PATROL) continue;
      const d = Math.hypot(g.x - game.player.x, g.y - game.player.y);
      if (d < game.player.noise + 40) {
        g.lastSeenX = game.player.x;
        g.lastSeenY = game.player.y;
        g.state = GUARD_STATE.CURIOUS;
        sounds.curious();
      }
    }
  }

  for (const g of game.guards) {
    const range = game.player.crouched ? CONE_RANGE_CROUCH : CONE_RANGE;
    const sees = guardSeesPlayer(g, game.player, range, CONE_HALF_ANGLE);
    g.update(dt, game.player, sees);
    // A chasing guard that touches the thief ends the run.
    if (g.state === GUARD_STATE.CHASE && Math.hypot(g.x - game.player.x, g.y - game.player.y) < 26) {
      onCaught();
      return;
    }
  }

  // Pick up a relic.
  const relic = relicAtPlayer();
  if (relic) {
    relic.taken = true;
    game.relicsTaken += 1;
    sounds.chime();
    if (game.relicsTaken >= RELICS_TO_WIN) {
      game.exitOpen = true;
      game.message = 'EXIT OPEN — reach the green door!';
      announce('All three embers stolen. The exit is open.');
    } else {
      game.message = `${relic.name} stolen! ${game.relicsTaken} of ${RELICS_TO_WIN}.`;
    }
  }

  // Reach the open exit to win.
  if (game.exitOpen) {
    const p = game.player;
    if (p.x > EXIT.x && p.x < EXIT.x + EXIT.w && p.y > EXIT.y && p.y < EXIT.y + EXIT.h) {
      game.phase = 'win';
      sounds.win();
      announce(game.ghost ? 'You won unseen — a perfect ghost heist.' : 'You won, but you were spotted along the way.');
    }
  }
}

function onCaught() {
  game.lives -= 1;
  sounds.caught();
  game.phase = 'caught';
  announce(game.lives > 0 ? `Caught! ${game.lives} lives left.` : 'Caught! No lives left.');
}

function draw() {
  const scale = Math.min(canvas.width / VIEW_W, canvas.height / VIEW_H);
  const ox = (canvas.width - VIEW_W * scale) / 2;
  const oy = (canvas.height - VIEW_H * scale) / 2;
  ctx.fillStyle = '#05070c';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  render(ctx, game);
  ctx.restore();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  game.timeSec += dt;
  update(dt);
  draw();
  requestAnimationFrame(frame);
}

// Screenshot staging: ?shot=start|play|alarm|end renders one fixed frame.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  stageShot(game, shot);
  game.timeSec = 1.234; // fixed clock so every shot is deterministic
  draw();
} else {
  requestAnimationFrame(frame);
}
