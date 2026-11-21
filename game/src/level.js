// VELVET SHADOW — the Ember Gallery level.
// All geometry is in pixels on a 960x600 canvas. Walls and cover are solid
// rectangles: they block movement and they block a guard's line of sight.
// Relics are the three things to steal; the exit only opens once all three
// are taken. Guards walk their waypoint loops forever.

export const WALLS = [
  // Outer border.
  { x: 0, y: 0, w: 960, h: 24 },
  { x: 0, y: 576, w: 960, h: 24 },
  { x: 0, y: 0, w: 24, h: 600 },
  { x: 936, y: 0, w: 24, h: 600 },
  // Divider between the two top galleries, with a gap to slip through.
  { x: 420, y: 24, w: 24, h: 96 },
  // Wall under the top galleries, gap in the middle for the main corridor.
  { x: 24, y: 180, w: 300, h: 24 },
  { x: 636, y: 180, w: 300, h: 24 },
  // Wall splitting the middle hall's right side, gap at the bottom.
  { x: 540, y: 204, w: 24, h: 120 },
  // Wall over the bottom hall, gap in the middle.
  { x: 24, y: 396, w: 420, h: 24 },
  { x: 600, y: 396, w: 336, h: 24 },
];

// Display cases, statues and pillars: solid cover to hide behind.
export const COVERS = [
  { x: 120, y: 90, w: 64, h: 36, kind: 'case' },
  { x: 300, y: 90, w: 64, h: 36, kind: 'case' },
  { x: 660, y: 90, w: 64, h: 36, kind: 'case' },
  { x: 780, y: 90, w: 64, h: 36, kind: 'case' },
  { x: 150, y: 280, w: 72, h: 40, kind: 'case' },
  { x: 420, y: 260, w: 40, h: 40, kind: 'statue' },
  { x: 700, y: 300, w: 72, h: 40, kind: 'case' },
  { x: 300, y: 470, w: 72, h: 40, kind: 'case' },
  { x: 620, y: 470, w: 40, h: 40, kind: 'statue' },
  { x: 480, y: 320, w: 28, h: 28, kind: 'pillar' },
  { x: 90, y: 440, w: 28, h: 28, kind: 'pillar' },
  { x: 850, y: 440, w: 28, h: 28, kind: 'pillar' },
];

export const RELICS = [
  { x: 200, y: 118, name: 'Ember Ruby', taken: false },
  { x: 820, y: 160, name: 'Ember Sapphire', taken: false },
  { x: 480, y: 368, name: 'Ember Crown', taken: false },
];

export const EXIT = { x: 852, y: 512, w: 60, h: 56 };

export const PLAYER_START = { x: 80, y: 520 };

export const GUARDS = [
  {
    name: 'Mara',
    waypoints: [
      { x: 80, y: 150 },
      { x: 380, y: 150 },
      { x: 380, y: 60 },
      { x: 80, y: 60 },
    ],
  },
  {
    name: 'Ivo',
    waypoints: [
      { x: 640, y: 140 },
      { x: 860, y: 140 },
      { x: 860, y: 80 },
      { x: 640, y: 80 },
    ],
  },
  {
    name: 'Sena',
    waypoints: [
      { x: 90, y: 240 },
      { x: 380, y: 240 },
      { x: 380, y: 360 },
      { x: 90, y: 360 },
    ],
  },
  {
    name: 'Bram',
    waypoints: [
      { x: 150, y: 540 },
      { x: 760, y: 540 },
      { x: 760, y: 450 },
      { x: 150, y: 450 },
    ],
  },
  {
    name: 'Nadia',
    waypoints: [
      { x: 600, y: 250 },
      { x: 880, y: 250 },
      { x: 880, y: 360 },
      { x: 600, y: 360 },
    ],
  },
];

// Every solid rectangle in the level, walls and cover together.
export function solids() {
  return WALLS.concat(COVERS);
}

// True when the point sits inside any solid rectangle (with a margin).
export function pointBlocked(x, y, margin) {
  for (const s of solids()) {
    if (x > s.x - margin && x < s.x + s.w + margin && y > s.y - margin && y < s.y + s.h + margin) return true;
  }
  return false;
}
