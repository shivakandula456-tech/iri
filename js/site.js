import * as THREE from 'three';
import { BUILDING, ENTRANCE, HALF_D, HALF_L, SITE } from './config.js';
import { ModelBuilder, createPalmFrondGeometry } from './geometry-kit.js';
import { createCanvasTexture, makeWordmarkTexture, mulberry32, randRange } from './utils.js';

/**
 * Conceptual landscape study. The published renders establish the character
 * of the grounds — a gated drive, tropical planting, a lawn, play space and
 * recreation court — but not surveyed dimensions or exact positions. Every
 * dimension and plant position here is an artistic inference.
 */

const PLOT = Object.freeze({ x: 67, front: 46, rear: -46 });
const LOOP = Object.freeze({ x: 7, z: 25, rx: 23.5, rz: 12.4, ix: 14.6, iz: 5.5 });
const GATE = Object.freeze({ x: 17.2, z: 45.6, opening: 9.6 });
const PLAY = Object.freeze({ x: -44, z: 27, radius: 7.6 });
const COURT = Object.freeze({ x: -46, z: 6, width: 20, depth: 10 });

const TOP = 0.06;

function slab(c, material, x, z, width, depth, {
  y = TOP,
  height = 0.08,
  cast = false
} = {}) {
  c.builder.box(material, x, y + height / 2, z, width, height, depth, {
    cast,
    receive: true
  });
}

function circleMesh(material, radius, x, y, z, scaleX = 1, scaleZ = 1, segments = 72) {
  const geometry = new THREE.CircleGeometry(radius, segments);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(scaleX, 1, scaleZ);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}

function ringMesh(material, inner, outer, x, y, z, scaleX = 1, scaleZ = 1) {
  const geometry = new THREE.RingGeometry(inner, outer, 80);
  geometry.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.scale.set(scaleX, 1, scaleZ);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  return mesh;
}

function addCollider(colliders, x, z, width, depth, height) {
  colliders.push(new THREE.Box3(
    new THREE.Vector3(x - width / 2, 0, z - depth / 2),
    new THREE.Vector3(x + width / 2, height, z + depth / 2)
  ));
}

export function buildSite(materials, { animateTraffic = true } = {}) {
  const c = {
    builder: new ModelBuilder('Iris Residences — grounds'),
    mats: materials,
    random: mulberry32(0x51e7a1),
    colliders: [],
    frond: createPalmFrondGeometry(4.7, 0.62)
  };

  buildGround(c);
  buildRoad(c);
  buildDrive(c);
  buildPlaza(c);
  buildBoundaryAndGate(c);
  buildPaths(c);
  buildPlantingBeds(c);
  buildPlayGarden(c);
  buildRecreationCourt(c);
  buildFurniture(c);
  buildLightingProps(c);
  plantTrees(c);
  plantDistantBelt(c);

  const group = c.builder.finalize();
  group.name = 'Iris Residences — conceptual grounds';

  const traffic = buildTraffic(c, group, animateTraffic);
  addAmbientGlow(group);

  group.userData.metadata = {
    description: 'Conceptual landscaped setting reconstructed from the project renders.',
    plot: 'Approximate visual envelope; not a surveyed boundary.',
    hardscape: 'Gated entry, drop-off loop, entrance plaza, perimeter walks — inferred.',
    planting: 'Tropical and broadleaf planting palette inferred from renders.',
    accuracy: 'Conceptual / approximate. Amenity positions and quantities are not established by survey.'
  };
  group.userData.stats = c.builder.group.userData.stats;

  return {
    group,
    colliders: c.colliders,
    stats: group.userData.stats,
    traffic,
    update(dt) {
      traffic.update(dt);
    }
  };
}

/* -------------------------------------------------------------------------- */
/*  Ground, road and arrival                                                   */
/* -------------------------------------------------------------------------- */

function buildGround(c) {
  const { builder, mats } = c;

  const base = new THREE.Mesh(new THREE.PlaneGeometry(SITE.groundSize, SITE.groundSize), mats.lawnFar);
  base.rotation.x = -Math.PI / 2;
  base.position.set(0, -0.07, 0);
  base.receiveShadow = true;
  base.name = 'Outer grassland';
  builder.addMesh(base, { castShadow: false, receiveShadow: true });

  // Fine-grained lawn inside the conceptual plot.
  builder.box(mats.lawn, 0, 0.0, 0, PLOT.x * 2, 0.08, 92, {
    cast: false,
    receive: true
  });

  // Subtle mown insets give the large lawn some scale.
  slab(c, mats.lawnInset, -40, -28, 34, 20, { y: 0.05, height: 0.02 });
  slab(c, mats.lawnInset, 42, -25, 26, 28, { y: 0.05, height: 0.02 });
  slab(c, mats.lawnInset, 49, 31, 20, 15, { y: 0.05, height: 0.02 });
}

function buildRoad(c) {
  const { builder, mats, random } = c;

  builder.box(mats.asphalt, 0, 0.055, SITE.roadZ, 520, 0.11, SITE.roadWidth, {
    cast: false,
    receive: true
  });
  slab(c, mats.pavingWalk, 0, 47.6, 520, 2.6, { y: 0.04, height: 0.09 });
  slab(c, mats.concrete, 0, 49.05, 520, 0.34, { y: 0.06, height: 0.26 });
  slab(c, mats.concrete, 0, 60.95, 520, 0.34, { y: 0.06, height: 0.26 });

  // Edge lines and centre dashes.
  for (const z of [49.6, 60.4]) {
    builder.box(mats.whiteLine, 0, 0.12, z, 520, 0.012, 0.12, {
      cast: false,
      receive: false
    });
  }
  for (let x = -252; x <= 252; x += 9) {
    builder.box(mats.whiteLine, x, 0.12, SITE.roadZ, 3.6, 0.012, 0.14, {
      cast: false,
      receive: false
    });
  }

  // Crosswalk east of the arrival gate.
  for (let i = 0; i < 7; i += 1) {
    builder.box(mats.whiteLine, 31 + i * 1.05, 0.12, SITE.roadZ, 0.62, 0.012, 9.6, {
      cast: false,
      receive: false
    });
  }

  // A little roadside verge planting behind the pavement.
  for (let i = 0; i < 30; i += 1) {
    const x = -160 + i * 11 + randRange(random, -2, 2);
    if (Math.abs(x - GATE.x) < 18) continue;
    builder.ico(mats.foliageLight, x, 0.65, 44.2, 1.4, 0.95, 1.6, {
      color: 0xb2c4a1,
      cast: true,
      receive: true
    });
    builder.ico(mats.hedge, x + 2.4, 0.45, 45.1, 1.1, 0.7, 1.2, {
      cast: true,
      receive: true
    });
  }
}

