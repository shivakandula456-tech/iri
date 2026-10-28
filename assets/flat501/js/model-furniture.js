import * as THREE from "three";
import { DEG, addBox, addCylinder, addSphere, makeClothGeometry } from "./viewer-geometry.js";

const FLOOR_OFFSET = 0.04;

function makeGroup(viewer, item) {
  const group = new THREE.Group();
  group.name = `furniture-${item.id}`;
  group.position.set(item.x, FLOOR_OFFSET, item.z);
  group.rotation.y = -(item.rotation || 0) * DEG;
  group.userData.furnitureId = item.id;
  group.userData.roomId = item.roomId;
  group.userData.label = item.label;
  viewer.furniture.add(group);
  return group;
}

function addPanel(group, material, options) {
  const geometry = new THREE.PlaneGeometry(options.w, options.h);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(options.x, options.y, options.z);
  mesh.rotation.set(options.rotX || 0, options.rotY || 0, options.rotZ || 0);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addTube(group, material, from, to, radius = 0.009) {
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  const direction = end.clone().sub(start);
  const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 8);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

function buildConsole(group, item, material) {
  addBox(group, {
    w: item.w,
    h: item.h - 0.07,
    d: item.d,
    mat: material.charcoalMatte,
    y: (item.h - 0.07) / 2 + 0.05,
  });
  addBox(group, {
    w: item.w + 0.035,
    h: 0.035,
    d: item.d + 0.035,
    mat: material.wood,
    y: item.h - 0.018,
  });
  for (const side of [-1, 1]) {
    addBox(group, {
      w: 0.012,
      h: item.h - 0.16,
      d: item.d / 2 - 0.035,
      mat: material.charcoal,
      x: item.w / 2 + 0.004,
      y: (item.h - 0.16) / 2 + 0.09,
      z: side * (item.d / 4 + 0.008),
    });
    addCylinder(group, {
      radiusTop: 0.008,
      height: 0.012,
      mat: material.brass,
      x: item.w / 2 + 0.016,
      y: item.h * 0.53,
      z: side * 0.07,
      rotZ: Math.PI / 2,
    });
  }
  addCylinder(group, {
    radiusTop: 0.1,
    radiusBottom: 0.08,
    height: 0.045,
    mat: material.ceramic,
    x: 0.02,
    y: item.h + 0.025,
    z: -item.d * 0.24,
  });
  addBox(group, {
    w: 0.02,
    h: 0.02,
    d: 0.22,
    mat: material.blackMetal,
    x: 0.03,
    y: item.h + 0.01,
    z: item.d * 0.28,
  });
}

function buildTv(group, item, material) {
  addBox(group, {
    w: item.w,
    h: item.h,
    d: item.d,
    mat: material.charcoal,
    x: 0,
    y: item.y,
  });
  addPanel(group, material.screen, {
    w: item.d - 0.075,
    h: item.h - 0.075,
    x: item.w / 2 + 0.006,
    y: item.y,
    z: 0,
    rotY: Math.PI / 2,
  });
  addBox(group, {
    w: 0.035,
    h: 0.32,
    d: 0.12,
    mat: material.blackMetal,
    x: -item.w / 2 - 0.012,
    y: item.y - 0.05,
  });
}

function buildCabinet(group, item, material) {
  addBox(group, {
    w: item.w,
    h: item.h - 0.06,
    d: item.d,
    mat: material.charcoal,
    y: (item.h - 0.06) / 2 + 0.03,
  });
  addBox(group, {
    w: item.w + 0.02,
    h: 0.03,
    d: item.d + 0.02,
    mat: material.charcoalMatte,
    y: item.h - 0.015,
  });
  for (const side of [-1, 1]) {
    addBox(group, {
      w: 0.012,
      h: item.h - 0.12,
      d: item.d / 2 - 0.035,
      mat: material.charcoalMatte,
      x: item.w / 2 + 0.004,
      y: (item.h - 0.12) / 2 + 0.08,
      z: side * (item.d / 4 + 0.006),
    });
    addCylinder(group, {
      radiusTop: 0.006,
      height: 0.055,
      mat: material.brass,
      x: item.w / 2 + 0.022,
      y: item.h * 0.57,
      z: side * (item.d / 4 - 0.03),
    });
  }
  addBox(group, {
    w: 0.13,
    h: 0.16,
    d: 0.13,
    mat: material.creamFabric,
    x: 0,
    y: item.h + 0.08,
    z: -item.d * 0.18,
  });
  addCylinder(group, {
    radiusTop: 0.035,
    height: 0.15,
    mat: material.amber,
    x: -0.02,
    y: item.h + 0.075,
    z: item.d * 0.16,
  });
}

function buildStool(group, item, material) {
  addCylinder(group, {
    radiusTop: item.w * 0.44,
    radiusBottom: item.w * 0.5,
    height: 0.045,
    mat: material.plasticBlue,
    y: item.h - 0.025,
    radialSegments: 18,
  });
  for (let index = 0; index < 4; index += 1) {
    const angle = (index / 4) * Math.PI * 2 + Math.PI / 4;
    const radius = item.w * 0.31;
    addBox(group, {
      w: 0.026,
      h: item.h - 0.06,
      d: 0.026,
      mat: material.plasticBlue,
      x: Math.cos(angle) * radius,
      y: (item.h - 0.06) / 2,
      z: Math.sin(angle) * radius,
      rotX: Math.sin(angle) * 0.055,
      rotZ: -Math.cos(angle) * 0.055,
    });
  }
  addCylinder(group, {
    radiusTop: 0.012,
    height: 0.25,
    mat: material.plasticBlue,
    y: item.h * 0.44,
  });
}

function buildDryingRack(group, item, material) {
  const halfWidth = item.w / 2 - 0.04;
  const halfDepth = item.d / 2 - 0.03;
  for (const x of [-halfWidth, halfWidth]) {
    for (const z of [-halfDepth, halfDepth]) {
      addCylinder(group, {
        radiusTop: 0.008,
        height: item.h,
        mat: material.chrome,
        x,
        y: item.h / 2,
        z,
      });
    }
  }
  for (const y of [item.h - 0.02, item.h * 0.52]) {
    for (const z of [-halfDepth, halfDepth]) {
      addTube(group, material.chrome, [-halfWidth, y, z], [halfWidth, y, z], 0.008);
    }
  }
  for (const x of [-halfWidth, halfWidth]) {
    addTube(group, material.chrome, [x, item.h - 0.02, -halfDepth], [x, item.h - 0.02, halfDepth], 0.008);
  }
  for (let index = -2; index <= 2; index += 1) {
    addTube(
      group,
      material.chrome,
      [-halfWidth * 0.86, item.h - 0.035, index * 0.055],
      [halfWidth * 0.86, item.h - 0.035, index * 0.055],
      0.005,
    );
  }
  const cloth = new THREE.Mesh(
    makeClothGeometry(item.w * 0.38, item.d * 0.72, 0.017),
    material.creamFabric,
  );
  cloth.position.set(-item.w * 0.17, item.h - 0.16, 0);
  cloth.rotation.x = -Math.PI / 2;
  cloth.rotation.z = 0.02;
  cloth.castShadow = false;
  group.add(cloth);
  const blueCloth = new THREE.Mesh(
    makeClothGeometry(item.w * 0.3, item.d * 0.58, 0.015),
    material.plasticBlue,
  );
  blueCloth.position.set(item.w * 0.2, item.h - 0.27, 0);
  blueCloth.rotation.x = -Math.PI / 2;
  blueCloth.rotation.z = -0.025;
  group.add(blueCloth);
}

function buildCounter(group, item, material) {
  addBox(group, {
    w: item.w,
    h: item.h - 0.045,
    d: item.d,
    mat: material.creamFabric,
    y: (item.h - 0.045) / 2,
  });
  addBox(group, {
    w: item.w + 0.05,
    h: 0.045,
    d: item.d + 0.04,
    mat: material.stone,
    y: item.h - 0.023,
  });
  for (const side of [-1, 1]) {
    addBox(group, {
      w: 0.012,
      h: item.h - 0.18,
      d: item.d / 2 - 0.04,
      mat: material.trim,
      x: item.w / 2 + 0.004,
      y: (item.h - 0.18) / 2 + 0.04,
      z: side * (item.d / 4 + 0.006),
    });
    addCylinder(group, {
      radiusTop: 0.006,
      height: 0.03,
      mat: material.blackMetal,
      x: item.w / 2 + 0.018,
      y: item.h * 0.62,
      z: side * 0.06,
      rotZ: Math.PI / 2,
    });
  }
  addBox(group, {
    w: item.w - 0.1,
    h: 0.024,
    d: item.d * 0.34,
    mat: material.charcoalMatte,
    x: -0.01,
    y: item.h + 0.002,
    z: item.d * 0.2,
  });
  addCylinder(group, {
    radiusTop: 0.012,
    height: 0.32,
    mat: material.chrome,
    x: -item.w * 0.18,
    y: item.h + 0.16,
    z: item.d * 0.2,
  });
  addTube(
    group,
    material.chrome,
    [-item.w * 0.18, item.h + 0.31, item.d * 0.2],
    [item.w * 0.04, item.h + 0.31, item.d * 0.2],
    0.012,
  );
  addCylinder(group, {
    radiusTop: 0.055,
    radiusBottom: 0.04,
    height: 0.055,
    mat: material.ceramic,
    x: item.w * 0.06,
    y: item.h + 0.05,
    z: -item.d * 0.27,
  });
  addCylinder(group, {
    radiusTop: 0.052,
    height: 0.13,
    mat: material.jarGlass,
    x: item.w * 0.02,
    y: item.h + 0.09,
    z: -item.d * 0.04,
  });
  addCylinder(group, {
    radiusTop: 0.035,
    height: 0.11,
    mat: material.amber,
    x: item.w * 0.02,
    y: item.h + 0.08,
    z: -item.d * 0.04,
  });
  for (let index = 0; index < 4; index += 1) {
    addCylinder(group, {
      radiusTop: 0.0035,
      height: 0.18,
      mat: material.blackMetal,
      x: item.w * 0.02 + (index - 1.5) * 0.014,
      y: item.h + 0.13,
      z: item.d * 0.05,
      rotX: (index - 1.5) * 0.025,
    });
  }
}

function buildTallAppliance(group, item, material) {
  addBox(group, {
    w: item.w,
    h: item.h,
    d: item.d,
    mat: material.appliance,
    y: item.h / 2,
  });
  addBox(group, {
    w: 0.012,
    h: item.h - 0.1,
    d: item.d - 0.08,
    mat: material.charcoalMatte,
    x: item.w / 2 + 0.005,
    y: item.h / 2,
  });
  addBox(group, {
    w: 0.005,
    h: item.h * 0.43,
    d: item.d - 0.11,
    mat: material.charcoal,
    x: item.w / 2 + 0.014,
    y: item.h * 0.73,
  });
  for (const y of [item.h * 0.46, item.h * 0.78]) {
    addCylinder(group, {
      radiusTop: 0.01,
      height: 0.18,
      mat: material.chrome,
      x: item.w / 2 + 0.044,
      y,
      z: item.d * 0.34,
    });
  }
  addBox(group, {
    w: 0.012,
    h: 0.1,
    d: item.d * 0.5,
    mat: material.blackMetal,
    x: item.w / 2 + 0.012,
    y: 0.12,
  });
}

function buildShelving(group, item, material) {
  const halfDepth = item.d / 2 - 0.03;
  for (const x of [-item.w / 2 + 0.03, item.w / 2 - 0.03]) {
    for (const z of [-halfDepth, halfDepth]) {
      addBox(group, {
        w: 0.025,
        h: item.h,
        d: 0.025,
        mat: material.blackMetal,
        x,
        y: item.h / 2,
        z,
      });
    }
  }
  const shelfHeights = [0.24, 0.58, 0.92, 1.26, 1.62];
  for (const y of shelfHeights) {
    addBox(group, {
      w: item.w,
      h: 0.025,
      d: item.d,
      mat: material.darkBrown,
      y,
    });
  }
  const jarRows = [
    { y: 0.24, count: 3, material: material.jarGlass },
    { y: 0.58, count: 2, material: material.amber },
    { y: 0.92, count: 3, material: material.jarGlass },
    { y: 1.26, count: 2, material: material.creamFabric },
  ];
  for (const row of jarRows) {
    for (let index = 0; index < row.count; index += 1) {
      const spread = row.count === 2 ? 0.22 : 0.2;
      const z = (index - (row.count - 1) / 2) * spread;
      addCylinder(group, {
        radiusTop: 0.045,
        radiusBottom: 0.042,
        height: 0.14 + (index % 2) * 0.04,
        mat: row.material,
        x: -item.w * 0.18,
        y: row.y + 0.085 + (index % 2) * 0.02,
        z,
      });
    }
  }
  addBox(group, {
    w: item.w * 0.52,
    h: 0.22,
    d: 0.18,
    mat: material.creamFabric,
    x: -item.w * 0.1,
    y: 1.62 + 0.12,
    z: 0.18,
  });
}

function buildWaterDispenser(group, item, material) {
  addBox(group, {
    w: item.w,
    h: item.h,
    d: item.d,
    mat: material.whitePlastic,
    y: item.h / 2,
  });
  addBox(group, {
    w: item.w + 0.012,
    h: 0.07,
    d: item.d + 0.012,
    mat: material.orangePlastic,
    y: item.h - 0.09,
  });
  addBox(group, {
    w: 0.045,
    h: 0.12,
    d: 0.13,
    mat: material.charcoal,
    x: -item.w / 2 - 0.018,
    y: 0.62,
  });
  addBox(group, {
    w: 0.025,
    h: 0.035,
    d: 0.03,
    mat: material.plasticBlue,
    x: -item.w / 2 - 0.045,
    y: 0.64,
    z: -0.035,
  });
  addBox(group, {
    w: 0.025,
    h: 0.035,
    d: 0.03,
    mat: material.orangePlastic,
    x: -item.w / 2 - 0.045,
    y: 0.64,
    z: 0.035,
  });
  addCylinder(group, {
    radiusTop: 0.115,
    radiusBottom: 0.115,
    height: 0.31,
    mat: material.waterBlue,
    y: item.h + 0.19,
    radialSegments: 24,
  });
  addCylinder(group, {
    radiusTop: 0.06,
    radiusBottom: 0.085,
    height: 0.085,
    mat: material.whitePlastic,
    y: item.h + 0.395,
  });
  addBox(group, {
    w: 0.09,
    h: 0.09,
    d: 0.2,
    mat: material.whitePlastic,
    x: -0.055,
    y: item.h - 0.025,
  });
}

function buildDaybed(group, item, material) {
  for (const x of [-item.w / 2 + 0.13, item.w / 2 - 0.13]) {
    for (const z of [-item.d / 2 + 0.12, item.d / 2 - 0.12]) {
      addCylinder(group, {
        radiusTop: 0.035,
        radiusBottom: 0.027,
        height: 0.15,
        mat: material.wood,
        x,
        y: 0.075,
        z,
      });
    }
  }
  addBox(group, {
    w: item.w,
    h: 0.13,
    d: item.d,
    mat: material.wood,
    y: 0.19,
  });
  addBox(group, {
    w: item.w - 0.06,
    h: 0.2,
    d: item.d - 0.08,
    mat: material.blueFabric,
    y: 0.34,
  });
  addBox(group, {
    w: item.w - 0.1,
    h: 0.14,
    d: 0.16,
    mat: material.blueFabric,
    y: 0.51,
    z: -item.d / 2 + 0.13,
  });
  for (const x of [-item.w / 2 + 0.08, item.w / 2 - 0.08]) {
    addBox(group, {
      w: 0.11,
      h: 0.25,
      d: item.d - 0.1,
      mat: material.blueFabric,
      x,
      y: 0.39,
    });
  }
  for (let index = 0; index < 3; index += 1) {
    addBox(group, {
      w: item.w * 0.22,
      h: 0.21,
      d: 0.12,
      mat: index === 1 ? material.creamFabric : material.blueFabric,
      x: -item.w * 0.23 + index * item.w * 0.23,
      y: 0.53,
      z: -item.d * 0.27,
      rotX: -0.08,
      rotY: (index - 1) * 0.04,
    });
  }
  addBox(group, {
    w: item.w * 0.24,
    h: 0.14,
    d: 0.18,
    mat: material.greenFabric,
    x: item.w * 0.21,
    y: 0.52,
    z: -item.d * 0.02,
    rotY: 0.16,
  });
  const throwGeometry = new THREE.PlaneGeometry(item.w * 0.38, item.d * 0.7, 10, 8);
  const throwMesh = new THREE.Mesh(throwGeometry, material.creamFabric);
  throwMesh.rotation.x = -Math.PI / 2;
  throwMesh.position.set(item.w * 0.26, 0.45, item.d * 0.14);
  throwMesh.rotation.z = -0.2;
  group.add(throwMesh);
}

function buildRug(group, item, material) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(item.w, item.d), material.rug);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.012;
  mesh.receiveShadow = true;
  group.add(mesh);
  const border = new THREE.Mesh(
    new THREE.PlaneGeometry(item.w * 0.94, item.d * 0.9),
    new THREE.MeshStandardMaterial({ color: 0xb5b6aa, roughness: 1, transparent: true, opacity: 0.08 }),
  );
  border.rotation.x = -Math.PI / 2;
  border.position.y = 0.014;
  group.add(border);
}

