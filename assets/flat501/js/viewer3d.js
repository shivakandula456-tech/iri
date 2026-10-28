import * as THREE from "three";
import { OrbitControls } from "../../../assets/vendor/OrbitControls.js";
import { createMaterialLibrary } from "./model-textures.js";
import {
  isWebGLAvailable,
  makeSiteEnvironment,
} from "./viewer-geometry.js";
import {
  buildBase,
  buildCeiling,
  buildFloors,
  buildLights,
  buildRoomTargets,
  buildWalls,
} from "./model-architecture.js";
import { buildFurniture } from "./model-furniture.js";
import { buildFixtures } from "./model-fixtures.js";
import { clamp, easeInOutCubic, prefersReducedMotion } from "./utils.js";

const VIEW_PRESETS = {
  perspective: {
    label: "Perspective",
    position: [10.7, 7.4, 11.3],
    target: [4.0, 0.55, 2.6],
    fov: 40,
    ceiling: false,
    labels: true,
    hiddenWalls: ["south-exterior", "east-exterior"],
    rotate: true,
  },
  cutaway: {
    label: "Cutaway",
    position: [9.4, 9.6, 8.2],
    target: [4.0, 0.35, 2.55],
    fov: 42,
    ceiling: false,
    labels: true,
    hiddenWalls: ["south-exterior", "east-exterior"],
    rotate: true,
  },
  interior: {
    label: "Interior",
    position: [1.8, 1.62, 4.7],
    target: [2.45, 1.22, 1.85],
    fov: 62,
    ceiling: true,
    labels: false,
    hiddenWalls: [],
    rotate: true,
  },
  plan: {
    label: "Plan",
    position: [4.0, 13.6, 2.6],
    target: [4.0, 0, 2.6],
    fov: 33,
    ceiling: false,
    labels: true,
    hiddenWalls: [],
    rotate: false,
  },
};

export class DigitalTwinViewer {
  constructor(container, options = {}) {
    if (!(container instanceof HTMLElement)) {
      throw new Error("The 3D viewer needs a container element.");
    }
    if (!isWebGLAvailable()) {
      throw new Error("WebGL is not available in this browser.");
    }

    this.container = container;
    this.options = options;
    this.property = options.property;
    if (!this.property) throw new Error("A property record is required.");

    this.width = this.property.layout.bounds.maxX - this.property.layout.bounds.minX;
    this.depth = this.property.layout.bounds.maxZ - this.property.layout.bounds.minZ;
    this.wallHeight = this.property.layout.wallHeight;
    this.roomHighlights = new Map();
    this.roomOutlines = new Map();
    this.roomLabels = new Map();
    this.activeRoomId = null;
    this.activeView = options.initialView && VIEW_PRESETS[options.initialView]
      ? options.initialView
      : "cutaway";
    this.labelsPreference = true;
    this.labelsVisible = true;
    this.transition = null;
    this.frameHandle = 0;
    this.readyCalled = false;
    this.visible = true;
    this.pointerDown = null;
    this.hoverCheckAt = 0;
    this.disposed = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.05, 70);
    this.camera.position.set(...VIEW_PRESETS[this.activeView].position);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.domElement.className = "viewer-canvas";
    this.renderer.domElement.setAttribute("role", "img");
    this.renderer.domElement.setAttribute(
      "aria-label",
      "Interactive provisional 3D reconstruction of Flat 501. Select a room label or the floor plan to explore.",
    );
    this.renderer.domElement.tabIndex = 0;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 24;
    this.controls.minPolarAngle = 0.08;
    this.controls.maxPolarAngle = THREE.MathUtils.degToRad(83);
    this.controls.target.set(...VIEW_PRESETS[this.activeView].target);

    const library = createMaterialLibrary(this.renderer);
    this.materialLibrary = library;
    this.material = library.materials;
    this.environmentTarget = makeSiteEnvironment(this.renderer);
    this.scene.environment = this.environmentTarget.texture;
    this.scene.environmentIntensity = 0.52;