function buildDrive(c) {
  const { builder, mats } = c;

  // Straight approach from the gate into the drop-off loop.
  slab(c, mats.asphaltDrive, GATE.x, 40.9, 9.2, 12.8, { y: 0.065, height: 0.1 });
  for (const x of [GATE.x - 4.75, GATE.x + 4.75]) {
    builder.box(mats.concrete, x, 0.16, 40.9, 0.32, 0.2, 12.8, {
      cast: false,
      receive: true
    });
  }

  // Elliptical drop-off loop and planted island.
  const loop = circleMesh(mats.asphaltLoop, 1, LOOP.x, 0.16, LOOP.z, LOOP.rx, LOOP.rz, 88);
  loop.name = 'Drop-off loop';
  builder.addMesh(loop, { castShadow: false, receiveShadow: true });

  const outerCurb = ringMesh(mats.concrete, 0.958, 1, LOOP.x, 0.185, LOOP.z, LOOP.rx + 0.25, LOOP.rz + 0.25);
  builder.addMesh(outerCurb, { castShadow: false, receiveShadow: true });

  const island = circleMesh(mats.lawnInset, 1, LOOP.x, 0.195, LOOP.z, LOOP.ix, LOOP.iz, 72);
  island.name = 'Planted island';
  builder.addMesh(island, { castShadow: false, receiveShadow: true });
  const islandCurb = ringMesh(mats.stone, 0.94, 1, LOOP.x, 0.215, LOOP.z, LOOP.ix + 0.35, LOOP.iz + 0.35);
  builder.addMesh(islandCurb, { castShadow: false, receiveShadow: true });

  // Painted edge line along the loop's building side.
  const line = ringMesh(mats.whiteLine, 0.873, 0.881, LOOP.x, 0.172, LOOP.z, LOOP.rx, LOOP.rz);
  builder.addMesh(line, { castShadow: false, receiveShadow: false });

  // Bollards flanking the gate approach.
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i += 1) {
      addBollard(c, GATE.x + side * 5.15, 37.3 + i * 2.8);
    }
  }

  // Island planting.
  addPalm(c, 3.4, 24.8, 7.4, -0.25, 0.35);
  addPalm(c, 11.1, 25.6, 8.3, 0.4, -0.2);
  addShrubMass(c, 6.2, 22.1, 3.6, 1.4, 8, 0.55);
  addShrubMass(c, 6.3, 28.1, 3.3, 1.2, 7, 0.5);
  addFlowerCluster(c, 9.8, 21.9, 0.8);
}

function buildPlaza(c) {
  const { builder, mats } = c;

  slab(c, mats.pavingCourt, ENTRANCE.x, 12.9, 41.5, 7.1, { y: 0.055, height: 0.09 });
  slab(c, mats.stone, ENTRANCE.x, 15.5, 2.6, 5.1, { y: 0.15, height: 0.015 });
  for (const z of [10.4, 13.4, 16.4]) {
    builder.box(mats.whiteSoft, ENTRANCE.x, 0.152, z, 41.2, 0.012, 0.17, {
      cast: false,
      receive: true
    });
  }

  // Two generous planters frame the porch beyond the building's own beds.
  for (const side of [-1, 1]) {
    const x = ENTRANCE.x + side * 8.7;
    builder.box(mats.stone, x, 0.31, 15.5, 3.0, 0.62, 1.5, { cast: true, receive: true });
    builder.box(mats.soil, x, 0.63, 15.5, 2.75, 0.06, 1.25, { cast: false, receive: true });
    addShrubMass(c, x, 15.5, 2.4, 0.75, 7, 0.5, 0.64);
    addFlowerCluster(c, x + 0.4, 15.5, 0.55, 0.8);
  }

  // A slim inlaid line leads from the loop to the lobby doors.
  builder.box(mats.goldDeep, ENTRANCE.x, 0.153, 15.9, 0.09, 0.012, 2.1, {
    cast: false,
    receive: false
  });
}

/* -------------------------------------------------------------------------- */
/*  Boundary, gate portal and name wall                                        */
/* -------------------------------------------------------------------------- */

function addWall(c, x0, x1, z, height = 1.28, material = null) {
  const { builder, mats } = c;
  const width = x1 - x0;
  const wall = material || mats.whiteSoft;
  builder.box(wall, (x0 + x1) / 2, height / 2, z, width, height, 0.5, {
    cast: true,
    receive: true
  });
  builder.box(mats.stone, (x0 + x1) / 2, height + 0.07, z, width + 0.16, 0.14, 0.66, {
    cast: true,
    receive: true
  });
}

