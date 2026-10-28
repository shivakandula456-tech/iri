import * as THREE from "three";
import {
  DEG,
  addBox,
  addCylinder,
  addSphere,
  makeCurtainGeometry,
  makeGrilleLines,
  roomGeometry,
} from "./viewer-geometry.js";

const DOOR_SWING = {
  "entrance-door": 1,
  "bedroom-door": -1,
  "balcony-door": -1,
  "closed-room-door": 0,
};

function addWallSegment(viewer, group, wall, start, end, y0, y1) {
  const dx = wall.to[0] - wall.from[0];
  const dz = wall.to[1] - wall.from[1];
  const length = Math.hypot(dx, dz);
  const dirX = dx / length;
  const dirZ = dz / length;
  const span = end - start;
  if (span <= 0.001 || y1 - y0 <= 0.001) return;
  const along = start + span / 2;
  const x = wall.from[0] + dirX * along;
  const z = wall.from[1] + dirZ * along;
  const y = (y0 + y1) / 2;
  const horizontal = Math.abs(dirX) > Math.abs(dirZ);

  addBox(group, {
    w: horizontal ? span : wall.thickness,
    h: y1 - y0,
    d: horizontal ? wall.thickness : span,
    mat: viewer.material.wall,
    x,
    y,
    z,
    cast: true,
    receive: true,
  });

  if (y0 <= 0.001) {
    for (const side of [-1, 1]) {
      addBox(group, {
        w: horizontal ? span : 0.018,
        h: 0.075,
        d: horizontal ? 0.018 : span,
        mat: viewer.material.trim,
        x: x + (horizontal ? 0 : side * (wall.thickness / 2 + 0.009)),
        y: 0.0375,
        z: z + (horizontal ? side * (wall.thickness / 2 + 0.009) : 0),
        cast: false,
      });
    }
  }
}

function addCasing(group, opening, thickness, material, baseY = 0) {
  const width = opening.width;
  const height = opening.height;
  const top = baseY + height;
  const jamb = 0.055;
  for (const side of [-1, 1]) {
    addBox(group, {
      w: jamb,
      h: height + 0.06,
      d: thickness + 0.035,
      mat: material,
      x: side * (width / 2 + jamb / 2 - 0.002),
      y: baseY + (height + 0.06) / 2,
      cast: false,
    });
  }
  addBox(group, {
    w: width + jamb * 2,
    h: 0.06,
    d: thickness + 0.035,
    mat: material,
    y: top + 0.03,
    cast: false,
  });
}

function addDoorPanels(group, centerX, width, height, material) {
  for (const side of [-1, 1]) {
    for (const row of [0.31, 0.66]) {
      addBox(group, {
        w: width * 0.66,
        h: height * 0.25,
        d: 0.008,
        mat: material,
        x: centerX,
        y: height * row,
        z: side * 0.0265,
        cast: false,
      });
    }
  }
}

function addHandle(group, x, y, material) {
  for (const side of [-1, 1]) {
    addCylinder(group, {
      radiusTop: 0.018,
      height: 0.018,
      mat: material,
      x,
      y,
      z: side * 0.04,
      rotX: Math.PI / 2,
    });
    addBox(group, {
      w: 0.11,
      h: 0.015,
      d: 0.018,
      mat: material,
      x: x - 0.035,
      y,
      z: side * 0.064,
      cast: false,
    });
  }
}

