// VELVET SHADOW — the player: a shadow-thief with a lantern.
// WASD or arrows to move, Shift to crouch (slower, quieter, harder to
// spot), Space to dash a short step. The player makes noise when moving:
// walking is quiet, running is heard across the room, crouching is silent.
// Noise is what pulls curious guards toward you even when they cannot see.

import {
  PLAYER_SPEED,
  PLAYER_CROUCH_SPEED,
  PLAYER_RADIUS,
  CROUCH_RADIUS,
  NOISE_RADIUS_RUN,
  NOISE_RADIUS_WALK,
  NOISE_RADIUS_CROUCH,
} from './config.js';
import { resolveCircleCollision } from './vision.js';

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.angle = -Math.PI / 2; // facing up the gallery
    this.crouched = false;
    this.moving = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.stepTimer = 0;
    this.noise = 0; // current noise radius, read by guards
    this.noisePulse = 0; // visual ripple timer for loud steps
  }

  reset(start) {
    this.x = start.x;
    this.y = start.y;
    this.angle = -Math.PI / 2;
    this.crouched = false;
    this.moving = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.noise = 0;
    this.noisePulse = 0;
  }

  // keys: {up,down,left,right,crouch,dash} booleans. dt in seconds.
  // Returns true when a footstep sound should play this frame.
  update(dt, keys) {
    let mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
    let my = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
    const len = Math.hypot(mx, my);
    this.moving = len > 0;
    this.crouched = !!keys.crouch;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (keys.dash && this.dashCooldown <= 0 && this.moving && !this.crouched) {
      this.dashTimer = 0.16;
      this.dashCooldown = 1.4;
    }
    let speed = this.crouched ? PLAYER_CROUCH_SPEED : PLAYER_SPEED;
    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      speed *= 2.1; // a quick burst through a cone's edge
    }
    let stepped = false;
    if (this.moving) {
      mx /= len;
      my /= len;
      const nx = this.x + mx * speed * dt;
      const ny = this.y + my * speed * dt;
      const r = this.crouched ? CROUCH_RADIUS : PLAYER_RADIUS;
      const [rx, ry] = resolveCircleCollision(nx, ny, r);
      this.x = rx;
      this.y = ry;
      this.angle = Math.atan2(my, mx);
      // Footstep timing: faster when running, silent when crouched.
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = this.crouched ? 0.55 : 0.34;
        stepped = !this.crouched;
        if (!this.crouched) this.noisePulse = 0.3;
      }
    }
    this.noise = !this.moving
      ? 0
      : this.crouched
        ? NOISE_RADIUS_CROUCH
        : this.dashTimer > 0
          ? NOISE_RADIUS_RUN
          : NOISE_RADIUS_WALK;
    if (this.noisePulse > 0) this.noisePulse -= dt;
    return stepped;
  }

  get radius() {
    return this.crouched ? CROUCH_RADIUS : PLAYER_RADIUS;
  }
}