function buildBoundaryAndGate(c) {
  const { builder, mats, random, colliders } = c;

  // Front wall, interrupted by the gate and name wall.
  addWall(c, -PLOT.x, 11.55, PLOT.front);
  addWall(c, 22.85, 26.0, PLOT.front);
  addWall(c, 37.0, PLOT.x, PLOT.front);
  for (const x of [-60, -50, -40, -30, -20, -10, 2, 26.5, 41, 51, 61]) {
    builder.box(mats.white, x, 0.8, PLOT.front, 0.62, 1.6, 0.74, { cast: true, receive: true });
    builder.box(mats.stone, x, 1.66, PLOT.front, 0.78, 0.13, 0.88, { cast: true, receive: true });
  }

  // Hedges behind the boundary and along the other three edges.
  addHedgeLine(c, -65.2, 10.3, 45.15, 1.55, 1.25);
  addHedgeLine(c, 23.4, 25.4, 45.15, 1.55, 1.25);
  addHedgeLine(c, 37.6, 65.2, 45.15, 1.55, 1.25);
  addHedgeLine(c, -65.4, 65.4, -45.5, 1.85, 1.4, true);
  for (const x of [-66.2, 66.2]) {
    builder.box(mats.hedge, x, 0.9, 0, 1.6, 1.8, 88, { cast: true, receive: true });
    for (let z = -40; z <= 40; z += 5) {
      builder.ico(mats.foliageLight, x + randRange(random, -0.3, 0.3), 1.85, z, 1.5, 0.8, 1.6, {
        color: 0xb4c5a0,
        cast: true,
        receive: true
      });
    }
  }

  // Gate portal.
  const pierOffset = GATE.opening / 2 + 0.65;
  for (const side of [-1, 1]) {
    const x = GATE.x + side * pierOffset;
    builder.box(mats.white, x, 2.72, GATE.z, 1.3, 5.44, 1.55, { cast: true, receive: true });
    builder.box(mats.stone, x, 5.53, GATE.z, 1.62, 0.18, 1.88, { cast: true, receive: true });
    builder.box(mats.darkMetal, x, 5.43, GATE.z, 1.36, 0.03, 1.62, { cast: false, receive: false });
    addCollider(colliders, x, GATE.z, 1.35, 1.6, 5.5);
    // Vertical shadow reveal on each pier.
    builder.box(mats.slotDark, x - side * 0.655, 2.7, GATE.z, 0.02, 5.1, 1.0, {
      cast: false,
      receive: true
    });
  }

  builder.box(mats.white, GATE.x, 5.55, GATE.z, 14.1, 0.55, 2.05, {
    cast: true,
    receive: true
  });
  builder.box(mats.timber, GATE.x, 5.24, GATE.z, 13.2, 0.16, 1.8, {
    cast: false,
    receive: true
  });
  builder.box(mats.timber, GATE.x, 5.85, GATE.z, 14.4, 0.18, 2.25, {
    cast: true,
    receive: true
  });
  builder.box(mats.goldDeep, GATE.x, 5.97, GATE.z, 14.5, 0.04, 2.28, {
    cast: false,
    receive: false
  });

  // Bronze slat veil above the opening.
  const slatCount = 34;
  for (let i = 0; i < slatCount; i += 1) {
    const x = GATE.x - GATE.opening / 2 + 0.15 + (i / (slatCount - 1)) * (GATE.opening - 0.3);
    builder.box(mats.gateSlat, x, 4.62, GATE.z - 0.18, 0.065, 1.55, 0.1, {
      cast: false,
      receive: true
    });
  }
  builder.box(mats.goldDeep, GATE.x, 3.84, GATE.z - 0.18, GATE.opening, 0.07, 0.13, {
    cast: false,
    receive: true
  });
  builder.box(mats.goldDeep, GATE.x, 5.4, GATE.z - 0.18, GATE.opening, 0.07, 0.13, {
    cast: false,
    receive: true
  });

  // Warm downlights under the gate canopy.
  for (const x of [GATE.x - 3.4, GATE.x, GATE.x + 3.4]) {
    builder.box(mats.lightWarm, x, 5.13, GATE.z + 0.42, 0.34, 0.025, 0.16, {
      cast: false,
      receive: false
    });
  }
  // Gravel inlay at the threshold.
  slab(c, mats.stone, GATE.x, 45.1, 9.4, 0.8, { y: 0.075, height: 0.015 });

  // Name wall, integrated into the boundary line.
  builder.box(mats.whiteSoft, 31.5, 1.4, PLOT.front, 10.4, 2.8, 0.52, {
    cast: true,
    receive: true
  });
  builder.box(mats.stone, 31.5, 2.88, PLOT.front, 10.7, 0.16, 0.72, {
    cast: true,
    receive: true
  });
  builder.box(mats.goldDeep, 31.5, 0.1, PLOT.front + 0.27, 10.4, 0.12, 0.05, {
    cast: false,
    receive: false
  });
  addCollider(colliders, 31.5, PLOT.front, 10.4, 0.6, 3.0);

  const wordmark = makeWordmarkTexture({
    ink: '#5b4632',
    sub: 'MUNDHWA · PUNE'
  });
  const signMaterial = new THREE.MeshBasicMaterial({
    map: wordmark,
    transparent: true,
    depthWrite: false,
    toneMapped: true
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 2.02), signMaterial);
  sign.position.set(31.5, 1.62, PLOT.front + 0.272);
  sign.name = 'Iris name wall wordmark';
  builder.addMesh(sign, { castShadow: false, receiveShadow: false });

  // Uplights wash the sign.
  for (const x of [28.0, 35.0]) {
    builder.box(mats.pole, x, 0.22, PLOT.front + 0.52, 0.18, 0.34, 0.18, {
      cast: false,
      receive: false
    });
    builder.box(mats.lightWarm, x, 0.4, PLOT.front + 0.53, 0.13, 0.02, 0.09, {
      cast: false,
      receive: false
    });
  }

  for (const x of [26.8, 36.2]) {
    builder.box(mats.stone, x, 0.3, PLOT.front + 0.75, 1.4, 0.6, 0.9, {
      cast: true,
      receive: true
    });
    builder.box(mats.soil, x, 0.61, PLOT.front + 0.75, 1.2, 0.05, 0.72, {
      cast: false,
      receive: true
    });
    addShrubMass(c, x, PLOT.front + 0.75, 1.1, 0.6, 4, 0.42, 0.66);
    addFlowerCluster(c, x + 0.2, PLOT.front + 0.75, 0.45, 0.75);
  }

  // Security cabin, set back inside the gate. Indicative only.
  const cabinX = 28.4;
  const cabinZ = 41.4;
  builder.box(mats.whiteSoft, cabinX, 1.5, cabinZ, 3.4, 3.0, 2.7, {
    cast: true,
    receive: true
  });
  builder.box(mats.darkMetal, cabinX, 3.08, cabinZ, 3.75, 0.18, 3.05, {
    cast: true,
    receive: true
  });
  builder.box(mats.glassWarm, cabinX, 1.72, cabinZ + 1.36, 2.5, 1.55, 0.06, {
    cast: false,
    receive: true
  });
  builder.box(mats.darkMetal, cabinX, 0.85, cabinZ + 1.385, 2.8, 0.08, 0.06, {
    cast: false,
    receive: false
  });
  addCollider(colliders, cabinX, cabinZ, 3.7, 3.0, 3.2);
}

