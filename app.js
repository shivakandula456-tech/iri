import * as THREE from 'three';
import { OrbitControls } from './assets/vendor/OrbitControls.js';
import {
  CAMERA,
  CROWN_TOP,
  EXTERIOR_MODEL_URL,
  HALF_D,
  HALF_L,
  INTRO_DURATION_MS,
  ROOF_Y,
  SITE,
  SUN_DIRECTION
} from './js/config.js';
import { createMaterials } from './js/materials.js';
import { buildBuilding } from './js/building.js';
import { loadExteriorModel } from './js/model-loader.js';
import { buildSite } from './js/site.js';
import { createSky, addHorizonRidges } from './js/sky.js';
import { createUI } from './js/ui.js';
import { CameraDirector, PRESETS } from './js/camera-director.js';
import { FreeLookController } from './js/free-look.js';
import { QualityController } from './js/quality.js';
import { disposeSceneResources } from './js/utils.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()));
const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

let renderer;
let scene;
let camera;
let controls;
let director;
let freeLook;
let site;
let building;
let sky;
let horizon;
let materials;
let ui;
let quality;
let ready = false;
let mode = 'orbit';
let clock;
let disposed = false;
let motionPreference = prefersReducedMotion.matches;

function showFatal(message, error) {
  const detail = error
    ? (error.stack || error.message || String(error))
    : '';
  if (ui) ui.showFatal(message, detail);
  else if (window.__IRIS_EMERGENCY__) window.__IRIS_EMERGENCY__(message, detail);
}

function assertWebGLSupport() {
  const test = document.createElement('canvas');
  const gl = test.getContext('webgl2') || test.getContext('webgl');
  if (!gl) throw new Error('WebGL is unavailable or disabled in this browser.');
  // Release the probe context; some browsers cap the number of live contexts.
  gl.getExtension('WEBGL_lose_context')?.loseContext();
}

function createRenderer() {
  const canvas = document.getElementById('scene');
  if (!canvas) throw new Error('The scene canvas is missing.');
  const test = document.createElement('canvas');
  const gl = test.getContext('webgl2') || test.getContext('webgl');
  if (!gl) throw new Error('WebGL is unavailable or disabled in this browser.');

  const instance = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    depth: true,
    stencil: false,
    powerPreference: 'high-performance'
  });
  instance.setSize(window.innerWidth, window.innerHeight, false);
  instance.outputColorSpace = THREE.SRGBColorSpace;
  instance.toneMapping = THREE.ACESFilmicToneMapping;
  instance.toneMappingExposure = 1.12;
  instance.shadowMap.enabled = true;
  instance.shadowMap.type = THREE.PCFSoftShadowMap;
  // The sun, building and planting never move. Rendering the shadow atlas once
  // removes a full extra scene pass from every animation frame.
  instance.shadowMap.autoUpdate = false;
  instance.shadowMap.needsUpdate = true;
  instance.autoClear = true;
  return instance;
}

function setupScene() {
  scene = new THREE.Scene();
  scene.name = 'Iris Residences — exterior scene';
  scene.fog = new THREE.FogExp2(0xc9a78e, 0.00155);

  camera = new THREE.PerspectiveCamera(
    CAMERA.fov,
    window.innerWidth / window.innerHeight,
    CAMERA.near,
    CAMERA.far
  );
  camera.position.set(-24, 30, 106);
  camera.lookAt(0, 22, 0);

  controls = new OrbitControls(camera, renderer.domElement);
  clock = new THREE.Clock();
}

