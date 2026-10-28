import * as THREE from 'three';
import { BUILDING, HALF_D } from './config.js';

const FLAT_REPO_REV = '74ca0000fcc5244566e2400dfa64fc897a51ac4e';
const FLAT_CDN = 'https://cdn.jsdelivr.net/gh/shivakandula456-tech/flat@' + FLAT_REPO_REV;
const VIDEO_URL = FLAT_CDN + '/assets/video/reference-flat-501.mp4';
const POSTER_URL = FLAT_CDN + '/assets/images/entry-501.jpg';

const clamp = (value, low, high) => Math.min(high, Math.max(low, value));
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export class Flat501Experience {
  constructor({
    scene,
    camera,
    controls,
    domElement,
    appElement,
    building,
    onBeforeOpen = () => {},
    onAfterClose = () => {},
    onActiveChange = () => {},
    onToast = () => {}
  }) {
    if (!scene || !camera || !controls || !domElement || !building?.group) {
      throw new TypeError('Flat501Experience requires the active IRIS scene, camera, controls, canvas and building.');
    }

    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    this.domElement = domElement;
    this.appElement = appElement || document.getElementById('app') || document.body;
    this.building = building;
    this.onBeforeOpen = onBeforeOpen;
    this.onAfterClose = onAfterClose;
    this.onActiveChange = onActiveChange;
    this.onToast = onToast;
    this.active = false;
    this.enabled = true;
    this.exploded = false;
    this.viewer = null;
    this.viewerLoading = false;
    this.viewerError = null;
    this.animationFrame = 0;
    this.pointerDown = null;
    this.savedParts = null;
    this.videoReady = false;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this._createBuildingTarget();
    this._createOverlay();
    this._bindEvents();
    this.updateMarker();
  }

  _createBuildingTarget() {
    // One conceptual fifth-floor bay, selected as the Flat 501 reference location.
    // The exterior itself is an approximate visualization, not a surveyed facade plan.
    const fifthFloorY = BUILDING.groundHeight + 4 * BUILDING.floorHeight + BUILDING.floorHeight * 0.5;
    const x = -20.45;
    const z = HALF_D + 0.52;
    this.targetAnchor = new THREE.Vector3(x, fifthFloorY + 0.16, z + 0.35);
    this.targetRoot = new THREE.Group();
    this.targetRoot.name = 'Flat 501 reference selection — fifth floor';
    this.targetRoot.position.set(x, fifthFloorY, z);

    const panelMaterial = new THREE.MeshBasicMaterial({
      color: 0xd3b07c,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
      side: THREE.DoubleSide,
      depthTest: true
    });
    this.targetPanel = new THREE.Mesh(new THREE.BoxGeometry(5.65, 2.5, 0.12), panelMaterial);
    this.targetPanel.name = 'Flat 501 selectable facade bay';
    this.targetPanel.renderOrder = 80;

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: 0xe7c995,
      transparent: true,
      opacity: 0.98,
      depthTest: true,
      linewidth: 1
    });
    this.targetOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(5.65, 2.5, 0.14)),
      edgeMaterial
    );
    this.targetOutline.name = 'Flat 501 highlight outline';
    this.targetOutline.renderOrder = 81;

    const hitMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.001,
      colorWrite: false,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    this.hitTarget = new THREE.Mesh(new THREE.BoxGeometry(5.9, 2.7, 0.9), hitMaterial);
    this.hitTarget.name = 'Flat 501 click target';

    this.targetRoot.add(this.targetPanel, this.targetOutline, this.hitTarget);
    this.scene.add(this.targetRoot);

    this.pin = document.createElement('button');
    this.pin.type = 'button';
    this.pin.className = 'flat501-pin';
    this.pin.innerHTML = '<span class="flat501-pin-dot" aria-hidden="true"></span><span><strong>FLAT 501</strong><small>FIFTH FLOOR · OPEN REFERENCE</small></span><span class="flat501-pin-arrow" aria-hidden="true">↗</span>';
    this.pin.setAttribute('aria-label', 'Open Flat 501 reference apartment on the fifth floor');
    this.pin.addEventListener('click', () => { void this.open(); });
    this.appElement.appendChild(this.pin);
    this.setEnabled(true);
  }

  _createOverlay() {
    this.shell = document.createElement('section');
    this.shell.className = 'flat501-overlay';
    this.shell.hidden = true;
    this.shell.setAttribute('role', 'dialog');
    this.shell.setAttribute('aria-label', 'Flat 501 reference interior experience');
    this.shell.setAttribute('aria-modal', 'true');
    this.shell.innerHTML = [
      '<header class="flat501-header">',
      '  <div class="flat501-title-lockup">',
      '    <span class="flat501-kicker">IRIS RESIDENCES · FIFTH FLOOR REFERENCE</span>',
      '    <h2>Flat 501 <span>Interior study</span></h2>',
      '  </div>',
      '  <div class="flat501-actions" role="group" aria-label="Flat 501 view controls">',
      '    <button type="button" class="flat501-action is-active" data-flat501-action="explode" aria-pressed="true">Exploded view</button>',
      '    <button type="button" class="flat501-action" data-flat501-action="cutaway" aria-pressed="false">Cutaway</button>',
      '    <button type="button" class="flat501-action" data-flat501-action="interior" aria-pressed="false">Interior</button>',
      '    <button type="button" class="flat501-action" data-flat501-action="plan" aria-pressed="false">Plan</button>',
      '    <button type="button" class="flat501-action flat501-video-button" data-flat501-action="video" aria-pressed="false">Watch video</button>',
      '    <button type="button" class="flat501-action flat501-close" data-flat501-action="close">Back to building</button>',
      '  </div>',
      '</header>',
      '<div class="flat501-viewport" aria-label="Interactive Flat 501 3D model"></div>',
      '<aside class="flat501-video-panel" hidden aria-label="Flat 501 reference walkthrough">',
      '  <div class="flat501-video-heading"><div><span class="flat501-kicker">SUPPLIED REFERENCE FOOTAGE</span><strong>Flat 501 walkthrough</strong></div><button type="button" class="flat501-video-close" data-flat501-action="video-close" aria-label="Close video">×</button></div>',
      '  <video class="flat501-video" controls playsinline preload="none"></video>',
      '  <p class="flat501-video-note">Original walkthrough supplied with the Flat 501 ZIP. Press play to load the video.</p>',
      '</aside>',
      '<div class="flat501-status" role="status" aria-live="polite">Exploded reference model · Drag to orbit · Scroll to zoom</div>',
      '<p class="flat501-disclaimer">Reference reconstruction from the supplied walkthrough. Dimensions and room geometry are provisional, not surveyed.</p>',
      '</section>'
    ].join('');
    document.body.appendChild(this.shell);

    this.viewerContainer = this.shell.querySelector('.flat501-viewport');
    this.statusElement = this.shell.querySelector('.flat501-status');
    this.videoPanel = this.shell.querySelector('.flat501-video-panel');
    this.videoElement = this.shell.querySelector('.flat501-video');
    this.videoButton = this.shell.querySelector('[data-flat501-action="video"]');
    this.videoElement.poster = POSTER_URL;
    this.videoElement.preload = 'none';

    this.shell.querySelectorAll('[data-flat501-action]').forEach((button) => {
      button.addEventListener('click', () => {
        void this._handleAction(button.dataset.flat501Action);
      });
    });
  }

  _bindEvents() {
    this._pointerDown = (event) => {
      if (!this.enabled || this.active || (event.button !== 0 && event.pointerType !== 'touch')) return;
      this.pointerDown = { x: event.clientX, y: event.clientY };
    };
    this._pointerUp = (event) => {
      if (!this.enabled || this.active || !this.pointerDown) return;
      const down = this.pointerDown;
      this.pointerDown = null;
      if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 7) return;
      if (this._hitFlat501(event)) {
        event.preventDefault();
        event.stopPropagation();
        void this.open();
      }
    };
    this._pointerCancel = () => { this.pointerDown = null; };
    this._pointerMove = (event) => {
      if (!this.enabled || this.active) return;
      this.domElement.style.cursor = this._hitFlat501(event) ? 'pointer' : '';
    };
    this._keyDown = (event) => {
      if (!this.active || event.key !== 'Escape') return;
      if (!this.videoPanel.hidden) {
        this._setVideoOpen(false);
      } else {
        this.close();
      }
    };
    this.domElement.addEventListener('pointerdown', this._pointerDown);
    this.domElement.addEventListener('pointerup', this._pointerUp);
    this.domElement.addEventListener('pointercancel', this._pointerCancel);
    this.domElement.addEventListener('pointermove', this._pointerMove, { passive: true });
    window.addEventListener('keydown', this._keyDown);
  }

  _hitFlat501(event) {
    if (!this.targetRoot.visible) return false;
    const rect = this.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return false;
    this.pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -(((event.clientY - rect.top) / rect.height) * 2 - 1)
    );
    this.scene.updateMatrixWorld(true);
    this.camera.updateMatrixWorld();
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObject(this.hitTarget, false).length > 0;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled) && !this.active;
    const visible = this.enabled;
    if (this.targetRoot) this.targetRoot.visible = visible;
    if (this.pin) this.pin.hidden = !visible;
    if (!visible && this.domElement) this.domElement.style.cursor = '';
    if (visible) this.updateMarker();
  }

  updateMarker() {
    if (!this.pin || !this.targetRoot || !this.enabled || this.active) return;
    const point = this.targetAnchor.clone().project(this.camera);
    const behind = point.z < -1 || point.z > 1;
    const rect = this.domElement.getBoundingClientRect();
    const appRect = this.appElement.getBoundingClientRect();
    const px = rect.left - appRect.left + (point.x * 0.5 + 0.5) * rect.width;
    const py = rect.top - appRect.top + (-point.y * 0.5 + 0.5) * rect.height;
    const onscreen = !behind && point.x > -1.12 && point.x < 1.12 && point.y > -1.12 && point.y < 1.12;
    this.pin.hidden = !onscreen;
    if (onscreen) {
      this.pin.style.left = px + 'px';
      this.pin.style.top = py + 'px';
    }
  }

  async open() {
    if (this.active || !this.enabled) return;
    this.active = true;
    this.setEnabled(false);
    this.onBeforeOpen();
    document.body.classList.add('is-flat501-active');
    this.shell.hidden = false;
    this.shell.classList.remove('is-video-open');
    this.videoPanel.hidden = true;
    this.onActiveChange(true);
    this.statusElement.textContent = 'Loading the supplied Flat 501 model…';

    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      await this._ensureViewer();
      if (!this.active || !this.viewer) return;
      this.viewer.visible = true;
      this.viewer.controls.enabled = true;
      this.viewer.setView('cutaway', { instant: true });
      this._setActiveAction('explode');
      this.setExploded(true, { immediate: true });
      this.statusElement.textContent = 'Exploded reference model · Drag to orbit · Scroll to zoom';
      this.shell.querySelector('[data-flat501-action="explode"]').textContent = 'Exploded view';
    } catch (error) {
      console.error('Flat 501 reference viewer could not be loaded.', error);
      this.statusElement.textContent = 'The Flat 501 model could not be loaded. Check the connection and try again.';
      this.onToast('Flat 501 model failed to load. The IRIS building remains available.');
    }
  }

  async _ensureViewer() {
    if (this.viewer || this.viewerLoading) {
      while (this.viewerLoading && !this.viewer) await new Promise((resolve) => setTimeout(resolve, 50));
      return;
    }
    this.viewerLoading = true;
    try {
      const [{ DigitalTwinViewer }, { PROPERTY }] = await Promise.all([
        import(FLAT_CDN + '/js/viewer3d.js'),
        import(FLAT_CDN + '/js/property-data.js')
      ]);
      if (!this.active) return;
      this.viewer = new DigitalTwinViewer(this.viewerContainer, {
        property: PROPERTY,
        initialView: 'cutaway',
        onError: (error) => {
          this.statusElement.textContent = '3D viewer warning: ' + (error?.message || 'graphics context issue');
        }
      });
      this._captureBaseTransforms();
    } finally {
      this.viewerLoading = false;
    }
  }

  _captureBaseTransforms() {
    if (!this.viewer) return;
    const groups = [
      this.viewer.floors,
      this.viewer.ceiling,
      this.viewer.furniture,
      this.viewer.fixtures,
      ...this.viewer.walls.children
    ];
    this.savedParts = new Map(groups.map((object) => [object, object.position.clone()]));
  }

  _explodedPositions(enabled) {
    const targets = new Map();
    const base = this.savedParts;
    if (!base) return targets;
    for (const [object, position] of base) targets.set(object, position.clone());
    if (!enabled || !this.viewer) return targets;

    const move = (object, x, y, z) => {
      if (!targets.has(object)) targets.set(object, object.position.clone());
      targets.get(object).add(new THREE.Vector3(x, y, z));
    };
    move(this.viewer.floors, 0, -0.22, 0);
    move(this.viewer.ceiling, 0, 2.55, 0);
    move(this.viewer.furniture, 0, 0.20, 0);
    move(this.viewer.fixtures, 0, 0.40, 0);

    for (const wallGroup of this.viewer.walls.children) {
      const id = wallGroup.userData?.wallId || '';
      if (id === 'south-exterior') move(wallGroup, 0, 0, 0.95);
      else if (id === 'north-exterior') move(wallGroup, 0, 0, -0.95);
      else if (id === 'east-exterior') move(wallGroup, 0.95, 0, 0);
      else if (id === 'west-exterior') move(wallGroup, -0.95, 0, 0);
      else {
        const wall = this.viewer.property.layout.walls.find((item) => item.id === id);
        if (!wall) continue;
        const dx = wall.to[0] - wall.from[0];
        const dz = wall.to[1] - wall.from[1];
        const cx = (wall.from[0] + wall.to[0]) * 0.5;
        const cz = (wall.from[1] + wall.to[1]) * 0.5;
        if (Math.abs(dx) >= Math.abs(dz)) move(wallGroup, 0, 0.22, cz >= 2.6 ? 0.48 : -0.48);
        else move(wallGroup, cx >= 4 ? 0.48 : -0.48, 0.22, 0);
      }
    }
    return targets;
  }

  setExploded(enabled, { immediate = false } = {}) {
    if (!this.viewer) return;
    const next = Boolean(enabled);
    this.exploded = next;
    if (next) {
      this.viewer.setView('perspective', { instant: true });
      this.viewer.walls.children.forEach((wall) => { wall.visible = true; });
      this.viewer.ceiling.visible = true;
      this.viewer.setLabelsVisible(false);
    } else {
      this.viewer.setView('cutaway', { instant: true });
      this.viewer.setLabelsVisible(true);
    }
    const targets = this._explodedPositions(next);
    this._animateParts(targets, immediate);
    this._setActiveAction(next ? 'explode' : 'cutaway');
  }

  _animateParts(targets, immediate = false) {
    if (!this.viewer || !this.savedParts) return;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
    const starts = new Map([...targets.keys()].map((object) => [object, object.position.clone()]));
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const duration = immediate || reduceMotion ? 0 : 680;
    const start = performance.now();

    const tick = (now) => {
      if (!this.viewer || !this.active) return;
      const t = duration ? clamp((now - start) / duration, 0, 1) : 1;
      const eased = easeOutCubic(t);
      for (const [object, target] of targets) {
        object.position.lerpVectors(starts.get(object), target, eased);
      }
      if (t < 1) this.animationFrame = requestAnimationFrame(tick);
      else this.animationFrame = 0;
    };
    this.animationFrame = requestAnimationFrame(tick);
  }

  async _handleAction(action) {
    if (action === 'close') { this.close(); return; }
    if (!this.viewer) return;
    if (action === 'explode') {
      this.setExploded(!this.exploded);
      this.shell.querySelector('[data-flat501-action="explode"]').textContent = this.exploded ? 'Reassemble' : 'Exploded view';
      this.statusElement.textContent = this.exploded
        ? 'Exploded reference model · Drag to orbit · Scroll to zoom'
        : 'Reassembled cutaway · Drag to orbit · Scroll to zoom';
      return;
    }
    if (action === 'cutaway' || action === 'interior' || action === 'plan') {
      if (this.exploded) this.setExploded(false);
      this.viewer.setView(action);
      this._setActiveAction(action);
      this.statusElement.textContent = action === 'plan'
        ? 'Plan view · Scroll to zoom'
        : action === 'interior'
          ? 'Interior view · Drag to look around'
          : 'Cutaway view · Drag to orbit · Scroll to zoom';
      this.shell.querySelector('[data-flat501-action="explode"]').textContent = 'Exploded view';
      return;
    }
    if (action === 'video') {
      this._setVideoOpen(this.videoPanel.hidden);
      return;
    }
    if (action === 'video-close') this._setVideoOpen(false);
  }

  _setActiveAction(action) {
    this.shell.querySelectorAll('[data-flat501-action]').forEach((button) => {
      const buttonAction = button.dataset.flat501Action;
      const selected = buttonAction === action || (action === 'explode' && buttonAction === 'explode');
      if (buttonAction === 'cutaway' || buttonAction === 'interior' || buttonAction === 'plan' || buttonAction === 'explode') {
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', String(selected));
      }
    });
  }

  _setVideoOpen(open) {
    const visible = Boolean(open);
    this.videoPanel.hidden = !visible;
    this.shell.classList.toggle('is-video-open', visible);
    this.videoButton.setAttribute('aria-pressed', String(visible));
    this.videoButton.classList.toggle('is-active', visible);
    if (visible) {
      if (!this.videoReady) {
        const source = document.createElement('source');
        source.src = VIDEO_URL;
        source.type = 'video/mp4';
        this.videoElement.appendChild(source);
        this.videoReady = true;
        this.videoElement.load();
      }
      this.statusElement.textContent = 'Reference walkthrough · User-initiated video playback';
    } else {
      this.videoElement.pause();
      this.statusElement.textContent = this.exploded
        ? 'Exploded reference model · Drag to orbit · Scroll to zoom'
        : 'Flat 501 reference view';
    }
  }

  close() {
    if (!this.active) return;
    this.active = false;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = 0;
    this._setVideoOpen(false);
    if (this.viewer) {
      this.viewer.visible = false;
      this.viewer.controls.enabled = false;
    }
    this.shell.hidden = true;
    this.pin.hidden = true;
    this.targetRoot.visible = false;
    document.body.classList.remove('is-flat501-active');
    this.onActiveChange(false);
    this.onAfterClose();
    this.setEnabled(true);
  }

  dispose() {
    this.close();
    this.domElement.removeEventListener('pointerdown', this._pointerDown);
    this.domElement.removeEventListener('pointerup', this._pointerUp);
    this.domElement.removeEventListener('pointercancel', this._pointerCancel);
    this.domElement.removeEventListener('pointermove', this._pointerMove);
    window.removeEventListener('keydown', this._keyDown);
    if (this.viewer) this.viewer.dispose();
    this.targetRoot.removeFromParent();
    this.targetRoot.traverse((object) => {
      object.geometry?.dispose?.();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => material?.dispose?.());
    });
    this.pin.remove();
    this.shell.remove();
  }
}
