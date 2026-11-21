// VELVET SHADOW — tuning constants for the whole game.
// One place for every number a designer would tweak: sizes, speeds,
// vision, detection, noise and scoring. Nothing here imports anything.

export const TILE = 40;
export const VIEW_W = 960;
export const VIEW_H = 600;

export const PLAYER_SPEED = 150; // px per second, walking
export const PLAYER_CROUCH_SPEED = 82; // px per second, crouched
export const PLAYER_RADIUS = 11;
export const CROUCH_RADIUS = 9;

export const GUARD_SPEED_PATROL = 62;
export const GUARD_SPEED_CHASE = 132;
export const GUARD_SPEED_SEARCH = 78;
export const GUARD_RADIUS = 12;

// Vision cone: how far a guard sees and how wide the cone is.
export const CONE_RANGE = 190;
export const CONE_HALF_ANGLE = 0.42; // radians, ~24 degrees each side
export const CONE_RANGE_CROUCH = 128; // crouched player is harder to spot

// Detection meter: 0 hidden, 100 caught. Fills while seen, drains while hidden.
export const DETECT_FILL_PER_SEC = 55;
export const DETECT_FILL_CROUCH_PER_SEC = 26;
export const DETECT_DRAIN_PER_SEC = 34;
export const SUSPICIOUS_AT = 34; // meter value where a guard gets curious
export const ALERT_AT = 100; // meter value where the chase starts

// Noise: running footsteps are heard inside this radius; crouch is silent.
export const NOISE_RADIUS_RUN = 120;
export const NOISE_RADIUS_WALK = 46;
export const NOISE_RADIUS_CROUCH = 0;

export const MAX_LIVES = 3;
export const RELICS_TO_WIN = 3;

export const COLORS = {
  floorA: '#242e40',
  floorB: '#2a3648',
  wall: '#3a2f28',
  wallTop: '#54432f',
  cover: '#2e4a3f',
  coverTop: '#4d7a63',
  gold: '#f2c14e',
  exit: '#58d68d',
  player: '#e8e4d8',
  playerGlow: '#ffb347',
  conePatrol: 'rgba(242, 193, 78, 0.30)',
  coneAlert: 'rgba(231, 76, 60, 0.38)',
  guard: '#c0392b',
  guardCalm: '#d9a441',
};