function addLighting() {
  const sunDirection = new THREE.Vector3(...SUN_DIRECTION).normalize();
  const sun = new THREE.DirectionalLight(0xffc393, 3.15);
  sun.name = 'Setting sun';
  sun.position.copy(sunDirection).multiplyScalar(210);
  sun.target.position.set(0, 16, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -140;
  sun.shadow.camera.right = 140;
  sun.shadow.camera.top = 140;
  sun.shadow.camera.bottom = -140;
  sun.shadow.camera.near = 18;
  sun.shadow.camera.far = 520;
  sun.shadow.bias = -0.00035;
  sun.shadow.normalBias = 0.1;
  sun.shadow.radius = 2.2;
  scene.add(sun);
  scene.add(sun.target);

  const hemisphere = new THREE.HemisphereLight(0xffd5b1, 0x334136, 1.02);
  hemisphere.name = 'Sky and lawn bounce';
  scene.add(hemisphere);

  const fill = new THREE.DirectionalLight(0x91b6cd, 0.52);
  fill.name = 'Cool fill';
  fill.position.set(100, 62, -120);
  fill.target.position.set(0, 20, 0);
  scene.add(fill);
  scene.add(fill.target);

  return { sun, hemisphere, fill };
}

function setupControllers() {
  const colliders = [
    ...building.colliders,
    ...site.colliders
  ];

  director = new CameraDirector({
    camera,
    controls,
    domElement: renderer.domElement,
    colliders,
    onPresetChange: (name) => {
      ui.setPresetActive(name);
    },
    onIntroStateChange: (playing) => {
      if (playing) {
        ui.showIntro({
          reducedMotion: motionPreference,
          duration: INTRO_DURATION_MS
        });
      } else {
        ui.hideIntro();
      }
    },
    onInteraction: () => {}
  });

  freeLook = new FreeLookController({
    camera,
    domElement: renderer.domElement,
    colliders,
    onStateChange: () => {},
    onPointerLockChange: (locked) => ui.setPointerLocked(locked)
  });
  freeLook.attachMobileControls(ui.mobileControls);

  director.jumpTo('home');
}

function setMode(nextMode) {
  if (!ready) return;
  const next = nextMode === 'free' ? 'free' : 'orbit';
  if (next === mode) return;

  if (next === 'free') {
    if (director.isIntroPlaying) director.stopIntro({ takeControl: true });
    if (director.isTransitioning) director.interrupt();
    controls.enabled = false;
    freeLook.enter();
    mode = 'free';
    ui.setMode('free');
    ui.setPresetActive(null);
    return;
  }

  if (freeLook.enabled) {
    const direction = freeLook.getDirection();
    freeLook.exit();
    director.resumeFromFreeLook(camera.position, direction);
  } else {
    controls.enabled = true;
  }
  mode = 'orbit';
  ui.setMode('orbit');
  ui.setPresetActive(director.currentPreset);
}

function goToPreset(name) {
  if (!ready) return;
  if (mode === 'free') setMode('orbit');
  if (director.isIntroPlaying) director.skipIntro();
  if (director.isTransitioning) director.interrupt();
  director.goTo(name);
}

function replayIntro() {
  if (!ready) return;
  if (mode === 'free') setMode('orbit');
  if (director.isTransitioning) director.interrupt();
  director.startIntro({ reducedMotion: motionPreference });
  director.update(0);
}

function skipIntro() {
  if (director && director.isIntroPlaying) director.skipIntro();
}

function onKeyDown(event) {
  if (!ready) return;
  if (ui.isSheetOpen()) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const target = event.target;
  if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;

  const presetKeys = {
    '1': 'front',
    '2': 'rear',
    '3': 'left',
    '4': 'right',
    '5': 'isometric',
    '6': 'elevated',
    '7': 'roof',
    '8': 'entrance',
    '9': 'home'
  };

  if (presetKeys[event.key]) {
    event.preventDefault();
    goToPreset(presetKeys[event.key]);
    return;
  }
  if (event.key === 'o' || event.key === 'O') {
    event.preventDefault();
    setMode('orbit');
    return;
  }
  if (event.key === 'f' || event.key === 'F') {
    event.preventDefault();
    setMode('free');
    return;
  }
  if (event.key === 'i' || event.key === 'I') {
    event.preventDefault();
    replayIntro();
    return;
  }
  if (event.key === 'Escape') {
    if (freeLook.pointerLocked) return;
    if (mode === 'free') {
      event.preventDefault();
      setMode('orbit');
    }
    return;
  }
  if (event.key === 'Home') {
    event.preventDefault();
    goToPreset('home');
  }
}

function bindEvents() {
  window.addEventListener('resize', () => {
    if (!renderer || !camera) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    quality?.resize();
  });

  window.addEventListener('keydown', onKeyDown);
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    if (ready) ui.showFatal('The graphics context was lost.', 'Reload the page to restart the exterior study.');
  });

  const motionListener = (event) => {
    motionPreference = event.matches;
  };
  if (prefersReducedMotion.addEventListener) {
    prefersReducedMotion.addEventListener('change', motionListener);
  } else {
    prefersReducedMotion.addListener?.(motionListener);
  }
}

function animate() {
  if (disposed) return;
  const rawDt = clock.getDelta();
  const dt = Math.min(rawDt, 0.05);
  quality?.sample(rawDt, !director.isIntroPlaying);
  if (mode === 'free' && freeLook.enabled) {
    freeLook.update(dt);
  } else {
    director.update(dt);
  }
  if (site) site.update(dt);
  renderer.render(scene, camera);
}

