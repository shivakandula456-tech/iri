import * as THREE from 'three';
import {
  BUILDING,
  CROWN_TOP,
  ENTRANCE,
  HALF_D,
  HALF_L,
  ROOF_Y,
  SLOTS,
  WINGS
} from './config.js';
import { ModelBuilder, createVisorGeometry } from './geometry-kit.js';
import { makeWordmarkTexture, mulberry32, randRange } from './utils.js';

/**
 * The facade module colours are deliberately assigned per bay so the building
 * reads as a designed rhythm rather than a uniform mirror. The exact pattern
 * is an inference from the published renders.
 */
const FRONT_STYLES = [
  ['loggia', 'balcony', 'window'],
  ['balcony', 'window', 'loggia'],
  ['window', 'loggia', 'balcony']
];
const REAR_STYLES = [
  ['balcony', 'window', 'loggia'],
  ['loggia', 'balcony', 'window'],
  ['balcony', 'loggia', 'balcony']
];

const FLOOR_BASE = (level) => BUILDING.groundHeight + level * BUILDING.floorHeight;

export function buildBuilding(materials) {
  const builder = new ModelBuilder('Iris Residences — tower');
  const random = mulberry32(0x1a2b3c);

  buildMassing(builder, materials);
  buildLongElevation(builder, materials, 1, FRONT_STYLES, 0.6, random);
  buildLongElevation(builder, materials, -1, REAR_STYLES, 0.3, random);
  buildVerticalSlots(builder, materials);
  buildShortElevations(builder, materials, random);
  buildPodiumAndEntrance(builder, materials, random);
  buildRoofCrown(builder, materials, random);

  const group = builder.finalize();
  group.name = 'Iris Residences exterior';
  group.userData.metadata = {
    description: 'Conceptual exterior reconstruction built procedurally from published reference images.',
    approximateFootprint: `${BUILDING.length} × ${BUILDING.depth} m`,
    approximateCrownHeight: `${CROWN_TOP.toFixed(1)} m`,
    levels: `${BUILDING.levels} residential levels + open crown (visual estimate)`,
    origin: 'Site centre at ground level; front elevation faces +Z.',
    accuracy: 'Approximate / inferred — not a surveyed or architect-approved model.'
  };
  group.userData.stats = builder.group.userData.stats;

  const colliders = [
    new THREE.Box3(
      new THREE.Vector3(-HALF_L - 0.4, 0, -HALF_D - 0.4),
      new THREE.Vector3(HALF_L + 0.4, CROWN_TOP + 1.4, HALF_D + 0.4)
    ),
    new THREE.Box3(
      new THREE.Vector3(ENTRANCE.x - ENTRANCE.width / 2 - 1.2, 0, HALF_D - 0.2),
      new THREE.Vector3(ENTRANCE.x + ENTRANCE.width / 2 + 1.2, 6.4, HALF_D + 6.0)
    )
  ];

  const floorGroups = new Map(
    group.children
      .filter((child) => Number.isInteger(child.userData?.floorNumber))
      .map((child) => [child.userData.floorNumber, child])
  );

  return {
    group,
    floorGroups,
    colliders,
    focus: new THREE.Vector3(0, ROOF_Y * 0.51, 0),
    entrance: new THREE.Vector3(ENTRANCE.x, 4.6, HALF_D + 8),
    stats: group.userData.stats
  };
}

/* -------------------------------------------------------------------------- */
/*  Main mass                                                                  */
/* -------------------------------------------------------------------------- */

function buildMassing(builder, mats) {
  const length = BUILDING.length - 2.6;
  const depth = BUILDING.depth - 3.4;
  // The opaque inner mass is split into floor-sized volumes. It retains the
  // continuous exterior appearance, while a selected floor can now be clipped
  // independently instead of cutting every level at once.
  const bodyHeight = BUILDING.floorHeight - 0.5;
  for (let level = 0; level < BUILDING.levels; level += 1) {
    const floorBase = FLOOR_BASE(level);
    builder.box(
      mats.ivory,
      0,
      floorBase + 0.23 + bodyHeight / 2,
      0,
      length,
      bodyHeight,
      depth,
      { cast: true, receive: true }
    );
  }

  // Roof slab and edge fascia close the mass from above.
  builder.box(mats.white, 0, ROOF_Y + 0.02, 0, BUILDING.length + 0.3, 0.46, BUILDING.depth + 0.3, {
    cast: true,
    receive: true
  });
  builder.box(mats.whiteSoft, 0, ROOF_Y + 0.32, HALF_D + 0.12, BUILDING.length + 0.4, 0.2, 0.7, {
    cast: false
  });
  builder.box(mats.whiteSoft, 0, ROOF_Y + 0.32, -HALF_D - 0.12, BUILDING.length + 0.4, 0.2, 0.7, {
    cast: false
  });

  // The ground colonnade sits on a shallow stone podium.
  builder.box(mats.stone, 0, 0.23, 0, BUILDING.length + 2.6, 0.46, BUILDING.depth + 3.0, {
    cast: true,
    receive: true
  });
  builder.box(mats.stone, ENTRANCE.x, 0.22, HALF_D + 2.25, 15.5, 0.44, 4.8, {
    cast: false,
    receive: true
  });
}

/* -------------------------------------------------------------------------- */
/*  Long elevations                                                            */
/* -------------------------------------------------------------------------- */

