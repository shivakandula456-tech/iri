import * as THREE from 'three';
import { BUILDING, ROOF_Y } from './config.js';

const FEATURE_COPY = Object.freeze({
  'roof': {
    title: 'Roof & architectural crown',
    description: 'The roof perimeter and open crown are reconstructed from the available exterior and aerial imagery. Hidden rooftop equipment and unverified amenities are intentionally omitted.'
  },
  'entrance': {
    title: 'Entrance podium',
    description: 'This area represents the arrival level and entrance podium. Its appearance is conceptual; precise materials, lobby details and dimensions require approved architectural references.'
  },
  'balcony': {
    title: 'Balcony & railing zone',
    description: 'Repeated balcony geometry expresses the visible facade rhythm. Balcony depth, railing construction and exact bay dimensions are visual estimates.'
  },
  'glazing': {
    title: 'Window & glazing zone',
    description: 'Dark glazing and window divisions are inferred from the published exterior images. Exact window schedules, glass specifications and opening dimensions are not verified.'
  },
  'frame': {
    title: 'Facade frame & vertical fin',
    description: 'The light-coloured frames, vertical fins and deep facade channels are key visual features of the reference design. Their exact section sizes are estimated.'
  },
  'elevation': {
    title: 'Exterior elevation',
    description: 'This selected surface belongs to the conceptual exterior reconstruction. Rear and side details are inferred where the supplied images do not provide direct evidence.'
  }
});

function sideFromNormal(normal) {
  if (Math.abs(normal.z) >= Math.abs(normal.x)) return normal.z >= 0 ? 'Front elevation' : 'Rear elevation';
  return normal.x >= 0 ? 'Right elevation' : 'Left elevation';
}

/**
 * Click-to-inspect layer for the real procedural building meshes. It does not
 * intercept camera drags; selecting a feature requires a short, stationary
 * primary-pointer gesture while inspection mode is enabled.
 */
export class FacadeInspector {
  constructor({ scene, camera, domElement, buildingGroup, onSelect = () => {}, onClear = () => {} }) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;
    this.buildingGroup = buildingGroup;
    this.onSelect = onSelect;
    this.onClear = onClear;
    this.enabled = false;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.downPoint = null;
    this.outline = null;

    this._onPointerDown = (event) => {
      if (!this.enabled || event.button !== 0) return;
      this.downPoint = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
    };
    this._onPointerUp = (event) => {
      if (!this.enabled || !this.downPoint || event.button !== 0) return;
      const down = this.downPoint;
      this.downPoint = null;
      if (down.pointerId !== event.pointerId || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 6) return;
      const hit = this._hit(event.clientX, event.clientY);
      if (!hit) {
        this._clearSelection();
        this.onClear();
        return;
      }
      const info = this._describe(hit);
      this._setOutline(hit);
      this.onSelect(info);
    };
    this._onPointerCancel = () => {
      this.downPoint = null;
    };
    this._onPointerMove = (event) => {
      if (!this.enabled || event.buttons) return;
      const hit = this._hit(event.clientX, event.clientY);
      this.domElement.style.cursor = hit ? 'pointer' : 'crosshair';
    };

