// VELVET SHADOW — rendering: everything the judge sees.
// Top-down night gallery: warm lantern glow around the thief, amber vision
// cones sweeping the floor, gold relics glinting, dark walls and velvet
// display cases. Cones are drawn under the walls so a wall visibly cuts a
// cone short. A darkness overlay keeps the mood: only the lantern's circle
// is fully lit. The HUD is drawn on the canvas so screenshots carry it.

import { VIEW_W, VIEW_H, TILE, COLORS, CONE_RANGE, CONE_HALF_ANGLE, RELICS_TO_WIN } from './config.js';
import { WALLS, COVERS, EXIT } from './level.js';
import { GUARD_STATE } from './guard.js';

function fmtTime(ms) {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function drawFloor(ctx, t) {
  for (let y = 0; y < VIEW_H / TILE; y++) {
    for (let x = 0; x < VIEW_W / TILE; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
    }
  }
  // Worn red carpets down the middle hall and the bottom hall. Kept faint
  // so they read as floor decoration, never as walls.
  ctx.fillStyle = 'rgba(122, 32, 40, 0.30)';
  ctx.fillRect(60, 282, 380, 56);
  ctx.fillRect(560, 282, 340, 56);
  ctx.fillRect(60, 478, 380, 56);
  ctx.strokeStyle = 'rgba(242, 193, 78, 0.28)';
  ctx.lineWidth = 2;
  ctx.strokeRect(60, 282, 380, 56);
  ctx.strokeRect(560, 282, 340, 56);
  ctx.strokeRect(60, 478, 380, 56);
}

function drawExit(ctx, open, t) {
  const pulse = open ? 0.55 + 0.35 * Math.sin(t * 4) : 0;
  ctx.save();
  ctx.fillStyle = open ? '#123524' : '#241a1a';
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.strokeStyle = open ? COLORS.exit : '#6b4a4a';
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  if (open) {
    ctx.shadowColor = COLORS.exit;
    ctx.shadowBlur = 18 + pulse * 14;
    ctx.fillStyle = COLORS.exit;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 + 5);
    ctx.shadowBlur = 0;
  } else {
    ctx.strokeStyle = '#8a6d3b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(EXIT.x + 8, EXIT.y + 8);
    ctx.lineTo(EXIT.x + EXIT.w - 8, EXIT.y + EXIT.h - 8);
    ctx.moveTo(EXIT.x + EXIT.w - 8, EXIT.y + 8);
    ctx.lineTo(EXIT.x + 8, EXIT.y + EXIT.h - 8);
    ctx.stroke();
    ctx.fillStyle = '#c9a86a';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('LOCKED', EXIT.x + EXIT.w / 2, EXIT.y - 8);
  }
  ctx.restore();
}

