import * as THREE from 'three';
import { CAMERA, CROWN_TOP, HALF_D, HALF_L, INTRO_DURATION_MS, NAV_BOUNDS } from './config.js';
import { clamp, resolveCameraCollision } from './utils.js';

/**
 * Camera presets are deliberately conservative, front-three-quarter views of a
 * building whose exact site geometry is unknown. Distances expand on narrow
 * screens so the full slab stays in frame.
 */
export const PRESETS = Object.freeze({
  front: {
    label: 'Front',
    index: '01',
    description: 'Entrance elevation',
    position: [0, 37, 150],
    target: [0, 25, 0]
  },
  rear: {
    label: 'Rear',
    index: '02',
    description: 'Rear elevation',
    position: [20, 37, -150],
    target: [0, 25, 0]
  },
  left: {
    label: 'Left',
    index: '03',
    description: 'West end',
    position: [-142, 35, 10],
    target: [0, 25, 0]
  },
  right: {
    label: 'Right',
    index: '04',
    description: 'East end',
    position: [142, 35, 10],
    target: [0, 25, 0]
  },
  isometric: {
    label: 'Isometric',
    index: '05',
    description: 'Three-quarter view',
    position: [86, 55, 105],
    target: [0, 23, 0]
  },
  elevated: {
    label: 'Elevated',
    index: '06',
    description: 'Site overview',
    position: [112, 86, 128],
    target: [0, 21, 0]
  },
  roof: {
    label: 'Roof',
    index: '07',
    description: 'Top-down roof inspection',
    position: [4, 130, 24],
    target: [0, 46, 0]
  },
  entrance: {
    label: 'Entrance',
    index: '08',
    description: 'Lobby close-up',
    position: [17.2, 5.4, 33],
    target: [17.2, 3.4, 10]
  },
  home: {
    label: 'Home',
    index: '09',
    description: 'Reset view',
    position: [-38, 38, 158],
    target: [0, 26, 0]
  }
});

const WIDE_PRESETS = new Set(['front', 'rear', 'home']);
const OBLIQUE_PRESETS = new Set(['isometric', 'elevated']);

function aspectFactor(name, aspect) {
  if (name === 'entrance') return aspect < 0.7 ? 1.12 : 1;
  if (name === 'roof') return aspect < 0.7 ? 1.22 : aspect < 1 ? 1.1 : 1;
  if (name === 'left' || name === 'right') {
    if (aspect < 0.7) return 1.35;
    if (aspect < 1) return 1.18;
    return 1;
  }
  if (WIDE_PRESETS.has(name)) {
    if (aspect < 0.6) return 1.96;
    if (aspect < 0.8) return 1.42;
    if (aspect < 1.05) return 1.2;
    if (aspect < 1.35) return 1.06;
    return 1;
  }
  if (OBLIQUE_PRESETS.has(name)) {
    if (aspect < 0.6) return 1.62;
    if (aspect < 0.8) return 1.32;
    if (aspect < 1.05) return 1.14;
    return 1;
  }
  return 1;
}