    domElement.addEventListener('pointerdown', this._onPointerDown);
    domElement.addEventListener('pointerup', this._onPointerUp);
    domElement.addEventListener('pointercancel', this._onPointerCancel);
    domElement.addEventListener('pointermove', this._onPointerMove);
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
    this.downPoint = null;
    this.domElement.style.cursor = this.enabled ? 'crosshair' : '';
    if (!this.enabled) {
      this._clearSelection();
      this.onClear();
    }
  }

  _hit(clientX, clientY) {
    const rect = this.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    this.pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.camera.updateMatrixWorld(true);
    this.buildingGroup.updateMatrixWorld(true);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersections = this.raycaster.intersectObject(this.buildingGroup, true);
    return intersections.find((hit) => hit.object?.isMesh && hit.object.geometry) || null;
  }

  _describe(hit) {
    const point = hit.point;
    const object = hit.object;
    const name = String(object.name || '').toLowerCase();
    const normal = hit.face?.normal
      ? hit.face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(object.matrixWorld)).normalize()
      : new THREE.Vector3(0, 0, point.z >= 0 ? 1 : -1);

    let kind = 'elevation';
    if (point.y >= ROOF_Y - 0.9) kind = 'roof';
    else if (point.y <= BUILDING.groundHeight + 1.6) kind = 'entrance';
    else if (/balcony|railing|balustrade|loggia/.test(name)) kind = 'balcony';
    else if (/glass|window|glaz/.test(name)) kind = 'glazing';
    else if (/fin|frame|slot|blade|visor/.test(name)) kind = 'frame';
    else if (point.y > BUILDING.groundHeight + BUILDING.floorHeight) {
      // Some procedurally merged meshes have generic names; infer the feature
      // type from the visible bay rhythm rather than inventing a verified label.
      kind = point.y > ROOF_Y - 2.2 ? 'roof' : 'elevation';
    }

    const copy = FEATURE_COPY[kind];
    const floor = point.y <= BUILDING.groundHeight
      ? 'Arrival level'
      : `Approx. level ${Math.min(BUILDING.levels, Math.max(1, Math.floor((point.y - BUILDING.groundHeight) / BUILDING.floorHeight) + 1))}`;
    return {
      kind,
      title: copy.title,
      description: copy.description,
      side: sideFromNormal(normal),
      floor,
      coordinates: [point.x, point.y, point.z].map((value) => Number(value.toFixed(1))),
      confidence: 'Conceptual / inferred geometry'
    };
  }

  _setOutline(hit) {
    this._clearOutline();
    const object = hit?.object;
    if (!object?.geometry) return;
    try {
      const geometry = new THREE.EdgesGeometry(object.geometry, 28);
      if (object.isInstancedMesh && Number.isInteger(hit.instanceId)) {
        const instanceMatrix = new THREE.Matrix4();
        object.getMatrixAt(hit.instanceId, instanceMatrix);
        geometry.applyMatrix4(instanceMatrix);
      }
      object.updateMatrixWorld(true);
      geometry.applyMatrix4(object.matrixWorld);
      const material = new THREE.LineBasicMaterial({
        color: 0xd3b07c,
        transparent: true,
        opacity: 0.92,
        depthTest: false
      });
      const outline = new THREE.LineSegments(geometry, material);
      outline.name = 'Facade inspection highlight';
      // Vertices are baked to world coordinates above, so the overlay stays at
      // identity transform. For instanced meshes this outlines the picked
      // instance, not the source box shared by the entire material batch.
      outline.matrixAutoUpdate = false;
      outline.matrix.identity();
      outline.matrixWorldNeedsUpdate = true;
      outline.renderOrder = 999;
      outline.frustumCulled = false;
      this.scene.add(outline);
      this.outline = outline;
    } catch (error) {
      // The descriptive inspector should remain useful if a geometry cannot be outlined.
      console.warn('Facade outline could not be created:', error);
    }
  }

  _clearOutline() {
    if (!this.outline) return;
    this.scene.remove(this.outline);
    this.outline.geometry?.dispose();
    if (Array.isArray(this.outline.material)) this.outline.material.forEach((material) => material.dispose());
    else this.outline.material?.dispose();
    this.outline = null;
  }

  _clearSelection() {
    this._clearOutline();
  }

  dispose() {
    this.domElement.removeEventListener('pointerdown', this._onPointerDown);
    this.domElement.removeEventListener('pointerup', this._onPointerUp);
    this.domElement.removeEventListener('pointercancel', this._onPointerCancel);
    this.domElement.removeEventListener('pointermove', this._onPointerMove);
    this._clearSelection();
    this.domElement.style.cursor = '';
  }
}
