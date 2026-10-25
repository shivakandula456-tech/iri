import * as THREE from 'three';
import { BUILDING, ROOF_Y } from './config.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const GLTF_LOADER_URL = 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js';

// Empty until a verified/local floor asset is supplied. Keys are the displayed
// floor number and values must be project-relative .glb paths in the static site.
export const INTERIOR_ASSETS = Object.freeze({});

export const ROOM_DEFINITIONS = Object.freeze([
  { id: 'living', label: 'Living room', shortLabel: 'Living', x: -7.2, z: 2.0, width: 8.8, depth: 5.4, color: 0x778d86, description: 'Illustrative main gathering space. Area, windows, room connections and actual dimensions must be checked against an approved apartment plan.', visit: [0.0, 2.3, -0.8] },
  { id: 'dining', label: 'Dining area', shortLabel: 'Dining', x: 0.0, z: 2.0, width: 5.8, depth: 5.4, color: 0xb59a73, description: 'Illustrative dining zone placed between the living area and kitchen for demonstration. This is not a verified apartment arrangement.', visit: [0.0, 2.4, -0.8] },
  { id: 'kitchen', label: 'Kitchen', shortLabel: 'Kitchen', x: 6.5, z: 2.0, width: 6.8, depth: 5.4, color: 0x7a8fa0, description: 'Illustrative kitchen zone with conceptual counters and work surfaces. Utility positions and actual dimensions are not verified.', visit: [-1.0, 2.4, -0.8] },
  { id: 'bedroom', label: 'Bedroom', shortLabel: 'Bedroom', x: -7.0, z: -3.6, width: 8.4, depth: 4.8, color: 0x8c7e9c, description: 'Illustrative private room with conceptual furniture blocks. The actual bedroom count, orientation and room dimensions require verified drawings.', visit: [0.0, 1.8, -0.5] },
  { id: 'bathroom', label: 'Bathroom', shortLabel: 'Bath', x: 4.7, z: -3.6, width: 4.4, depth: 4.8, color: 0x7b9b9b, description: 'Illustrative bathroom zone for spatial demonstration only. Plumbing, waterproofing and approved fixture layouts are not modeled or verified.', visit: [-0.3, 1.4, -0.5] },
  { id: 'balcony', label: 'Balcony', shortLabel: 'Balcony', x: 0.0, z: 7.1, width: 13.2, depth: 1.7, color: 0xc29a6e, description: 'Illustrative balcony zone connecting the sample layout to the exterior. Actual balcony depth and orientation must be verified.', visit: [0.0, 0.2, -1.0] }
]);

/**
 * Interactive floor exploration controller.
 *
 * The building's original instanced facade stays intact in exterior mode.
 * Floor-specific batches, produced by ModelBuilder, can be isolated and moved
 * for the exploded view. The furnished sample apartment is explicitly
 * illustrative; no approved floor plan or interior asset was supplied.
 */
