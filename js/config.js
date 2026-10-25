/**
 * Iris Residences — Phase 1 exterior study.
 *
 * All dimensions below are *visual estimates* derived from published renders.
 * They are not surveyed measurements and must not be used for construction.
 *
 * World coordinates:
 *   +X  → building's right-hand end when viewed from the entrance front
 *   +Z  → the main entrance / front elevation
 *   +Y  → up. Ground plane is y = 0.
 *   Origin lies at the centre of the site, below the centre of the tower.
 */

export const BUILDING = Object.freeze({
  length: 64,              // estimated overall length of the slab
  depth: 20,               // estimated overall depth
  groundHeight: 4.35,      // double-height colonnade / lobby zone
  floorHeight: 3.03,       // approximate typical floor height
  levels: 14,              // visible residential levels above the plinth
  endFinWidth: 2.4,        // broad white corner blades
  slotWidth: 2.1,          // deep vertical facade channels
  crownHeight: 7.9,        // open rooftop crown above terrace slab
  baysPerWing: 3,
  entrance: Object.freeze({ x: 17.2, width: 7.4, depth: 4.6 })
});

export const HALF_L = BUILDING.length / 2;
export const HALF_D = BUILDING.depth / 2;
export const ROOF_Y = BUILDING.groundHeight + BUILDING.levels * BUILDING.floorHeight;
export const CROWN_TOP = ROOF_Y + BUILDING.crownHeight;

// The long elevation is divided into three wings by two deep vertical channels.
const USABLE_LENGTH = BUILDING.length - 2 * BUILDING.endFinWidth - 2 * BUILDING.slotWidth;
const WING_WIDTH = USABLE_LENGTH / 3;

export const WINGS = Object.freeze([
  Object.freeze({ x0: -HALF_L + BUILDING.endFinWidth, x1: -HALF_L + BUILDING.endFinWidth + WING_WIDTH }),
  Object.freeze({ x0: -WING_WIDTH / 2, x1: WING_WIDTH / 2 }),
  Object.freeze({ x0: HALF_L - BUILDING.endFinWidth - WING_WIDTH, x1: HALF_L - BUILDING.endFinWidth })
]);

export const SLOTS = Object.freeze([
  Object.freeze({ x0: WINGS[0].x1, x1: WINGS[1].x0 }),
  Object.freeze({ x0: WINGS[1].x1, x1: WINGS[2].x0 })
]);

export const ENTRANCE = Object.freeze({
  ...BUILDING.entrance,
  z: HALF_D
});

/** Public viewing area. The landscape beyond this is deliberately conceptual. */
export const SITE = Object.freeze({
  groundSize: 1400,
  plotX: 72,
  plotZ: 56,
  boundaryFrontZ: 48,
  boundaryRearZ: -46,
  roadZ: 58,
  roadWidth: 14,
  driveX: 9,
  gateZ: 43.5,
  frontLawnZ: 32,
  rearLawnZ: -28
});

/** Warm low sun from the front-left, matching the supplied sunset reference. */
export const SUN_DIRECTION = Object.freeze([-0.66, 0.185, 0.73]);

export const CAMERA = Object.freeze({
  fov: 38,
  near: 0.12,
  far: 1700,
  minDistance: 7.5,
  maxDistance: 275,
  minPolar: 0.035,
  maxPolar: Math.PI * 0.492,
  home: 'home'
});

/**
 * Outer navigation bounds shared by orbit, pan and free-look. Target bounds
 * are checked before camera bounds, and camera bounds allow a full orbit at
 * maximum distance around any permitted target. This prevents one limit from
 * fighting another and snapping the view during a mode handoff.
 */
export const NAV_BOUNDS = Object.freeze({
  targetXZ: 360,
  targetY: 320,
  cameraXZ: 635,
  cameraY: 595,
  freeLookXZ: 300,
  freeLookY: 300
});

// Leave null to use the bundled procedural reconstruction. If an approved
// architect-supplied GLB/GLTF is added, set a project-relative URL here.
export const EXTERIOR_MODEL_URL = null;

export const INTRO_DURATION_MS = 7200;

export const PALETTE = Object.freeze({
  ink: '#0d1922',
  ivory: '#f3efe5',
  gold: '#c7a46e',
  horizon: '#e6b48d'
});