function addHedgeLine(c, x0, x1, z, height, depth, clumps = false) {
  const { builder, mats, random } = c;
  const width = x1 - x0;
  builder.box(mats.hedge, (x0 + x1) / 2, height / 2, z, width, height, depth, {
    cast: true,
    receive: true
  });
  const count = Math.max(2, Math.round(width / 2.4));
  for (let i = 0; i < count; i += 1) {
    const x = x0 + (i + 0.5) * (width / count);
    builder.ico(mats.foliageLight, x, height - 0.05, z + randRange(random, -0.12, 0.12), 1.25, 0.6, depth * 0.7, {
      color: 0xa9bd98,
      cast: true,
      receive: true
    });
    if (clumps && i % 3 === 0) {
      addFlowerCluster(c, x + 0.7, z + 0.1, 0.5, height + 0.1);
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Perimeter paths                                                            */
/* -------------------------------------------------------------------------- */

function buildPaths(c) {
  const { builder, mats } = c;

  slab(c, mats.pavingWalk, -36.5, 18.6, 55, 2.7, { y: 0.055, height: 0.075 });
  slab(c, mats.pavingWalk, 51.0, 18.6, 25, 2.7, { y: 0.055, height: 0.075 });
  slab(c, mats.pavingWalk, -35.8, 0.8, 2.7, 33, { y: 0.055, height: 0.075 });
  slab(c, mats.pavingWalk, 35.8, 0.8, 2.7, 33, { y: 0.055, height: 0.075 });
  slab(c, mats.pavingWalk, 0, -17.2, 71.6, 2.7, { y: 0.055, height: 0.075 });
  slab(c, mats.pavingWalk, -44, 20.7, 2.5, 4.4, { y: 0.055, height: 0.075 });
  slab(c, mats.pavingWalk, -44, 13.3, 2.5, 6.2, { y: 0.055, height: 0.075 });

  // Low stone kerbs mark the principal walk edges.
  for (const x of [-64.2, -8.9]) {
    builder.box(mats.stone, x, 0.1, 18.6, 0.2, 0.2, 2.9, { cast: false, receive: true });
  }
  for (const x of [-37.3, -34.3, 34.3, 37.3]) {
    builder.box(mats.stone, x, 0.1, 0.8, 0.22, 0.2, 33, { cast: false, receive: true });
  }
  for (const x of [-35.6, 35.6]) {
    builder.box(mats.stone, x, 0.13, -17.2, 0.22, 0.26, 2.9, { cast: false, receive: true });
  }
}

/* -------------------------------------------------------------------------- */
/*  Planting beds and garden structure                                         */
/* -------------------------------------------------------------------------- */

function buildPlantingBeds(c) {
  const { builder, mats } = c;

  // Front bed to the left of the entrance plaza.
  builder.box(mats.stone, -19.6, 0.2, 11.5, 28.0, 0.4, 1.8, { cast: true, receive: true });
  builder.box(mats.soil, -19.6, 0.42, 11.5, 27.6, 0.06, 1.5, { cast: false, receive: true });
  for (let i = 0; i < 18; i += 1) {
    const x = -32.2 + i * 1.52;
    addShrub(c, x, 11.5 + randRange(c.random, -0.3, 0.3), randRange(c.random, 0.45, 0.85), 0.48);
  }
  addFlowerCluster(c, -29.8, 11.6, 0.7, 0.7);
  addFlowerCluster(c, -8.8, 11.4, 0.62, 0.7);

  // Rear facade bed, deliberately low so the ground floor stays legible.
  builder.box(mats.stone, 0, 0.16, -11.35, 59.0, 0.32, 1.4, { cast: true, receive: true });
  builder.box(mats.soil, 0, 0.35, -11.35, 58.6, 0.05, 1.15, { cast: false, receive: true });
  for (let i = 0; i < 34; i += 1) {
    const x = -28.2 + i * 1.72;
    addShrub(c, x, -11.35 + randRange(c.random, -0.22, 0.22), randRange(c.random, 0.35, 0.7), 0.42);
  }

  // Side-end planters.
  for (const end of [-1, 1]) {
    builder.box(mats.stone, end * 33.4, 0.15, 0, 1.5, 0.3, 8.0, {
      cast: true,
      receive: true
    });
    builder.box(mats.soil, end * 33.4, 0.32, 0, 1.2, 0.05, 7.6, {
      cast: false,
      receive: true
    });
    for (let i = 0; i < 5; i += 1) {
      addShrub(c, end * 33.4, -3.0 + i * 1.5, randRange(c.random, 0.35, 0.6), 0.4);
    }
  }

  // Pergola and seating beside the play garden.
  addTimberPergola(c, -55.0, 33.8, 5.6, 3.4);
  addBench(c, -55.0, 32.9, 0, 0);
  addFlowerCluster(c, -57.0, 34.6, 0.9, 2.8);
  addFlowerCluster(c, -52.9, 35.1, 0.8, 2.9);

  // Loose garden boulders.
  for (const [x, z, s] of [[-9.6, 20.4, 0.8], [38.8, 16.5, 0.6], [-61.0, 9.2, 0.7]]) {
    builder.ico(mats.stone, x, 0.25 * s, z, s, s * 0.55, s * 0.8, {
      cast: true,
      receive: true
    });
  }
}

function addShrub(c, x, z, scale, y = 0.1) {
  const { builder, mats, random } = c;
  const tint = [
    0xb3c6a0, 0x9fb88f, 0xc1cfa9, 0x8fab84, 0xd0d3b2
  ][Math.floor(random() * 5)];
  builder.ico(mats.foliageLight, x, y + scale * 0.56, z, scale, scale * 0.72, scale, {
    color: tint,
    cast: true,
    receive: true
  });
  if (random() < 0.16) {
    builder.ico(mats.flowerCream, x + scale * 0.28, y + scale * 0.8, z, scale * 0.26, scale * 0.2, scale * 0.26, {
      cast: false,
      receive: true
    });
  }
}

function addShrubMass(c, x, z, radiusX, radiusZ, count, scale, y = 0.15) {
  const { builder, mats, random } = c;
  for (let i = 0; i < count; i += 1) {
    const angle = random() * Math.PI * 2;
    const r = Math.sqrt(random());
    const px = x + Math.cos(angle) * radiusX * r * 0.5;
    const pz = z + Math.sin(angle) * radiusZ * r * 0.5;
    const s = scale * randRange(random, 0.65, 1.15);
    builder.ico(mats.foliageLight, px, y + s * 0.55, pz, s, s * 0.7, s, {
      color: [0xaec3a0, 0x99b38c, 0xc3d0ad][i % 3],
      cast: true,
      receive: true
    });
  }
}

function addFlowerCluster(c, x, z, scale, y = 0.2) {
  const { builder, mats, random } = c;
  const count = 4 + Math.floor(random() * 4);
  for (let i = 0; i < count; i += 1) {
    const px = x + randRange(random, -scale * 1.3, scale * 1.3);
    const pz = z + randRange(random, -scale * 0.9, scale * 0.9);
    const s = scale * randRange(random, 0.35, 0.75);
    builder.ico(
      random() < 0.62 ? mats.flowerPink : mats.flowerCream,
      px,
      y + randRange(random, 0.1, 0.55) * scale,
      pz,
      s,
      s * 0.65,
      s,
      { cast: false, receive: true }
    );
  }
}

function addTimberPergola(c, x, z, width, depth) {
  const { builder, mats } = c;
  const h = 2.9;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      builder.box(mats.timber, x + sx * (width / 2 - 0.16), h / 2, z + sz * (depth / 2 - 0.16), 0.22, h, 0.22, {
        cast: true,
        receive: true
      });
    }
  }
  for (const sz of [-1, 1]) {
    builder.box(mats.timber, x, h, z + sz * (depth / 2 - 0.16), width, 0.23, 0.24, {
      cast: true,
      receive: true
    });
  }
  for (let i = 0; i < 9; i += 1) {
    builder.box(mats.timber, x - width / 2 + 0.35 + i * ((width - 0.7) / 8), h + 0.2, z, 0.1, 0.1, depth, {
      cast: true,
      receive: true
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Play garden and recreation court                                           */
/* -------------------------------------------------------------------------- */

function buildPlayGarden(c) {
  const { builder, mats, random } = c;

  const rubber = circleMesh(mats.playPurple, PLAY.radius, PLAY.x, 0.13, PLAY.z, 1, 1, 72);
  rubber.name = 'Play garden surface';
  builder.addMesh(rubber, { castShadow: false, receiveShadow: true });
  builder.addMesh(
    ringMesh(mats.playCream, PLAY.radius, PLAY.radius + 0.55, PLAY.x, 0.145, PLAY.z, 1, 1),
    { castShadow: false, receiveShadow: true }
  );
  for (const radius of [3.1, 4.9, 6.5]) {
    builder.addMesh(
      ringMesh(mats.playCream, radius, radius + 0.1, PLAY.x, 0.155, PLAY.z, 1, 1),
      { castShadow: false, receiveShadow: false }
    );
  }

  // Play tower.
  const tx = PLAY.x - 1.0;
  const tz = PLAY.z - 0.4;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      builder.box(mats.playWood, tx + sx * 1.05, 1.32, tz + sz * 1.05, 0.16, 2.35, 0.16, {
        cast: true,
        receive: true
      });
    }
  }
  builder.box(mats.playWood, tx, 1.23, tz, 2.4, 0.16, 2.4, { cast: true, receive: true });
  builder.box(mats.playPastel, tx, 2.62, tz, 2.85, 0.2, 2.85, { cast: true, receive: true });
  builder.box(mats.playCream, tx, 2.78, tz, 1.25, 0.12, 1.25, { cast: false, receive: true });
  for (let i = 0; i < 4; i += 1) {
    builder.box(mats.playWood, tx - 1.2 + i * 0.38, 0.42 + i * 0.24, tz + 1.28, 0.1, 0.1, 1.1, {
      cast: false,
      receive: true
    });
  }
  // Slide.
  builder.box(mats.playPastel, tx + 2.2, 0.85, tz - 0.4, 3.3, 0.14, 0.85, {
    cast: true,
    receive: true,
    rz: -0.28
  });
  for (const sz of [-1, 1]) {
    builder.box(mats.playCream, tx + 2.2, 1.12, tz - 0.4 + sz * 0.46, 3.25, 0.2, 0.08, {
      cast: false,
      receive: true,
      rz: -0.28
    });
  }

  // Swing frame.
  const sx0 = PLAY.x + 4.1;
  const sz0 = PLAY.z + 2.7;
  for (const side of [-1, 1]) {
    for (const dx of [-1.35, 1.35]) {
      builder.cylinder(mats.playWood, sx0 + dx, 1.32, sz0 + side * 0.82, 0.09, 2.64, {
        cast: true,
        receive: true,
        rz: side * dx > 0 ? 0.34 : -0.34
      });
    }
  }
  builder.box(mats.playWood, sx0, 2.62, sz0, 3.2, 0.16, 0.16, { cast: true, receive: true });
  for (let i = 0; i < 3; i += 1) {
    const x = sx0 - 1.05 + i * 1.05;
    for (const dz of [-0.42, 0.42]) {
      builder.box(mats.railMetal, x, 1.78, sz0 + dz, 0.022, 1.7, 0.022, {
        cast: false,
        receive: false
      });
    }
    builder.box(mats.playCream, x, 0.92, sz0, 0.58, 0.07, 0.42, { cast: true, receive: true });
  }

  // Curved climbing wall.
  const wallMaterial = mats.climbingWall.clone();
  wallMaterial.side = THREE.DoubleSide;
  const wallGeometry = new THREE.CylinderGeometry(5.8, 5.8, 2.7, 40, 1, true, Math.PI * 1.02, Math.PI * 0.42);
  const wall = new THREE.Mesh(wallGeometry, wallMaterial);
  wall.position.set(PLAY.x, 1.5, PLAY.z);
  wall.castShadow = true;
  wall.receiveShadow = true;
  wall.name = 'Curved play wall';
  builder.addMesh(wall, { castShadow: true, receiveShadow: true });
  for (let i = 0; i < 9; i += 1) {
    const angle = Math.PI * (1.07 + i * 0.043);
    builder.ico(
      i % 2 ? mats.playCream : mats.flowerPink,
      PLAY.x + Math.sin(angle) * 5.67,
      0.65 + (i % 4) * 0.48,
      PLAY.z + Math.cos(angle) * 5.67,
      0.13,
      0.1,
      0.08,
      { cast: false, receive: true }
    );
  }

  // Stepping stones and a little timber balance trail.
  for (let i = 0; i < 6; i += 1) {
    builder.cylinder(mats.playWood, PLAY.x + 3.6 + i * 0.55, 0.2, PLAY.z - 3.2 + i * 0.55, 0.26, 0.2, {
      cast: true,
      receive: true
    });
  }

  // Play garden hedge and flowers.
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    const x = PLAY.x + Math.cos(angle) * (PLAY.radius + 2.3);
    const z = PLAY.z + Math.sin(angle) * (PLAY.radius + 2.3);
    builder.ico(mats.foliageLight, x, 0.7, z, 1.7, 0.5, 1.4, {
      color: 0xa7ba96,
      cast: true,
      receive: true
    });
    if (i % 2 === 0) addFlowerCluster(c, x, z, 0.55, 0.45);
  }
  addSeat(c, PLAY.x + 1.5, PLAY.z + 6.9, Math.PI);
}

function buildRecreationCourt(c) {
  const { builder, mats, random } = c;
  const { x, z, width, depth } = COURT;

  slab(c, mats.courtGreen, x, z, width + 4.4, depth + 4.4, { y: 0.07, height: 0.09 });
  slab(c, mats.courtRed, x, z, width, depth, { y: 0.1, height: 0.045 });

  const lineY = 0.155;
  const hw = width / 2 - 0.5;
  const hd = depth / 2 - 0.5;
  for (const lz of [-hd, hd]) {
    builder.box(mats.whiteLine, x, lineY, z + lz, hw * 2, 0.01, 0.09, {
      cast: false,
      receive: false
    });
  }
  for (const lx of [-hw, hw]) {
    builder.box(mats.whiteLine, x + lx, lineY, z, 0.09, 0.01, hd * 2, {
      cast: false,
      receive: false
    });
  }
  builder.box(mats.whiteLine, x, lineY, z, 0.09, 0.01, hd * 2, { cast: false, receive: false });
  for (const lx of [-3.2, 3.2]) {
    builder.box(mats.whiteLine, x + lx, lineY, z, 0.07, 0.01, hd * 1.35, {
      cast: false,
      receive: false
    });
  }

  for (const lz of [-hd, hd]) {
    builder.box(mats.pole, x, 1.15, z + lz, 0.1, 2.3, 0.1, { cast: true, receive: true });
  }
  const netMaterial = new THREE.MeshBasicMaterial({
    color: 0xe7e2d4,
    transparent: true,
    opacity: 0.26,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  const net = new THREE.Mesh(new THREE.PlaneGeometry(depth - 0.2, 1.15), netMaterial);
  net.rotation.y = Math.PI / 2;
  net.position.set(x, 1.42, z);
  builder.addMesh(net, { castShadow: false, receiveShadow: false });

  // Hedge frame and a bench for spectators.
  for (const side of [-1, 1]) {
    const hx = x + side * (width / 2 + 2.2);
    builder.box(mats.hedge, hx, 0.58, z, 0.95, 1.16, depth + 4.4, {
      cast: true,
      receive: true
    });
    for (let i = 0; i < 5; i += 1) {
      builder.ico(mats.foliageLight, hx, 1.12, z - depth / 2 - 1.2 + i * 2.6, 1.1, 0.55, 1.2, {
        color: 0xa8bb97,
        cast: true,
        receive: true
      });
    }
  }
  for (let i = 0; i < 7; i += 1) {
    builder.ico(mats.foliageLight, x - 8 + i * 2.7, 0.55, z - depth / 2 - 2.0, 1.25, 0.65, 1.0, {
      color: 0xa8bb97,
      cast: true,
      receive: true
    });
  }
  addSeat(c, x + width / 2 + 3.4, z + 2.2, -Math.PI / 2);
  addFlowerCluster(c, x - width / 2 - 2.8, z + 3.0, 0.7, 0.5);
}

/* -------------------------------------------------------------------------- */
/*  Street furniture                                                           */
/* -------------------------------------------------------------------------- */

function addBench(c, x, z, rotationY = 0, _unused = 0) {
  const { builder, mats } = c;
  const sin = Math.sin(rotationY);
  const cos = Math.cos(rotationY);
  const place = (dx, dz) => [x + dx * cos + dz * sin, z - dx * sin + dz * cos];
  for (const dx of [-0.72, 0.72]) {
    const [px, pz] = place(dx, 0);
    builder.box(mats.concrete, px, 0.2, pz, 0.18, 0.4, 0.55, { cast: true, receive: true });
  }
  const [sx, sz] = place(0, 0);
  builder.box(mats.deckWarm, sx, 0.45, sz, 1.8, 0.1, 0.52, {
    cast: true,
    receive: true,
    ry: rotationY
  });
  const [bx, bz] = place(0, -0.23);
  builder.box(mats.deckWarm, bx, 0.79, bz, 1.8, 0.5, 0.09, {
    cast: true,
    receive: true,
    ry: rotationY,
    rx: -0.1
  });
}

/** A small table-height seat used inside/next to the play garden. */
function addSeat(c, x, z, rotationY = 0) {
  const { builder, mats } = c;
  builder.cylinder(mats.stone, x, 0.24, z, 0.38, 0.48, { cast: true, receive: true });
  builder.cylinder(mats.deckWarm, x, 0.51, z, 0.42, 0.1, {
    cast: true,
    receive: true,
    ry: rotationY
  });
}

function buildFurniture(c) {
  addBench(c, -24, -19.3, 0);
  addBench(c, 0, -19.3, 0);
  addBench(c, 24, -19.3, 0);
  addBench(c, -30, 20.4, Math.PI);
  addBench(c, 48.5, 20.4, Math.PI);
  addSeat(c, 6.0, 17.4, 0);
  addSeat(c, 28.5, 17.4, 0);
}

function buildLightingProps(c) {
  const { builder, mats } = c;

  // Bollards along the plaza and the arrival route.
  for (const x of [10.5, 23.9]) {
    for (let i = 0; i < 3; i += 1) addBollard(c, x, 18.6 + i * 3.0);
  }

  // Simple street lights along the front pavement.
  for (const x of [-37, 3, 45, 63]) {
    builder.cylinder(mats.pole, x, 2.75, 48.0, 0.09, 5.5, { cast: true, receive: true });
    builder.box(mats.pole, x, 5.42, 48.0, 0.12, 0.12, 1.0, { cast: true, receive: true });
    builder.box(mats.pole, x, 5.32, 48.55, 0.34, 0.2, 0.7, { cast: true, receive: true });
    builder.box(mats.lightLens, x, 5.2, 48.55, 0.26, 0.04, 0.58, {
      cast: false,
      receive: false
    });
  }

  // Low path lights at the rear walk.
  for (const x of [-28, -14, 14, 28]) {
    builder.cylinder(mats.pole, x, 0.32, -18.6, 0.05, 0.64, { cast: true, receive: true });
    builder.box(mats.lightWarm, x, 0.66, -18.6, 0.16, 0.05, 0.16, {
      cast: false,
      receive: false
    });
  }

  // Entrance wall-wash fixtures beside the canopy.
  for (const side of [-1, 1]) {
    const x = ENTRANCE.x + side * 5.9;
    builder.box(mats.pole, x, 0.3, 17.2, 0.13, 0.6, 0.13, { cast: false, receive: false });
    builder.box(mats.lightWarm, x, 0.61, 17.2, 0.1, 0.03, 0.08, {
      cast: false,
      receive: false
    });
  }
}

function addBollard(c, x, z) {
  const { builder, mats } = c;
  builder.cylinder(mats.pole, x, 0.46, z, 0.075, 0.92, { cast: true, receive: true });
  builder.cylinder(mats.lightWarm, x, 0.95, z, 0.085, 0.06, {
    cast: false,
    receive: false
  });
}

/* -------------------------------------------------------------------------- */
/*  Trees                                                                       */
/* -------------------------------------------------------------------------- */

function addBroadleaf(c, x, z, scale, { far = false } = {}) {
  const { builder, mats, random } = c;
  const trunkHeight = 4.2 * scale;
  builder.cylinder(mats.trunk, x, trunkHeight / 2, z, 0.19 * scale, trunkHeight, {
    cast: !far,
    receive: true
  });
  for (let i = 0; i < 2; i += 1) {
    const angle = random() * Math.PI * 2;
    builder.cylinder(
      mats.trunk,
      x + Math.cos(angle) * 0.55 * scale,
      trunkHeight * 0.78,
      z + Math.sin(angle) * 0.55 * scale,
      0.11 * scale,
      2.1 * scale,
      {
        cast: !far,
        receive: true,
        rx: Math.cos(angle) * 0.5,
        rz: Math.sin(angle) * 0.5
      }
    );
  }

  const tints = [0xb9cfa9, 0xa7c097, 0xcad9b6, 0x96b189, 0xd2d8b9];
  const blobs = far ? 4 : 6;
  for (let i = 0; i < blobs; i += 1) {
    const angle = (i / blobs) * Math.PI * 2 + random() * 0.6;
    const radius = i === 0 ? 0 : randRange(random, 0.7, 1.7) * scale;
    const bx = x + Math.cos(angle) * radius;
    const bz = z + Math.sin(angle) * radius;
    const by = trunkHeight + randRange(random, 0.1, 1.3) * scale;
    const s = randRange(random, 1.35, 2.25) * scale;
    builder.ico(mats.foliage, bx, by, bz, s, s * randRange(random, 0.72, 1.0), s, {
      color: tints[Math.floor(random() * tints.length)],
      cast: !far,
      receive: true,
      fine: !far
    });
  }
}

function addPalm(c, x, z, height, leanX = 0, leanZ = 0) {
  const { builder, mats, random } = c;
  const segments = 6;
  let px = x;
  let pz = z;
  for (let i = 0; i < segments; i += 1) {
    const t = i / segments;
    const stepX = leanX * (t + 0.16);
    const stepZ = leanZ * (t + 0.16);
    px = x + stepX;
    pz = z + stepZ;
    const radius = 0.2 - i * 0.014;
    builder.cylinder(mats.trunk, px, (i + 0.5) * (height / segments), pz, radius, height / segments + 0.1, {
      cast: true,
      receive: true,
      rx: leanZ * 0.05,
      rz: -leanX * 0.05
    });
    builder.cylinder(mats.trunk, px, (i + 0.92) * (height / segments), pz, radius + 0.018, 0.1, {
      cast: false,
      receive: true
    });
  }

  const crownY = height + 0.2;
  const fronds = 11;
  for (let i = 0; i < fronds; i += 1) {
    const angle = (i / fronds) * Math.PI * 2 + random() * 0.25;
    const scale = randRange(random, 0.86, 1.18);
    builder.customInstances(
      mats.palmLeaf,
      c.frond,
      [
        px,
        crownY,
        pz,
        scale,
        scale,
        scale,
        -0.16 + random() * 0.28,
        angle,
        randRange(random, -0.12, 0.12)
      ],
      { cast: true, receive: true }
    );
  }
  for (let i = 0; i < 3; i += 1) {
    builder.ico(mats.flowerCream, px + (i - 1) * 0.16, crownY - 0.2, pz + (i % 2) * 0.16, 0.14, 0.12, 0.14, {
      cast: false,
      receive: true
    });
  }
}

function plantTrees(c) {
  const smallTrees = [
    [-60, 37, 1.08], [-58, 12, 1.2], [-38, 38.5, 1.12], [-24, 35.5, 1.0],
    [-12, 39.0, 1.16], [35.0, 36.0, 1.08], [46.0, 38.5, 1.2],
    [57.0, 34.0, 1.05], [63.0, 14.0, 1.16], [46.5, 25.4, 0.95],
    [56.0, 8.0, 1.02], [-58, -20, 1.15], [-52, -36, 1.2],
    [-36, -41, 1.08], [-20, -38, 0.98], [-7, -42, 1.18],
    [10, -40, 1.05], [24, -36, 1.12], [40, -41, 1.22],
    [54, -34, 1.02], [62, -18, 1.12], [-28, -23, 0.82],
    [27, -23, 0.8], [-63, -8, 1.06], [64, -4, 1.0]
  ];
  for (const [x, z, scale] of smallTrees) addBroadleaf(c, x, z, scale);

  // Smaller ornamental trees within the garden.
  addBroadleaf(c, -27.5, 14.8, 0.62);
  addBroadleaf(c, -12.8, 14.9, 0.56);
  addBroadleaf(c, 44.0, 14.2, 0.65);
  addBroadleaf(c, 52.0, 42.0, 0.95);

  const palms = [
    [27.5, 40.0, 8.4, -0.2, 0.3], [25.5, 33.4, 7.5, 0.25, -0.2],
    [-6.8, 21.0, 7.4, 0.2, 0.15], [33.8, 21.2, 8.1, -0.2, -0.3],
    [-53.2, 35.2, 7.2, 0.2, 0.3], [-35.4, 22.0, 8.0, -0.25, -0.2],
    [-39.0, -14.0, 7.0, 0.2, 0.2], [38.5, -14.2, 7.2, -0.2, 0.15],
    [-61.0, 30.0, 8.8, 0.3, 0.1], [63.0, 30.0, 8.2, -0.2, -0.2]
  ];
  for (const [x, z, height, leanX, leanZ] of palms) addPalm(c, x, z, height, leanX, leanZ);

  // Boundary shrubs and flower colour.
  addFlowerCluster(c, 24.0, 44.2, 0.7, 1.2);
  addFlowerCluster(c, 23.0, 43.1, 0.5, 0.9);
  addFlowerCluster(c, 39.0, 44.1, 0.7, 1.2);
  addFlowerCluster(c, -6.5, 44.2, 0.65, 1.1);
  addFlowerCluster(c, -52.0, 43.2, 0.8, 1.0);
}

function plantDistantBelt(c) {
  const { builder, mats, random } = c;
  const positions = [];
  for (let i = 0; i < 46; i += 1) {
    let x = 0;
    let z = 0;
    let attempts = 0;
    do {
      x = randRange(random, -170, 170);
      z = randRange(random, -150, 155);
      attempts += 1;
      const insidePlot = Math.abs(x) < PLOT.x + 4 && z < PLOT.front + 4 && z > PLOT.rear - 4;
      const onRoad = z > 43 && z < 66;
      if (!insidePlot && !onRoad) break;
    } while (attempts < 24);
    if (attempts >= 24) continue;
    positions.push([x, z]);
  }
  for (const [x, z] of positions) {
    const scale = randRange(random, 1.2, 2.2);
    // Distant trees are simplified to two low-poly canopies.
    builder.cylinder(mats.trunk, x, 2.1 * scale, z, 0.24 * scale, 4.2 * scale, {
      cast: false,
      receive: true
    });
    for (let i = 0; i < 2; i += 1) {
      builder.ico(
        mats.foliage,
        x + (i ? 0.9 : -0.8) * scale,
        5.6 * scale + i * 0.7 * scale,
        z + (i ? -0.6 : 0.4) * scale,
        2.4 * scale,
        2.0 * scale,
        2.4 * scale,
        {
          color: i ? 0xa8bd96 : 0xbacda7,
          cast: false,
          receive: true
        }
      );
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Traffic and ambient lighting                                               */
/* -------------------------------------------------------------------------- */

function makeCar(materials, color) {
  const car = new THREE.Group();
  car.name = `Conceptual car — ${color.toString(16)}`;
  const paint = materials.carPaint.clone();
  paint.color.set(color);

  const body = new THREE.Mesh(new THREE.BoxGeometry(4.15, 0.56, 1.82), paint);
  body.position.y = 0.72;
  body.castShadow = false;
  body.receiveShadow = true;
  car.add(body);

  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.32, 1.72), paint);
  nose.position.set(2.08, 0.62, 0);
  nose.castShadow = false;
  car.add(nose);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.54, 1.62), materials.carGlass);
  cabin.position.set(-0.18, 1.25, 0);
  cabin.castShadow = false;
  car.add(cabin);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.07, 1.5), paint);
  roof.position.set(-0.18, 1.55, 0);
  car.add(roof);

  const wheelGeometry = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 12);
  for (const sx of [-1.34, 1.34]) {
    for (const sz of [-0.84, 0.84]) {
      const wheel = new THREE.Mesh(wheelGeometry, materials.tyre);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(sx, 0.38, sz);
      wheel.castShadow = false;
      car.add(wheel);
    }
  }

  for (const sz of [-0.56, 0.56]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.32), materials.lightLens);
    head.position.set(2.46, 0.72, sz);
    car.add(head);
    const tail = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.1, 0.28),
      new THREE.MeshBasicMaterial({ color: 0xb43c28, toneMapped: false })
    );
    tail.position.set(-2.09, 0.72, sz);
    car.add(tail);
  }

  return car;
}