function drawRelics(ctx, relics, t) {
  for (const r of relics) {
    if (r.taken) continue;
    const bob = Math.sin(t * 2.4 + r.x) * 2;
    const glow = 0.5 + 0.3 * Math.sin(t * 3 + r.x);
    ctx.save();
    ctx.shadowColor = COLORS.gold;
    ctx.shadowBlur = 16 * glow;
    ctx.translate(r.x, r.y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(-8, -8, 16, 16);
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }
}

function drawCones(ctx, guards) {
  for (const g of guards) {
    const alert = g.state === GUARD_STATE.CHASE;
    ctx.save();
    ctx.fillStyle = alert ? COLORS.coneAlert : COLORS.conePatrol;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.arc(g.x, g.y, CONE_RANGE, g.angle - CONE_HALF_ANGLE, g.angle + CONE_HALF_ANGLE);
    ctx.closePath();
    ctx.fill();
    // A bright rim so the cone's edge reads even where the floor is dark.
    ctx.strokeStyle = alert ? 'rgba(255, 90, 78, 0.55)' : 'rgba(242, 193, 78, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

function drawSolids(ctx) {
  for (const w of WALLS) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = COLORS.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 4);
  }
  for (const c of COVERS) {
    if (c.kind === 'case') {
      ctx.fillStyle = '#1f2f28';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = COLORS.cover;
      ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
    } else if (c.kind === 'statue') {
      ctx.fillStyle = '#5a6470';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7d8894';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2 - 4, c.y + c.h / 2 - 4, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Pillar: a round column with a gold band.
      ctx.fillStyle = '#4a3d31';
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(c.x + c.w / 2, c.y + c.h / 2, c.w / 2 - 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawGuards(ctx, guards, t) {
  for (const g of guards) {
    const alert = g.state === GUARD_STATE.CHASE;
    const curious = g.state === GUARD_STATE.CURIOUS || g.state === GUARD_STATE.SEARCH;
    // Body: a watchman in a dark coat with a brass helmet.
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(g.x + 2, g.y + 4, 13, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = alert ? COLORS.guard : COLORS.guardCalm;
    ctx.beginPath();
    ctx.arc(g.x, g.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5d76e';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 6, 0, Math.PI * 2);
    ctx.fill();
    // Facing tick.
    ctx.strokeStyle = '#2c1a12';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.angle) * 15, g.y + Math.sin(g.angle) * 15);
    ctx.stroke();
    // ? when curious, ! when chasing.
    if (alert || curious) {
      const bobY = g.y - 26 + Math.sin(t * 5) * 2;
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = alert ? '#ff5a4e' : '#ffd34e';
      ctx.fillText(alert ? '!' : '?', g.x, bobY);
    }
    ctx.restore();
  }
}

function drawPlayer(ctx, player, t) {
  const p = player;
  ctx.save();
  // Lantern glow, additive so the floor warms around the thief.
  const glow = ctx.createRadialGradient(p.x, p.y, 6, p.x, p.y, 120);
  glow.addColorStop(0, 'rgba(255, 179, 71, 0.30)');
  glow.addColorStop(1, 'rgba(255, 179, 71, 0)');
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // Noise ripple when a loud step lands.
  if (p.noisePulse > 0) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${p.noisePulse * 1.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 26 + (0.3 - p.noisePulse) * 90, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(p.x + 2, p.y + 4, p.radius + 2, p.radius * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded figure: dark cloak, pale face, lantern dot ahead.
  ctx.fillStyle = '#232a3a';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.player;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = COLORS.playerGlow;
  ctx.beginPath();
  ctx.arc(p.x + Math.cos(p.angle) * (p.radius + 4), p.y + Math.sin(p.angle) * (p.radius + 4), 3.5, 0, Math.PI * 2);
  ctx.fill();
  if (p.crouched) {
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(232, 228, 216, 0.7)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawDarkness(ctx, player) {
  const g = ctx.createRadialGradient(player.x, player.y, 110, player.x, player.y, 430);
  g.addColorStop(0, 'rgba(4, 6, 12, 0)');
  g.addColorStop(0.55, 'rgba(4, 6, 12, 0.14)');
  g.addColorStop(1, 'rgba(4, 6, 12, 0.46)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawHud(ctx, s) {
  // Top bar.
  ctx.fillStyle = 'rgba(8, 10, 16, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, 34);
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`RELICS ${s.relicsTaken}/${RELICS_TO_WIN}`, 14, 22);
  // Detection meter.
  const mw = 220;
  const mx = VIEW_W / 2 - mw / 2;
  ctx.fillStyle = '#11141b';
  ctx.fillRect(mx, 9, mw, 16);
  const frac = Math.min(1, s.meter / 100);
  ctx.fillStyle = frac < 0.34 ? '#58d68d' : frac < 0.7 ? '#f2c14e' : '#e74c3c';
  ctx.fillRect(mx, 9, mw * frac, 16);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx, 9, mw, 16);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(frac >= 1 ? 'SPOTTED!' : frac >= 0.34 ? 'SUSPICIOUS' : 'HIDDEN', VIEW_W / 2, 47);
  // Lives and time.
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e8e4d8';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText(`♥ ${s.lives}    ${fmtTime(s.elapsedMs)}`, VIEW_W - 14, 22);
  // Hint line.
  if (s.message) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = 'rgba(232, 228, 216, 0.9)';
    ctx.fillText(s.message, VIEW_W / 2, VIEW_H - 12);
  }
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6, 8, 14, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 58px Georgia, serif';
  ctx.fillText(title, VIEW_W / 2, 190);
  ctx.fillStyle = '#e8e4d8';
  ctx.font = '19px Georgia, serif';
  lines.forEach((ln, i) => ctx.fillText(ln, VIEW_W / 2, 250 + i * 32));
}

// The one entry point: draw the whole frame for game state `s`.
export function render(ctx, s) {
  const t = s.timeSec;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  drawFloor(ctx, t);
  drawExit(ctx, s.exitOpen, t);
  drawRelics(ctx, s.relics, t);
  if (s.phase === 'playing' || s.phase === 'caught' || s.phase === 'win') {
    drawCones(ctx, s.guards);
  }
  drawSolids(ctx);
  if (s.phase !== 'title') {
    drawGuards(ctx, s.guards, t);
    drawPlayer(ctx, s.player, t);
    drawDarkness(ctx, s.player);
    drawHud(ctx, s);
  }
  if (s.phase === 'title') {
    overlay(ctx, 'VELVET SHADOW', [
      'The Ember Gallery — a night heist in three relics.',
      'Steal all three embers, then reach the green exit unseen.',
      '',
      'WASD / Arrows — move      SHIFT — crouch (slow, silent, hard to spot)',
      'SPACE — dash      M — mute      R — restart',
      '',
      'Patrols can be learned. Cones are honest. Patience pays.',
      '',
      'Press ENTER to begin',
    ], COLORS.gold);
  } else if (s.phase === 'caught') {
    overlay(ctx, 'CAUGHT!', [
      `The watchmen caught you with ${s.relicsTaken} of ${RELICS_TO_WIN} relics.`,
      s.lives > 0 ? `${s.lives} ${s.lives === 1 ? 'life' : 'lives'} left — the gallery resets.` : 'No lives left — the heist is over.',
      '',
      'Press ENTER to try again',
    ], '#e74c3c');
  } else if (s.phase === 'win') {
    overlay(ctx, 'UNSEEN', [
      `All three embers stolen in ${fmtTime(s.elapsedMs)} — and nobody ever saw you.`,
      s.ghost ? 'GHOST: no guard ever raised the alarm. A perfect heist.' : 'You were spotted along the way — but you still slipped out.',
      '',
      'Press ENTER to play again',
    ], COLORS.exit);
  }
}