function addDoor(viewer, group, opening, thickness) {
  const width = opening.width;
  const height = opening.height;
  const hingeStart = opening.hinge !== "end";
  const leafGroup = new THREE.Group();
  leafGroup.position.set(hingeStart ? -width / 2 : width / 2, 0, 0);
  const angle = (opening.openAngle || 0) * DEG * (DOOR_SWING[opening.id] || 0);
  leafGroup.rotation.y = angle;
  group.add(leafGroup);

  const center = hingeStart ? width / 2 : -width / 2;
  const isWood = opening.leaf === "wood";
  const leafMaterial = isWood ? viewer.material.wood : viewer.material.whiteDoor;
  addBox(leafGroup, {
    w: width,
    h: height,
    d: 0.045,
    mat: leafMaterial,
    x: center,
    y: height / 2,
    z: 0,
  });

  addDoorPanels(
    leafGroup,
    center,
    width,
    height,
    isWood ? viewer.material.darkBrown : viewer.material.trim,
  );

  if (opening.id === "balcony-door") {
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 0.58, height * 0.6),
      viewer.material.glass,
    );
    glass.position.set(center, height * 0.62, 0.026);
    leafGroup.add(glass);
    addBox(leafGroup, {
      w: 0.018,
      h: height * 0.6,
      d: 0.012,
      mat: viewer.material.whiteDoor,
      x: center,
      y: height * 0.62,
      z: 0.031,
      cast: false,
    });
  }

  addHandle(leafGroup, center + (hingeStart ? width * 0.38 : -width * 0.38), 1.02, viewer.material.chrome);

  if (isWood) {
    addCylinder(leafGroup, {
      radiusTop: 0.024,
      height: 0.008,
      mat: viewer.material.chrome,
      x: center,
      y: 1.55,
      z: 0.026,
      rotX: Math.PI / 2,
    });
    const plaqueMaterial = viewer.material.plaque;
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.12), plaqueMaterial);
    plaque.position.set(center, 1.72, 0.025);
    leafGroup.add(plaque);
    const plaqueBack = plaque.clone();
    plaqueBack.rotation.y = Math.PI;
    plaqueBack.position.z = -0.025;
    leafGroup.add(plaqueBack);
  }

  addBox(group, {
    w: width + 0.04,
    h: 0.018,
    d: thickness + 0.06,
    mat: viewer.material.stone,
    y: 0.012,
    cast: false,
  });

  leafGroup.userData.doorId = opening.id;
  leafGroup.userData.open = Math.abs(opening.openAngle || 0) > 0;
}

function addWindow(viewer, group, opening, thickness) {
  const width = opening.width;
  const height = opening.height;
  const sill = opening.sill || 0.9;
  const top = sill + height;
  const centerY = sill + height / 2;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.1, height - 0.1), viewer.material.glass);
  glass.position.set(0, centerY, 0);
  group.add(glass);

  for (const side of [-1, 1]) {
    addBox(group, {
      w: 0.045,
      h: height + 0.04,
      d: thickness + 0.02,
      mat: viewer.material.trim,
      x: side * (width / 2 + 0.012),
      y: centerY,
      cast: false,
    });
  }
  addBox(group, {
    w: width + 0.09,
    h: 0.045,
    d: thickness + 0.02,
    mat: viewer.material.trim,
    y: top + 0.012,
    cast: false,
  });
  addBox(group, {
    w: width + 0.13,
    h: 0.038,
    d: thickness + 0.1,
    mat: viewer.material.trim,
    y: sill - 0.019,
    cast: false,
  });
  addBox(group, {
    w: 0.028,
    h: height,
    d: 0.04,
    mat: viewer.material.trim,
    y: centerY,
    z: 0.012,
    cast: false,
  });
  addBox(group, {
    w: width,
    h: 0.028,
    d: 0.04,
    mat: viewer.material.trim,
    y: sill + height * 0.48,
    z: 0.012,
    cast: false,
  });
}

function addCurtains(viewer, group, opening, thickness) {
  if (!opening.curtain) return;
  const blue = opening.curtain === "blue";
  const material = blue ? viewer.material.curtainBlue : viewer.material.curtainGrey;
  const width = opening.width;
  const top = (opening.sill || 0) + opening.height + 0.32;
  const bottom = 0.12;
  const curtainHeight = top - bottom;
  const panels = blue ? 1 : 2;
  const panelWidth = blue ? width + 0.25 : width * 0.53;
  for (let index = 0; index < panels; index += 1) {
    const geometry = makeCurtainGeometry(panelWidth, curtainHeight, blue ? 7 : 5);
    const mesh = new THREE.Mesh(geometry, material);
    const x = blue ? 0 : (index === 0 ? -1 : 1) * (width / 2 - panelWidth * 0.36);
    mesh.position.set(x, bottom + curtainHeight / 2, thickness / 2 + 0.095);
    mesh.rotation.y = blue ? 0 : (index === 0 ? -0.06 : 0.06);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    group.add(mesh);
  }
  addBox(group, {
    w: width + (blue ? 0.36 : 0.18),
    h: 0.022,
    d: 0.022,
    mat: blue ? viewer.material.blackMetal : viewer.material.brass,
    y: top + 0.015,
    z: thickness / 2 + 0.11,
    cast: false,
  });
}