function buildLongElevation(builder, mats, side, styles, goldFactor, random) {
  for (let wingIndex = 0; wingIndex < WINGS.length; wingIndex += 1) {
    const wing = WINGS[wingIndex];
    const wingWidth = wing.x1 - wing.x0;
    const bayWidth = wingWidth / BUILDING.baysPerWing;
    const wingCenter = (wing.x0 + wing.x1) / 2;

    for (let level = 0; level < BUILDING.levels; level += 1) {
      const y = FLOOR_BASE(level);

      // Strong white floor band — the facade's dominant horizontal rhythm.
      builder.box(
        mats.white,
        wingCenter,
        y + 0.23,
        side * (HALF_D + 0.05),
        wingWidth + 0.14,
        0.46,
        0.56,
        { cast: true, receive: true }
      );
      builder.box(
        mats.whiteSoft,
        wingCenter,
        y + 2.93,
        side * (HALF_D + 0.01),
        wingWidth + 0.04,
        0.13,
        0.34,
        { cast: false, receive: true }
      );
      // A fine dark shadow line under every slab gives the white bands crispness.
      builder.box(
        mats.darkMetal,
        wingCenter,
        y + 0.015,
        side * (HALF_D + 0.33),
        wingWidth - 0.15,
        0.032,
        0.08,
        { cast: false, receive: false }
      );

      for (let bay = 0; bay < BUILDING.baysPerWing; bay += 1) {
        const x0 = wing.x0 + bay * bayWidth;
        const x1 = x0 + bayWidth;
        const style = styles[wingIndex][bay];
        buildLongBay(
          builder, mats, side, style, x0, x1, y, level, bay + wingIndex * 3, goldFactor, random
        );
      }
    }

    // Vertical white structural piers at every bay division.
    for (let pier = 0; pier <= BUILDING.baysPerWing; pier += 1) {
      const x = wing.x0 + (wingWidth / BUILDING.baysPerWing) * pier;
      const isWingEdge = pier === 0 || pier === BUILDING.baysPerWing;
      const width = isWingEdge ? 0.92 : 0.56;
      const z = side * (HALF_D + 0.12);
      builder.box(
        mats.white,
        x,
        (BUILDING.groundHeight + ROOF_Y) / 2,
        z,
        width,
        ROOF_Y - BUILDING.groundHeight + 0.32,
        0.76,
        { cast: true, receive: true }
      );
      builder.box(
        mats.darkMetal,
        x + width / 2 - 0.075,
        (BUILDING.groundHeight + ROOF_Y) / 2,
        z + side * 0.395,
        0.05,
        ROOF_Y - BUILDING.groundHeight,
        0.028,
        { cast: false, receive: false }
      );
    }

    // A close-set pair of tall fins at the centre of each wing, visible in
    // the supplied elevation as dark vertical breaks in the white frame.
    const centreFinX = wingCenter;
    builder.box(
      mats.white,
      centreFinX,
      (BUILDING.groundHeight + ROOF_Y) / 2,
      side * (HALF_D + 0.26),
      0.29,
      ROOF_Y - BUILDING.groundHeight,
      0.28,
      { cast: true, receive: true }
    );
    builder.box(
      mats.darkMetal,
      centreFinX + 0.13,
      (BUILDING.groundHeight + ROOF_Y) / 2,
      side * (HALF_D + 0.4),
      0.045,
      ROOF_Y - BUILDING.groundHeight - 0.5,
      0.06,
      { cast: false }
    );
  }
}

function buildLongBay(builder, mats, side, style, x0, x1, y, level, bayId, goldFactor, random) {
  const width = x1 - x0;
  const centerX = (x0 + x1) / 2;
  const inset = style === 'window' ? 0.3 : style === 'loggia' ? 0.9 : 0.45;
  const zGlass = side * (HALF_D - inset);
  const openingWidth = width - 1.04;
  const paneGap = 0.055;
  const paneWidth = (openingWidth - paneGap * 3) / 4;
  const hasWarmRoom = random() < 0.16;
  const warmIndex = Math.floor(random() * 4);
  const warmMaterial = level % 5 === 0 ? mats.glassWarm : mats.glassWarm;

  // Dark, deep interior backing — windows remain legible against it.
  builder.box(
    mats.slotDark,
    centerX,
    y + 1.72,
    side * (HALF_D - inset - 0.22),
    width - 0.22,
    2.42,
    0.18,
    { cast: false, receive: true }
  );

  // Interior room ceiling and floor edge behind the glazing.
  builder.box(
    mats.ivory,
    centerX,
    y + 2.9,
    side * (HALF_D - inset - 0.02),
    width - 0.26,
    0.08,
    inset + 0.2,
    { cast: false, receive: true }
  );

  buildLongGlazing(builder, mats, {
    side,
    xStart: centerX - openingWidth / 2,
    xCenter: centerX,
    y,
    zGlass,
    paneWidth,
    paneGap,
    hasWarmRoom,
    warmIndex,
    warmMaterial,
    level
  });

  if (style === 'balcony') {
    buildLongBalcony(builder, mats, side, x0, x1, y, level, bayId, goldFactor, random);
  } else if (style === 'loggia') {
    buildLongLoggia(builder, mats, side, x0, x1, y, level, goldFactor, random, inset);
  } else {
    buildJulietWindow(builder, mats, side, x0, x1, y, level);
  }

  // Crisp white sill and header at every opening.
  builder.box(
    mats.white,
    centerX,
    y + 0.49,
    side * (HALF_D - inset + 0.035),
    width - 0.26,
    0.14,
    0.2,
    { cast: false, receive: true }
  );
  builder.box(
    mats.white,
    centerX,
    y + 2.83,
    side * (HALF_D - inset + 0.04),
    width - 0.26,
    0.18,
    0.19,
    { cast: false, receive: true }
  );

  // Fine vertical shadow either side of the glazing.
  for (const x of [centerX - openingWidth / 2 - 0.035, centerX + openingWidth / 2 + 0.035]) {
    builder.box(
      mats.darkMetal,
      x,
      y + 1.7,
      side * (HALF_D - inset + 0.005),
      0.045,
      2.22,
      0.07,
      { cast: false, receive: false }
    );
  }
}

function buildLongGlazing(builder, mats, {
  side, xStart, xCenter, y, zGlass, paneWidth, paneGap, hasWarmRoom, warmIndex, warmMaterial, level
}) {
  for (let pane = 0; pane < 4; pane += 1) {
    const paneCenter = xStart + paneWidth / 2 + pane * (paneWidth + paneGap);
    const isWarm = hasWarmRoom && warmIndex === pane;
    const material = isWarm
      ? warmMaterial
      : (level + pane) % 4 === 0
        ? mats.glassDeep
        : mats.glass;
    builder.box(
      material,
      paneCenter,
      y + 1.68,
      zGlass,
      paneWidth,
      2.16,
      0.06,
      { cast: false, receive: true }
    );

    // Mid-height sliding-door transom.
    builder.box(
      mats.darkMetal,
      paneCenter,
      y + 2.12,
      zGlass + side * 0.035,
      paneWidth,
      0.028,
      0.038,
      { cast: false, receive: false }
    );

    if (isWarm) {
      // A slim glowing reveal behind the warm pane makes the interior feel occupied.
      builder.box(
        mats.lightWarm,
        paneCenter,
        y + 2.72,
        zGlass - side * 0.06,
        paneWidth * 0.74,
        0.035,
        0.02,
        { cast: false, receive: false }
      );
    }
  }

  for (let pane = 1; pane < 4; pane += 1) {
    const x = xStart + pane * paneWidth + (pane - 0.5) * paneGap;
    builder.box(
      mats.darkMetal,
      x,
      y + 1.68,
      zGlass + side * 0.015,
      0.05,
      2.2,
      0.075,
      { cast: false, receive: true }
    );
  }

  builder.box(
    mats.white,
    xCenter,
    y + 2.78,
    zGlass + side * 0.03,
    paneWidth * 4 + paneGap * 3 + 0.1,
    0.1,
    0.1,
    { cast: false, receive: true }
  );
}