function buildLowStorage(group, item, material) {
  addBox(group, {
    w: item.w,
    h: item.h - 0.05,
    d: item.d,
    mat: material.darkBrown,
    y: (item.h - 0.05) / 2 + 0.02,
  });
  addBox(group, {
    w: item.w + 0.015,
    h: 0.025,
    d: item.d + 0.015,
    mat: material.charcoal,
    y: item.h - 0.012,
  });
  addBox(group, {
    w: 0.012,
    h: item.h * 0.58,
    d: item.d - 0.08,
    mat: material.charcoalMatte,
    x: -item.w / 2 - 0.003,
    y: item.h * 0.48,
  });
  addCylinder(group, {
    radiusTop: 0.008,
    height: 0.06,
    mat: material.brass,
    x: -item.w / 2 - 0.014,
    y: item.h * 0.62,
    z: 0,
    rotZ: Math.PI / 2,
  });
  addCylinder(group, {
    radiusTop: 0.055,
    radiusBottom: 0.04,
    height: 0.16,
    mat: material.ceramic,
    x: 0,
    y: item.h + 0.08,
    z: -item.d * 0.25,
  });
}

function buildGuitar(group, item, material) {
  const body = new THREE.Shape();
  body.moveTo(0, 0.32);
  body.bezierCurveTo(-0.17, 0.34, -0.24, 0.23, -0.19, 0.12);
  body.bezierCurveTo(-0.16, 0.05, -0.1, 0.03, -0.09, -0.04);
  body.bezierCurveTo(-0.16, -0.08, -0.22, -0.17, -0.17, -0.27);
  body.bezierCurveTo(-0.11, -0.38, 0.11, -0.38, 0.17, -0.27);
  body.bezierCurveTo(0.22, -0.17, 0.16, -0.08, 0.09, -0.04);
  body.bezierCurveTo(0.1, 0.03, 0.16, 0.05, 0.19, 0.12);
  body.bezierCurveTo(0.24, 0.23, 0.17, 0.34, 0, 0.32);
  const bodyGeometry = new THREE.ExtrudeGeometry(body, {
    depth: 0.055,
    bevelEnabled: true,
    bevelSize: 0.008,
    bevelThickness: 0.008,
    bevelSegments: 2,
    curveSegments: 18,
  });
  const lean = new THREE.Group();
  lean.rotation.z = -0.08;
  lean.position.y = 0.36;
  lean.scale.setScalar(0.92);
  group.add(lean);
  const bodyMesh = new THREE.Mesh(bodyGeometry, material.wood);
  bodyMesh.position.z = -0.027;
  bodyMesh.castShadow = true;
  lean.add(bodyMesh);
  addCylinder(lean, {
    radiusTop: 0.0055,
    height: 0.55,
    mat: material.charcoal,
    x: 0,
    y: 0.59,
    z: 0.03,
  });
  addBox(lean, {
    w: 0.075,
    h: 0.09,
    d: 0.025,
    mat: material.darkBrown,
    y: 0.9,
    z: 0.03,
  });
  addCylinder(lean, {
    radiusTop: 0.034,
    height: 0.012,
    mat: material.charcoal,
    y: 0.04,
    z: 0.036,
    rotX: Math.PI / 2,
  });
  for (let index = 0; index < 6; index += 1) {
    addTube(
      lean,
      material.chrome,
      [-0.018 + index * 0.007, -0.03, 0.037],
      [0.02 + index * 0.007, 0.93, 0.037],
      0.0012,
    );
  }
  const fretMaterial = new THREE.MeshBasicMaterial({ color: 0xcbbfa8 });
  for (let index = 0; index < 7; index += 1) {
    addBox(lean, {
      w: 0.062,
      h: 0.002,
      d: 0.003,
      mat: fretMaterial,
      y: 0.62 + index * 0.04,
      z: 0.04,
      cast: false,
    });
  }
}

