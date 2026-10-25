/**
 * Adaptive render resolution for a wide range of desktop and mobile GPUs.
 *
 * The scene is deliberately detailed, so the safe default is to keep the CSS
 * layout crisp while allowing the WebGL back buffer to scale down when frame
 * time is poor. `?quality=high` pins the original resolution for evidence
 * captures; `?quality=low` starts from a conservative level.
 */

const PIXEL_BUDGETS = Object.freeze([
  2400000,
  1900000,
  1500000,
  1150000,
  880000,
  680000,
  550000
]);

const MIN_PIXEL_RATIO = 0.55;
const MAX_PIXEL_RATIO = 1.75;

export class QualityController {
  constructor(renderer, { onChange = () => {} } = {}) {
    this.renderer = renderer;
    this.onChange = onChange;

    const requested = new URLSearchParams(window.location.search).get('quality');
    this.mode = requested === 'high' || requested === 'low' ? requested : 'auto';
    this.auto = this.mode === 'auto';
    this.maxDpr = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    this.level = this.mode === 'low' ? 4 : 0;
    this.pixelRatio = 1;
    this._sampleElapsed = 0;
    this._sampleFrames = 0;
    this._fps = 0;
    this._cooldownWindows = 0;
    this._stableHighWindows = 0;
    this._lastChange = 'startup';

    this.resize();
  }

  get fps() {
    return this._fps;
  }

  get state() {
    return {
      mode: this.mode,
      automatic: this.auto,
      level: this.level,
      levels: PIXEL_BUDGETS.length,
      pixelRatio: Number(this.pixelRatio.toFixed(3)),
      fps: Number(this._fps.toFixed(1)),
      lastChange: this._lastChange
    };
  }

  _targetPixelRatio() {
    if (this.mode === 'high') return this.maxDpr;
    if (this.mode === 'low') {
      return Math.max(MIN_PIXEL_RATIO, Math.min(this.maxDpr, 0.8));
    }
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    const budgetRatio = Math.sqrt(PIXEL_BUDGETS[this.level] / (width * height));
    return Math.max(MIN_PIXEL_RATIO, Math.min(this.maxDpr, budgetRatio));
  }

  resize() {
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    const ratio = this._targetPixelRatio();
    const changed = Math.abs(ratio - this.pixelRatio) > 0.001;

    this.pixelRatio = ratio;
    if (changed) {
      this.renderer.setPixelRatio(ratio);
    }
    this.renderer.setSize(width, height, false);

    if (changed) {
      this.onChange(this.state);
    }
  }

  /**
   * Samples raw frame time. Long pauses (tab switches, shader compile) are
   * ignored so they cannot trigger a quality change. Decisions are made in
   * 1.6-second windows to avoid resolution thrashing.
   */
  sample(dt, active = true) {
    if (!this.auto || !active || document.hidden || dt <= 0 || dt > 0.25) {
      this._sampleFrames = 0;
      this._sampleElapsed = 0;
      return;
    }

    this._sampleFrames += 1;
    this._sampleElapsed += dt;
    if (this._sampleElapsed < 1.6) return;

    this._fps = this._sampleFrames / this._sampleElapsed;
    this._sampleFrames = 0;
    this._sampleElapsed = 0;

    if (this._cooldownWindows > 0) {
      this._cooldownWindows -= 1;
      return;
    }

    if (this._fps < 22 && this.level < PIXEL_BUDGETS.length - 1) {
      this.level = Math.min(PIXEL_BUDGETS.length - 1, this.level + 2);
      this._stableHighWindows = 0;
      this._lastChange = 'reduce (severe)';
      this._cooldownWindows = 1;
      this.resize();
      return;
    }

    if (this._fps < 30 && this.level < PIXEL_BUDGETS.length - 1) {
      this.level += 1;
      this._stableHighWindows = 0;
      this._lastChange = 'reduce';
      this._cooldownWindows = 1;
      this.resize();
      return;
    }

    if (this._fps > 50 && this.level > 0) {
      this._stableHighWindows += 1;
      if (this._stableHighWindows >= 5) {
        this.level -= 1;
        this._stableHighWindows = 0;
        this._lastChange = 'restore';
        this._cooldownWindows = 2;
        this.resize();
      }
      return;
    }

    this._stableHighWindows = 0;
  }
}
