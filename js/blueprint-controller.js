import * as THREE from 'three';

const MAX_BLUEPRINT_VERTICES = 1500000;

/**
 * Switches the existing exterior meshes into an edge-only architectural
 * blueprint. Original visibility and material references are preserved exactly
 * and restored on exit. This is a view mode over the real geometry, not a
 * separate illustration or a substitute model.
 */
export class BlueprintController {
  constructor({ buildingGroup, onChange = () => {} }) {
    if (!buildingGroup?.isObject3D) {
      throw new TypeError('BlueprintController requires a building Object3D group.');
    }
    this.buildingGroup = buildingGroup;
    this.onChange = onChange;
    this.enabled = false;
    this.records = [];
    this.lines = [];
    this.blueprintVertexBudget = MAX_BLUEPRINT_VERTICES;
    buildingGroup.traverse((object) => {
      if (!object.isMesh || !object.geometry || object.name === 'Facade inspection highlight') return;
      this.records.push({
        mesh: object,
        visible: object.visible,
        material: object.material
      });
    });
  }

  setEnabled(enabled) {
    const next = Boolean(enabled);
    if (next === this.enabled) return;
    if (next) this._enter();
    else this._exit();
    this.enabled = next;
    this.onChange(next);
  }

  toggle() {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  _enter() {
    this.lines.length = 0;
    for (const record of this.records) {
      if (!record.visible) continue;
      const mesh = record.mesh;
      if (!mesh.parent) continue;
      try {
        const edgeSource = new THREE.EdgesGeometry(mesh.geometry, 24);
        let geometry = edgeSource;
        let bakeToParent = false;

        if (mesh.isInstancedMesh) {
          // EdgesGeometry represents only one source shape. Expand each real
          // instance transform into a shared line buffer so the blueprint
          // traces the entire facade, not one unit box per material batch.
          const sourcePosition = edgeSource.getAttribute('position');
          const expandedVertexCount = sourcePosition.count * mesh.count;
          if (expandedVertexCount > this.blueprintVertexBudget) {
            edgeSource.dispose();
            console.warn('Blueprint edge budget reached; this mesh stays shaded to preserve mobile memory.');
            continue;
          }
          const expanded = new Float32Array(expandedVertexCount * 3);
          const instanceMatrix = new THREE.Matrix4();
          const objectMatrix = mesh.matrix.clone();
          const transform = new THREE.Matrix4();
          const point = new THREE.Vector3();
          let offset = 0;
          for (let instance = 0; instance < mesh.count; instance += 1) {
            mesh.getMatrixAt(instance, instanceMatrix);
            transform.copy(objectMatrix).multiply(instanceMatrix);
            for (let vertex = 0; vertex < sourcePosition.count; vertex += 1) {
              point.fromBufferAttribute(sourcePosition, vertex).applyMatrix4(transform);
              expanded[offset++] = point.x;
              expanded[offset++] = point.y;
              expanded[offset++] = point.z;
            }
          }
          geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(expanded, 3));
          geometry.computeBoundingSphere();
          edgeSource.dispose();
          this.blueprintVertexBudget -= expandedVertexCount;
          bakeToParent = true;
        }

        const material = new THREE.LineBasicMaterial({
          color: 0x9de3ed,
          transparent: true,
          opacity: 0.92,
          depthTest: false,
          depthWrite: false,
          toneMapped: false
        });
        const lines = new THREE.LineSegments(geometry, material);
        lines.name = 'Iris blueprint edge overlay';
        if (!bakeToParent) {
          lines.position.copy(mesh.position);
          lines.quaternion.copy(mesh.quaternion);
          lines.scale.copy(mesh.scale);
        }
        lines.renderOrder = 50;
        lines.frustumCulled = false;
        mesh.parent.add(lines);
        this.lines.push({ object: lines, parent: mesh.parent });
        mesh.visible = false;
      } catch (error) {
        mesh.visible = record.visible;
        console.warn('A blueprint edge set could not be created; the original model remains recoverable.', error);
      }
    }
    document.body.classList.add('is-blueprint');
  }

  _exit() {
    for (const record of this.records) {
      record.mesh.visible = record.visible;
      record.mesh.material = record.material;
    }
    for (const entry of this.lines) {
      entry.parent.remove(entry.object);
      entry.object.geometry?.dispose();
      if (Array.isArray(entry.object.material)) entry.object.material.forEach((m) => m.dispose());
      else entry.object.material?.dispose();
    }
    this.lines.length = 0;
    this.blueprintVertexBudget = MAX_BLUEPRINT_VERTICES;
    document.body.classList.remove('is-blueprint');
  }

  dispose() {
    if (this.enabled) this._exit();
    this.enabled = false;
    this.onChange(false);
  }

  getState() {
    return { enabled: this.enabled, edgeSets: this.lines.length };
  }
}