function addGrille(viewer, group, opening, thickness) {
  const width = opening.width;
  const height = opening.height;
  const sill = opening.sill || 0.8;
  const centerY = sill + height / 2;
  const top = sill + height;
  const meshMaterial = new THREE.MeshBasicMaterial({
    color: 0xf7f2e8,
    transparent: true,
    opacity: 0.14,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.08, height - 0.05), meshMaterial);
  screen.position.set(0, centerY, 0);
  group.add(screen);

  const lines = new THREE.LineSegments(
    makeGrilleLines(width - 0.06, height - 0.04, 0.052),
    new THREE.LineBasicMaterial({ color: 0xf3eee4, transparent: true, opacity: 0.72 }),
  );
  lines.position.set(0, centerY, 0.012);
  group.add(lines);

  for (const side of [-1, 1]) {
    addBox(group, {
      w: 0.034,
      h: height,
      d: thickness + 0.02,
      mat: viewer.material.charcoal,
      x: side * (width / 2),
      y: centerY,
    });
  }
  for (const y of [sill, top]) {
    addBox(group, {
      w: width,
      h: 0.038,
      d: thickness + 0.02,
      mat: viewer.material.charcoal,
      y,
    });
  }
  addBox(group, {
    w: width + 0.05,
    h: 0.04,
    d: thickness + 0.12,
    mat: viewer.material.stone,
    y: sill - 0.02,
    z: thickness * 0.15,
    cast: false,
  });
  addBox(group, {
    w: width - 0.04,
    h: 0.042,
    d: 0.05,
    mat: viewer.material.blackMetal,
    y: 1.02,
    z: thickness / 2 + 0.08,
  });
  const postCount = Math.max(2, Math.round(width / 0.9));
  for (let index = 0; index <= postCount; index += 1) {
    const x = -width / 2 + (index / postCount) * width;
    addBox(group, {
      w: 0.022,
      h: 0.24,
      d: 0.022,
      mat: viewer.material.blackMetal,
      x,
      y: 0.95,
      z: thickness / 2 + 0.06,
    });
  }
}

function addTrackAndOrnament(viewer, group, opening) {
  const width = opening.width;
  addBox(group, {
    w: width + 0.08,
    h: 0.055,
    d: 0.06,
    mat: viewer.material.blackMetal,
    y: opening.height + 0.02,
    z: 0.08,
  });
  const ornamentX = width * 0.27;
  addCylinder(group, {
    radiusTop: 0.0025,
    height: 0.17,
    mat: viewer.material.blackMetal,
    x: ornamentX,
    y: opening.height - 0.07,
    z: 0.12,
    cast: false,
  });
  addSphere(group, {
    radius: 0.033,
    mat: viewer.material.brass,
    x: ornamentX,
    y: opening.height - 0.17,
    z: 0.12,
    scaleY: 1.35,
  });
  addCylinder(group, {
    radiusTop: 0.012,
    height: 0.018,
    mat: viewer.material.brass,
    x: ornamentX,
    y: opening.height + 0.01,
    z: 0.12,
    cast: false,
  });
}

function addOpening(viewer, wall, opening, wallGroup) {
  const dx = wall.to[0] - wall.from[0];
  const dz = wall.to[1] - wall.from[1];
  const length = Math.hypot(dx, dz);
  const dirX = dx / length;
  const dirZ = dz / length;
  const rotationY = Math.atan2(-dirZ, dirX);
  const along = opening.offset + opening.width / 2;
  const group = new THREE.Group();
  group.name = `opening-${opening.id}`;
  group.position.set(
    wall.from[0] + dirX * along,
    0.04,
    wall.from[1] + dirZ * along,
  );
  group.rotation.y = rotationY;
  group.userData.openingId = opening.id;
  wallGroup.add(group);

  if (opening.kind === "door") {
    addCasing(group, opening, wall.thickness, viewer.material.trim);
    addDoor(viewer, group, opening, wall.thickness);
    return;
  }
  if (opening.kind === "window") {
    addCasing(group, opening, wall.thickness, viewer.material.trim, opening.sill || 0);
    addWindow(viewer, group, opening, wall.thickness);
    addCurtains(viewer, group, opening, wall.thickness);
    return;
  }
  if (opening.kind === "grille") {
    addGrille(viewer, group, opening, wall.thickness);
    return;
  }
  addCasing(group, opening, wall.thickness, viewer.material.trim);
  if (opening.track) addTrackAndOrnament(viewer, group, opening);
}