function buildTraffic(c, group, animate) {
  const { mats } = c;
  const trafficGroup = new THREE.Group();
  trafficGroup.name = 'Conceptual traffic';
  group.add(trafficGroup);

  const all = [];
  const moving = [];

  const addMoving = (x, z, color, speed, rotationY) => {
    const car = makeCar(mats, color);
    car.position.set(x, 0, z);
    car.rotation.y = rotationY;
    trafficGroup.add(car);
    const entry = { mesh: car, speed };
    moving.push(entry);
    all.push(entry);
  };

  const parked = [
    [29.2, 28.5, 0x232b2d, -0.45],
    [4.6, 16.8, 0x8d887a, 0.18]
  ];
  for (const [x, z, color, rotationY] of parked) {
    const car = makeCar(mats, color);
    car.position.set(x, 0, z);
    car.rotation.y = rotationY;
    trafficGroup.add(car);
    all.push({ mesh: car, speed: 0 });
  }

  // The road is wider than the plot, so cars fade into the haze.
  addMoving(-76, 52.3, 0x2a3032, 9.2, 0);
  addMoving(62, 52.3, 0xb7b0a2, 8.0, 0);
  addMoving(148, 52.3, 0x5b3432, 10.4, 0);
  addMoving(88, 58.0, 0x384b52, -9.5, Math.PI);
  addMoving(-24, 58.0, 0x9d9588, -8.4, Math.PI);
  addMoving(-164, 58.0, 0x2b3438, -10.8, Math.PI);

  // Shadows are baked only for the static architecture. Contact discs ground
  // the moving cars without forcing the shadow atlas to refresh every frame.
  const contactGeometry = new THREE.PlaneGeometry(1, 1);
  contactGeometry.rotateX(-Math.PI / 2);
  const contactMaterial = new THREE.MeshBasicMaterial({
    color: 0x05090a,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    toneMapped: false
  });
  const contactShadows = new THREE.InstancedMesh(contactGeometry, contactMaterial, all.length);
  contactShadows.name = 'Traffic contact shadows';
  contactShadows.renderOrder = 1;
  contactShadows.frustumCulled = false;
  trafficGroup.add(contactShadows);

  const dummy = new THREE.Object3D();
  const writeContact = (index, mesh) => {
    dummy.position.set(mesh.position.x, 0.125, mesh.position.z);
    dummy.rotation.set(0, mesh.rotation.y, 0);
    dummy.scale.set(4.7, 1, 2.15);
    dummy.updateMatrix();
    contactShadows.setMatrixAt(index, dummy.matrix);
  };
  all.forEach((entry, index) => writeContact(index, entry.mesh));
  contactShadows.instanceMatrix.needsUpdate = true;

  let elapsed = 0;
  if (!animate) {
    for (const car of moving) car.mesh.visible = true;
  }

  return {
    group: trafficGroup,
    count: all.length,
    update(dt) {
      if (!animate) return;
      elapsed += dt;
      for (let index = 0; index < moving.length; index += 1) {
        const { mesh, speed } = moving[index];
        mesh.position.x += speed * dt;
        if (mesh.position.x > 265) mesh.position.x = -265;
        if (mesh.position.x < -265) mesh.position.x = 265;
        writeContact(index, mesh);
      }
      contactShadows.instanceMatrix.needsUpdate = true;
    }
  };
}

