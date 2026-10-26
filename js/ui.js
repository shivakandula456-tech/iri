import { BUILDING, HALF_D, INTRO_DURATION_MS } from './config.js';

const ORBIT_HINT_DESKTOP = 'Drag to orbit · Scroll to zoom · Right-drag to pan';
const ORBIT_HINT_TOUCH = 'Drag to orbit · Pinch to zoom · Two fingers to pan';
const FREE_HINT_DESKTOP = 'Drag to look · WASD move · Q / E rise & fall · Esc to exit';
const FREE_HINT_TOUCH = 'Drag to look · Pad to move · Hold ▲ / ▼ to rise & fall';

function byId(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing required interface element #${id}`);
  return element;
}

const FOCUSABLE = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

export function createUI({
  presets,
  onPreset = () => {},
  onMode = () => {},
  onReplayIntro = () => {},
  onGuidedTourToggle = () => {},
  onGuidedPauseToggle = () => {},
  onGuidedNext = () => {},
  onGuidedSkip = () => {},
  onInspectToggle = () => {},
  onBlueprintToggle = () => {},
  onExplorerToggle = () => {},
  onExplorerClose = () => {},
  onExplorerFloor = () => {},
  onExplorerMode = () => {},
  onExplorerCutDepth = () => {},
  onExplorerEnter = () => {},
  onExplorerReturnFloor = () => {},
  onExplorerReassemble = () => {},
  onExplorerRotate = () => {},
  onExplorerRoom = () => {},
  onExplorerWalkDirection = () => {},
  onClearInspection = () => {},
  onSkipIntro = () => {},
  onSheetOpen = () => {},
  onSheetClose = () => {}
}) {
  const elements = {
    canvas: byId('scene'),
    loading: byId('loading'),
    loadingBar: byId('loadingBar'),
    loadingPercent: byId('loadingPercent'),
    loadingStage: byId('loadingStage'),
    fatal: byId('fatal'),
    fatalMessage: byId('fatalMessage'),
    fatalDetail: byId('fatalDetail'),
    fatalReload: byId('fatalReload'),
    modeOrbit: byId('modeOrbit'),
    modeFree: byId('modeFree'),
    presetRail: byId('presetRail'),
    hintText: byId('hintText'),
    replayIntro: byId('replayIntro'),
    guidedTourButton: byId('guidedTourButton'),
    guidedTourLabel: byId('guidedTourLabel'),
    directorPanel: byId('directorPanel'),
    tourStepTitle: byId('tourStepTitle'),
    tourStepCount: byId('tourStepCount'),
    tourProgress: byId('tourProgress'),
    tourPauseButton: byId('tourPauseButton'),
    tourPauseLabel: byId('tourPauseLabel'),
    tourNextButton: byId('tourNextButton'),
    tourSkipButton: byId('tourSkipButton'),
    blueprintToggle: byId('blueprintToggle'),
    blueprintToggleLabel: byId('blueprintToggleLabel'),
    exploreFloorsButton: byId('exploreFloorsButton'),
    exploreFloorsLabel: byId('exploreFloorsLabel'),
    buildingExplorerPanel: byId('buildingExplorerPanel'),
    explorerCloseButton: byId('explorerCloseButton'),
    explorerSelectedFloor: byId('explorerSelectedFloor'),
    explorerModeLabel: byId('explorerModeLabel'),
    explorerFloorRail: byId('explorerFloorRail'),
    explorerExteriorMode: byId('explorerExteriorMode'),
    explorerVerticalCutawayMode: byId('explorerVerticalCutawayMode'),
    explorerCutawayMode: byId('explorerCutawayMode'),
    explorerXrayMode: byId('explorerXrayMode'),
    explorerFloorMode: byId('explorerFloorMode'),
    explorerCutControl: byId('explorerCutControl'),
    explorerCutDepth: byId('explorerCutDepth'),
    explorerCutDepthLabel: byId('explorerCutDepthLabel'),
    explorerExplodedMode: byId('explorerExplodedMode'),
    explorerEnterApartment: byId('explorerEnterApartment'),
    explorerRotateFloor: byId('explorerRotateFloor'),
    explorerReassemble: byId('explorerReassemble'),
    explorerReturnToFloor: byId('explorerReturnToFloor'),
    explorerReturnExterior: byId('explorerReturnExterior'),
    explorerRoomSection: byId('explorerRoomSection'),
    explorerPlanFloor: byId('explorerPlanFloor'),
    explorerPlan: byId('explorerPlan'),
    explorerRoomList: byId('explorerRoomList'),
    explorerRoomTitle: byId('explorerRoomTitle'),
    explorerRoomDescription: byId('explorerRoomDescription'),
    explorerAccuracy: byId('explorerAccuracy'),
    explorerWalkControls: byId('explorerWalkControls'),
    explorerModelNotice: byId('explorerModelNotice'),
    facadeInspectButton: byId('facadeInspectButton'),
    facadeInspectLabel: byId('facadeInspectLabel'),
    facadeInfo: byId('facadeInfo'),
    facadeInfoKicker: byId('facadeInfoKicker'),
    facadeInfoTitle: byId('facadeInfoTitle'),
    facadeInfoDescription: byId('facadeInfoDescription'),
    facadeInfoSide: byId('facadeInfoSide'),
    facadeInfoFloor: byId('facadeInfoFloor'),
    facadeInfoConfidence: byId('facadeInfoConfidence'),
    facadeInfoClose: byId('facadeInfoClose'),
    aboutButton: byId('aboutButton'),
    fullscreenButton: byId('fullscreenButton'),
    fullscreenLabel: byId('fullscreenLabel'),
    freeHud: byId('freeHud'),
    lookHintText: byId('lookHintText'),
    joystick: byId('joystick'),
    joystickKnob: byId('joystickKnob'),
    freeUp: byId('freeUp'),
    freeDown: byId('freeDown'),
    lockCursor: byId('lockCursor'),
    lockCursorLabel: byId('lockCursorLabel'),
    intro: byId('intro'),
    skipIntro: byId('skipIntro'),
    introProgress: byId('introProgress'),
    aboutPanel: byId('aboutPanel'),
    aboutClose: byId('aboutClose'),
    toast: byId('toast'),
    status: byId('sceneStatus')
  };

  const touch = window.matchMedia('(pointer: coarse)').matches;
  const presetButtons = new Map();
  const explorerFloorButtons = new Map();
  const explorerRoomButtons = new Map();
  const explorerPlanButtons = new Map();
  let explorerRoomsBuilt = false;
  let currentMode = 'orbit';
  let sheetOpen = false;
  let lastFocused = null;
  let toastTimer = 0;
  let introTimer = 0;
  let loadingTimer = 0;

  for (const [name, preset] of Object.entries(presets)) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preset-button';
    button.dataset.preset = name;
    button.setAttribute('aria-pressed', 'false');
    button.setAttribute('title', `${preset.description} — press ${preset.index.slice(1)}`);
    button.innerHTML = `<span class="preset-index">${preset.index}</span><span class="preset-label">${preset.label}</span>`;
    button.addEventListener('click', () => onPreset(name));
    elements.presetRail.appendChild(button);
    presetButtons.set(name, button);
  }

  // Floor numbers are view controls, not claims about official storey naming.
  for (let floor = BUILDING.levels; floor >= 1; floor -= 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'explorer-floor-button';
    button.textContent = String(floor);
    button.dataset.floor = String(floor);
    button.setAttribute('aria-label', `Select modeled floor ${floor}`);
    button.setAttribute('aria-pressed', 'false');
    button.addEventListener('click', () => onExplorerFloor(floor));
    elements.explorerFloorRail.appendChild(button);
    explorerFloorButtons.set(floor, button);
  }

  function buildRoomControls(rooms = []) {
    if (explorerRoomsBuilt || !Array.isArray(rooms) || !rooms.length) return;
    for (const room of rooms) {
      const planButton = document.createElement('button');
      planButton.type = 'button';
      planButton.className = `explorer-plan-room plan-room-${room.id}`;
      planButton.textContent = room.shortLabel || room.label;
      planButton.dataset.roomId = room.id;
      planButton.setAttribute('aria-label', `Select ${room.label} on the floor plan`);
      planButton.setAttribute('aria-pressed', 'false');
      planButton.addEventListener('click', () => onExplorerRoom(room.id));
      elements.explorerPlan.appendChild(planButton);
      explorerPlanButtons.set(room.id, planButton);

      const listButton = document.createElement('button');
      listButton.type = 'button';
      listButton.className = 'explorer-room-button';
      listButton.textContent = room.label;
      listButton.dataset.roomId = room.id;
      listButton.setAttribute('aria-pressed', 'false');
      listButton.addEventListener('click', () => onExplorerRoom(room.id));
      elements.explorerRoomList.appendChild(listButton);
      explorerRoomButtons.set(room.id, listButton);
    }
    explorerRoomsBuilt = true;
  }

  function setMode(mode) {
    currentMode = mode === 'free' ? 'free' : 'orbit';
    const orbit = currentMode === 'orbit';
    elements.modeOrbit.classList.toggle('is-active', orbit);
    elements.modeFree.classList.toggle('is-active', !orbit);
    elements.modeOrbit.setAttribute('aria-pressed', String(orbit));
    elements.modeFree.setAttribute('aria-pressed', String(!orbit));
    elements.freeHud.hidden = orbit;
    elements.hintText.textContent = orbit
      ? (touch ? ORBIT_HINT_TOUCH : ORBIT_HINT_DESKTOP)
      : (touch ? FREE_HINT_TOUCH : FREE_HINT_DESKTOP);
    elements.lookHintText.textContent = touch ? FREE_HINT_TOUCH : FREE_HINT_DESKTOP;
    document.body.dataset.mode = currentMode;
    announce(orbit ? 'Orbit mode' : 'Free-look mode. Drag to look; use WASD to move.');
  }

  function setPresetActive(name) {
    for (const [key, button] of presetButtons) {
      const active = key === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    }
  }

  function setPointerLocked(locked) {
    elements.lockCursor.classList.toggle('is-active', locked);
    elements.lockCursorLabel.textContent = locked ? 'Unlock cursor' : 'Lock cursor';
    elements.lockCursor.setAttribute('aria-pressed', String(locked));
    if (locked) announce('Pointer locked. Press Escape to release the cursor.');
  }

  function setLoading(progress, stage) {
    const value = Math.max(0, Math.min(1, progress));
    elements.loadingBar.style.width = `${(value * 100).toFixed(1)}%`;
    elements.loadingPercent.textContent = `${Math.round(value * 100)}%`;
    if (stage) elements.loadingStage.textContent = stage;
  }

  function hideLoading() {
    window.clearTimeout(loadingTimer);
    elements.loading.classList.add('is-done');
    document.body.classList.remove('is-loading');
    loadingTimer = window.setTimeout(() => {
      elements.loading.hidden = true;
    }, 760);
  }

  function showFatal(message, detail = '') {
    window.clearTimeout(loadingTimer);
    document.body.classList.remove('is-loading');
    elements.loading.hidden = true;
    elements.loading.setAttribute('aria-busy', 'false');
    elements.fatal.hidden = false;
    elements.fatalMessage.textContent = message;
    elements.fatalDetail.textContent = detail;
    elements.fatalDetail.hidden = !detail;
    elements.fatalReload.focus?.();
  }

  function announce(message) {
    elements.status.textContent = '';
    window.setTimeout(() => {
      elements.status.textContent = message;
    }, 20);
  }

  function showToast(message, duration = 2600) {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => {
      elements.toast.classList.remove('is-visible');
    }, duration);
  }

  function showIntro({ reducedMotion = false, duration = INTRO_DURATION_MS } = {}) {
    window.clearTimeout(introTimer);
    elements.intro.hidden = false;
    elements.intro.setAttribute('aria-hidden', 'false');
    elements.intro.style.setProperty('--intro-duration', `${duration}ms`);
    elements.skipIntro.tabIndex = 0;
    // Restart the CSS progress animation on every replay.
    elements.intro.classList.remove('is-visible', 'is-running', 'is-reduced', 'is-motion');
    void elements.intro.offsetWidth;
    elements.intro.classList.add('is-visible', 'is-running', reducedMotion ? 'is-reduced' : 'is-motion');
    document.body.classList.add('intro-active');
  }

  function hideIntro() {
    window.clearTimeout(introTimer);
    elements.intro.classList.remove('is-visible');
    elements.intro.classList.add('is-leaving');
    elements.intro.setAttribute('aria-hidden', 'true');
    elements.skipIntro.tabIndex = -1;
    document.body.classList.remove('intro-active');
    introTimer = window.setTimeout(() => {
      elements.intro.hidden = true;
      elements.intro.classList.remove('is-leaving', 'is-running', 'is-reduced', 'is-motion');
    }, 520);
  }

  function openSheet() {
    if (sheetOpen) return;
    sheetOpen = true;
    lastFocused = document.activeElement;
    onSheetOpen();
    elements.aboutPanel.hidden = false;
    elements.aboutPanel.setAttribute('aria-hidden', 'false');
    elements.aboutButton.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => {
      elements.aboutPanel.classList.add('is-open');
      elements.aboutClose.focus();
    });
    document.addEventListener('keydown', sheetKeydown, true);
    announce('About this model opened.');
  }

  function closeSheet() {
    if (!sheetOpen) return;
    sheetOpen = false;
    elements.aboutPanel.classList.remove('is-open');
    elements.aboutPanel.setAttribute('aria-hidden', 'true');
    elements.aboutButton.setAttribute('aria-expanded', 'false');
    document.removeEventListener('keydown', sheetKeydown, true);
    window.setTimeout(() => {
      if (!sheetOpen) elements.aboutPanel.hidden = true;
    }, 340);
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    onSheetClose();
  }

  function sheetKeydown(event) {
    if (!sheetOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeSheet();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = Array.from(elements.aboutPanel.querySelectorAll(FOCUSABLE)).filter(
      (element) => !element.disabled && element.offsetParent !== null
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function toggleFullscreen() {
    const root = document.documentElement;
    const active = document.fullscreenElement;
    if (active) {
      document.exitFullscreen?.();
      return;
    }
    const request = root.requestFullscreen || root.webkitRequestFullscreen;
    if (!request) {
      showToast('Fullscreen is not available in this browser.');
      return;
    }
    Promise.resolve(request.call(root)).catch(() => {
      showToast('Fullscreen was declined by the browser.');
    });
  }

  function syncFullscreen() {
    const active = Boolean(document.fullscreenElement);
    elements.fullscreenLabel.textContent = active ? 'Exit fullscreen' : 'Fullscreen';
    elements.fullscreenButton.setAttribute('aria-pressed', String(active));
  }

  elements.modeOrbit.addEventListener('click', () => onMode('orbit'));
  elements.modeFree.addEventListener('click', () => onMode('free'));
  elements.replayIntro.addEventListener('click', () => onReplayIntro());
  elements.guidedTourButton.addEventListener('click', () => onGuidedTourToggle());
  elements.tourPauseButton.addEventListener('click', () => onGuidedPauseToggle());
  elements.tourNextButton.addEventListener('click', () => onGuidedNext());
  elements.tourSkipButton.addEventListener('click', () => onGuidedSkip());
  elements.blueprintToggle.addEventListener('click', () => onBlueprintToggle());
  elements.exploreFloorsButton.addEventListener('click', () => onExplorerToggle());
  elements.explorerCloseButton.addEventListener('click', () => onExplorerClose());
  elements.explorerReturnExterior.addEventListener('click', () => onExplorerClose());
  elements.explorerExteriorMode.addEventListener('click', () => onExplorerMode('exterior'));
  elements.explorerVerticalCutawayMode.addEventListener('click', () => onExplorerMode('vertical'));
  elements.explorerCutawayMode.addEventListener('click', () => onExplorerMode('cutaway'));
  elements.explorerXrayMode.addEventListener('click', () => onExplorerMode('xray'));
  elements.explorerCutDepth.addEventListener('input', () => onExplorerCutDepth(Number(elements.explorerCutDepth.value)));
  elements.explorerFloorMode.addEventListener('click', () => onExplorerMode('floor'));
  elements.explorerExplodedMode.addEventListener('click', () => onExplorerMode('exploded'));
  elements.explorerEnterApartment.addEventListener('click', () => onExplorerEnter());
  elements.explorerReturnToFloor.addEventListener('click', () => onExplorerReturnFloor());
  elements.explorerReassemble.addEventListener('click', () => onExplorerReassemble());
  elements.explorerRotateFloor.addEventListener('click', () => onExplorerRotate());
  elements.explorerWalkControls.querySelectorAll('[data-walk]').forEach((button) => {
    const direction = button.dataset.walk;
    const release = () => onExplorerWalkDirection(direction, false);
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      try { button.setPointerCapture(event.pointerId); } catch { /* optional */ }
      onExplorerWalkDirection(direction, true);
    });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  });
  elements.facadeInspectButton.addEventListener('click', () => onInspectToggle());
  elements.facadeInfoClose.addEventListener('click', () => onClearInspection());
  elements.aboutButton.addEventListener('click', () => openSheet());
  elements.aboutClose.addEventListener('click', () => closeSheet());
  elements.aboutPanel.querySelector('[data-close-sheet]')?.addEventListener('click', () => closeSheet());
  elements.skipIntro.addEventListener('click', (event) => {
    event.stopPropagation();
    onSkipIntro();
  });
  elements.fullscreenButton.addEventListener('click', toggleFullscreen);
  elements.fatalReload.addEventListener('click', () => window.location.reload());
  document.addEventListener('fullscreenchange', syncFullscreen);

  if (!document.fullscreenEnabled && !document.webkitFullscreenEnabled) {
    elements.fullscreenButton.hidden = true;
  }

  setMode('orbit');
  syncFullscreen();
  elements.intro.hidden = true;
  elements.intro.setAttribute('aria-hidden', 'true');
  document.body.classList.add('is-loading');

  return {
    elements,
    mobileControls: {
      joystick: elements.joystick,
      knob: elements.joystickKnob,
      upButton: elements.freeUp,
      downButton: elements.freeDown,
      lockButton: elements.lockCursor
    },
    setMode,
    setPresetActive,
    setGuidedTourState(state = {}) {
      const active = Boolean(state.active);
      const paused = Boolean(state.paused);
      elements.guidedTourButton.setAttribute('aria-pressed', String(active));
      elements.guidedTourButton.classList.toggle('is-tour-active', active);
      elements.guidedTourLabel.textContent = active
        ? `Tour ${state.step}/${state.total}`
        : 'Guided tour';
      elements.guidedTourButton.title = active
        ? `${state.label || 'Guided tour'} — click to stop`
        : 'Play the guided exterior tour';
      elements.directorPanel.hidden = !active;
      if (active) {
        elements.tourStepTitle.textContent = state.label || 'Guided exterior tour';
        elements.tourStepCount.textContent = `${String(state.step || 1).padStart(2, '0')} / ${String(state.total || 9).padStart(2, '0')}`;
        elements.tourProgress.style.width = `${Math.max(0, Math.min(1, (state.step || 1) / (state.total || 9))) * 100}%`;
      }
      elements.tourPauseButton.setAttribute('aria-pressed', String(paused));
      elements.tourPauseLabel.textContent = paused ? 'Resume' : 'Pause';
      elements.tourPauseButton.title = paused ? 'Resume the guided tour' : 'Pause tour progression';
    },
    setExplorerState(state = {}) {
      buildRoomControls(state.rooms || []);
      const active = Boolean(state.active);
      const floor = Number(state.selectedFloor) || 1;
      const mode = state.mode || 'exterior';
      const modeLabels = {
        exterior: 'Exterior highlight', xray: 'X-ray facade', cutaway: 'Selected-floor cutaway',
        vertical: 'Vertical tower cutaway', exploded: 'Exploded tower',
        floor: 'Isolated floor', interior: 'Inside apartment'
      };
      elements.buildingExplorerPanel.hidden = !active;
      elements.exploreFloorsButton.setAttribute('aria-pressed', String(active));
      elements.exploreFloorsButton.classList.toggle('is-explorer-active', active);
      elements.exploreFloorsLabel.textContent = active ? 'IRIS Inside' : 'Explore floors';
      document.body.classList.toggle('is-building-explorer', active);
      elements.explorerSelectedFloor.textContent = `Floor ${floor}`;
      elements.explorerPlanFloor.textContent = `FLOOR ${floor}`;
      elements.explorerModeLabel.textContent = modeLabels[mode] || mode;
      for (const [number, button] of explorerFloorButtons) {
        const selected = number === floor;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', String(selected));
      }
      const modeButtons = [elements.explorerExteriorMode, elements.explorerVerticalCutawayMode, elements.explorerCutawayMode, elements.explorerXrayMode, elements.explorerFloorMode, elements.explorerExplodedMode];
      for (const button of modeButtons) {
        const selected = button.dataset.explorerMode === mode;
        button.classList.toggle('is-active', selected);
        button.setAttribute('aria-pressed', String(selected));
      }
      elements.explorerEnterApartment.textContent = state.walking ? 'Inside apartment' : 'Enter apartment';
      elements.explorerEnterApartment.disabled = mode === 'interior' && Boolean(state.walking);
      elements.explorerRotateFloor.setAttribute('aria-pressed', String(Boolean(state.rotateEnabled)));
      elements.explorerRotateFloor.classList.toggle('is-active', Boolean(state.rotateEnabled));
      elements.explorerRotateFloor.textContent = state.rotateEnabled ? 'Drag to rotate · On' : 'Rotate floor';
      elements.explorerRotateFloor.disabled = Boolean(state.walking) || !['floor', 'xray', 'cutaway', 'vertical', 'exploded'].includes(mode);
      elements.explorerReassemble.hidden = mode !== 'exploded';
      elements.explorerReturnToFloor.hidden = mode !== 'interior';
      elements.explorerCutControl.hidden = !['cutaway', 'vertical'].includes(mode);
      elements.explorerCutDepth.value = String(state.cutDepth ?? 6);
      elements.explorerCutDepthLabel.textContent = `${Number(state.cutDistanceFromFront ?? (HALF_D - Number(state.cutDepth ?? 6))).toFixed(1)} m from front`;
      elements.explorerRoomSection.hidden = !['xray', 'cutaway', 'vertical', 'floor', 'interior'].includes(mode);
      elements.explorerWalkControls.hidden = !Boolean(state.walking);
      elements.explorerModelNotice.textContent = state.proxyFloorsOnly
        ? 'This model has no floor-specific facade groups. Exploded view uses inferred floor datum proxies; the sample interior remains conceptual.'
        : 'The selected floor uses floor-aware exterior geometry. Apartment rooms are illustrative; no approved interior drawing is present in the repository.';
      elements.explorerAccuracy.textContent = 'Illustrative room concept · not an approved apartment plan';
      for (const [id, button] of explorerPlanButtons) {
        const selected = id === state.selectedRoom;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      }
      for (const [id, button] of explorerRoomButtons) {
        const selected = id === state.selectedRoom;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      }
      if (state.roomTitle) elements.explorerRoomTitle.textContent = state.roomTitle;
      if (state.roomDescription) elements.explorerRoomDescription.textContent = state.roomDescription;
    },
    setBlueprintState(active) {
      const enabled = Boolean(active);
      elements.blueprintToggle.setAttribute('aria-pressed', String(enabled));
      elements.blueprintToggle.classList.toggle('is-blueprint-active', enabled);
      elements.blueprintToggleLabel.textContent = enabled ? 'Reality' : 'Blueprint';
      elements.blueprintToggle.title = enabled
        ? 'Return to the fully shaded 3D exterior'
        : 'Reveal the building\'s architectural edge geometry';
    },
    setInspectionState(active) {
      const enabled = Boolean(active);
      elements.facadeInspectButton.setAttribute('aria-pressed', String(enabled));
      elements.facadeInspectButton.classList.toggle('is-inspection-active', enabled);
      elements.facadeInspectLabel.textContent = enabled ? 'Inspect on' : 'Inspect';
      elements.facadeInspectButton.title = enabled
        ? 'Click a building surface to inspect it; select again to stop'
        : 'Turn on facade inspection';
      if (!enabled) elements.facadeInfo.hidden = true;
    },
    showFacadeInfo(info) {
      if (!info) return;
      elements.facadeInfoKicker.textContent = info.confidence || 'CONCEPTUAL EXTERIOR';
      elements.facadeInfoTitle.textContent = info.title || 'Exterior feature';
      elements.facadeInfoDescription.textContent = info.description || '';
      elements.facadeInfoSide.textContent = info.side || 'Exterior';
      elements.facadeInfoFloor.textContent = info.floor || '';
      elements.facadeInfoConfidence.textContent = 'Conceptual / inferred geometry · not an approved architectural detail';
      elements.facadeInfo.hidden = false;
      announce(`${info.title || 'Exterior feature'} selected. ${info.side || ''}. ${info.floor || ''}.`);
    },
    clearFacadeInfo() {
      elements.facadeInfo.hidden = true;
    },
    setPointerLocked,
    setLoading,
    hideLoading,
    showFatal,
    showToast,
    showIntro,
    hideIntro,
    openSheet,
    closeSheet,
    isSheetOpen: () => sheetOpen,
    isTouch: touch,
    announce
  };
}
