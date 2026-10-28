import * as THREE from "three";
import { addBox, addCylinder, addSphere } from "./viewer-geometry.js";

function addCable(group, material, points, radius = 0.0045) {
  for (let index = 0; index < points.length - 1; index += 1) {
    const from = new THREE.Vector3(...points[index]);
    const to = new THREE.Vector3(...points[index + 1]);
    const direction = to.clone().sub(from);
    const geometry = new THREE.CylinderGeometry(
      radius,
      radius,
      direction.length(),
      6,
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(from).add(to).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    group.add(mesh);
  }
}

function buildClockAndRouter(viewer) {
  const group = new THREE.Group();
  group.name = "fixtures-west-wall";
  viewer.fixtures.add(group);

  addCylinder(group, {
    radiusTop: 0.175,
    radiusBottom: 0.175,
    height: 0.032,
    mat: viewer.material.charcoal,
    x: 0.128,
    y: 1.78,
    z: 3.02,
    rotZ: Math.PI / 2,
    radialSegments: 36,
  });
  addCylinder(group, {
    radiusTop: 0.162,
    radiusBottom: 0.162,
    height: 0.038,
    mat: viewer.material.ceramic,
    x: 0.138,
    y: 1.78,
    z: 3.02,
    rotZ: Math.PI / 2,
    radialSegments: 36,
  });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.33, 0.33), viewer.material.clockFace);
  face.position.set(0.159, 1.78, 3.02);
  face.rotation.y = Math.PI / 2;
  group.add(face);

  addBox(group, {
    w: 0.055,
    h: 0.035,
    d: 0.16,
    mat: viewer.material.charcoal,
    x: 0.35,
    y: 0.835,
    z: 3.28,
  });
  for (const side of [-1, 1]) {
    addCylinder(group, {
      radiusTop: 0.0035,
      height: 0.14,
      mat: viewer.material.blackMetal,
      x: 0.35,
      y: 0.9,
      z: 3.28 + side * 0.055,
      rotX: side * 0.22,
    });
  }
  addSphere(group, {
    radius: 0.006,
    mat: new THREE.MeshBasicMaterial({ color: 0x8ee39f }),
    x: 0.322,
    y: 0.842,
    z: 3.33,
    cast: false,
  });
  addCable(group, viewer.material.charcoal, [
    [0.125, 1.6, 3.16],
    [0.125, 1.15, 3.2],
    [0.2, 0.86, 3.22],
  ]);
}

function buildWashAlcove(viewer) {
  const group = new THREE.Group();
  group.name = "fixtures-wash";
  viewer.fixtures.add(group);

  addBox(group, {
    w: 0.026,
    h: 0.82,
    d: 0.6,
    mat: viewer.material.charcoal,
    x: 4.535,
    y: 1.58,
    z: 1.96,
  });
  const mirror = new THREE.Mesh(new THREE.PlaneGeometry(0.53, 0.74), viewer.material.mirror);
  mirror.position.set(4.518, 1.58, 1.96);
  mirror.rotation.y = -Math.PI / 2;
  group.add(mirror);

  addCylinder(group, {
    radiusTop: 0.12,
    radiusBottom: 0.15,
    height: 0.62,
    mat: viewer.material.ceramic,
    x: 4.2,
    y: 0.35,
    z: 1.96,
    radialSegments: 24,
  });
  addCylinder(group, {
    radiusTop: 0.235,
    radiusBottom: 0.18,
    height: 0.16,
    mat: viewer.material.ceramic,
    x: 4.2,
    y: 0.75,
    z: 1.96,
    radialSegments: 28,
  });
  addCylinder(group, {
    radiusTop: 0.185,
    radiusBottom: 0.185,
    height: 0.018,
    mat: viewer.material.glass,
    x: 4.2,
    y: 0.825,
    z: 1.96,
    radialSegments: 28,
    cast: false,
  });
  addCylinder(group, {
    radiusTop: 0.013,
    height: 0.2,
    mat: viewer.material.chrome,
    x: 4.46,
    y: 0.98,
    z: 1.96,
  });
  addCylinder(group, {
    radiusTop: 0.012,
    height: 0.23,
    mat: viewer.material.chrome,
    x: 4.36,
    y: 1.08,
    z: 1.96,
    rotZ: Math.PI / 2,
  });
  addCylinder(group, {
    radiusTop: 0.01,
    height: 0.07,
    mat: viewer.material.chrome,
    x: 4.26,
    y: 1.04,
    z: 1.96,
    rotZ: 0.16,
  });
  for (const side of [-1, 1]) {
    addCylinder(group, {
      radiusTop: 0.015,
      height: 0.05,
      mat: viewer.material.chrome,
      x: 4.36,
      y: 1.035,
      z: 1.96 + side * 0.08,
      rotX: Math.PI / 2,
    });
  }

  addBox(group, {
    w: 0.018,
    h: 0.09,
    d: 0.5,
    mat: viewer.material.ceramic,
    x: 4.532,
    y: 1.05,
    z: 1.96,
  });
  addBox(group, {
    w: 0.16,
    h: 0.018,
    d: 0.18,
    mat: viewer.material.ceramic,
    x: 4.46,
    y: 1.1,
    z: 1.96,
  });
  addCylinder(group, {
    radiusTop: 0.034,
    height: 0.09,
    mat: viewer.material.amber,
    x: 4.45,
    y: 1.155,
    z: 1.78,
  });
}