export function getPreset(name, aspect = 1.7) {
  const preset = PRESETS[name] || PRESETS.home;
  const target = new THREE.Vector3(...preset.target);
  const base = new THREE.Vector3(...preset.position);
  const factor = aspectFactor(name, aspect);
  const position = target.clone().add(base.clone().sub(target).multiplyScalar(factor));
  return {
    name: PRESETS[name] ? name : 'home',
    label: preset.label,
    index: preset.index,
    description: preset.description,
    position,
    target
  };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function insideExpandedTower(point) {
  return (
    Math.abs(point.x) < HALF_L + 6 &&
    Math.abs(point.z) < HALF_D + 6 &&
    point.y < CROWN_TOP + 3
  );
}

/**
 * Finds a stable OrbitControls target along the current gaze. Used whenever a
 * free-look or intro session hands control back to the orbit camera.
 */
export function findOrbitTarget(position, direction, colliders, maxDistance = 34) {
  const ray = new THREE.Ray(position.clone(), direction.clone().normalize());
  let nearest = Infinity;
  const hit = new THREE.Vector3();
  for (const box of colliders) {
    const intersection = ray.intersectBox(box, hit);
    if (!intersection) continue;
    const distance = position.distanceTo(intersection);
    if (distance > 0.5 && distance < nearest) nearest = distance;
  }
  const distance = Number.isFinite(nearest)
    ? clamp(nearest - 2.4, 4.5, maxDistance)
    : maxDistance;
  const target = position.clone().addScaledVector(ray.direction, distance);
  target.x = clamp(target.x, -NAV_BOUNDS.targetXZ, NAV_BOUNDS.targetXZ);
  target.y = clamp(target.y, 1.4, NAV_BOUNDS.targetY);
  target.z = clamp(target.z, -NAV_BOUNDS.targetXZ, NAV_BOUNDS.targetXZ);

  // OrbitControls cannot put its target above the camera because maxPolarAngle
  // sits just below the horizon. Left uncorrected, handing off while looking up
  // would clamp the pivot and visibly lift the camera. Keep the pivot at or
  // below eye level while preserving the current azimuth.
  const horizontal = Math.hypot(position.x - target.x, position.z - target.z);
  const highestPivot = position.y - horizontal * Math.cos(CAMERA.maxPolar) - 0.08;
  target.y = Math.min(target.y, Math.max(1.4, highestPivot));
  return target;
}

export class CameraDirector {
  constructor({
    camera,
    controls,
    domElement,
    colliders = [],
    onPresetChange = () => {},
    onIntroStateChange = () => {},
    onInteraction = () => {}
  }) {
    this.camera = camera;
    this.controls = controls;
    this.domElement = domElement;
    this.colliders = colliders;
    this.onPresetChange = onPresetChange;
    this.onIntroStateChange = onIntroStateChange;
    this.onInteraction = onInteraction;

    this.transition = null;
    this.intro = null;
    this._introTimer = 0;
    this._currentPreset = CAMERA.home;
    this._reducedMotion = false;

    this._configureControls();
    this._bindInterrupts();
  }

  _configureControls() {
    const controls = this.controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.panSpeed = 0.7;
    controls.rotateSpeed = 0.55;
    controls.zoomSpeed = 0.82;
    controls.zoomToCursor = false;
    controls.minDistance = CAMERA.minDistance;
    controls.maxDistance = CAMERA.maxDistance;
    controls.minPolarAngle = CAMERA.minPolar;
    controls.maxPolarAngle = CAMERA.maxPolar;
    controls.target.set(0, 22, 0);
    controls.enabled = true;
  }

  _bindInterrupts() {
    this._interrupt = () => this.interrupt();
    this.domElement.addEventListener('pointerdown', this._interrupt, { capture: true });
    this.domElement.addEventListener('wheel', this._interrupt, { capture: true, passive: true });
    this.controls.addEventListener('start', this._interrupt);
  }

  get currentPreset() {
    return this._currentPreset;
  }

  get isIntroPlaying() {
    return Boolean(this.intro);
  }

  get isTransitioning() {
    return Boolean(this.transition);
  }

  _aspect() {
    return this.camera.aspect || 1.7;
  }

  /**
   * OrbitControls keeps residual damping/pan/zoom deltas. Applying them with
   * damping disabled clears the deltas in one frame so a preset or handoff
   * cannot drift away from its target.
   */
  _clearOrbitMomentum() {
    const controls = this.controls;
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    controls.enableDamping = damping;
  }

  getPreset(name) {
    return getPreset(name, this._aspect());
  }

  jumpTo(name) {
    const preset = this.getPreset(name);
    this._clearOrbitMomentum();
    this.intro = null;
    this._clearIntroTimer();
    this.transition = null;
    this.camera.position.copy(preset.position);
    this.controls.target.copy(preset.target);
    this.controls.enabled = true;
    this.camera.lookAt(preset.target);
    this._currentPreset = preset.name;
    this.onPresetChange(preset.name);
    this._resolveCamera();
  }

  goTo(name, { duration = null, fromUser = false } = {}) {
    const preset = this.getPreset(name);
    if (fromUser) this.stopIntro({ takeControl: true, silent: true });
    this._clearOrbitMomentum();

    const fromPosition = this.camera.position.clone();
    const fromTarget = this.controls.target.clone();
    const distance = fromPosition.distanceTo(preset.position);
    const crossing = this._chordCrossesTower(fromPosition, preset.position);
    const control = fromPosition.clone().add(preset.position).multiplyScalar(0.5);
    control.y += Math.min(30, 9 + distance * 0.12);
    if (crossing) {
      control.set(0, Math.max(CROWN_TOP + 34, control.y), 0);
    }

    this.transition = {
      fromPosition,
      toPosition: preset.position.clone(),
      fromTarget,
      toTarget: preset.target.clone(),
      control,
      lastPosition: fromPosition.clone(),
      lastTarget: fromTarget.clone(),
      elapsed: 0,
      duration: duration || clamp(880 + distance * 4.2, 900, 1950)
    };
    this.intro = null;
    this._clearIntroTimer();
    this.controls.enabled = false;
    this._currentPreset = preset.name;
    this.onPresetChange(preset.name);
  }

  _chordCrossesTower(from, to) {
    for (let i = 1; i < 10; i += 1) {
      const point = from.clone().lerp(to, i / 10);
      if (insideExpandedTower(point)) return true;
    }
    return false;
  }

  startIntro({ reducedMotion = false } = {}) {
    this._clearOrbitMomentum();
    this.transition = null;
    this._reducedMotion = reducedMotion;
    this.controls.enabled = false;
    this._currentPreset = null;
    this.onPresetChange(null);
    this._clearIntroTimer();

    const home = this.getPreset('home');
    if (reducedMotion) {
      this.camera.position.copy(home.position);
      this.controls.target.copy(home.target);
      this.camera.lookAt(home.target);
      this.intro = { reducedMotion: true };
      this.onIntroStateChange(true);
      this._introTimer = window.setTimeout(() => {
        this._finishIntroNatural();
      }, 3400);
      return;
    }

    const multiplier = this._aspect() < 0.8 ? 1.15 : 1;
    const sideShift = this._aspect() < 0.8 ? 1.12 : 1;
    const points = [
      new THREE.Vector3(-124, 62, -92),
      new THREE.Vector3(-132 * sideShift, 42, 6),
      new THREE.Vector3(-94 * sideShift, 28, 82),
      home.position.clone()
    ];
    if (multiplier > 1) {
      for (const point of points.slice(0, 3)) {
        point.x *= 1.07;
        point.z *= 1.07;
      }
    }
    const targetPoints = [
      new THREE.Vector3(-4, 30, 6),
      new THREE.Vector3(0, 27, 0),
      new THREE.Vector3(4, 24, 0),
      home.target.clone()
    ];

    this.intro = {
      reducedMotion: false,
      elapsed: 0,
      duration: INTRO_DURATION_MS,
      path: new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.24),
      targets: targetPoints,
      startTarget: targetPoints[0].clone()
    };
    this.onIntroStateChange(true);
  }

  _clearIntroTimer() {
    if (this._introTimer) {
      window.clearTimeout(this._introTimer);
      this._introTimer = 0;
    }
  }

  _finishIntroNatural() {
    if (!this.intro) return;
    this._clearOrbitMomentum();
    const home = this.getPreset('home');
    this.intro = null;
    this._clearIntroTimer();
    this.camera.position.copy(home.position);
    this.controls.target.copy(home.target);
    this.controls.enabled = true;
    this.camera.lookAt(home.target);
    this._currentPreset = 'home';
    this.onPresetChange('home');
    this.onIntroStateChange(false);
  }

  skipIntro() {
    this._finishIntroNatural();
  }

  stopIntro({ takeControl = true, silent = false } = {}) {
    if (!this.intro) return;
    this._clearOrbitMomentum();
    this.intro = null;
    this._clearIntroTimer();
    if (takeControl) {
      const direction = new THREE.Vector3();
      this.camera.getWorldDirection(direction);
      this.controls.target.copy(findOrbitTarget(this.camera.position, direction, this.colliders));
      this.controls.enabled = true;
      this._currentPreset = null;
      this.onPresetChange(null);
    }
    if (!silent) this.onIntroStateChange(false);
  }

  interrupt() {
    if (this.intro) {
      this.stopIntro({ takeControl: true });
      this.onInteraction('intro');
      return;
    }
    if (this.transition) {
      this._clearOrbitMomentum();
      this.transition = null;
      this.controls.enabled = true;
      this._currentPreset = null;
      this.onPresetChange(null);
      this.onInteraction('transition');
    }
  }

  update(dt) {
    if (this.intro) {
      if (!this.intro.reducedMotion) this._updateIntro(dt);
      return;
    }

    if (this.transition) {
      this._updateTransition(dt);
      return;
    }

    if (this.controls.enabled) {
      this.controls.update();
      this._clampOrbit();
      this._resolveCamera();
    }
  }

  _updateIntro(dt) {
    const intro = this.intro;
    intro.elapsed += dt * 1000;
    const raw = clamp(intro.elapsed / intro.duration, 0, 1);
    const t = easeInOutCubic(raw);
    this.camera.position.copy(intro.path.getPointAt(t));

    // Piecewise target interpolation keeps the building framed as the camera arcs.
    const scaled = t * (intro.targets.length - 1);
    const index = Math.min(intro.targets.length - 2, Math.floor(scaled));
    const local = scaled - index;
    const target = intro.targets[index].clone().lerp(intro.targets[index + 1], local);
    this.controls.target.copy(target);
    this.camera.lookAt(target);

    if (raw >= 1) this._finishIntroNatural();
  }

  _updateTransition(dt) {
    const transition = this.transition;
    transition.elapsed += dt * 1000;
    const raw = clamp(transition.elapsed / transition.duration, 0, 1);
    const t = easeInOutCubic(raw);

    const inv = 1 - t;
    const position = new THREE.Vector3()
      .addScaledVector(transition.fromPosition, inv * inv)
      .addScaledVector(transition.control, 2 * inv * t)
      .addScaledVector(transition.toPosition, t * t);
    const target = transition.fromTarget.clone().lerp(transition.toTarget, t);

    this.camera.position.copy(position);
    this.controls.target.copy(target);
    this.camera.lookAt(target);
    transition.lastPosition.copy(position);
    transition.lastTarget.copy(target);

    if (raw >= 1) {
      this.camera.position.copy(transition.toPosition);
      this.controls.target.copy(transition.toTarget);
      this.camera.lookAt(transition.toTarget);
      this.transition = null;
      this.controls.enabled = true;
      this._resolveCamera();
    }
  }

  _clampOrbit() {
    const controls = this.controls;
    controls.target.x = clamp(controls.target.x, -NAV_BOUNDS.targetXZ, NAV_BOUNDS.targetXZ);
    controls.target.y = clamp(controls.target.y, 1.4, NAV_BOUNDS.targetY);
    controls.target.z = clamp(controls.target.z, -NAV_BOUNDS.targetXZ, NAV_BOUNDS.targetXZ);

    // These outer bounds allow the configured maximum orbit radius around the
    // most extreme permitted target, so OrbitControls never hits a second,
    // tighter limit after zooming or panning.
    this.camera.position.x = clamp(this.camera.position.x, -NAV_BOUNDS.cameraXZ, NAV_BOUNDS.cameraXZ);
    this.camera.position.y = clamp(this.camera.position.y, 1.1, NAV_BOUNDS.cameraY);
    this.camera.position.z = clamp(this.camera.position.z, -NAV_BOUNDS.cameraXZ, NAV_BOUNDS.cameraXZ);
  }

  _resolveCamera() {
    resolveCameraCollision(this.camera.position, this.colliders, 1.0);
    if (this.camera.position.y < 1.15) this.camera.position.y = 1.15;
  }

  /** Called when free-look hands control back to the orbit camera. */
  resumeFromFreeLook(position, direction) {
    this._clearOrbitMomentum();
    this.camera.position.copy(position);
    this.camera.fov = CAMERA.fov;
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(findOrbitTarget(position, direction, this.colliders));
    this.controls.enabled = true;
    this._currentPreset = null;
    this.onPresetChange(null);
  }

  dispose() {
    this.domElement.removeEventListener('pointerdown', this._interrupt, { capture: true });
    this.domElement.removeEventListener('wheel', this._interrupt, { capture: true });
    this.controls.removeEventListener('start', this._interrupt);
    this._clearIntroTimer();
  }
}