function buildLaundryBasin(group, item, material) {
  addBox(group, {
    w: item.w,
    h: item.h - 0.07,
    d: item.d,
    mat: material.ceramic,
    y: (item.h - 0.07) / 2,
  });
  addBox(group, {
    w: item.w + 0.04,
    h: 0.055,
    d: item.d + 0.04,
    mat: material.ceramic,
    y: item.h - 0.028,
  });
  addBox(group, {
    w: item.w - 0.12,
    h: 0.02,
    d: item.d - 0.12,
    mat: material.charcoalMatte,
    y: item.h - 0.055,
  });
  for (const x of [-1, 1]) {
    addBox(group, {
      w: 0.045,
      h: 0.13,
      d: item.d - 0.11,
      mat: material.ceramic,
      x: x * (item.w / 2 - 0.075),
      y: item.h + 0.045,
    });
  }
  for (const z of [-1, 1]) {
    addBox(group, {
      w: item.w - 0.18,
      h: 0.13,
      d: 0.045,
      mat: material.ceramic,
      z: z * (item.d / 2 - 0.075),
      y: item.h + 0.045,
    });
  }
  addCylinder(group, {
    radiusTop: 0.014,
    height: 0.28,
    mat: material.chrome,
    x: -item.w * 0.28,
    y: item.h + 0.18,
    z: -item.d * 0.3,
  });
  addTube(
    group,
    material.chrome,
    [-item.w * 0.28, item.h + 0.32, -item.d * 0.3],
    [-item.w * 0.13, item.h + 0.32, -item.d * 0.3],
    0.013,
  );
  const clothGeometry = makeClothGeometry(0.3, 0.25, 0.025);
  const cloth = new THREE.Mesh(clothGeometry, material.plasticBlue);
  cloth.rotation.x = -Math.PI / 2;
  cloth.position.set(item.w * 0.27, item.h + 0.015, item.d * 0.14);
  cloth.rotation.z = 0.35;
  group.add(cloth);
}

