import * as THREE from "three";

export const DEG = Math.PI / 180;

export function isWebGLAvailable() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") ||
          canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

export function addBox(parent, options) {
  const {
    w,
    h,
    d,
    mat,
    x = 0,
    y = 0,
    z = 0,
    rotX = 0,
    rotY = 0,
    rotZ = 0,
    cast = true,
    receive = true,
    name,
  } = options;
  const geometry = new THREE.BoxGeometry(w, h, d);
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rotX, rotY, rotZ);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  if (name) mesh.name = name;
  parent.add(mesh);
  return mesh;
}

export function addCylinder(parent, options) {
  const {
    radiusTop,
    radiusBottom = radiusTop,
    height,
    mat,
    x = 0,
    y = 0,
    z = 0,
    radialSegments = 20,
    openEnded = false,
    rotX = 0,
    rotY = 0,
    rotZ = 0,
    cast = true,
    receive = true,
    name,
  } = options;
  const geometry = new THREE.CylinderGeometry(
    radiusTop,
    radiusBottom,
    height,
    radialSegments,
    1,
    openEnded,
  );
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rotX, rotY, rotZ);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  if (name) mesh.name = name;
  parent.add(mesh);
  return mesh;
}

export function addSphere(parent, options) {
  const {
    radius,
    mat,
    x = 0,
    y = 0,
    z = 0,
    widthSegments = 20,
    heightSegments = 14,
    scaleX = 1,
    scaleY = 1,
    scaleZ = 1,
    cast = true,
    receive = true,
    name,
  } = options;
  const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x, y, z);
  mesh.scale.set(scaleX, scaleY, scaleZ);
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  if (name) mesh.name = name;
  parent.add(mesh);
  return mesh;
}

export function polygonShape(points) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    shape.lineTo(points[i][0], points[i][1]);
  }
  shape.closePath();
  return shape;
}

export function roomGeometry(points, height = 0.012) {
  const geometry = new THREE.ShapeGeometry(polygonShape(points));
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, height, 0);
  return geometry;
}

export function roundedShape(width, depth, radius) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -depth / 2;
  const r = Math.min(radius, width / 2, depth / 2);
  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + depth - r);
  shape.quadraticCurveTo(x + width, y + depth, x + width - r, y + depth);
  shape.lineTo(x + r, y + depth);
  shape.quadraticCurveTo(x, y + depth, x, y + depth - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  shape.closePath();
  return shape;
}

export function makePlinthSlab(width, depth, height, radius) {
  const geometry = new THREE.ExtrudeGeometry(roundedShape(width, depth, radius), {
    depth: height,
    bevelEnabled: true,
    bevelSize: 0.018,
    bevelThickness: 0.018,
    bevelSegments: 3,
    curveSegments: 10,
    steps: 1,
  });
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

export function makeCurtainGeometry(width, height, folds = 6, depth = 0.045) {
  const geometry = new THREE.PlaneGeometry(width, height, 32, 8);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const u = x / width + 0.5;
    const v = y / height + 0.5;
    const fold =
      Math.sin(u * Math.PI * folds * 2) * depth +
      Math.sin(u * Math.PI * folds * 0.7 + 1.3) * depth * 0.45;
    position.setZ(i, fold * (0.72 + v * 0.28));
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function makeClothGeometry(width, height, foldDepth = 0.025) {
  const geometry = new THREE.PlaneGeometry(width, height, 14, 5);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const u = x / width + 0.5;
    position.setZ(i, Math.sin(u * Math.PI * 4.5) * foldDepth);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function makeGrilleLines(width, height, cell = 0.062) {
  const positions = [];
  const columns = Math.max(2, Math.round(width / cell));
  const rows = Math.max(2, Math.round(height / cell));
  for (let i = 0; i <= columns; i += 1) {
    const x = -width / 2 + (i / columns) * width;
    positions.push(x, -height / 2, 0, x, height / 2, 0);
  }
  for (let i = 0; i <= rows; i += 1) {
    const y = -height / 2 + (i / rows) * height;
    positions.push(-width / 2, y, 0, width / 2, y, 0);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

export function makeSiteEnvironment(renderer) {
  const scene = new THREE.Scene();
  scene.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(26, 16, 26),
      new THREE.MeshBasicMaterial({ color: 0x6c5e4c, side: THREE.BackSide }),
    ),
  );

  const panels = [
    { color: 0xfff1d6, size: [10, 6], pos: [-6, 5.8, 3], rot: [Math.PI / 2, 0, 0] },
    { color: 0xe7edf2, size: [7, 5], pos: [7, 4.6, -5], rot: [Math.PI / 2, 0, Math.PI / 3] },
    { color: 0xffdca6, size: [5, 4], pos: [2, 2, 8], rot: [Math.PI / 2, 0, Math.PI / 2] },
    { color: 0x3a3026, size: [8, 5], pos: [-4, -2, -7], rot: [Math.PI / 2, 0, Math.PI] },
  ];

  for (const panel of panels) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(panel.size[0], panel.size[1]),
      new THREE.MeshBasicMaterial({ color: panel.color }),
    );
    mesh.position.set(...panel.pos);
    mesh.rotation.set(...panel.rot);
    scene.add(mesh);
  }

  const pmrem = new THREE.PMREMGenerator(renderer);
  const renderTarget = pmrem.fromScene(scene, 0.035);
  pmrem.dispose();
  scene.traverse((object) => {
    if (object.isMesh) {
      object.geometry.dispose();
      object.material.dispose();
    }
  });
  return renderTarget;
}