export function buildWalls(viewer) {
  for (const wall of viewer.property.layout.walls) {
    const dx = wall.to[0] - wall.from[0];
    const dz = wall.to[1] - wall.from[1];
    const length = Math.hypot(dx, dz);
    const dirX = dx / length;
    const dirZ = dz / length;
    const group = new THREE.Group();
    group.name = `wall-${wall.id}`;
    group.userData.wallId = wall.id;
    group.userData.wallKind = wall.kind;
    viewer.walls.add(group);

    const openings = [...wall.openings].sort((a, b) => a.offset - b.offset);
    let cursor = 0;
    for (const opening of openings) {
      if (opening.offset > cursor) {
        addWallSegment(viewer, group, wall, cursor, opening.offset, 0, viewer.wallHeight);
      }
      const sill = opening.sill || 0;
      const top = sill + opening.height;
      if (sill > 0) {
        addWallSegment(viewer, group, wall, opening.offset, opening.offset + opening.width, 0, sill);
      }
      if (top < viewer.wallHeight) {
        addWallSegment(
          viewer,
          group,
          wall,
          opening.offset,
          opening.offset + opening.width,
          top,
          viewer.wallHeight,
        );
      }
      addOpening(viewer, wall, opening, group);
      cursor = opening.offset + opening.width;
    }
    if (cursor < length) {
      addWallSegment(viewer, group, wall, cursor, length, 0, viewer.wallHeight);
    }
  }
}

export function buildBase(viewer) {
  addBox(viewer.model, {
    w: viewer.width + 0.42,
    h: 0.18,
    d: viewer.depth + 0.42,
    mat: viewer.material.charcoalMatte,
    x: viewer.width / 2,
    y: -0.09,
    z: viewer.depth / 2,
    receive: true,
  });
  addBox(viewer.model, {
    w: viewer.width + 0.28,
    h: 0.045,
    d: viewer.depth + 0.28,
    mat: viewer.material.trim,
    x: viewer.width / 2,
    y: -0.0125,
    z: viewer.depth / 2,
    cast: false,
  });
  for (const side of [-1, 1]) {
    addBox(viewer.model, {
      w: viewer.width + 0.29,
      h: 0.018,
      d: 0.012,
      mat: viewer.material.brass,
      x: viewer.width / 2,
      y: -0.012,
      z: viewer.depth / 2 + side * (viewer.depth / 2 + 0.145),
      cast: false,
      receive: false,
    });
    addBox(viewer.model, {
      w: 0.012,
      h: 0.018,
      d: viewer.depth + 0.29,
      mat: viewer.material.brass,
      x: viewer.width / 2 + side * (viewer.width / 2 + 0.145),
      y: -0.012,
      z: viewer.depth / 2,
      cast: false,
      receive: false,
    });
  }
  const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 30),
    new THREE.ShadowMaterial({ color: 0x16110c, opacity: 0.18 }),
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(viewer.width / 2, -0.182, viewer.depth / 2);
  shadowPlane.receiveShadow = true;
  viewer.model.add(shadowPlane);
}

export function buildFloors(viewer) {
  for (const room of viewer.property.layout.rooms) {
    const isBalcony = room.kind === "balcony";
    const geometry = roomGeometry(room.polygon, 0.028);
    const material = isBalcony ? viewer.material.balconyTile : viewer.material.floorTile;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `floor-${room.id}`;
    mesh.receiveShadow = true;
    viewer.floors.add(mesh);
  }
  const thresholdMaterial = viewer.material.stone;
  for (const wall of viewer.property.layout.walls) {
    for (const opening of wall.openings) {
      if (opening.kind !== "door") continue;
      const dx = wall.to[0] - wall.from[0];
      const dz = wall.to[1] - wall.from[1];
      const length = Math.hypot(dx, dz);
      const dirX = dx / length;
      const dirZ = dz / length;
      const along = opening.offset + opening.width / 2;
      const horizontal = Math.abs(dirX) > Math.abs(dirZ);
      addBox(viewer.floors, {
        w: horizontal ? opening.width : wall.thickness + 0.08,
        h: 0.012,
        d: horizontal ? wall.thickness + 0.08 : opening.width,
        mat: thresholdMaterial,
        x: wall.from[0] + dirX * along,
        y: 0.04,
        z: wall.from[1] + dirZ * along,
        cast: false,
      });
    }
  }
}