function buildMop(group, item, material) {
  addCylinder(group, {
    radiusTop: item.w * 0.42,
    radiusBottom: item.w * 0.34,
    height: item.h * 0.3,
    mat: material.orangePlastic,
    y: item.h * 0.15,
    radialSegments: 18,
  });
  addCylinder(group, {
    radiusTop: item.w * 0.36,
    radiusBottom: item.w * 0.36,
    height: 0.035,
    mat: material.charcoal,
    y: item.h * 0.3,
  });
  addCylinder(group, {
    radiusTop: 0.012,
    height: item.h * 0.85,
    mat: material.whitePlastic,
    x: 0.08,
    y: item.h * 0.53,
    z: -0.03,
    rotZ: -0.13,
    rotX: 0.08,
  });
  addBox(group, {
    w: 0.055,
    h: 0.025,
    d: 0.03,
    mat: material.charcoal,
    x: 0.05,
    y: item.h * 0.94,
    z: -0.01,
  });
  const mopMaterial = new THREE.MeshStandardMaterial({ color: 0xc9c2b2, roughness: 1 });
  for (let index = 0; index < 9; index += 1) {
    const angle = (index / 9) * Math.PI * 2;
    addCylinder(group, {
      radiusTop: 0.004,
      radiusBottom: 0.011,
      height: 0.25,
      mat: mopMaterial,
      x: 0.14 + Math.cos(angle) * 0.04,
      y: item.h * 0.22,
      z: -0.03 + Math.sin(angle) * 0.04,
      rotZ: Math.cos(angle) * 0.07,
      rotX: Math.sin(angle) * 0.07,
    });
  }
}

const BUILDERS = {
  "tv-console": buildConsole,
  tv: buildTv,
  cabinet: buildCabinet,
  stool: buildStool,
  "drying-rack": buildDryingRack,
  counter: buildCounter,
  "tall-appliance": buildTallAppliance,
  shelving: buildShelving,
  "water-dispenser": buildWaterDispenser,
  daybed: buildDaybed,
  rug: buildRug,
  "low-storage": buildLowStorage,
  guitar: buildGuitar,
  "laundry-basin": buildLaundryBasin,
  mop: buildMop,
};

export function buildFurniture(viewer) {
  const items = viewer.property.layout.furniture;
  for (const item of items) {
    const builder = BUILDERS[item.type];
    if (!builder) continue;
    const group = makeGroup(viewer, item);
    builder(group, item, viewer.material);
    group.traverse((object) => {
      if (object.isMesh) {
        object.userData.furnitureId = item.id;
        object.userData.roomId = item.roomId;
      }
    });
  }
}