    this.model = new THREE.Group();
    this.model.name = "flat-501-model";
    this.floors = new THREE.Group();
    this.walls = new THREE.Group();
    this.ceiling = new THREE.Group();
    this.furniture = new THREE.Group();
    this.fixtures = new THREE.Group();
    this.roomTargets = new THREE.Group();
    this.model.add(
      this.floors,
      this.walls,
      this.ceiling,
      this.furniture,
      this.fixtures,
      this.roomTargets,
    );
    this.scene.add(this.model);

    buildBase(this);
    buildFloors(this);
    buildWalls(this);
    buildCeiling(this);
    buildFurniture(this);
    buildFixtures(this);
    buildRoomTargets(this);
    buildLights(this);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.lastPointerEvent = null;

    this.createOverlay();
    this.createRoomLabels();
    this.bindEvents();
    this.resize();
    this.applyView(this.activeView, { instant: true });
    this.animate();
  }

  createOverlay() {
    this.labelLayer = document.createElement("div");
    this.labelLayer.className = "scene-label-layer";
    this.labelLayer.setAttribute("aria-label", "Room markers");
    this.container.appendChild(this.labelLayer);
  }

  createRoomLabels() {
    for (const room of this.property.layout.rooms) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "scene-label";
      button.dataset.roomId = room.id;
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", `Select ${room.name}`);

      const index = document.createElement("span");
      index.className = "scene-label__index";
      index.textContent = String(room.index).padStart(2, "0");
      const name = document.createElement("span");
      name.className = "scene-label__name";
      name.textContent = room.shortName;
      button.append(index, name);

      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this.selectRoom(room.id, { notify: true, source: "label" });
      });

      this.roomLabels.set(room.id, button);
      this.labelLayer.appendChild(button);
    }
  }

  bindEvents() {
    this.handleResize = () => this.resize();
    this.resizeObserver = new ResizeObserver(this.handleResize);
    this.resizeObserver.observe(this.container);

    this.handlePointerDown = (event) => {
      if (event.button !== 0) return;
      this.pointerDown = { x: event.clientX, y: event.clientY, time: performance.now() };
    };

    this.handlePointerUp = (event) => {
      if (!this.pointerDown || event.button !== 0) return;
      const distance = Math.hypot(
        event.clientX - this.pointerDown.x,
        event.clientY - this.pointerDown.y,
      );
      const elapsed = performance.now() - this.pointerDown.time;
      this.pointerDown = null;
      if (distance > 6 || elapsed > 650) return;
      this.pickRoom(event);
    };

    this.handlePointerMove = (event) => {
      this.lastPointerEvent = event;
      const now = performance.now();
      if (now - this.hoverCheckAt < 80) return;
      this.hoverCheckAt = now;
      const pickable = this.pickRoom(event, { select: false });
      this.renderer.domElement.style.cursor = pickable ? "pointer" : "grab";
    };

    this.handlePointerLeave = () => {
      this.lastPointerEvent = null;
      this.renderer.domElement.style.cursor = "grab";
    };

    this.handleControlStart = () => {
      if (this.transition) {
        this.transition = null;
        this.controls.enabled = true;
      }
    };

    this.handleContextLost = (event) => {
      event.preventDefault();
      this.options.onError?.(new Error("The 3D graphics context was lost."));
    };

    this.handleVisibilityChange = () => {
      this.visible = !document.hidden;
    };

    this.renderer.domElement.addEventListener("pointerdown", this.handlePointerDown);
    this.renderer.domElement.addEventListener("pointerup", this.handlePointerUp);
    this.renderer.domElement.addEventListener("pointermove", this.handlePointerMove);
    this.renderer.domElement.addEventListener("pointerleave", this.handlePointerLeave);
    this.renderer.domElement.addEventListener("webglcontextlost", this.handleContextLost);
    this.controls.addEventListener("start", this.handleControlStart);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
  }

  pickRoom(event, options = {}) {
    const select = options.select !== false;
    const rect = this.renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const targets = [...this.roomTargets.children, this.furniture];
    const hits = this.raycaster.intersectObjects(targets, true);
    let roomId = null;
    for (const hit of hits) {
      let node = hit.object;
      while (node) {
        if (node.userData?.roomId) {
          roomId = node.userData.roomId;
          break;
        }
        node = node.parent;
      }
      if (roomId) break;
    }
    if (!roomId) return null;
    if (select) this.selectRoom(roomId, { notify: true, source: "viewer" });
    return roomId;
  }

  selectRoom(roomId, options = {}) {
    const notify = options.notify !== false;
    if (roomId === null || roomId === undefined) {
      this.activeRoomId = null;
      for (const highlight of this.roomHighlights.values()) highlight.visible = false;
      for (const outline of this.roomOutlines.values()) outline.visible = false;
      for (const [id, label] of this.roomLabels) {
        label.classList.remove("is-active");
        label.setAttribute("aria-pressed", "false");
      }
      if (notify) this.options.onRoomSelect?.(null, options.source || "api");
      return;
    }

    const room = this.property.layout.rooms.find((entry) => entry.id === roomId);
    if (!room) return;
    if (this.activeRoomId === roomId && !options.force) {
      if (notify) this.options.onRoomSelect?.(room, options.source || "api");
      return;
    }
    this.activeRoomId = roomId;
    for (const [id, highlight] of this.roomHighlights) {
      highlight.visible = id === roomId;
    }
    for (const [id, outline] of this.roomOutlines) {
      outline.visible = id === roomId;
    }
    for (const [id, label] of this.roomLabels) {
      const active = id === roomId;
      label.classList.toggle("is-active", active);
      label.setAttribute("aria-pressed", String(active));
    }
    if (notify) this.options.onRoomSelect?.(room, options.source || "api");
  }

  get activeRoom() {
    return this.property.layout.rooms.find((room) => room.id === this.activeRoomId) || null;
  }

  setView(viewId, options = {}) {
    if (!VIEW_PRESETS[viewId]) return;
    this.applyView(viewId, options);
    this.options.onViewChange?.(viewId, VIEW_PRESETS[viewId]);
  }

  applyView(viewId, options = {}) {
    const preset = VIEW_PRESETS[viewId];
    if (!preset) return;
    this.activeView = viewId;
    const hidden = new Set(preset.hiddenWalls || []);
    for (const wallGroup of this.walls.children) {
      wallGroup.visible = !hidden.has(wallGroup.userData.wallId);
    }
    this.ceiling.visible = Boolean(preset.ceiling);
    this.labelsVisible = this.labelsPreference && Boolean(preset.labels);
    this.updateLabelVisibility();

    this.controls.enableRotate = preset.rotate;
    this.controls.minPolarAngle = preset.rotate ? 0.08 : 0;
    this.controls.maxPolarAngle = preset.rotate ? THREE.MathUtils.degToRad(83) : Math.PI;
    this.controls.minDistance = viewId === "interior" ? 0.4 : 3.2;
    this.controls.maxDistance = viewId === "plan" ? 30 : 24;

    const up = viewId === "plan" ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0);
    if (options.instant || prefersReducedMotion() || options.skipAnimation) {
      this.transition = null;
      this.camera.up.copy(up);
      this.camera.position.set(...preset.position);
      this.camera.fov = preset.fov;
      this.camera.updateProjectionMatrix();
      this.controls.target.set(...preset.target);
      this.controls.enabled = true;
      this.controls.update();
      return;
    }

    this.camera.up.copy(up);
    this.controls.enabled = false;
    this.transition = {
      start: performance.now(),
      duration: 1050,
      fromPosition: this.camera.position.clone(),
      toPosition: new THREE.Vector3(...preset.position),
      fromTarget: this.controls.target.clone(),
      toTarget: new THREE.Vector3(...preset.target),
      fromFov: this.camera.fov,
      toFov: preset.fov,
    };
  }

  resetView() {
    this.setView(this.activeView);
  }

  setLabelsVisible(visible) {
    this.labelsPreference = Boolean(visible);
    this.labelsVisible =
      this.labelsPreference && Boolean(VIEW_PRESETS[this.activeView]?.labels);
    this.updateLabelVisibility();
  }

  updateLabelVisibility() {
    if (!this.labelLayer) return;
    for (const label of this.roomLabels.values()) {
      label.style.display = this.labelsVisible ? "" : "none";
    }
  }

  updateLabelPositions() {
    if (!this.labelsVisible) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!width || !height) return;
    const vector = new THREE.Vector3();
    for (const room of this.property.layout.rooms) {
      const label = this.roomLabels.get(room.id);
      if (!label) continue;
      const [x, z] = room.labelPosition;
      vector.set(x, 0.52, z).project(this.camera);
      const behind = vector.z < -1 || vector.z > 1;
      const screenX = (vector.x * 0.5 + 0.5) * width;
      const screenY = (-vector.y * 0.5 + 0.5) * height;
      if (behind || screenX < -60 || screenY < -60 || screenX > width + 60 || screenY > height + 60) {
        label.style.visibility = "hidden";
      } else {
        label.style.visibility = "visible";
        label.style.transform = `translate3d(${screenX}px, ${screenY}px, 0) translate(-50%, -100%)`;
      }
    }
  }

  updateTransition(now) {
    if (!this.transition) return;
    const progress = clamp((now - this.transition.start) / this.transition.duration, 0, 1);
    const eased = easeInOutCubic(progress);
    this.camera.position.lerpVectors(
      this.transition.fromPosition,
      this.transition.toPosition,
      eased,
    );
    this.controls.target.lerpVectors(
      this.transition.fromTarget,
      this.transition.toTarget,
      eased,
    );
    this.camera.fov =
      this.transition.fromFov + (this.transition.toFov - this.transition.fromFov) * eased;
    this.camera.updateProjectionMatrix();
    this.controls.update();
    if (progress >= 1) {
      this.transition = null;
      this.controls.enabled = true;
    }
  }

  resize() {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height, false);
  }

  animate() {
    if (this.disposed) return;
    this.frameHandle = requestAnimationFrame((now) => this.animate());
    if (!this.visible) return;
    if (this.transition) this.updateTransition(performance.now());
    else this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.updateLabelPositions();
    if (!this.readyCalled) {
      this.readyCalled = true;
      this.options.onReady?.(this);
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.frameHandle);
    this.resizeObserver?.disconnect();
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.controls.removeEventListener("start", this.handleControlStart);
    this.controls.dispose();
    this.renderer.domElement.removeEventListener("pointerdown", this.handlePointerDown);
    this.renderer.domElement.removeEventListener("pointerup", this.handlePointerUp);
    this.renderer.domElement.removeEventListener("pointermove", this.handlePointerMove);
    this.renderer.domElement.removeEventListener("pointerleave", this.handlePointerLeave);
    this.renderer.domElement.removeEventListener("webglcontextlost", this.handleContextLost);

    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    this.scene.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) {
        const list = Array.isArray(object.material) ? object.material : [object.material];
        list.forEach((material) => {
          materials.add(material);
          if (material.map) textures.add(material.map);
        });
      }
    });
    geometries.forEach((geometry) => geometry.dispose());
    textures.forEach((texture) => texture.dispose());
    materials.forEach((material) => material.dispose());
    this.materialLibrary?.dispose();
    this.environmentTarget?.dispose();
    this.labelLayer?.remove();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
    this.scene.clear();
  }
}

export { VIEW_PRESETS };