export function buildRoomTargets(viewer) {
  const hitMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
    colorWrite: false,
  });
  for (const room of viewer.property.layout.rooms) {
    const target = new THREE.Mesh(roomGeometry(room.polygon, 0.052), hitMaterial);
    target.name = `room-target-${room.id}`;
    target.userData.roomId = room.id;
    target.userData.pickable = true;
    viewer.roomTargets.add(target);

    const highlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xc39a58,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const highlight = new THREE.Mesh(roomGeometry(room.polygon, 0.056), highlightMaterial);
    highlight.visible = false;
    highlight.name = `room-highlight-${room.id}`;
    viewer.roomHighlights.set(room.id, highlight);
    viewer.model.add(highlight);

    const outlinePoints = room.polygon.map(
      (point) => new THREE.Vector3(point[0], 0.061, point[1]),
    );
    outlinePoints.push(outlinePoints[0].clone());
    const outlineGeometry = new THREE.BufferGeometry().setFromPoints(outlinePoints);
    const outline = new THREE.Line(
      outlineGeometry,
      new THREE.LineBasicMaterial({
        color: 0xd2aa62,
        transparent: true,
        opacity: 0.9,
      }),
    );
    outline.visible = false;
    viewer.roomOutlines.set(room.id, outline);
    viewer.model.add(outline);
  }
}

export function buildCeiling(viewer) {
  for (const room of viewer.property.layout.rooms) {
    const geometry = roomGeometry(room.polygon, viewer.wallHeight + 0.005);
    const mesh = new THREE.Mesh(geometry, viewer.material.ceiling);
    mesh.name = `ceiling-${room.id}`;
    mesh.receiveShadow = true;
    viewer.ceiling.add(mesh);
  }

  const downlightMaterial = new THREE.MeshBasicMaterial({ color: 0xfff2d8 });
  const downlights = [
    [2.1, 4.0],
    [1.4, 1.3],
    [5.9, 3.4],
    [7.1, 2.4],
    [4.0, 2.0],
  ];
  for (const [x, z] of downlights) {
    addCylinder(viewer.ceiling, {
      radiusTop: 0.062,
      height: 0.014,
      mat: downlightMaterial,
      x,
      y: viewer.wallHeight - 0.008,
      z,
      cast: false,
      receive: false,
    });
    addCylinder(viewer.ceiling, {
      radiusTop: 0.075,
      radiusBottom: 0.075,
      height: 0.004,
      mat: viewer.material.trim,
      x,
      y: viewer.wallHeight + 0.0,
      z,
      cast: false,
      receive: false,
    });
  }

  addBox(viewer.ceiling, {
    w: 1.1,
    h: 0.05,
    d: 0.1,
    mat: viewer.material.trim,
    x: 1.35,
    y: viewer.wallHeight - 0.04,
    z: 1.22,
    cast: false,
  });
  addBox(viewer.ceiling, {
    w: 1.02,
    h: 0.024,
    d: 0.065,
    mat: viewer.material.ledDiffuser,
    x: 1.35,
    y: viewer.wallHeight - 0.068,
    z: 1.22,
    cast: false,
    receive: false,
  });
  for (const side of [-1, 1]) {
    addBox(viewer.ceiling, {
      w: 0.035,
      h: 0.06,
      d: 0.11,
      mat: viewer.material.blackMetal,
      x: 1.35 + side * 0.55,
      y: viewer.wallHeight - 0.045,
      z: 1.22,
      cast: false,
    });
  }
}

export function buildLights(viewer) {
  const hemi = new THREE.HemisphereLight(0xfff4e4, 0x3e342b, 1.15);
  viewer.scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff0d8, 2.3);
  key.position.set(4.2, 8.5, 7.8);
  key.target.position.set(4.0, 0.5, 2.6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -7;
  key.shadow.camera.right = 7;
  key.shadow.camera.top = 7;
  key.shadow.camera.bottom = -7;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 22;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.025;
  viewer.scene.add(key, key.target);

  const windowFill = new THREE.DirectionalLight(0xcfdde8, 0.8);
  windowFill.position.set(2.5, 4.8, -6.5);
  windowFill.target.position.set(4.0, 1.1, 2.5);
  viewer.scene.add(windowFill, windowFill.target);

  const practicals = [
    { position: [2.2, 2.35, 4.1], color: 0xffd9a0, intensity: 5.2, distance: 5.2 },
    { position: [1.3, 2.3, 1.25], color: 0xfff1d4, intensity: 4.6, distance: 4.2 },
    { position: [6.1, 2.35, 3.35], color: 0xffd6a0, intensity: 6.0, distance: 5.6 },
    { position: [5.9, 2.2, 0.85], color: 0xd6e4ee, intensity: 2.8, distance: 3.4 },
    { position: [3.9, 2.2, 2.0], color: 0xffedd0, intensity: 2.2, distance: 3.0 },
  ];
  for (const config of practicals) {
    const light = new THREE.PointLight(config.color, config.intensity, config.distance, 2);
    light.position.set(...config.position);
    viewer.scene.add(light);
  }
}
