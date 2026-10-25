/**
 * A visitor-led camera tour of the exterior. The tour only schedules existing
 * camera presets; it never owns the camera or competes with CameraDirector.
 * A direct user interaction should call stop() immediately.
 */
const STOPS = Object.freeze([
  { preset: 'isometric', label: 'Three-quarter overview', dwellMs: 1900 },
  { preset: 'front', label: 'Front elevation', dwellMs: 1450 },
  { preset: 'entrance', label: 'Entrance and podium', dwellMs: 1650 },
  { preset: 'right', label: 'Right-side elevation', dwellMs: 1400 },
  { preset: 'rear', label: 'Rear elevation', dwellMs: 1600 },
  { preset: 'left', label: 'Left-side elevation', dwellMs: 1400 },
  { preset: 'elevated', label: 'Landscape and site overview', dwellMs: 1850 },
  { preset: 'roof', label: 'Roof and crown inspection', dwellMs: 1900 },
  { preset: 'home', label: 'Returning to the opening view', dwellMs: 1100 }
]);

export class GuidedTour {
  constructor({ goToPreset, onStateChange = () => {}, onStep = () => {} }) {
    if (typeof goToPreset !== 'function') {
      throw new TypeError('GuidedTour requires a goToPreset callback.');
    }
    this.goToPreset = goToPreset;
    this.onStateChange = onStateChange;
    this.onStep = onStep;
    this.active = false;
    this.index = -1;
    this.elapsed = 0;
    this.waitingForTransition = false;
    this.current = null;
  }

  start() {
    if (this.active) this.stop({ reason: 'restarted', silent: true });
    this.active = true;
    this.index = -1;
    this.elapsed = 0;
    this.waitingForTransition = false;
    this._advance();
  }

  _advance() {
    if (!this.active) return;
    this.index += 1;

    if (this.index >= STOPS.length) {
      this.stop({ completed: true, reason: 'completed' });
      return;
    }

    this.current = STOPS[this.index];
    this.elapsed = 0;
    this.waitingForTransition = true;
    this.onStateChange({
      active: true,
      label: this.current.label,
      step: this.index + 1,
      total: STOPS.length
    });
    this.onStep(this.current, this.index + 1, STOPS.length);
    this.goToPreset(this.current.preset);
  }

  update(deltaSeconds, isTransitioning) {
    if (!this.active) return;

    // Wait until CameraDirector has finished its smooth move before starting
    // the dwell timer. This also handles a preset that requires no transition.
    if (this.waitingForTransition) {
      if (isTransitioning) return;
      this.waitingForTransition = false;
      this.elapsed = 0;
      return;
    }

    if (isTransitioning) {
      this.waitingForTransition = true;
      return;
    }

    this.elapsed += Math.max(0, deltaSeconds) * 1000;
    if (this.elapsed >= this.current.dwellMs) this._advance();
  }

  stop({ completed = false, reason = 'manual', silent = false } = {}) {
    if (!this.active) return;
    this.active = false;
    this.waitingForTransition = false;
    this.elapsed = 0;
    this.current = null;
    if (!silent) {
      this.onStateChange({ active: false, completed, reason, step: 0, total: STOPS.length });
    }
  }

  get stopCount() {
    return STOPS.length;
  }
}