export class BuildingExplorer {
  constructor({
    scene,
    camera,
    controls,
    renderer,
    building,
    site,
    onStateChange = () => {},
    onToast = () => {},
    interiorAssets = INTERIOR_ASSETS
  }) {
    if (!scene || !camera || !controls || !renderer || !building?.group) {
      throw new TypeError('BuildingExplorer requires scene, camera, controls, renderer and building.');
    }
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.renderer = renderer;
    this.building = building;
    this.site = site;
    this.onStateChange = onStateChange;
    this.onToast = onToast;
    this.interiorAssets = interiorAssets;
    this.active = false;
    this.mode = 'exterior';
    this.selectedFloor = Math.min(8, BUILDING.levels);
    this.selectedRoom = 'living';
    this.rotateEnabled = false;
    this.walking = false;
    this.heldKeys = new Set();
    this.flight = null;
    this.savedExterior = null;
    this.lastPointer = null;
    this.pointerDragged = false;
    this.rotatePointer = null;
    this.loadedInterior = null;
    this.loadedInteriorFloor = null;
    this.interiorLoadToken = 0;
    this.siteInitialVisibility = site?.group?.visible ?? true;
    this.originalLocalClipping = renderer.localClippingEnabled;
    this.clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 8.0);
    this.clipRecords = [];
    this.floorGroups = new Map(building.floorGroups || []);
    this.staticChildren = [];
    this.floorPlates = new Map();
    this._captureBuildingLayers();
    this.floorHighlight = this._createFloorHighlight();
    this.interiorRoot = new THREE.Group();
    this.interiorRoot.name = 'Interactive apartment interior container';
    this.conceptInterior = this._createIllustrativeApartment();
    this.interiorRoot.add(this.conceptInterior);
    this.scene.add(this.interiorRoot);
    this.interiorRoot.visible = false;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this._keyDown = (event) => this._handleKeyDown(event);
    this._keyUp = (event) => this._handleKeyUp(event);
    this._pointerDown = (event) => this._handlePointerDown(event);
    this._pointerMove = (event) => this._handlePointerMove(event);
    this._pointerUp = (event) => this._handlePointerUp(event);
    this._pointerCancel = () => {
      this.lastPointer = null;
      this.rotatePointer = null;
      this.pointerDragged = false;
    };
    this._attachEvents();
    this._applyVisualMode();
    this._emitState();
  }

  _captureBuildingLayers() {
    for (const child of this.building.group.children) {
      if (Number.isInteger(child.userData?.floorNumber)) {
        const floorNumber = child.userData.floorNumber;
        this.floorGroups.set(floorNumber, child);
        const floorBottom = BUILDING.groundHeight + (floorNumber - 1) * BUILDING.floorHeight;
        const plateMaterial = new THREE.MeshStandardMaterial({
          name: `Floor ${floorNumber} visual datum`,
          color: 0x8f897f,
          roughness: 0.84,
          metalness: 0.04,
          transparent: true,
          opacity: 0.26,
          depthWrite: false,
          side: THREE.DoubleSide
        });
        const plate = new THREE.Mesh(
          new THREE.BoxGeometry(BUILDING.length - 5.2, 0.12, BUILDING.depth - 2.6),
          plateMaterial
        );
        plate.name = `Floor ${floorNumber} visual datum — conceptual`;
        plate.position.set(0, floorBottom + 0.05, 0);
        plate.visible = false;
        plate.renderOrder = 2;
        child.add(plate);
        this.floorPlates.set(floorNumber, plate);
      } else {
        this.staticChildren.push({ object: child, visible: child.visible });
      }
    }
    // For a supplied GLB without layer metadata, use honest floor datum proxies
    // so selection and floor-plan exploration remain available. The interface
    // will not claim that its whole-floor facade can be separated from that GLB.
    if (!this.floorGroups.size) {
      for (let floorNumber = 1; floorNumber <= BUILDING.levels; floorNumber += 1) {
        const group = new THREE.Group();
        group.name = `Floor ${String(floorNumber).padStart(2, '0')} — inferred datum proxy`;
        group.userData.floorNumber = floorNumber;
        group.userData.proxyOnly = true;
        const floorBottom = BUILDING.groundHeight + (floorNumber - 1) * BUILDING.floorHeight;
        const material = new THREE.MeshStandardMaterial({
          color: 0xa98e63, transparent: true, opacity: 0.18, roughness: 0.8,
          depthWrite: false, side: THREE.DoubleSide
        });
        const slab = new THREE.Mesh(new THREE.BoxGeometry(BUILDING.length - 4, 0.15, BUILDING.depth - 1.8), material);
        slab.position.y = floorBottom + 0.05;
        group.add(slab);
        group.visible = false;
        this.building.group.add(group);
        this.floorGroups.set(floorNumber, group);
        this.floorPlates.set(floorNumber, slab);
      }
      this.staticChildren = this.building.group.children
        .filter((child) => !Number.isInteger(child.userData?.floorNumber))
        .map((object) => ({ object, visible: object.visible }));
    }
  }

  _createFloorHighlight() {
    const geometry = new THREE.EdgesGeometry(
      new THREE.BoxGeometry(BUILDING.length + 0.8, BUILDING.floorHeight - 0.18, BUILDING.depth + 0.75),
      8
    );
    const material = new THREE.LineBasicMaterial({
      color: 0xe4c18c, transparent: true, opacity: 0.96,
      depthTest: false, toneMapped: false
    });
    const outline = new THREE.LineSegments(geometry, material);
    outline.name = 'Selected floor highlight';
    outline.frustumCulled = false;
    outline.renderOrder = 80;
    this.scene.add(outline);
    return outline;
  }

  _createIllustrativeApartment() {
    const root = new THREE.Group();
    root.name = 'Illustrative apartment interior — not an approved plan';
    root.userData.accuracy = 'Illustrative concept. Obtain approved architectural plans before representing this as an actual unit layout.';
    this.roomObjects = new Map();

    const floorMaterial = new THREE.MeshStandardMaterial({
      name: 'Illustrative interior floor',
      color: 0xd1c8b7, roughness: 0.84, metalness: 0.01
    });
    const wallMaterial = new THREE.MeshStandardMaterial({
      name: 'Illustrative interior wall',
      color: 0xe7e0d3, roughness: 0.9, metalness: 0
    });
    const trimMaterial = new THREE.MeshStandardMaterial({
      name: 'Illustrative interior trim',
      color: 0x9a8a72, roughness: 0.58, metalness: 0.12
    });
    const darkMaterial = new THREE.MeshStandardMaterial({
      name: 'Illustrative interior details',
      color: 0x51575a, roughness: 0.68
    });

    const addBox = (parent, name, size, position, material) => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
      mesh.name = name;
      mesh.position.set(...position);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    };

    addBox(root, 'Illustrative apartment floor plate', [27.4, 0.16, 14.1], [0, 0, 0], floorMaterial);
    // Rear and side walls establish scale while keeping the front open for an
    // unobstructed dollhouse view and room selection.
    addBox(root, 'Rear partition wall', [27.4, 2.55, 0.18], [0, 1.28, -6.95], wallMaterial);
    addBox(root, 'Left partition wall', [0.18, 2.55, 13.8], [-13.55, 1.28, 0], wallMaterial);
    addBox(root, 'Right partition wall', [0.18, 2.55, 13.8], [13.55, 1.28, 0], wallMaterial);
    addBox(root, 'Central room divider', [0.14, 2.45, 8.9], [2.85, 1.25, -1.1], wallMaterial);
    addBox(root, 'Bedroom divider', [8.4, 2.4, 0.14], [-7.0, 1.22, -0.25], wallMaterial);
    addBox(root, 'Bathroom divider', [4.5, 2.35, 0.14], [4.8, 1.2, -1.0], wallMaterial);
    addBox(root, 'Kitchen divider', [0.14, 2.4, 5.0], [3.0, 1.2, 2.0], wallMaterial);
    addBox(root, 'Interior window concept', [15.0, 1.45, 0.09], [0, 1.7, 6.72], trimMaterial);

    const roomMap = new Map();
    for (const definition of ROOM_DEFINITIONS) {
      const roomGroup = new THREE.Group();
      roomGroup.name = definition.label;
      roomGroup.userData.roomId = definition.id;
      roomGroup.userData.roomLabel = definition.label;
      roomGroup.userData.accuracy = 'Illustrative, not a verified project plan';
      const zoneMaterial = new THREE.MeshBasicMaterial({
        name: `${definition.label} selection zone`,
        color: definition.color,
        transparent: true,
        opacity: 0.23,
        depthWrite: false,
        side: THREE.DoubleSide
      });
      const zone = addBox(
        roomGroup,
        `${definition.label} selectable floor zone`,
        [definition.width, 0.035, definition.depth],
        [definition.x, 0.105, definition.z],
        zoneMaterial
      );
      zone.userData.roomId = definition.id;
      roomGroup.userData.roomId = definition.id;
      roomGroup.userData.definition = definition;
      roomGroup.userData.baseColor = definition.color;
      roomMap.set(definition.id, { group: roomGroup, zone, definition, baseColor: definition.color });
      root.add(roomGroup);
    }

    // Simple, scale-consistent furniture masses help explain room relationships.
    // They intentionally do not claim a developer-approved furniture schedule.
    const living = roomMap.get('living').group;
    addBox(living, 'Sofa base — illustrative', [3.7, 0.38, 1.1], [-8.1, 0.34, 2.7], trimMaterial);
    addBox(living, 'Sofa back — illustrative', [3.7, 0.7, 0.24], [-8.1, 0.75, 3.12], trimMaterial);
    addBox(living, 'Coffee table — illustrative', [1.3, 0.28, 0.75], [-5.8, 0.22, 0.7], darkMaterial);

    const dining = roomMap.get('dining').group;
    addBox(dining, 'Dining table — illustrative', [2.2, 0.14, 1.0], [0, 0.84, 2.2], trimMaterial);
    for (const [x, z] of [[-1.2, 1.5], [1.2, 1.5], [-1.2, 2.9], [1.2, 2.9]]) {
      addBox(dining, 'Dining chair — illustrative', [0.42, 0.45, 0.42], [x, 0.35, z], darkMaterial);
    }

    const kitchen = roomMap.get('kitchen').group;
    addBox(kitchen, 'Kitchen counter — illustrative', [4.6, 0.92, 0.76], [7.0, 0.54, 3.65], trimMaterial);
    addBox(kitchen, 'Kitchen worktop — illustrative', [4.75, 0.1, 0.9], [7.0, 1.02, 3.65], darkMaterial);
    addBox(kitchen, 'Kitchen island — illustrative', [2.2, 0.9, 0.82], [6.4, 0.53, 0.3], trimMaterial);

    const bedroom = roomMap.get('bedroom').group;
    addBox(bedroom, 'Bed base — illustrative', [3.2, 0.35, 2.6], [-7.0, 0.3, -3.8], trimMaterial);
    addBox(bedroom, 'Mattress — illustrative', [3.05, 0.2, 2.45], [-7.0, 0.56, -3.8], floorMaterial);
    addBox(bedroom, 'Wardrobe — illustrative', [2.2, 2.0, 0.62], [-11.0, 1.08, -5.4], darkMaterial);

    const bathroom = roomMap.get('bathroom').group;
    addBox(bathroom, 'Vanity — illustrative', [1.3, 0.7, 0.55], [4.2, 0.44, -4.2], trimMaterial);
    addBox(bathroom, 'Shower tray — illustrative', [1.3, 0.14, 1.4], [5.9, 0.1, -4.4], floorMaterial);
    addBox(bathroom, 'WC block — illustrative', [0.55, 0.62, 0.75], [3.5, 0.34, -3.1], wallMaterial);

    const balcony = roomMap.get('balcony').group;
    addBox(balcony, 'Balcony bench — illustrative', [2.8, 0.38, 0.48], [-3.4, 0.3, 7.1], trimMaterial);
    addBox(balcony, 'Balcony planter — illustrative', [1.5, 0.44, 0.48], [5.1, 0.34, 7.2], darkMaterial);

    this.roomObjects = roomMap;
    this.interiorMaterials = [floorMaterial, wallMaterial, trimMaterial, darkMaterial, ...Array.from(roomMap.values(), (item) => item.zone.material)];
    root.visible = true;
    return root;
  }

  _attachEvents() {
    this.renderer.domElement.addEventListener('pointerdown', this._pointerDown, { capture: true });
    this.renderer.domElement.addEventListener('pointermove', this._pointerMove, { capture: true });
    this.renderer.domElement.addEventListener('pointerup', this._pointerUp, { capture: true });
    this.renderer.domElement.addEventListener('pointercancel', this._pointerCancel, { capture: true });
    window.addEventListener('keydown', this._keyDown, { capture: true });
    window.addEventListener('keyup', this._keyUp, { capture: true });
  }

  open() {
    if (this.active) return;
    this.savedExterior = {
      position: this.camera.position.clone(),
      target: this.controls.target.clone(),
      minDistance: this.controls.minDistance,
      maxDistance: this.controls.maxDistance,
      enabled: this.controls.enabled,
      siteVisible: this.site?.group?.visible ?? this.siteInitialVisibility
    };
    this.active = true;
    this.mode = 'exterior';
    this.selectedFloor = clamp(this.selectedFloor, 1, BUILDING.levels);
    this.rotateEnabled = false;
    if (this.interiorAssets[this.selectedFloor]) void this.loadInteriorAsset(this.selectedFloor);
    this.walking = false;
    this.heldKeys.clear();
    this._applyVisualMode();
    this._emitState();
  }

  selectFloor(floorNumber, { fromCanvas = false } = {}) {
    if (!this.active) return;
    const next = clamp(Math.round(Number(floorNumber) || 1), 1, BUILDING.levels);
    if (this.selectedFloor === next && !fromCanvas) return;
    if (this.walking) this.walking = false;
    this.rotateEnabled = false;
    this.selectedFloor = next;
    this.selectedRoom = this.selectedRoom || 'living';
    if (this.mode === 'exploded') this._applyVisualMode();
    else if (this.mode === 'floor' || this.mode === 'interior') {
      this.mode = 'floor';
      this._applyVisualMode();
      this._flyTo(this._floorCameraPosition(), this._floorTarget(), 850);
    } else if (this.mode === 'cutaway') {
      this._applyVisualMode();
      this._flyTo(this._floorCameraPosition(), this._floorTarget(), 850);
    } else {
      this._updateFloorHighlight();
      this._flyTo(this._floorCameraPosition(), this._floorTarget(), 850);
    }
    this.interiorRoot.position.y = this._floorBottom();
    if (this.interiorAssets[next]) void this.loadInteriorAsset(next);
    this._emitState();
  }

  setMode(mode) {
    if (!this.active) return;
    const allowed = new Set(['exterior', 'cutaway', 'exploded', 'floor']);
    if (!allowed.has(mode)) return;
    this.walking = false;
    this.rotateEnabled = false;
    this.mode = mode;
    this._applyVisualMode();
    if (mode === 'exterior') {
      this._flyTo(this._floorCameraPosition(), this._floorTarget(), 850);
    } else if (mode === 'exploded') {
      this._flyTo(
        new THREE.Vector3(112, Math.max(78, ROOF_Y + 35), 128),
        new THREE.Vector3(0, ROOF_Y * 0.5, 0),
        1200,
        13
      );
    } else {
      this._flyTo(this._floorCameraPosition(), this._floorTarget(), 1000, mode === 'cutaway' ? 5 : 3);
    }
    this._emitState();
  }

  reassemble() {
    if (!this.active) return;
    this.walking = false;
    this.heldKeys.clear();
    this.rotateEnabled = false;
    this.mode = 'exterior';
    this._applyVisualMode();
    this._flyTo(
      new THREE.Vector3(104, 60, 124),
      new THREE.Vector3(0, ROOF_Y * 0.48, 0),
      1050,
      2.0
    );
    this._emitState();
  }

  enterApartment() {
    if (!this.active) return;
    this.mode = 'interior';
    this.walking = true;
    this.rotateEnabled = false;
    this._applyVisualMode();
    this.interiorRoot.position.y = this._floorBottom();
    this._flyTo(
      new THREE.Vector3(0, this._floorBottom() + 1.62, 5.5),
      new THREE.Vector3(0, this._floorBottom() + 1.62, 0),
      1250,
      1.5,
      () => {
        this.walking = true;
        this.controls.enabled = false;
        this._syncWalkOrientation();
        this._emitState();
      }
    );
    this._emitState();
  }

  returnToFloor() {
    if (!this.active) return;
    this.walking = false;
    this.heldKeys.clear();
    this.rotateEnabled = false;
    this.mode = 'floor';
    this._applyVisualMode();
    this._flyTo(this._floorCameraPosition(), this._floorTarget(), 950, 3, () => {
      this.controls.enabled = true;
      this._emitState();
    });
    this._emitState();
  }

  visitRoom(roomId) {
    const room = this.roomObjects.get(roomId);
    if (!this.active || !room) return;
    this.selectRoom(roomId, { moveCamera: false });
    if (!this.walking || this.mode !== 'interior') return;
    const definition = room.definition;
    const [offsetX, offsetZ, lookZ] = definition.visit;
    const position = new THREE.Vector3(
      definition.x + offsetX,
      this._floorBottom() + 1.62,
      definition.z + offsetZ
    );
    const target = new THREE.Vector3(
      definition.x,
      this._floorBottom() + 1.45,
      definition.z + lookZ
    );
    position.x = clamp(position.x, -12.2, 12.2);
    position.z = clamp(position.z, -5.9, 7.4);
    target.x = clamp(target.x, -12.5, 12.5);
    target.z = clamp(target.z, -6.0, 7.6);
    this._flyTo(position, target, 700, 0.35, () => {
      this.walking = true;
      this.controls.enabled = false;
      this._syncWalkOrientation();
    });
  }

  selectRoom(roomId, { moveCamera = true } = {}) {
    if (!this.active || !this.roomObjects.has(roomId)) return;
    this.selectedRoom = roomId;
    for (const [id, room] of this.roomObjects) {
      const selected = id === roomId;
      room.zone.material.color.setHex(selected ? 0xe4c18c : room.baseColor);
      room.zone.material.opacity = selected ? 0.43 : 0.2;
      room.zone.material.needsUpdate = true;
      room.group.userData.selected = selected;
    }
    this._emitState();
    if (moveCamera && this.walking) this.visitRoom(roomId);
  }

  toggleRotate() {
    if (!this.active || this.walking) return;
    this.rotateEnabled = !this.rotateEnabled;
    if (this.rotateEnabled) this.controls.enabled = false;
    else this.controls.enabled = true;
    this._emitState();
    this.onToast(this.rotateEnabled
      ? 'Drag across the scene to rotate the selected floor. Toggle Rotate off to orbit the camera.'
      : 'Floor rotation off. Camera controls restored.');
  }

  close() {
    if (!this.active) return;
    if (this.flight) {
      this.flight = null;
      this.controls.enabled = true;
    }
    this.walking = false;
    this.heldKeys.clear();
    this.rotateEnabled = false;
    this.mode = 'exterior';
    this._applyVisualMode();
    const saved = this.savedExterior;
    if (!saved) {
      this.active = false;
      this._emitState();
      return;
    }
    this._flyTo(saved.position, saved.target, 1050, 0.8, () => {
      this.camera.position.copy(saved.position);
      this.controls.target.copy(saved.target);
      this.camera.lookAt(saved.target);
      this.controls.minDistance = saved.minDistance;
      this.controls.maxDistance = saved.maxDistance;
      this.controls.enabled = saved.enabled;
      if (this.site?.group) this.site.group.visible = saved.siteVisible;
      this.active = false;
      this.flight = null;
      this.savedExterior = null;
      this._emitState();
    });
    this._emitState();
  }

  _applyVisualMode() {
    this._stopWalk();
    this._clearClipping();
    this.controls.enabled = true;
    for (const { object, visible } of this.staticChildren) object.visible = visible;
    for (const [floorNumber, group] of this.floorGroups) {
      group.visible = true;
      group.position.y = 0;
      group.rotation.y = 0;
      const plate = this.floorPlates.get(floorNumber);
      if (plate) plate.visible = false;
    }
    if (this.site?.group) this.site.group.visible = this.siteInitialVisibility;
    this.interiorRoot.visible = false;
    if (!this.rotateEnabled) this.interiorRoot.rotation.y = 0;
    this.conceptInterior.visible = !(this.loadedInterior && this.loadedInteriorFloor === this.selectedFloor);
    if (this.loadedInterior) this.loadedInterior.visible = this.loadedInteriorFloor === this.selectedFloor;
    this.floorHighlight.visible = this.mode !== 'exploded';
    this._updateFloorHighlight();

    if (this.mode === 'cutaway') {
      this._applyClipping({ selectedFloorOnly: true });
      this.interiorRoot.visible = true;
      this.interiorRoot.position.y = this._floorBottom();
      const plate = this.floorPlates.get(this.selectedFloor);
      if (plate) plate.visible = true;
    } else if (this.mode === 'exploded') {
      if (this.site?.group) this.site.group.visible = false;
      for (const { object } of this.staticChildren) object.visible = false;
      this.floorHighlight.visible = false;
      const gap = 1.38;
      for (const [floorNumber, group] of this.floorGroups) {
        group.visible = true;
        group.position.y = (floorNumber - this.selectedFloor) * gap;
        const plate = this.floorPlates.get(floorNumber);
        if (plate) plate.visible = true;
      }
    } else if (this.mode === 'floor') {
      if (this.site?.group) this.site.group.visible = false;
      for (const { object } of this.staticChildren) object.visible = false;
      for (const [floorNumber, group] of this.floorGroups) {
        group.visible = floorNumber === this.selectedFloor;
        const plate = this.floorPlates.get(floorNumber);
        if (plate) plate.visible = floorNumber === this.selectedFloor;
      }
      this._applyClipping({ selectedFloorOnly: true });
      this.interiorRoot.visible = true;
      this.interiorRoot.position.y = this._floorBottom();
      this.floorHighlight.visible = false;
    } else if (this.mode === 'interior') {
      if (this.site?.group) this.site.group.visible = false;
      for (const { object } of this.staticChildren) object.visible = false;
      for (const [floorNumber, group] of this.floorGroups) {
        group.visible = floorNumber === this.selectedFloor;
        const plate = this.floorPlates.get(floorNumber);
        if (plate) plate.visible = floorNumber === this.selectedFloor;
      }
      this._applyClipping({ selectedFloorOnly: true });
      this.interiorRoot.visible = true;
      this.interiorRoot.position.y = this._floorBottom();
      this.floorHighlight.visible = false;
    }
    this._updateRoomZones();
  }

  _applyClipping({ selectedFloorOnly = false } = {}) {
    if (this.clipRecords.length) return;
    this.renderer.localClippingEnabled = true;
    this.building.group.traverse((object) => {
      if (!object.isMesh || !object.material) return;
      if (selectedFloorOnly) {
        let parent = object;
        while (parent && !Number.isInteger(parent.userData?.floorNumber)) parent = parent.parent;
        if (parent?.userData?.floorNumber !== this.selectedFloor) return;
      }
      const original = object.material;
      const cloneOne = (material) => {
        const cloned = material.clone();
        cloned.clippingPlanes = [this.clipPlane];
        cloned.clipShadows = true;
        cloned.needsUpdate = true;
        return cloned;
      };
      const cloned = Array.isArray(original) ? original.map(cloneOne) : cloneOne(original);
      object.material = cloned;
      this.clipRecords.push({ object, original, cloned });
    });
  }

  _clearClipping() {
    for (const record of this.clipRecords) {
      record.object.material = record.original;
      if (Array.isArray(record.cloned)) record.cloned.forEach((material) => material.dispose());
      else record.cloned.dispose();
    }
    this.clipRecords.length = 0;
    this.renderer.localClippingEnabled = this.originalLocalClipping;
  }

  _updateFloorHighlight() {
    const bottom = this._floorBottom();
    this.floorHighlight.position.set(0, bottom + BUILDING.floorHeight * 0.5, 0);
    this.floorHighlight.visible = this.active && this.mode === 'exterior';
  }

  _floorBottom() {
    return BUILDING.groundHeight + (this.selectedFloor - 1) * BUILDING.floorHeight;
  }

  _floorCameraPosition() {
    return new THREE.Vector3(0, this._floorBottom() + 4.7, 61);
  }

  _floorTarget() {
    return new THREE.Vector3(0, this._floorBottom() + BUILDING.floorHeight * 0.5, 0);
  }

  _flyTo(position, target, duration = 900, arc = 0, onComplete = null) {
    this.flight = {
      fromPosition: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPosition: position.clone(),
      toTarget: target.clone(),
      duration,
      elapsed: 0,
      arc,
      onComplete
    };
    this.controls.enabled = false;
  }

  update(deltaSeconds) {
    if (!this.active) return;
    if (this.flight) {
      const flight = this.flight;
      flight.elapsed += Math.max(0, deltaSeconds) * 1000;
      const raw = clamp(flight.elapsed / flight.duration, 0, 1);
      const t = easeInOutCubic(raw);
      this.camera.position.lerpVectors(flight.fromPosition, flight.toPosition, t);
      this.camera.position.y += Math.sin(Math.PI * t) * flight.arc;
      this.controls.target.lerpVectors(flight.fromTarget, flight.toTarget, t);
      this.camera.lookAt(this.controls.target);
      if (raw >= 1) {
        this.camera.position.copy(flight.toPosition);
        this.controls.target.copy(flight.toTarget);
        this.camera.lookAt(flight.toTarget);
        this.flight = null;
        if (typeof flight.onComplete === 'function') flight.onComplete();
        else if (!this.walking && !this.rotateEnabled) this.controls.enabled = true;
      }
      return;
    }

    if (this.walking && this.mode === 'interior') {
      this._updateWalking(deltaSeconds);
      return;
    }
    if (!this.rotateEnabled && this.controls.enabled) this.controls.update();
  }

  _updateWalking(deltaSeconds) {
    const dt = Math.min(Math.max(deltaSeconds, 0), 0.05);
    const speed = this.heldKeys.has('shift') ? 6.4 : 3.8;
    const forward = new THREE.Vector3(-Math.sin(this.walkYaw), 0, -Math.cos(this.walkYaw));
    const right = new THREE.Vector3(Math.cos(this.walkYaw), 0, -Math.sin(this.walkYaw));
    const movement = new THREE.Vector3();
    if (this.heldKeys.has('w') || this.heldKeys.has('arrowup') || this.heldKeys.has('forward')) movement.add(forward);
    if (this.heldKeys.has('s') || this.heldKeys.has('arrowdown') || this.heldKeys.has('backward')) movement.sub(forward);
    if (this.heldKeys.has('d') || this.heldKeys.has('arrowright') || this.heldKeys.has('right')) movement.add(right);
    if (this.heldKeys.has('a') || this.heldKeys.has('arrowleft') || this.heldKeys.has('left')) movement.sub(right);
    if (movement.lengthSq()) {
      movement.normalize().multiplyScalar(speed * dt);
      this.camera.position.add(movement);
      this.camera.position.x = clamp(this.camera.position.x, -12.6, 12.6);
      this.camera.position.z = clamp(this.camera.position.z, -6.4, 7.75);
      this.camera.position.y = this._floorBottom() + 1.62;
    }
    const direction = new THREE.Vector3(
      -Math.sin(this.walkYaw) * Math.cos(this.walkPitch),
      Math.sin(this.walkPitch),
      -Math.cos(this.walkYaw) * Math.cos(this.walkPitch)
    );
    this.camera.lookAt(this.camera.position.clone().add(direction));
  }

  _syncWalkOrientation() {
    const direction = this.camera.getWorldDirection(new THREE.Vector3());
    this.walkYaw = Math.atan2(-direction.x, -direction.z);
    this.walkPitch = Math.asin(clamp(direction.y, -0.88, 0.88));
    this.camera.rotation.order = 'YXZ';
  }

  _handleKeyDown(event) {
    if (!this.active || !this.walking || this.mode !== 'interior') return;
    const key = event.key.toLowerCase();
    const accepted = new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift']);
    if (!accepted.has(key)) return;
    event.preventDefault();
    event.stopPropagation();
    this.heldKeys.add(key);
  }

  _handleKeyUp(event) {
    if (!this.active || !this.walking || this.mode !== 'interior') return;
    this.heldKeys.delete(event.key.toLowerCase());
  }

  setWalkDirection(direction, active) {
    if (!this.active || !this.walking) return;
    if (active) this.heldKeys.add(direction);
    else this.heldKeys.delete(direction);
  }

  _handlePointerDown(event) {
    if (!this.active) return;
    this.pointerDragged = false;
    this.lastPointer = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY };
    if (this.rotateEnabled || this.walking) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.controls.enabled = false;
      this.rotatePointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
      try { this.renderer.domElement.setPointerCapture(event.pointerId); } catch { /* optional */ }
    }
  }

  _handlePointerMove(event) {
    if (!this.active || !this.lastPointer || event.pointerId !== this.lastPointer.id) return;
    if (this.rotateEnabled && this.rotatePointer) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const dx = event.clientX - this.rotatePointer.x;
      this.rotatePointer.x = event.clientX;
      const selectedGroup = this.floorGroups.get(this.selectedFloor);
      if (selectedGroup && this.mode === 'exploded') selectedGroup.rotation.y += dx * 0.008;
      else if (selectedGroup && (this.mode === 'floor' || this.mode === 'cutaway')) selectedGroup.rotation.y += dx * 0.008;
      if (this.interiorRoot.visible) this.interiorRoot.rotation.y += dx * 0.008;
      this.pointerDragged = this.pointerDragged || Math.abs(dx) > 1;
      return;
    }
    if (this.walking && this.rotatePointer) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const dx = event.clientX - this.rotatePointer.x;
      const dy = event.clientY - this.rotatePointer.y;
      this.rotatePointer.x = event.clientX;
      this.rotatePointer.y = event.clientY;
      this.walkYaw -= dx * 0.0042;
      this.walkPitch = clamp(this.walkPitch - dy * 0.0035, -0.85, 0.8);
      this.pointerDragged = this.pointerDragged || Math.abs(dx) + Math.abs(dy) > 1;
      this._updateWalking(0);
    }
  }

  _handlePointerUp(event) {
    if (!this.active || !this.lastPointer || event.pointerId !== this.lastPointer.id) return;
    const down = this.lastPointer;
    const moved = this.pointerDragged || Math.hypot(event.clientX - down.startX, event.clientY - down.startY) > 6;
    if (this.rotateEnabled || this.walking) {
      event.preventDefault();
      event.stopImmediatePropagation();
      this.rotatePointer = null;
      this.lastPointer = null;
      if (!this.walking && this.rotateEnabled) this.controls.enabled = false;
      if (this.walking && !moved) this._pickRoom(event.clientX, event.clientY);
      this.pointerDragged = false;
      return;
    }
    this.lastPointer = null;
    if (!moved) {
      if (this.mode === 'cutaway' || this.mode === 'floor') this._pickRoom(event.clientX, event.clientY);
      else if (this.mode === 'exterior' || this.mode === 'exploded') this._pickFromExterior(event.clientX, event.clientY);
    }
    this.pointerDragged = false;
  }

  _pickFromExterior(clientX, clientY) {
    this._setPointer(clientX, clientY);
    const hits = this.raycaster.intersectObject(this.building.group, true);
    if (!hits.length) return;
    const hit = hits.find((entry) => entry.object?.isMesh) || hits[0];
    let object = hit.object;
    while (object && !Number.isInteger(object.userData?.floorNumber)) object = object.parent;
    const floor = Number.isInteger(object?.userData?.floorNumber)
      ? object.userData.floorNumber
      : clamp(Math.floor((hit.point.y - BUILDING.groundHeight) / BUILDING.floorHeight) + 1, 1, BUILDING.levels);
    this.selectFloor(floor, { fromCanvas: true });
    this.onToast(`Floor ${floor} selected. Choose a cutaway, exploded view or apartment exploration mode.`);
  }

  _pickRoom(clientX, clientY) {
    this._setPointer(clientX, clientY);
    const hits = this.raycaster.intersectObject(this.interiorRoot, true);
    for (const hit of hits) {
      let object = hit.object;
      while (object && !object.userData?.roomId) object = object.parent;
      if (object?.userData?.roomId) {
        this.selectRoom(object.userData.roomId);
        return;
      }
    }
  }

  _setPointer(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    this.camera.updateMatrixWorld(true);
    this.building.group.updateMatrixWorld(true);
    this.interiorRoot.updateMatrixWorld(true);
    this.raycaster.setFromCamera(this.pointer, this.camera);
  }

  async loadInteriorAsset(floorNumber, url = this.interiorAssets[floorNumber]) {
    if (!url || typeof url !== 'string') return false;
    const token = ++this.interiorLoadToken;
    try {
      // The loader library is fetched only when a local asset has explicitly
      // been configured. The .glb itself must be on the same static site.
      const { GLTFLoader } = await import(GLTF_LOADER_URL);
      const loader = new GLTFLoader();
      const gltf = await new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
      if (token !== this.interiorLoadToken || !this.active) {
        gltf.scene?.traverse((object) => {
          object.geometry?.dispose?.();
          if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose?.());
          else object.material?.dispose?.();
        });
        return false;
      }
      if (this.loadedInterior) {
        this.interiorRoot.remove(this.loadedInterior);
        this._disposeObjectTree(this.loadedInterior);
      }
      const model = gltf.scene || gltf.scenes?.[0];
      if (!model) return false;
      model.name = `Floor ${floorNumber} supplied interior asset`;
      model.userData.floorNumber = floorNumber;
      model.position.y = 0;
      model.userData.accuracy = 'Imported interior asset — verify source and plan status before public presentation.';
      model.visible = true;
      this.interiorRoot.add(model);
      this.loadedInterior = model;
      this.conceptInterior.visible = false;
      this.loadedInteriorFloor = floorNumber;
      return true;
    } catch (error) {
      console.warn(`Interior asset for floor ${floorNumber} could not be loaded.`, error);
      this.onToast('Could not load the optional floor asset. The conceptual interior remains available.');
      return false;
    }
  }

  _disposeObjectTree(root) {
    root.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (Array.isArray(object.material)) object.material.forEach((m) => m.dispose());
      else object.material?.dispose?.();
    });
  }

  _stopWalk() {
    this.walking = false;
    this.heldKeys.clear();
    this.rotatePointer = null;
    this.lastPointer = null;
    this.pointerDragged = false;
  }

  _restoreDefaultVisuals() {
    this._stopWalk();
    this._clearClipping();
    for (const { object, visible } of this.staticChildren) object.visible = visible;
    for (const [floorNumber, group] of this.floorGroups) {
      group.visible = true;
      group.position.y = 0;
      group.rotation.y = 0;
      const plate = this.floorPlates.get(floorNumber);
      if (plate) plate.visible = false;
    }
    if (this.site?.group) this.site.group.visible = this.siteInitialVisibility;
    this.interiorRoot.visible = false;
    this.floorHighlight.visible = false;
    this.rotateEnabled = false;
    this.mode = 'exterior';
    this.renderer.localClippingEnabled = this.originalLocalClipping;
  }

  _updateRoomZones() {
    const selected = this.roomObjects.get(this.selectedRoom);
    if (!selected) return;
    selected.group.userData.selected = true;
  }

  _emitState() {
    const proxyOnly = Array.from(this.floorGroups.values()).every((group) => group.userData.proxyOnly);
    const selected = this.roomObjects.get(this.selectedRoom);
    this.onStateChange({
      active: this.active,
      selectedFloor: this.selectedFloor,
      floorCount: BUILDING.levels,
      mode: this.mode,
      rotateEnabled: this.rotateEnabled,
      walking: this.walking,
      selectedRoom: this.selectedRoom,
      roomTitle: selected?.definition.label || 'Room',
      roomDescription: selected?.definition.description || '',
      floorLabel: `Floor ${this.selectedFloor}`,
      isConceptual: true,
      proxyFloorsOnly: proxyOnly,
      canSeparateFacade: !proxyOnly,
      rooms: ROOM_DEFINITIONS.map(({ id, label, shortLabel, description }) => ({ id, label, shortLabel, description }))
    });
  }

  getState() {
    return {
      active: this.active,
      mode: this.mode,
      selectedFloor: this.selectedFloor,
      selectedRoom: this.selectedRoom,
      rotateEnabled: this.rotateEnabled,
      walking: this.walking,
      flightActive: Boolean(this.flight),
      visibleFloorLayers: Array.from(this.floorGroups.values()).filter((group) => group.visible).length
    };
  }

  dispose() {
    this._stopWalk();
    this._clearClipping();
    this.renderer.domElement.removeEventListener('pointerdown', this._pointerDown, { capture: true });
    this.renderer.domElement.removeEventListener('pointermove', this._pointerMove, { capture: true });
    this.renderer.domElement.removeEventListener('pointerup', this._pointerUp, { capture: true });
    this.renderer.domElement.removeEventListener('pointercancel', this._pointerCancel, { capture: true });
    window.removeEventListener('keydown', this._keyDown, { capture: true });
    window.removeEventListener('keyup', this._keyUp, { capture: true });
    this._restoreDefaultVisuals();
    if (this.savedExterior) {
      this.camera.position.copy(this.savedExterior.position);
      this.controls.target.copy(this.savedExterior.target);
      this.controls.enabled = this.savedExterior.enabled;
    }
    this.scene.remove(this.floorHighlight);
    this.floorHighlight.geometry.dispose();
    this.floorHighlight.material.dispose();
    this.scene.remove(this.interiorRoot);
    this._disposeObjectTree(this.interiorRoot);
  }
}
