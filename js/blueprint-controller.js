import * as THREE from 'three';

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
        const geometry = new THREE.EdgesGeometry(mesh.geometry, 24);
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
        lines.position.copy(mesh.position);
        lines.quaternion.copy(mesh.quaternion);
        lines.scale.copy(mesh.scale);
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