async function boot() {
  ui = createUI({
    presets: PRESETS,
    onPreset: (name) => goToPreset(name),
    onMode: (next) => setMode(next),
    onReplayIntro: () => replayIntro(),
    onSkipIntro: () => skipIntro(),
    onSheetOpen: () => {
      if (mode === 'free') setMode('orbit');
      if (director && director.isIntroPlaying) director.stopIntro({ takeControl: true });
      if (director && director.isTransitioning) director.interrupt();
    }
  });

  try {
    ui.setLoading(0.04, 'Checking the graphics context…');
    // Check synchronously before the first animation frame: if WebGL is
    // unavailable, some browsers also stop painting, so waiting for rAF would
    // leave the user on the loading screen until the watchdog fired.
    assertWebGLSupport();
    await nextFrame();
    renderer = createRenderer();
    ui.setLoading(0.12, 'Preparing the renderer…');
    await nextFrame();

    setupScene();
    quality = new QualityController(renderer);
    ui.setLoading(0.19, 'Weaving the sunset sky…');
    await nextFrame();

    sky = createSky(scene, renderer);
    horizon = addHorizonRidges(scene);
    const lighting = addLighting();
    ui.setLoading(0.28, 'Mixing materials and light…');
    await nextFrame();

    materials = createMaterials(renderer);
    ui.setLoading(0.38, EXTERIOR_MODEL_URL ? 'Loading the supplied architectural model…' : 'Raising the tower and crown…');
    await nextFrame();

    if (EXTERIOR_MODEL_URL) {
      building = await loadExteriorModel(EXTERIOR_MODEL_URL, (event) => {
        const fraction = event.lengthComputable && event.total > 0
          ? Math.min(1, event.loaded / event.total)
          : 0;
        ui.setLoading(0.38 + fraction * 0.18, 'Loading the supplied architectural model…');
      });
    } else {
      building = buildBuilding(materials);
    }
    scene.add(building.group);
    scene.userData.lighting = lighting;
    ui.setLoading(0.58, 'Planting the grounds and arrival court…');
    await nextFrame();

    site = buildSite(materials, { animateTraffic: !motionPreference });
    scene.add(site.group);
    ui.setLoading(0.74, 'Setting the cameras and controls…');
    await nextFrame();

    setupControllers();
    bindEvents();
    ui.setMode('orbit');
    ui.setPresetActive('home');
    ui.setLoading(0.86, 'Warming shaders…');
    await nextFrame();

    if (renderer.compile) {
      try {
        // Synchronous warm-up keeps the loading screen deterministic. Asynchronous
        // shader compilation can stall indefinitely on some headless/software GL
        // implementations, leaving the UI at 86%.
        renderer.compile(scene, camera);
      } catch (error) {
        console.warn('Shader warm-up was skipped:', error);
      }
    }
    ui.setLoading(0.96, 'Composing the first frame…');
    renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);

    ready = true;
    window.__IRIS_READY__ = true;
    ui.setLoading(1, 'Ready');
    await nextFrame();
    ui.hideLoading();

    director.startIntro({ reducedMotion: motionPreference });
    director.update(0);
    renderer.render(scene, camera);
    renderer.setAnimationLoop(animate);

    // Expose a diagnostic surface for automated checks and curious visitors.
    window.__IRIS_APP__ = {
      THREE,
      scene,
      camera,
      renderer,
      controls,
      director,
      freeLook,
      site,
      building,
      sky,
      horizon,
      materials,
      quality,
      presets: PRESETS,
      get mode() { return mode; },
      get ready() { return ready; },
      setMode,
      goToPreset,
      replayIntro,
      startIntro(options = {}) {
        if (mode === 'free') setMode('orbit');
        director.startIntro({ reducedMotion: Boolean(options.reducedMotion) });
        director.update(0);
      },
      skipIntro,
      setMotionPreference(value) {
        motionPreference = Boolean(value);
        if (site) site.traffic.group.visible = true;
      },
      getReducedMotion() {
        return motionPreference;
      },
      getStats() {
        return {
          building: building?.stats || null,
          site: site?.stats || null,
          drawCalls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          geometries: renderer.info.memory.geometries,
          textures: renderer.info.memory.textures,
          camera: {
            position: camera.position.toArray(),
            target: controls.target.toArray(),
            polar: controls.getPolarAngle?.(),
            distance: camera.position.distanceTo(controls.target)
          },
          mode,
          preset: director?.currentPreset || null,
          introPlaying: Boolean(director?.isIntroPlaying),
          freeLook: Boolean(freeLook?.enabled),
          pointerLocked: Boolean(freeLook?.pointerLocked),
          quality: quality?.state || null,
          renderSize: {
            width: renderer.domElement.width,
            height: renderer.domElement.height,
            pixelRatio: renderer.getPixelRatio()
          }
        };
      },
      diagnostics: {
        crownTop: CROWN_TOP,
        roofHeight: ROOF_Y,
        halfLength: HALF_L,
        halfDepth: HALF_D,
        site: SITE,
        introDuration: INTRO_DURATION_MS,
        presetNames: Object.keys(PRESETS),
        modelSource: EXTERIOR_MODEL_URL || 'procedural'
      }
    };
  } catch (error) {
    console.error('Iris Residences failed to initialise:', error);
    showFatal(
      'The 3D scene could not be created.',
      error
    );
  }
}

window.addEventListener('beforeunload', () => {
  disposed = true;
  if (renderer && scene) {
    try {
      disposeSceneResources(scene);
    } catch {
      // The page is closing; disposal failures are not actionable.
    }
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    boot();
  }, { once: true });
} else {
  boot();
}
