import { INTRO_DURATION_MS } from './config.js';

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
  onInspectToggle = () => {},
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
    elements.intro.classList.remove('is-visible', 'is-running');
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
      elements.intro.classList.remove('is-leaving', 'is-running');
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
      elements.guidedTourButton.setAttribute('aria-pressed', String(active));
      elements.guidedTourButton.classList.toggle('is-tour-active', active);
      elements.guidedTourLabel.textContent = active
        ? `Tour ${state.step}/${state.total}`
        : 'Guided tour';
      elements.guidedTourButton.title = active
        ? `${state.label || 'Guided tour'} — click to stop`
        : 'Play the guided exterior tour';
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
