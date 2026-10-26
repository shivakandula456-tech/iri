import * as THREE from 'three';
import { BUILDING, ROOF_Y } from './config.js';

const _position = new THREE.Vector3();
const _quaternion = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _matrix = new THREE.Matrix4();
const _euler = new THREE.Euler();

/**
 * Collects thousands of repeated facade details into a handful of
 * InstancedMeshes, one per material/geometry/flag combination.
 *
 * This keeps the architecture detailed without paying a draw-call penalty for
 * every window mullion or railing post.
 */
export class ModelBuilder {
  constructor(label = 'model') {
    this.label = label;
    this.isTowerBuilder = /tower/i.test(label);
    this.batches = new Map();
    this.floorGroups = new Map();
    this.unique = [];
    this.instanceCount = 0;
    this.group = new THREE.Group();
    this.group.name = label;

    this.geometries = {
      box: new THREE.BoxGeometry(1, 1, 1),
      cylinder: new THREE.CylinderGeometry(1, 1, 1, 10, 1),
      ico: new THREE.IcosahedronGeometry(1, 1),
      icoFine: new THREE.IcosahedronGeometry(1, 2),
      sphere: new THREE.SphereGeometry(1, 12, 8)
    };
  }

  _batchKey(material, geometry, options) {
    return [
      material.uuid,
      geometry.uuid,
      options.castShadow ? 1 : 0,
      options.receiveShadow ? 1 : 0,
      options.renderOrder || 0,
      options.layer || ''
    ].join('|');
  }

  _batch(material, geometry, options = {}) {
    const castShadow = options.castShadow ?? options.cast ?? true;
    const receiveShadow = options.receiveShadow ?? options.receive ?? true;
    const renderOrder = options.renderOrder || 0;
    const layer = options.layer || null;
    const key = this._batchKey(material, geometry, { castShadow, receiveShadow, renderOrder, layer });
    if (!this.batches.has(key)) {
      this.batches.set(key, {
        material,
        geometry,
        castShadow,
        receiveShadow,
        renderOrder,
        layer,
        matrices: [],
        colors: [],
        hasColor: false
      });
    }
    return this.batches.get(key);
  }

  _add(material, geometry, position, scale, rotation = [0, 0, 0], options = {}) {
    // Only tower batches are floor-classified. Site builders share this utility
    // but must never be mistaken for residential levels.
    let layer = options.layer || null;
    const objectHeight = Math.abs(scale[1]);

    // Tall, upright facade boxes (vertical fins/piers) are split at estimated
    // storey boundaries so a selected-floor cutaway can clip the matching
    // segment without cutting the entire multi-storey element. The same
    // material/shape is used, and the split boxes share the same outer bounds.
    if (
      !layer &&
      this.isTowerBuilder &&
      geometry === this.geometries.box &&
      objectHeight > BUILDING.floorHeight * 1.12 &&
      Math.abs(rotation[0] || 0) < 1e-5 &&
      Math.abs(rotation[2] || 0) < 1e-5
    ) {
      const bottom = position[1] - objectHeight / 2;
      const top = position[1] + objectHeight / 2;
      const insideTower = bottom >= BUILDING.groundHeight - 0.3 &&
        top <= ROOF_Y + 0.35 &&
        top > BUILDING.groundHeight + BUILDING.floorHeight * 1.5;
      if (insideTower) {
        for (let floorNumber = 1; floorNumber <= BUILDING.levels; floorNumber += 1) {
          const floorBottom = BUILDING.groundHeight + (floorNumber - 1) * BUILDING.floorHeight;
          const floorTop = floorBottom + BUILDING.floorHeight;
          const segmentBottom = Math.max(bottom, floorBottom);
          const segmentTop = Math.min(top, floorTop);
          const segmentHeight = segmentTop - segmentBottom;
          if (segmentHeight <= 0.01) continue;
          this._add(
            material,
            geometry,
            [position[0], (segmentBottom + segmentTop) / 2, position[2]],
            [scale[0], segmentHeight, scale[2]],
            rotation,
            { ...options, layer: `floor-${floorNumber}` }
          );
        }
        return this;
      }
    }

    if (!layer && this.isTowerBuilder && objectHeight <= BUILDING.floorHeight * 1.12 &&
        position[1] >= BUILDING.groundHeight - 0.3 && position[1] < ROOF_Y - 0.35) {
      const floorNumber = Math.floor((position[1] - BUILDING.groundHeight) / BUILDING.floorHeight) + 1;
      if (floorNumber >= 1 && floorNumber <= BUILDING.levels) layer = `floor-${floorNumber}`;
    }
    const batchOptions = layer ? { ...options, layer } : options;
    const batch = this._batch(material, geometry, batchOptions);
    _position.set(position[0], position[1], position[2]);
    _scale.set(scale[0], scale[1], scale[2]);
    _euler.set(rotation[0] || 0, rotation[1] || 0, rotation[2] || 0, 'YXZ');
    _quaternion.setFromEuler(_euler);
    _matrix.compose(_position, _quaternion, _scale);

    const matrix = _matrix.clone();
    batch.matrices.push(matrix);
    this.instanceCount += 1;

    if (options.color !== undefined) {
      batch.hasColor = true;
      const color = options.color instanceof THREE.Color
        ? options.color
        : new THREE.Color(options.color);
      batch.colors.push([color.r, color.g, color.b]);
    } else {
      batch.colors.push(null);
    }
    return this;
  }

  box(material, x, y, z, w, h, d, options = {}) {
    return this._add(
      material,
      this.geometries.box,
      [x, y, z],
      [w, h, d],
      [options.rx || 0, options.ry || 0, options.rz || 0],
      options
    );
  }