function buildSwitches(viewer) {
  const plate = viewer.material.trim;
  const switchMaterial = new THREE.MeshStandardMaterial({
    color: 0xded6c8,
    roughness: 0.7,
  });
  const positions = [
    { x: 2.26, y: 1.26, z: 5.08, rotY: Math.PI },
    { x: 4.545, y: 1.22, z: 3.14, rotY: -Math.PI / 2 },
  ];
  for (const config of positions) {
    const group = new THREE.Group();
    group.position.set(config.x, config.y, config.z);
    group.rotation.y = config.rotY;
    viewer.fixtures.add(group);
    addBox(group, {
      w: 0.11,
      h: 0.16,
      d: 0.014,
      mat: plate,
      cast: false,
    });
    for (const offset of [-0.025, 0.025]) {
      addBox(group, {
        w: 0.028,
        h: 0.045,
        d: 0.008,
        mat: switchMaterial,
        x: offset,
        z: 0.011,
        cast: false,
      });
    }
  }
}

function buildCounterRail(viewer) {
  const group = new THREE.Group();
  group.name = "fixtures-far-zone";
  viewer.fixtures.add(group);
  addCylinder(group, {
    radiusTop: 0.009,
    height: 1.08,
    mat: viewer.material.blackMetal,
    x: 0.13,
    y: 1.52,
    z: 1.02,
    rotX: Math.PI / 2,
  });
  for (const z of [0.62, 0.92, 1.2, 1.42]) {
    addCylinder(group, {
      radiusTop: 0.004,
      height: 0.1,
      mat: viewer.material.blackMetal,
      x: 0.13,
      y: 1.46,
      z,
      cast: false,
    });
    addBox(group, {
      w: 0.012,
      h: 0.02,
      d: 0.04,
      mat: viewer.material.blackMetal,
      x: 0.13,
      y: 1.4,
      z,
      cast: false,
    });
  }
  const panMaterial = new THREE.MeshStandardMaterial({
    color: 0x9c9488,
    roughness: 0.35,
    metalness: 0.55,
  });
  addCylinder(group, {
    radiusTop: 0.12,
    radiusBottom: 0.105,
    height: 0.05,
    mat: panMaterial,
    x: 0.18,
    y: 1.38,
    z: 0.92,
    rotZ: Math.PI / 2,
    radialSegments: 24,
  });
  addBox(group, {
    w: 0.06,
    h: 0.3,
    d: 0.4,
    mat: viewer.material.creamFabric,
    x: 0.12,
    y: 1.3,
    z: 1.34,
  });
}

function buildGreenCushion(viewer) {
  const group = new THREE.Group();
  group.name = "fixtures-bedroom";
  group.position.set(0, 0.04, 0);
  viewer.fixtures.add(group);
  addBox(group, {
    w: 0.52,
    h: 0.15,
    d: 0.5,
    mat: viewer.material.greenFabric,
    x: 7.05,
    y: 0.075,
    z: 2.68,
    rotY: -0.18,
  });
  addCylinder(group, {
    radiusTop: 0.018,
    height: 0.01,
    mat: viewer.material.brass,
    x: 7.05,
    y: 0.155,
    z: 2.68,
    rotX: Math.PI / 2,
    cast: false,
  });
}

export function buildFixtures(viewer) {
  buildClockAndRouter(viewer);
  buildWashAlcove(viewer);
  buildSwitches(viewer);
  buildCounterRail(viewer);
  buildGreenCushion(viewer);
}
