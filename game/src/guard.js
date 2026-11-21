// VELVET SHADOW — guards: patrol, suspicion, chase and search.
// A guard walks its waypoint loop. When it sees the player its suspicion
// grows; curious guards walk over to look, alarmed guards chase, and a
// guard that loses you searches the last place it saw you before giving up
// and going back to patrol. Patrols are fixed, so a patient player can
// learn them — that is the whole game.

import { GUARD_SPEED_PATROL, GUARD_SPEED_CHASE, GUARD_SPEED_SEARCH, GUARD_RADIUS } from './config.js';
import { resolveCircleCollision } from './vision.js';

export const GUARD_STATE = {
  PATROL: 'patrol',
  CURIOUS: 'curious',
  CHASE: 'chase',
  SEARCH: 'search',
};

export class Guard {
  constructor(def) {
    this.name = def.name;
    this.waypoints = def.waypoints;
    this.wpIndex = 0;
    this.x = def.waypoints[0].x;
    this.y = def.waypoints[0].y;
    this.angle = 0;
    this.state = GUARD_STATE.PATROL;
    this.suspicion = 0; // 0..100, per-guard suspicion shown as ? or !
    this.searchTimer = 0;
    this.lastSeenX = this.x;
    this.lastSeenY = this.y;
    this.pauseTimer = 0;
    this.stepPhase = Math.random() * Math.PI * 2;
  }

  // Move toward (tx,ty) at `speed` for dt seconds. Returns distance left.
  moveToward(tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 1e-6) return 0;
    const step = Math.min(dist, speed * dt);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    const [rx, ry] = resolveCircleCollision(nx, ny, GUARD_RADIUS);
    this.x = rx;
    this.y = ry;
    this.angle = Math.atan2(dy, dx);
    return dist - step;
  }

  update(dt, player, seesPlayer) {
    this.stepPhase += dt * 6;
    if (seesPlayer) {
      this.lastSeenX = player.x;
      this.lastSeenY = player.y;
    }
    switch (this.state) {
      case GUARD_STATE.PATROL: {
        if (this.pauseTimer > 0) {
          // Stand still and scan the room at each waypoint.
          this.pauseTimer -= dt;
          this.angle += dt * 1.6;
          break;
        }
        const wp = this.waypoints[this.wpIndex];
        const left = this.moveToward(wp.x, wp.y, GUARD_SPEED_PATROL, dt);
        if (left < 2) {
          this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
          this.pauseTimer = 0.6; // glance around at each waypoint
        }
        break;
      }
      case GUARD_STATE.CURIOUS: {
        // Walk to the last seen spot and look around.
        const left = this.moveToward(this.lastSeenX, this.lastSeenY, GUARD_SPEED_PATROL, dt);
        if (left < 4) {
          this.searchTimer += dt;
          this.angle += dt * 2.2;
          if (this.searchTimer > 2.5) {
            this.state = GUARD_STATE.PATROL;
            this.searchTimer = 0;
            this.suspicion = 0;
          }
        }
        break;
      }
      case GUARD_STATE.CHASE: {
        this.moveToward(player.x, player.y, GUARD_SPEED_CHASE, dt);
        if (!seesPlayer) {
          this.state = GUARD_STATE.SEARCH;
          this.searchTimer = 0;
        }
        break;
      }
      case GUARD_STATE.SEARCH: {
        const left = this.moveToward(this.lastSeenX, this.lastSeenY, GUARD_SPEED_SEARCH, dt);
        if (left < 4) {
          this.searchTimer += dt;
          this.angle += dt * 2.6;
          if (this.searchTimer > 3.5) {
            this.state = GUARD_STATE.PATROL;
            this.searchTimer = 0;
            this.suspicion = 0;
          }
        }
        break;
      }
    }
  }

  // Called every frame with whether this guard currently sees the player.
  // Drives the suspicion meter and the state changes.
  notice(dt, seesPlayer, globalMeter) {
    if (seesPlayer) {
      this.suspicion = Math.min(100, this.suspicion + dt * 70);
      if (globalMeter >= 100 && this.state !== GUARD_STATE.CHASE) {
        this.state = GUARD_STATE.CHASE;
      } else if (this.suspicion > 45 && this.state === GUARD_STATE.PATROL) {
        this.state = GUARD_STATE.CURIOUS;
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - dt * 26);
      if (this.state === GUARD_STATE.CURIOUS && this.suspicion <= 0) {
        this.state = GUARD_STATE.PATROL;
      }
    }
  }

  // How alarmed this guard looks: used for the ? / ! marker and cone colour.
  get alertLevel() {
    if (this.state === GUARD_STATE.CHASE) return 2;
    if (this.state === GUARD_STATE.CURIOUS || this.state === GUARD_STATE.SEARCH) return 1;
    return 0;
  }
}