function makeGlowTexture() {
  return createCanvasTexture(64, 64, (ctx, width, height) => {
    const cx = width / 2;
    const gradient = ctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
    gradient.addColorStop(0, 'rgba(255, 244, 219, 1)');
    gradient.addColorStop(0.16, 'rgba(255, 214, 159, 0.92)');
    gradient.addColorStop(0.48, 'rgba(255, 182, 109, 0.28)');
    gradient.addColorStop(1, 'rgba(255, 160, 82, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }, { wrap: false, anisotropy: 1 });
}

function addAmbientGlow(group) {
  // Small, unlit halos replace real point lights. They preserve the warm
  // evening read of the lamps without adding per-pixel light loops to every
  // material in the scene.
  const pushGlow = (target, x, y, z, color) => {
    target.positions.push(x, y, z);
    const c = new THREE.Color(color);
    target.colors.push(c.r, c.g, c.b);
  };
  const local = { positions: [], colors: [] };
  const distant = { positions: [], colors: [] };

  // Street lamps along the front pavement.
  for (const x of [-37, 3, 45, 63]) {
    pushGlow(distant, x, 5.2, 48.55, 0xffd4a2);
  }
  // Rear walk bollards.
  for (const x of [-28, -14, 14, 28]) {
    pushGlow(local, x, 0.67, -18.6, 0xffc98e);
  }
  // Entrance wall lights.
  for (const side of [-1, 1]) {
    pushGlow(local, ENTRANCE.x + side * 5.9, 0.68, 17.2, 0xffd2a0);
  }
  // Conceptual gate and play-garden fixtures.
  pushGlow(distant, GATE.x, 3.7, GATE.z - 0.5, 0xffce97);
  pushGlow(distant, PLAY.x, 3.9, PLAY.z, 0xffd3a4);

  const makePoints = (set, size, opacity) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(set.positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(set.colors, 3));
    const material = new THREE.PointsMaterial({
      map: makeGlowTexture(),
      size,
      sizeAttenuation: true,
      transparent: true,
      opacity,
      vertexColors: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    });
    const points = new THREE.Points(geometry, material);
    points.name = 'Warm lamp halo';
    points.renderOrder = 2;
    points.frustumCulled = false;
    group.add(points);
    return points;
  };

  makePoints(local, 0.7, 0.7);
  makePoints(distant, 1.9, 0.55);

  // One low-intensity entrance lamp replaces the previous cluster of four
  // point lights. It gives the canopy a soft wall-wash without blowing out the
  // glass or adding four light loops to every material in the scene.
  const entranceLamp = new THREE.PointLight(0xffc18a, 12, 20, 2);
  entranceLamp.position.set(ENTRANCE.x, 4.55, HALF_D + 2.4);
  entranceLamp.castShadow = false;
  entranceLamp.name = 'Entrance canopy lamp';
  group.add(entranceLamp);

  // A soft pool of light at the entrance, also additive and unlit.
  const pool = new THREE.Mesh(
    new THREE.PlaneGeometry(10.4, 5.8),
    new THREE.MeshBasicMaterial({
      map: makeGlowTexture(),
      color: 0xffc78d,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false
    })
  );
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(ENTRANCE.x, 0.178, 15.4);
  pool.renderOrder = 2;
  pool.name = 'Entrance lamp pool';
  group.add(pool);
}