function buildLongBalcony(builder, mats, side, x0, x1, y, level, bayId, goldFactor, random) {
  const width = x1 - x0;
  const centerX = (x0 + x1) / 2;
  const depth = 1.22;
  const railWidth = width - 0.6;
  const solidRail = random() < 0.16;
  const zSlab = side * (HALF_D + depth / 2 + 0.05);

  builder.box(
    mats.white,
    centerX,
    y + 0.16,
    zSlab,
    width - 0.38,
    0.26,
    depth + 0.2,
    { cast: true, receive: true }
  );
  builder.box(
    mats.stone,
    centerX,
    y + 0.29,
    side * (HALF_D + depth / 2),
    width - 0.56,
    0.035,
    depth - 0.06,
    { cast: false, receive: true }
  );
  builder.box(
    mats.white,
    centerX,
    y + 0.34,
    side * (HALF_D + depth + 0.13),
    width - 0.38,
    0.35,
    0.12,
    { cast: true, receive: true }
  );

  addFrontBalustrade(
    builder, mats, centerX, y + 0.31, side * (HALF_D + depth + 0.04), railWidth, solidRail
  );

  // Projecting white soffit over each balcony.
  builder.box(
    mats.white,
    centerX,
    y + 2.96,
    side * (HALF_D + depth / 2 + 0.05),
    width - 0.16,
    0.17,
    depth + 0.28,
    { cast: true, receive: true }
  );
  builder.box(
    mats.ivory,
    centerX,
    y + 2.85,
    side * (HALF_D + depth - 0.15),
    width - 0.8,
    0.035,
    0.4,
    { cast: false, receive: false }
  );

  // Warm recessed downlights under the slab above.
  const lightCount = 2;
  for (let i = 0; i < lightCount; i += 1) {
    const x = centerX + (i === 0 ? -1 : 1) * (width * 0.23);
    builder.box(
      mats.lightWarm,
      x,
      y + 2.87,
      side * (HALF_D + 0.45),
      0.22,
      0.018,
      0.08,
      { cast: false, receive: false }
    );
  }

  if (random() < goldFactor) {
    const goldX = random() < 0.5 ? x0 + 0.42 : x1 - 0.42;
    addGoldScreen(builder, mats, {
      x: goldX,
      y: y + 0.42,
      height: 2.34,
      z: side * (HALF_D + depth - 0.06),
      span: 0.54,
      bars: 6,
      axis: 'x'
    });
  }

  // Slender white side fins frame each balcony bay.
  for (const x of [x0 + 0.22, x1 - 0.22]) {
    builder.box(
      mats.white,
      x,
      y + 1.48,
      side * (HALF_D + depth * 0.44),
      0.13,
      2.75,
      depth * 0.9,
      { cast: true, receive: true }
    );
  }
}

function buildLongLoggia(builder, mats, side, x0, x1, y, level, goldFactor, random, inset) {
  const width = x1 - x0;
  const centerX = (x0 + x1) / 2;
  const railWidth = width - 0.7;
  const solidRail = random() < 0.11;

  addFrontBalustrade(
    builder, mats, centerX, y + 0.36, side * (HALF_D + 0.045), railWidth, solidRail
  );

  // Deep white side returns make the loggia read as a carved volume.
  for (const x of [x0 + 0.25, x1 - 0.25]) {
    builder.box(
      mats.whiteSoft,
      x,
      y + 1.64,
      side * (HALF_D - inset / 2 + 0.02),
      0.29,
      2.5,
      inset + 0.18,
      { cast: true, receive: true }
    );
  }

  builder.box(
    mats.white,
    centerX,
    y + 2.93,
    side * (HALF_D - inset / 2 + 0.02),
    width - 0.5,
    0.15,
    inset + 0.3,
    { cast: true, receive: true }
  );

  builder.box(
    mats.stone,
    centerX,
    y + 0.39,
    side * (HALF_D - inset / 2),
    width - 0.7,
    0.04,
    inset - 0.06,
    { cast: false, receive: true }
  );

  builder.box(
    mats.lightWarm,
    centerX,
    y + 2.84,
    side * (HALF_D - 0.26),
    0.86,
    0.014,
    0.05,
    { cast: false, receive: false }
  );

  if (random() < goldFactor) {
    addGoldScreen(builder, mats, {
      x: random() < 0.5 ? x0 + 0.56 : x1 - 0.56,
      y: y + 0.45,
      height: 2.3,
      z: side * (HALF_D - 0.12),
      span: 0.48,
      bars: 5,
      axis: 'x'
    });
  }
}

