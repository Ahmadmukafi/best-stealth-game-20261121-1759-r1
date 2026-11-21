// VELVET SHADOW — seeing: line of sight and vision cones.
// A guard sees the player only when three things are all true: the player
// is inside the cone's range, inside its angle, and no solid rectangle
// blocks the straight line between them. Cover really does hide you.

import { solids } from './level.js';

// Does the segment (x1,y1)-(x2,y2) cross the rectangle r?
function segmentHitsRect(x1, y1, x2, y2, r) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  // Slab test on each axis: shrink the [tmin, tmax] window per axis.
  for (const [p, d, lo, hi] of [
    [x1, dx, r.x, r.x + r.w],
    [y1, dy, r.y, r.y + r.h],
  ]) {
    if (Math.abs(d) < 1e-9) {
      if (p < lo || p > hi) return false;
    } else {
      let t1 = (lo - p) / d;
      let t2 = (hi - p) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
  }
  return true;
}

// True when nothing solid stands between the two points.
export function hasLineOfSight(x1, y1, x2, y2) {
  for (const s of solids()) {
    if (segmentHitsRect(x1, y1, x2, y2, s)) return false;
  }
  return true;
}

// True when the target point is inside a cone from (ox,oy) facing `angle`.
// `range` is how far the cone reaches, `halfAngle` is half its spread.
export function insideCone(ox, oy, angle, range, halfAngle, tx, ty) {
  const dx = tx - ox;
  const dy = ty - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range || dist < 1e-6) return dist < 1e-6;
  const toTarget = Math.atan2(dy, dx);
  let diff = toTarget - angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= halfAngle;
}

// The full vision test: range, angle and a clear line of sight.
export function guardSeesPlayer(guard, player, range, halfAngle) {
  if (!insideCone(guard.x, guard.y, guard.angle, range, halfAngle, player.x, player.y)) return false;
  return hasLineOfSight(guard.x, guard.y, player.x, player.y);
}

// Push a circle (x,y,r) out of every solid rectangle it overlaps.
// Returns the corrected [x, y]. Used for player and guard movement.
export function resolveCircleCollision(x, y, r) {
  for (const s of solids()) {
    const cx = Math.max(s.x, Math.min(x, s.x + s.w));
    const cy = Math.max(s.y, Math.min(y, s.y + s.h));
    const dx = x - cx;
    const dy = y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < r * r) {
      if (d2 < 1e-9) {
        // Centre inside the rect: push out along the smallest penetration.
        const left = x - s.x;
        const right = s.x + s.w - x;
        const top = y - s.y;
        const bottom = s.y + s.h - y;
        const m = Math.min(left, right, top, bottom);
        if (m === left) x = s.x - r;
        else if (m === right) x = s.x + s.w + r;
        else if (m === top) y = s.y - r;
        else y = s.y + s.h + r;
      } else {
        const d = Math.sqrt(d2);
        x = cx + (dx / d) * r;
        y = cy + (dy / d) * r;
      }
    }
  }
  return [x, y];
}