  cylinder(material, x, y, z, radius, height, options = {}) {
    return this._add(
      material,
      this.geometries.cylinder,
      [x, y, z],
      [radius, height, radius],
      [options.rx || 0, options.ry || 0, options.rz || 0],
      options
    );
  }

  ico(material, x, y, z, sx, sy, sz, options = {}) {
    return this._add(
      material,
      options.fine ? this.geometries.icoFine : this.geometries.ico,
      [x, y, z],
      [sx, sy, sz],
      [options.rx || 0, options.ry || 0, options.rz || 0],
      options
    );
  }

  sphere(material, x, y, z, sx, sy, sz, options = {}) {
    return this._add(
      material,
      this.geometries.sphere,
      [x, y, z],
      [sx, sy, sz],
      [options.rx || 0, options.ry || 0, options.rz || 0],
      options
    );
  }

  /** Add instances of a custom geometry (palm fronds, play equipment, etc.). */
  customInstances(material, geometry, transform, options = {}) {
    const [x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0] = transform;
    return this._add(material, geometry, [x, y, z], [sx, sy, sz], [rx, ry, rz], options);
  }

  /** Add a single mesh that cannot be usefully instanced. */
  addMesh(mesh, { castShadow = true, receiveShadow = true } = {}) {
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    this.unique.push(mesh);
    this.group.add(mesh);
    return mesh;
  }

  finalize(parent = null) {
    for (const batch of this.batches.values()) {
      const count = batch.matrices.length;
      if (!count) continue;
      const mesh = new THREE.InstancedMesh(batch.geometry, batch.material, count);
      mesh.name = `${this.label}:${batch.material.name || batch.material.type}`;
      mesh.castShadow = batch.castShadow;
      mesh.receiveShadow = batch.receiveShadow;
      mesh.renderOrder = batch.renderOrder;
      mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

      if (batch.hasColor) {
        const color = new THREE.Color();
        for (let i = 0; i < count; i += 1) {
          const c = batch.colors[i];
          if (c) color.setRGB(c[0], c[1], c[2]);
          else color.setRGB(1, 1, 1);
          mesh.setColorAt(i, color);
        }
        mesh.instanceColor.needsUpdate = true;
      }

      for (let i = 0; i < count; i += 1) mesh.setMatrixAt(i, batch.matrices[i]);
      mesh.instanceMatrix.needsUpdate = true;
      mesh.computeBoundingSphere();
      mesh.computeBoundingBox();
      let target = this.group;
      if (batch.layer) {
        if (!this.floorGroups.has(batch.layer)) {
          const floorNumber = Number(batch.layer.replace('floor-', ''));
          const floorGroup = new THREE.Group();
          floorGroup.name = `Floor ${String(floorNumber).padStart(2, '0')} · facade geometry`;
          floorGroup.userData.floorNumber = floorNumber;
          floorGroup.userData.role = 'floor-facade-layer';
          this.floorGroups.set(batch.layer, floorGroup);
          this.group.add(floorGroup);
        }
        target = this.floorGroups.get(batch.layer);
      }
      target.add(mesh);
    }

    if (parent) parent.add(this.group);
    this.group.updateMatrixWorld(true);

    let uniqueTriangles = 0;
    this.unique.forEach((mesh) => {
      const geometry = mesh.geometry;
      if (!geometry) return;
      const indexCount = geometry.index ? geometry.index.count : geometry.attributes.position.count;
      uniqueTriangles += Math.floor(indexCount / 3);
    });

    let instanceTriangles = 0;
    for (const batch of this.batches.values()) {
      if (!batch.matrices.length) continue;
      const indexCount = batch.geometry.index
        ? batch.geometry.index.count
        : batch.geometry.attributes.position.count;
      instanceTriangles += Math.floor(indexCount / 3) * batch.matrices.length;
    }

    this.group.userData.stats = {
      instances: this.instanceCount,
      batches: this.batches.size,
      uniqueMeshes: this.unique.length,
      approximateTriangles: instanceTriangles + uniqueTriangles
    };
    return this.group;
  }
}

/** Build a gently curved wing-like roof visor used at each short end. */
export function createVisorGeometry(width, rise = 0.8, thickness = 0.62) {
  const half = width / 2;
  const shape = new THREE.Shape();
  shape.moveTo(-half, thickness * 0.16);
  shape.lineTo(half, thickness * 0.16);
  shape.lineTo(half, thickness * 0.36);
  shape.quadraticCurveTo(0, thickness + rise, -half, thickness * 0.36);
  shape.closePath();

  const extrude = new THREE.ExtrudeGeometry(shape, {
    depth: 2.8,
    bevelEnabled: false,
    curveSegments: 18
  });
  // Shape XY is (z, y); extrusion is local +Z. Rotate so the extrusion follows X.
  extrude.rotateY(Math.PI / 2);
  extrude.translate(0, 0, 0);
  extrude.computeVertexNormals();
  return extrude;
}

/** A bent tropical frond generated as a thin double-sided blade. */
export function createPalmFrondGeometry(length = 4.4, width = 0.52) {
  const segments = 7;
  const positions = [];
  const indices = [];
  for (let i = 0; i < segments; i += 1) {
    const t = i / segments;
    const z = t * length;
    const w = width * (0.44 + 0.56 * Math.sin(Math.PI * t)) * (1 - 0.86 * t);
    const y = -0.78 * t * t;
    positions.push(-w / 2, y, z, w / 2, y, z);
    if (i < segments - 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  // Tip
  positions.push(0, -0.78, length + 0.28);
  const tip = positions.length / 3 - 1;
  const last = (segments - 1) * 2;
  indices.push(last, last + 1, tip);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