function buildJulietWindow(builder, mats, side, x0, x1, y, level) {
  const width = x1 - x0;
  const centerX = (x0 + x1) / 2;
  const railWidth = width - 1.25;

  builder.box(
    mats.white,
    centerX,
    y + 0.17,
    side * (HALF_D + 0.16),
    width - 0.55,
    0.17,
    0.32,
    { cast: false, receive: true }
  );
  builder.box(
    mats.railMetal,
    centerX,
    y + 1.12,
    side * (HALF_D + 0.31),
    railWidth,
    0.045,
    0.06,
    { cast: false, receive: false }
  );
  const posts = 7;
  for (let i = 0; i < posts; i += 1) {
    const x = centerX - railWidth / 2 + (railWidth / (posts - 1)) * i;
    builder.box(
      mats.railMetal,
      x,
      y + 0.64,
      side * (HALF_D + 0.31),
      0.026,
      0.97,
      0.03,
      { cast: false, receive: false }
    );
  }
  // Gold flank fin on alternate window bays.
  if ((level + Math.round((x0 + x1) * 10)) % 5 === 0) {
    builder.box(
      mats.gold,
      centerX + (width / 2 - 0.35),
      y + 1.55,
      side * (HALF_D + 0.08),
      0.14,
      2.34,
      0.16,
      { cast: false, receive: true }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  Deep vertical channels between the three wings                             */
/* -------------------------------------------------------------------------- */

function buildVerticalSlots(builder, mats) {
  for (const slot of SLOTS) {
    const centerX = (slot.x0 + slot.x1) / 2;
    const width = slot.x1 - slot.x0;

    for (const side of [-1, 1]) {
      // Recessed dark face and its vertical shadow ribs.
      builder.box(
        mats.slotDark,
        centerX,
        (BUILDING.groundHeight + ROOF_Y) / 2,
        side * (HALF_D - 0.94),
        width - 0.06,
        ROOF_Y - BUILDING.groundHeight + 0.2,
        0.16,
        { cast: false, receive: true }
      );

      const ribCount = 11;
      for (let i = 0; i < ribCount; i += 1) {
        const x = centerX - width / 2 + 0.13 + (i / (ribCount - 1)) * (width - 0.26);
        builder.box(
          mats.darkMetal,
          x,
          (BUILDING.groundHeight + ROOF_Y) / 2,
          side * (HALF_D - 0.6),
          0.055,
          ROOF_Y - BUILDING.groundHeight - 0.1,
          0.2,
          { cast: false, receive: true }
        );
      }

      // White return cheeks facing into the channel.
      for (const edgeX of [slot.x0 + 0.22, slot.x1 - 0.22]) {
        builder.box(
          mats.whiteSoft,
          edgeX,
          (BUILDING.groundHeight + ROOF_Y) / 2,
          side * (HALF_D - 0.38),
          0.42,
          ROOF_Y - BUILDING.groundHeight,
          1.2,
          { cast: true, receive: true }
        );
      }

      // Gold louvre band near the crown, an accent visible in the aerial render.
      for (let i = 0; i < 12; i += 1) {
        const x = centerX - width / 2 + 0.22 + (i / 11) * (width - 0.44);
        builder.box(
          mats.gold,
          x,
          ROOF_Y - 2.5,
          side * (HALF_D - 0.56),
          0.06,
          4.4,
          0.08,
          { cast: false, receive: true }
        );
      }
      builder.box(
        mats.goldDeep,
        centerX,
        ROOF_Y - 4.72,
        side * (HALF_D - 0.53),
        width - 0.35,
        0.08,
        0.1,
        { cast: false }
      );
      builder.box(
        mats.goldDeep,
        centerX,
        ROOF_Y - 0.3,
        side * (HALF_D - 0.53),
        width - 0.35,
        0.08,
        0.1,
        { cast: false }
      );
    }
  }
}

/* -------------------------------------------------------------------------- */
/*  Short ends                                                                 */
/* -------------------------------------------------------------------------- */

function buildShortElevations(builder, mats, random) {
  for (const end of [-1, 1]) {
    const xOuter = end * HALF_L;
    const bandX = end * (HALF_L - 0.04);
    const backingX = end * (HALF_L - 0.92);
    const glassX = end * (HALF_L - 0.52);
    const bayCentres = [-3.55, 3.55];
    const bayWidth = 6.6;

    // Dark recessed glazing field framed by broad white corner blades.
    builder.box(
      mats.slotDark,
      backingX,
      (BUILDING.groundHeight + ROOF_Y) / 2,
      0,
      0.18,
      ROOF_Y - BUILDING.groundHeight,
      BUILDING.depth - 2 * BUILDING.endFinWidth - 0.8,
      { cast: false, receive: true }
    );

    // Broad white corner blades, full height from podium to crown.
    for (const zSign of [-1, 1]) {
      const z = zSign * (HALF_D - BUILDING.endFinWidth / 2);
      builder.box(
        mats.white,
        end * (HALF_L - 0.27),
        CROWN_TOP / 2 + 0.2,
        z,
        0.72,
        CROWN_TOP + 0.4,
        BUILDING.endFinWidth,
        { cast: true, receive: true }
      );
      builder.box(
        mats.darkMetal,
        end * (HALF_L + 0.095),
        (BUILDING.groundHeight + CROWN_TOP) / 2 + 0.3,
        z - zSign * (BUILDING.endFinWidth / 2 - 0.09),
        0.035,
        CROWN_TOP - BUILDING.groundHeight,
        0.055,
        { cast: false, receive: false }
      );
    }

    for (let level = 0; level < BUILDING.levels; level += 1) {
      const y = FLOOR_BASE(level);
      // Full-width end bands tie the short elevation to the long elevations.
      builder.box(
        mats.white,
        bandX,
        y + 0.23,
        0,
        0.55,
        0.46,
        BUILDING.depth - 0.3,
        { cast: true, receive: true }
      );
      builder.box(
        mats.whiteSoft,
        end * (HALF_L + 0.025),
        y + 2.93,
        0,
        0.28,
        0.12,
        BUILDING.depth - 0.65,
        { cast: false, receive: true }
      );

      for (let bay = 0; bay < 2; bay += 1) {
        const zCenter = bayCentres[bay];
        const opening = bayWidth - 0.9;
        const paneGap = 0.05;
        const paneWidth = (opening - paneGap * 2) / 3;
        const hasWarm = random() < 0.13;
        const warmPane = Math.floor(random() * 3);

        for (let pane = 0; pane < 3; pane += 1) {
          const z = zCenter - opening / 2 + paneWidth / 2 + pane * (paneWidth + paneGap);
          builder.box(
            hasWarm && pane === warmPane ? mats.glassWarm : mats.glass,
            glassX,
            y + 1.68,
            z,
            0.06,
            2.14,
            paneWidth,
            { cast: false, receive: true }
          );
          if (pane < 2) {
            builder.box(
              mats.darkMetal,
              glassX + end * 0.02,
              y + 1.68,
              z + paneWidth / 2 + paneGap / 2,
              0.08,
              2.2,
              0.045,
              { cast: false, receive: false }
            );
          }
        }

        // Balcony tray projecting from the short end.
        const depthOut = 0.9;
        builder.box(
          mats.white,
          end * (HALF_L + depthOut / 2 - 0.02),
          y + 0.17,
          zCenter,
          depthOut + 0.28,
          0.27,
          bayWidth - 0.45,
          { cast: true, receive: true }
        );
        builder.box(
          mats.stone,
          end * (HALF_L + depthOut / 2),
          y + 0.31,
          zCenter,
          depthOut - 0.08,
          0.035,
          bayWidth - 0.7,
          { cast: false, receive: true }
        );
        builder.box(
          mats.white,
          end * (HALF_L + depthOut + 0.1),
          y + 2.96,
          zCenter,
          depthOut + 0.2,
          0.16,
          bayWidth - 0.28,
          { cast: true, receive: true }
        );

        addEndBalustrade(
          builder,
          mats,
          end * (HALF_L + depthOut + 0.06),
          y + 0.34,
          zCenter,
          bayWidth - 0.65,
          random() < 0.22
        );

        if (random() < 0.42) {
          const screenZ = zCenter + (random() < 0.5 ? -1 : 1) * (bayWidth / 2 - 0.45);
          addGoldScreen(builder, mats, {
            x: end * (HALF_L + depthOut - 0.08),
            y: y + 0.45,
            height: 2.26,
            z: screenZ,
            span: 0.52,
            bars: 5,
            axis: 'z'
          });
        }
      }
    }

    // Central white mullion down the short elevation.
    builder.box(
      mats.white,
      end * (HALF_L + 0.06),
      (BUILDING.groundHeight + ROOF_Y) / 2,
      0,
      0.5,
      ROOF_Y - BUILDING.groundHeight,
      0.6,
      { cast: true, receive: true }
    );
    builder.box(
      mats.darkMetal,
      end * (HALF_L + 0.2),
      (BUILDING.groundHeight + ROOF_Y) / 2,
      0,
      0.04,
      ROOF_Y - BUILDING.groundHeight,
      0.07,
      { cast: false }
    );

    // Ground floor end treatment.
    builder.box(
      mats.glassDeep,
      end * (HALF_L - 0.3),
      2.28,
      0,
      0.09,
      3.35,
      BUILDING.depth - 2.0,
      { cast: false, receive: true }
    );
    for (const z of [-7.2, -2.4, 2.4, 7.2]) {
      builder.box(
        mats.white,
        end * (HALF_L + 0.04),
        2.2,
        z,
        0.58,
        4.1,
        0.58,
        { cast: true, receive: true }
      );
    }

    // Crown portal on the short end.
    builder.box(
      mats.white,
      end * (HALF_L - 0.02),
      (ROOF_Y + CROWN_TOP) / 2,
      0,
      0.78,
      CROWN_TOP - ROOF_Y,
      0.72,
      { cast: true, receive: true }
    );
    builder.box(
      mats.white,
      end * (HALF_L + 0.16),
      CROWN_TOP - 0.48,
      0,
      1.15,
      0.96,
      BUILDING.depth + 0.7,
      { cast: true, receive: true }
    );
    builder.box(
      mats.whiteSoft,
      end * (HALF_L + 0.1),
      ROOF_Y + 3.5,
      0,
      0.7,
      0.28,
      BUILDING.depth + 0.2,
      { cast: false, receive: true }
    );
    for (let i = 0; i < 16; i += 1) {
      const z = -5.7 + (i / 15) * 11.4;
      builder.box(
        mats.gold,
        end * (HALF_L - 0.22),
        ROOF_Y + 3.8,
        z,
        0.06,
        3.8,
        0.055,
        { cast: false, receive: true }
      );
    }

    // Glazed slots and planting below the visor.
    for (const z of [-7.0, 7.0]) {
      builder.box(
        mats.glassDeep,
        end * (HALF_L - 0.12),
        ROOF_Y + 2.2,
        z,
        0.06,
        3.2,
        1.9,
        { cast: false, receive: true }
      );
    }
    addRoofPlanter(builder, mats, end * (HALF_L - 1.2), ROOF_Y + 0.45, 5.8, 2.4, 0.55, 1.2, random);

    // Sculptural visor / flying roof cap.
    const visorGeometry = createVisorGeometry(BUILDING.depth + 1.2, 0.86, 0.66);
    const visor = new THREE.Mesh(visorGeometry, mats.white);
    visor.position.set(end > 0 ? HALF_L - 0.35 : -HALF_L - 2.25, CROWN_TOP - 0.02, 0);
    builder.addMesh(visor, { castShadow: true, receiveShadow: true });
    builder.box(
      mats.lightWarm,
      end * (HALF_L + 1.45),
      CROWN_TOP + 0.2,
      0,
      0.06,
      0.05,
      BUILDING.depth - 1.4,
      { cast: false, receive: false }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  Podium, colonnade and entrance                                             */
/* -------------------------------------------------------------------------- */

function buildPodiumAndEntrance(builder, mats, random) {
  // A dark inner lining behind the transparent ground-floor glazing.
  builder.box(
    mats.slotDark,
    0,
    2.15,
    0,
    BUILDING.length - 3.2,
    3.8,
    BUILDING.depth - 2.4,
    { cast: false, receive: true }
  );

  // Continuous ground-floor glazing.
  for (const side of [-1, 1]) {
    builder.box(
      mats.glassLobby,
      0,
      2.3,
      side * (HALF_D - 0.68),
      BUILDING.length - 4.2,
      3.3,
      0.09,
      { cast: false, receive: true }
    );
    builder.box(
      mats.white,
      0,
      BUILDING.groundHeight - 0.18,
      side * (HALF_D + 0.1),
      BUILDING.length + 0.8,
      0.42,
      0.9,
      { cast: true, receive: true }
    );
    builder.box(
      mats.white,
      0,
      0.53,
      side * (HALF_D - 0.38),
      BUILDING.length + 0.1,
      0.3,
      0.55,
      { cast: true, receive: true }
    );
  }

  // Ground colonnade columns align with the residential piers.
  for (const wing of WINGS) {
    const bayWidth = (wing.x1 - wing.x0) / BUILDING.baysPerWing;
    for (let i = 0; i <= BUILDING.baysPerWing; i += 1) {
      const x = wing.x0 + i * bayWidth;
      for (const side of [-1, 1]) {
        builder.box(
          mats.white,
          x,
          2.25,
          side * (HALF_D - 0.15),
          0.62,
          4.0,
          0.62,
          { cast: true, receive: true }
        );
      }
    }
  }

  // Flank the entrance with tall gold screens and broad white piers.
  const halfEntrance = ENTRANCE.width / 2;
  for (const x of [ENTRANCE.x - halfEntrance - 0.72, ENTRANCE.x + halfEntrance + 0.72]) {
    builder.box(
      mats.white,
      x,
      2.7,
      HALF_D + 0.35,
      1.15,
      5.4,
      1.25,
      { cast: true, receive: true }
    );
    addGoldScreen(builder, mats, {
      x,
      y: 0.5,
      height: 3.9,
      z: HALF_D + 1.02,
      span: 0.82,
      bars: 6,
      axis: 'x'
    });
  }

  // Double-height lobby glazing.
  builder.box(
    mats.glassLobby,
    ENTRANCE.x,
    2.32,
    HALF_D + 0.12,
    ENTRANCE.width - 1.2,
    3.48,
    0.1,
    { cast: false, receive: true }
  );
  builder.box(
    mats.lightWarm,
    ENTRANCE.x,
    2.4,
    HALF_D - 0.12,
    ENTRANCE.width - 2.2,
    2.7,
    0.045,
    { cast: false, receive: false }
  );
  for (let i = 0; i < 6; i += 1) {
    const x = ENTRANCE.x - (ENTRANCE.width - 1.6) / 2 + ((ENTRANCE.width - 1.6) / 5) * i;
    builder.box(
      mats.darkMetal,
      x,
      2.36,
      HALF_D + 0.2,
      0.075,
      3.5,
      0.08,
      { cast: false, receive: true }
    );
  }
  builder.box(
    mats.darkMetal,
    ENTRANCE.x,
    4.05,
    HALF_D + 0.2,
    ENTRANCE.width - 1.2,
    0.08,
    0.09,
    { cast: false, receive: true }
  );
  builder.box(
    mats.darkMetal,
    ENTRANCE.x,
    0.65,
    HALF_D + 0.2,
    ENTRANCE.width - 1.2,
    0.1,
    0.1,
    { cast: false, receive: true }
  );

  // Entrance canopy / portal.
  builder.box(
    mats.white,
    ENTRANCE.x,
    5.25,
    HALF_D + 2.55,
    ENTRANCE.width + 4.2,
    0.48,
    5.1,
    { cast: true, receive: true }
  );
  builder.box(
    mats.whiteSoft,
    ENTRANCE.x,
    5.55,
    HALF_D + 2.45,
    ENTRANCE.width + 4.35,
    0.2,
    5.25,
    { cast: true, receive: true }
  );
  builder.box(
    mats.deckWarm,
    ENTRANCE.x,
    4.97,
    HALF_D + 2.55,
    ENTRANCE.width + 3.8,
    0.08,
    4.75,
    { cast: false, receive: true }
  );
  for (let i = 0; i < 4; i += 1) {
    builder.box(
      mats.lightWarm,
      ENTRANCE.x - 2.9 + i * 1.94,
      4.9,
      HALF_D + 3.8,
      0.34,
      0.03,
      0.14,
      { cast: false, receive: false }
    );
  }
  // Slim supporting fins under the outer edge of the canopy.
  for (const x of [ENTRANCE.x - ENTRANCE.width / 2 - 1.2, ENTRANCE.x + ENTRANCE.width / 2 + 1.2]) {
    builder.box(mats.railMetal, x, 2.5, HALF_D + 4.95, 0.09, 4.8, 0.09, {
      cast: true,
      receive: true
    });
  }

  // Steps and entrance apron.
  for (let i = 0; i < 3; i += 1) {
    builder.box(
      mats.stone,
      ENTRANCE.x,
      0.09 + i * 0.11,
      HALF_D + 2.0 + i * 0.5,
      ENTRANCE.width + 5.5 - i * 0.4,
      0.18,
      1.25,
      { cast: false, receive: true }
    );
  }

  // Flanking planters.
  for (const x of [ENTRANCE.x - 6.7, ENTRANCE.x + 6.7]) {
    addPlanter(builder, mats, {
      x,
      y: 0.24,
      z: HALF_D + 2.7,
      width: 2.8,
      depth: 1.2,
      height: 0.55,
      scale: 0.78,
      random
    });
  }

  // A quiet nameplate beside the lobby.
  const signTexture = makeWordmarkTexture({ ink: '#44382a' });
  const signMaterial = new THREE.MeshBasicMaterial({
    map: signTexture,
    transparent: true,
    depthWrite: false,
    toneMapped: true
  });
  builder.box(
    mats.whiteSoft,
    ENTRANCE.x - halfEntrance - 2.25,
    2.3,
    HALF_D + 0.16,
    3.5,
    1.18,
    0.12,
    { cast: false, receive: true }
  );
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.0), signMaterial);
  sign.position.set(ENTRANCE.x - halfEntrance - 2.25, 2.3, HALF_D + 0.235);
  builder.addMesh(sign, { castShadow: false, receiveShadow: false });

  // Ground-level planting strips against the podium.
  for (let i = 0; i < 7; i += 1) {
    const x = -26 + i * 8.4;
    if (Math.abs(x - ENTRANCE.x) < 7) continue;
    addPlanter(builder, mats, {
      x,
      y: 0.24,
      z: HALF_D + 1.5,
      width: 3.2,
      depth: 0.9,
      height: 0.4,
      scale: 0.5,
      random
    });
  }
}

/* -------------------------------------------------------------------------- */
/*  Roof terrace and open crown                                                */
/* -------------------------------------------------------------------------- */

function buildRoofCrown(builder, mats, random) {
  // Paved roof terrace with inset planted edge.
  const roofPaving = new THREE.Mesh(
    new THREE.PlaneGeometry(BUILDING.length - 1.4, BUILDING.depth - 1.6),
    mats.roofPaving
  );
  roofPaving.rotation.x = -Math.PI / 2;
  roofPaving.position.set(0, ROOF_Y + 0.26, 0);
  builder.addMesh(roofPaving, { castShadow: false, receiveShadow: true });

  // A terrace deck inset adds material variety to the top view.
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(18, 5.6), mats.deck);
  deck.rotation.x = -Math.PI / 2;
  deck.position.set(-13, ROOF_Y + 0.275, 3.5);
  builder.addMesh(deck, { castShadow: false, receiveShadow: true });

  // Low perimeter upstand and glass balustrade within the open crown.
  for (const side of [-1, 1]) {
    builder.box(
      mats.white,
      0,
      ROOF_Y + 0.55,
      side * (HALF_D - 0.34),
      BUILDING.length - 0.8,
      0.55,
      0.4,
      { cast: true, receive: true }
    );
  }
  for (const end of [-1, 1]) {
    builder.box(
      mats.white,
      end * (HALF_L - 0.34),
      ROOF_Y + 0.55,
      0,
      0.4,
      0.55,
      BUILDING.depth - 0.8,
      { cast: true, receive: true }
    );
  }

  // Crown columns and open top beams. The long facade columns align with the
  // structural grid below; the short ends use a central pylon and corner blades.
  const crownColumnXs = [];
  for (const wing of WINGS) {
    crownColumnXs.push(wing.x0 + 0.25, (wing.x0 + wing.x1) / 2, wing.x1 - 0.25);
  }
  for (const side of [-1, 1]) {
    for (const x of crownColumnXs) {
      builder.box(
        mats.white,
        x,
        (ROOF_Y + CROWN_TOP) / 2,
        side * (HALF_D - 0.52),
        0.65,
        CROWN_TOP - ROOF_Y - 0.5,
        0.72,
        { cast: true, receive: true }
      );
      // Railing above the parapet between crown columns is added below.
    }
    builder.box(
      mats.white,
      0,
      CROWN_TOP - 0.4,
      side * (HALF_D - 0.52),
      BUILDING.length + 1.0,
      0.8,
      0.72,
      { cast: true, receive: true }
    );
    builder.box(
      mats.whiteSoft,
      0,
      ROOF_Y + 3.5,
      side * (HALF_D - 0.5),
      BUILDING.length - 0.8,
      0.2,
      0.35,
      { cast: false, receive: true }
    );
  }

  // Full-width top beams close the crown frame.
  for (const end of [-1, 1]) {
    builder.box(
      mats.white,
      end * (HALF_L + 0.15),
      CROWN_TOP - 0.4,
      0,
      0.9,
      0.8,
      BUILDING.depth + 0.8,
      { cast: true, receive: true }
    );
  }

  // Glass balustrade segments between columns at the terrace edge.
  for (const side of [-1, 1]) {
    for (let i = 0; i < crownColumnXs.length - 1; i += 1) {
      const x0 = crownColumnXs[i];
      const x1 = crownColumnXs[i + 1];
      if (x1 - x0 < 1.2) continue;
      builder.box(
        mats.railGlass,
        (x0 + x1) / 2,
        ROOF_Y + 0.94,
        side * (HALF_D - 0.7),
        x1 - x0 - 0.7,
        0.85,
        0.035,
        { cast: false, receive: false, renderOrder: 2 }
      );
      builder.box(
        mats.railMetal,
        (x0 + x1) / 2,
        ROOF_Y + 1.38,
        side * (HALF_D - 0.7),
        x1 - x0 - 0.55,
        0.045,
        0.075,
        { cast: false, receive: false }
      );
    }
  }

  // Gold crown screens near the two vertical channels.
  for (const slot of SLOTS) {
    for (const side of [-1, 1]) {
      for (let i = 0; i < 9; i += 1) {
        const x = slot.x0 + 0.2 + (i / 8) * (slot.x1 - slot.x0 - 0.4);
        builder.box(
          mats.gold,
          x,
          ROOF_Y + 4.1,
          side * (HALF_D - 0.18),
          0.07,
          4.8,
          0.09,
          { cast: false, receive: true }
        );
      }
    }
  }

  // Gold screens at the crown corners, echoing the reference elevation.
  for (const end of [-1, 1]) {
    for (let i = 0; i < 10; i += 1) {
      const z = -5.7 + (i / 9) * 11.4;
      builder.box(
        mats.gold,
        end * (HALF_L - 1.2),
        ROOF_Y + 4.4,
        z,
        0.06,
        4.2,
        0.075,
        { cast: false, receive: true }
      );
    }
  }

  // Planted perimeter gardens — conservative, evidenced by the aerial renders.
  const planterSpots = [
    [-26, 6.5], [-13, 6.5], [0, 6.5], [13, 6.5], [26, 6.5],
    [-26, -6.5], [-13, -6.5], [0, -6.5], [13, -6.5], [26, -6.5]
  ];
  for (const [x, z] of planterSpots) {
    addRoofPlanter(builder, mats, x, ROOF_Y + 0.38, z, 4.2, 0.55, 0.95, random);
  }

  // Low white service pavilions. These are inferred from the aerial's white
  // rectangular roof structures; no plant equipment or rooftop amenity is claimed.
  addRoofPavilion(builder, mats, -17, ROOF_Y + 0.33, -1.8, 7.2, 2.35, 3.8, random);
  addRoofPavilion(builder, mats, 16.5, ROOF_Y + 0.33, -3.1, 5.8, 2.2, 3.4, random);

  // Open white pergola frames visible in the roof aerial.
  const pergolas = [
    [-26, 1.7, 3.8, 2.8],
    [-5.4, 2.2, 3.5, 2.6],
    [10.5, 1.4, 3.2, 2.8],
    [24.0, -0.2, 3.0, 2.4]
  ];
  for (const [x, z, w, d] of pergolas) {
    addRoofPergola(builder, mats, x, ROOF_Y + 0.27, z, w, d);
  }

  // Sparse small trees in the planted roof zones.
  const treeSpots = [[-26, 6.3], [-6, -6.4], [16, 6.4], [28, -6.4]];
  for (const [x, z] of treeSpots) {
    addRoofTree(builder, mats, x, ROOF_Y + 0.55, z, 1.15, random);
  }
}

function addRoofPavilion(builder, mats, x, y, z, w, h, d, random) {
  builder.box(mats.white, x, y + h / 2, z, w, h, d, { cast: true, receive: true });
  builder.box(mats.whiteSoft, x, y + h + 0.09, z, w + 0.24, 0.16, d + 0.24, {
    cast: true,
    receive: true
  });
  builder.box(mats.darkMetal, x, y + h * 0.7, z + d / 2 + 0.012, w - 0.5, h * 0.42, 0.04, {
    cast: false,
    receive: true
  });
  builder.box(mats.darkMetal, x, y + h * 0.7, z - d / 2 - 0.012, w - 0.5, h * 0.42, 0.04, {
    cast: false,
    receive: true
  });
  for (let i = 0; i < 10; i += 1) {
    builder.box(
      mats.darkMetal,
      x - (w - 0.7) / 2 + (i / 9) * (w - 0.7),
      y + h * 0.72,
      z + d / 2 + 0.05,
      0.035,
      h * 0.32,
      0.05,
      { cast: false, receive: false }
    );
    builder.box(
      mats.darkMetal,
      x - (w - 0.7) / 2 + (i / 9) * (w - 0.7),
      y + h * 0.72,
      z - d / 2 - 0.05,
      0.035,
      h * 0.32,
      0.05,
      { cast: false, receive: false }
    );
  }
  // A small door-like recess, no interior is modelled.
  builder.box(mats.glassDeep, x + w * 0.25, y + 0.82, z + d / 2 + 0.025, 1.0, 1.55, 0.03, {
    cast: false,
    receive: true
  });
  addRoofPlanter(builder, mats, x - w / 2 - 1.2, y, z + 0.2, 1.7, 0.35, 1.0, random);
}

function addRoofPergola(builder, mats, x, y, z, w, d) {
  const h = 1.35;
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      builder.box(mats.white, x + sx * (w / 2 - 0.12), y + h / 2, z + sz * (d / 2 - 0.12), 0.14, h, 0.14, {
        cast: true,
        receive: true
      });
    }
  }
  for (const sz of [-1, 1]) {
    builder.box(mats.white, x, y + h, z + sz * (d / 2 - 0.12), w, 0.16, 0.17, {
      cast: true,
      receive: true
    });
  }
  for (const sx of [-1, 1]) {
    builder.box(mats.white, x + sx * (w / 2 - 0.12), y + h, z, 0.17, 0.16, d, {
      cast: true,
      receive: true
    });
  }
  for (let i = 0; i < 7; i += 1) {
    builder.box(
      mats.whiteSoft,
      x - w / 2 + 0.28 + (i / 6) * (w - 0.56),
      y + h + 0.17,
      z,
      0.06,
      0.06,
      d - 0.12,
      { cast: false, receive: true }
    );
  }
}

function addRoofPlanter(builder, mats, x, y, z, width, height, depth, random) {
  builder.box(mats.whiteSoft, x, y + height / 2, z, width, height, depth, {
    cast: false,
    receive: true
  });
  builder.box(mats.soil, x, y + height + 0.025, z, width - 0.16, 0.08, depth - 0.12, {
    cast: false,
    receive: true
  });
  const count = Math.max(3, Math.round(width * 1.25));
  for (let i = 0; i < count; i += 1) {
    const px = x - width * 0.42 + (i / Math.max(1, count - 1)) * width * 0.84;
    const pz = z + randRange(random, -depth * 0.25, depth * 0.25);
    const scale = randRange(random, 0.28, 0.62) * height;
    builder.ico(mats.foliage, px, y + height + scale * 0.75, pz, scale, scale * 0.8, scale, {
      cast: true,
      receive: true,
      color: i % 3 === 0 ? 0x6d8460 : i % 3 === 1 ? 0x4e6b4b : 0x586f4f
    });
  }
  if (random() < 0.28) {
    builder.ico(mats.flowerPink, x + width * 0.27, y + height + 0.35, z, 0.3, 0.24, 0.3, {
      cast: false,
      receive: true
    });
  }
}

function addRoofTree(builder, mats, x, y, z, scale, random) {
  builder.cylinder(mats.trunk, x, y + 0.8 * scale, z, 0.14 * scale, 1.6 * scale, {
    cast: true,
    receive: true
  });
  for (let i = 0; i < 4; i += 1) {
    const angle = (i / 4) * Math.PI * 2 + random() * 0.5;
    builder.ico(
      mats.foliage,
      x + Math.cos(angle) * 0.5 * scale,
      y + (1.85 + (i % 2) * 0.4) * scale,
      z + Math.sin(angle) * 0.5 * scale,
      0.85 * scale,
      0.75 * scale,
      0.85 * scale,
      { cast: true, receive: true, fine: true, color: i % 2 ? 0x4b6a4d : 0x5f7a59 }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  Reusable detail helpers                                                    */
/* -------------------------------------------------------------------------- */

function addFrontBalustrade(builder, mats, centerX, y, z, width, solid) {
  if (solid) {
    builder.box(mats.whiteSoft, centerX, y + 0.52, z, width, 1.02, 0.14, {
      cast: true,
      receive: true
    });
    builder.box(mats.darkMetal, centerX, y + 1.05, z, width + 0.05, 0.055, 0.19, {
      cast: false
    });
    return;
  }

  builder.box(mats.railGlass, centerX, y + 0.53, z, width - 0.12, 0.94, 0.032, {
    cast: false,
    receive: false,
    renderOrder: 2
  });
  builder.box(mats.railMetal, centerX, y + 1.03, z, width, 0.05, 0.075, {
    cast: false,
    receive: false
  });
  builder.box(mats.railMetal, centerX, y + 0.06, z, width, 0.045, 0.075, {
    cast: false,
    receive: false
  });
  for (const x of [centerX - width / 2, centerX + width / 2]) {
    builder.box(mats.railMetal, x, y + 0.53, z, 0.045, 0.99, 0.06, {
      cast: false,
      receive: false
    });
  }
}

function addEndBalustrade(builder, mats, x, y, zCenter, depth, solid) {
  if (solid) {
    builder.box(mats.whiteSoft, x, y + 0.52, zCenter, 0.14, 1.02, depth, {
      cast: true,
      receive: true
    });
    builder.box(mats.darkMetal, x, y + 1.05, zCenter, 0.19, 0.055, depth + 0.04, {
      cast: false
    });
    return;
  }
  builder.box(mats.railGlass, x, y + 0.53, zCenter, 0.032, 0.94, depth - 0.12, {
    cast: false,
    receive: false,
    renderOrder: 2
  });
  builder.box(mats.railMetal, x, y + 1.03, zCenter, 0.075, 0.05, depth, {
    cast: false,
    receive: false
  });
  builder.box(mats.railMetal, x, y + 0.06, zCenter, 0.075, 0.045, depth, {
    cast: false,
    receive: false
  });
  for (const z of [zCenter - depth / 2, zCenter + depth / 2]) {
    builder.box(mats.railMetal, x, y + 0.53, z, 0.06, 0.99, 0.045, {
      cast: false,
      receive: false
    });
  }
}

function addGoldScreen(builder, mats, { x, y, height, z, span, bars, axis }) {
  if (axis === 'z') {
    for (let i = 0; i < bars; i += 1) {
      const pz = z - span / 2 + (i / Math.max(1, bars - 1)) * span;
      builder.box(mats.gold, x, y + height / 2, pz, 0.055, height, 0.065, {
        cast: false,
        receive: true
      });
    }
    builder.box(mats.goldDeep, x, y, z, 0.075, 0.07, span + 0.1, { cast: false });
    builder.box(mats.goldDeep, x, y + height, z, 0.075, 0.07, span + 0.1, { cast: false });
  } else {
    for (let i = 0; i < bars; i += 1) {
      const px = x - span / 2 + (i / Math.max(1, bars - 1)) * span;
      builder.box(mats.gold, px, y + height / 2, z, 0.055, height, 0.065, {
        cast: false,
        receive: true
      });
    }
    builder.box(mats.goldDeep, x, y, z, span + 0.1, 0.07, 0.075, { cast: false });
    builder.box(mats.goldDeep, x, y + height, z, span + 0.1, 0.07, 0.075, { cast: false });
  }
}

function addPlanter(builder, mats, { x, y, z, width, depth, height, scale, random }) {
  builder.box(mats.whiteSoft, x, y + height / 2, z, width, height, depth, {
    cast: true,
    receive: true
  });
  builder.box(mats.soil, x, y + height + 0.012, z, width - 0.1, 0.04, depth - 0.08, {
    cast: false,
    receive: true
  });
  const count = Math.max(2, Math.round(width / Math.max(0.4, scale)));
  for (let i = 0; i < count; i += 1) {
    const px = x - width * 0.4 + (i / Math.max(1, count - 1)) * width * 0.8;
    builder.ico(
      mats.foliage,
      px + randRange(random, -0.08, 0.08),
      y + height + scale * 0.65,
      z + randRange(random, -0.1, 0.1),
      scale,
      scale * 0.8,
      scale,
      { cast: true, receive: true, color: i % 2 ? 0x4d6b4b : 0x637f59 }
    );
  }
  if (random() < 0.35) {
    builder.ico(mats.flowerPink, x + width * 0.25, y + height + scale * 0.6, z, scale * 0.55, scale * 0.4, scale * 0.55, {
      cast: false,
      receive: true
    });
  }
}
