import * as THREE from 'three';
import { CAMERA, NAV_BOUNDS } from './config.js';
import { clamp, damp, resolveCameraCollision } from './utils.js';

const MOVE_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
  'KeyQ', 'KeyE', 'ShiftLeft', 'ShiftRight'
]);

/**
 * True first-person free-look. Position and gaze are both user-controlled;
 * mouse/touch drag looks, WASD/arrows move, Q/E (or the mobile pad) changes
 * height. Pointer lock is offered but never required.
 */
export class FreeLookController {
  constructor({
    camera,
    domElement,
    colliders = [],
    onStateChange = () => {},
    onPointerLockChange = () => {}
  }) {
    this.camera = camera;
    this.domElement = domElement;
    this.colliders = colliders;
    this.onStateChange = onStateChange;
    this.onPointerLockChange = onPointerLockChange;

    this.enabled = false;
    this.pointerLocked = false;
    this.yaw = 0;
    this.pitch = 0;
    this.keys = new Set();
    this.velocity = new THREE.Vector3();
    this.moveInput = { x: 0, y: 0 };
    this.verticalInput = 0;
    this.lookPointer = null;
    this.lastLook = { x: 0, y: 0 };
    this.savedFov = CAMERA.fov;
    this.speed = 11;
    this.touchSensitivity = 0.0032;
    this.mouseSensitivity = 0.0024;
    this.joystickRadius = 34;
    this.joystickPointer = null;
    this.joystickCenter = { x: 0, y: 0 };

    this._bound = {
      keydown: (event) => this._onKeyDown(event),
      keyup: (event) => this._onKeyUp(event),
      pointerDown: (event) => this._onPointerDown(event),
      pointerMove: (event) => this._onPointerMove(event),
      pointerUp: (event) => this._onPointerUp(event),
      wheel: (event) => this._onWheel(event),
      mouseMove: (event) => this._onMouseMove(event),
      pointerLock: () => this._onPointerLockChange(),
      contextMenu: (event) => event.preventDefault()
    };
  }

  enter() {
    if (this.enabled) return;
    this.enabled = true;
    this.savedFov = this.camera.fov;
    this.camera.fov = 52;
    this.camera.updateProjectionMatrix();
    this.camera.rotation.order = 'YXZ';

    const direction = new THREE.Vector3();
    this.camera.getWorldDirection(direction);
    this.pitch = clamp(Math.asin(clamp(direction.y, -1, 1)), -1.28, 1.28);
    this.yaw = Math.atan2(-direction.x, -direction.z);
    this.keys.clear();
    this.velocity.set(0, 0, 0);
    this.moveInput = { x: 0, y: 0 };
    this.verticalInput = 0;
    this.camera.position.y = Math.max(1.7, this.camera.position.y);
    resolveCameraCollision(this.camera.position, this.colliders, 0.75);
    this._applyOrientation();

    window.addEventListener('keydown', this._bound.keydown);
    window.addEventListener('keyup', this._bound.keyup);
    this.domElement.addEventListener('pointerdown', this._bound.pointerDown);
    this.domElement.addEventListener('pointermove', this._bound.pointerMove);
    this.domElement.addEventListener('pointerup', this._bound.pointerUp);
    this.domElement.addEventListener('pointercancel', this._bound.pointerUp);
    this.domElement.addEventListener('wheel', this._bound.wheel, { passive: false });
    this.domElement.addEventListener('contextmenu', this._bound.contextMenu);
    document.addEventListener('mousemove', this._bound.mouseMove);
    document.addEventListener('pointerlockchange', this._bound.pointerLock);
    this.domElement.classList.add('is-free-look');
    this.onStateChange(true);
  }

  exit() {
    if (!this.enabled) return;
    this.enabled = false;
    this.camera.fov = this.savedFov || CAMERA.fov;
    this.camera.updateProjectionMatrix();
    if (this.pointerLocked && document.exitPointerLock) document.exitPointerLock();
    this.pointerLocked = false;
    this.keys.clear();
    this.velocity.set(0, 0, 0);
    this.moveInput = { x: 0, y: 0 };
    this.verticalInput = 0;
    this._resetJoystick();
    this.lookPointer = null;

    window.removeEventListener('keydown', this._bound.keydown);
    window.removeEventListener('keyup', this._bound.keyup);
    this.domElement.removeEventListener('pointerdown', this._bound.pointerDown);
    this.domElement.removeEventListener('pointermove', this._bound.pointerMove);
    this.domElement.removeEventListener('pointerup', this._bound.pointerUp);
    this.domElement.removeEventListener('pointercancel', this._bound.pointerUp);
    this.domElement.removeEventListener('wheel', this._bound.wheel);
    this.domElement.removeEventListener('contextmenu', this._bound.contextMenu);
    document.removeEventListener('mousemove', this._bound.mouseMove);
    document.removeEventListener('pointerlockchange', this._bound.pointerLock);
    this.domElement.classList.remove('is-free-look');
    this.onPointerLockChange(false);
    this.onStateChange(false);
  }

  getDirection() {
    return new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch)
    );
  }

  _applyOrientation() {
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  _onKeyDown(event) {
    if (!this.enabled) return;
    if (event.target && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
    if (MOVE_KEYS.has(event.code)) {
      this.keys.add(event.code);
      event.preventDefault();
    }
  }

  _onKeyUp(event) {
    this.keys.delete(event.code);
  }

  _onPointerDown(event) {
    if (!this.enabled) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (this.pointerLocked) return;
    if (this.lookPointer !== null) return;
    this.lookPointer = event.pointerId;
    this.lastLook.x = event.clientX;
    this.lastLook.y = event.clientY;
    this.domElement.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  _onPointerMove(event) {
    if (!this.enabled || this.pointerLocked) return;
    if (this.lookPointer !== event.pointerId) return;

    const movementX = typeof event.movementX === 'number' && event.movementX !== 0
      ? event.movementX
      : event.clientX - this.lastLook.x;
    const movementY = typeof event.movementY === 'number' && event.movementY !== 0
      ? event.movementY
      : event.clientY - this.lastLook.y;

    this.lastLook.x = event.clientX;
    this.lastLook.y = event.clientY;
    this._look(movementX, movementY, event.pointerType === 'touch');
    event.preventDefault();
  }

  _onPointerUp(event) {
    if (this.lookPointer === event.pointerId) {
      this.lookPointer = null;
      this.domElement.releasePointerCapture?.(event.pointerId);
    }
  }

  _onMouseMove(event) {
    if (!this.enabled || !this.pointerLocked) return;
    this._look(event.movementX || 0, event.movementY || 0, false);
  }

  _look(dx, dy, touch) {
    const sensitivity = touch ? this.touchSensitivity : this.mouseSensitivity;
    this.yaw -= dx * sensitivity;
    this.pitch = clamp(this.pitch - dy * sensitivity, -1.28, 1.28);
    this._applyOrientation();
  }

  _onWheel(event) {
    if (!this.enabled) return;
    event.preventDefault();
    const step = clamp(-event.deltaY * 0.022, -2.6, 2.6);
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this.camera.position.addScaledVector(forward, step);
    this._constrainPosition();
  }

  _onPointerLockChange() {
    this.pointerLocked = document.pointerLockElement === this.domElement;
    this.onPointerLockChange(this.pointerLocked);
  }

  requestPointerLock() {
    if (!this.enabled) return;
    if (!this.domElement.requestPointerLock) return;
    try {
      const result = this.domElement.requestPointerLock();
      if (result && typeof result.catch === 'function') result.catch(() => {});
    } catch {
      // Pointer lock is optional; drag-look remains available.
    }
  }

  exitPointerLock() {
    if (document.exitPointerLock) document.exitPointerLock();
  }

  setMoveInput(x, y) {
    this.moveInput.x = clamp(x, -1, 1);
    this.moveInput.y = clamp(y, -1, 1);
  }

  setVerticalInput(value) {
    this.verticalInput = clamp(value, -1, 1);
  }

  attachMobileControls({ joystick, knob, upButton, downButton, lockButton }) {
    this.joystickElement = joystick;
    this.joystickKnob = knob;
    if (joystick) {
      joystick.addEventListener('pointerdown', (event) => {
        if (!this.enabled) return;
        event.preventDefault();
        this.joystickPointer = event.pointerId;
        const rect = joystick.getBoundingClientRect();
        this.joystickCenter.x = rect.left + rect.width / 2;
        this.joystickCenter.y = rect.top + rect.height / 2;
        joystick.setPointerCapture?.(event.pointerId);
        joystick.classList.add('is-active');
        this._updateJoystick(event.clientX, event.clientY, rect);
      });
      joystick.addEventListener('pointermove', (event) => {
        if (this.joystickPointer !== event.pointerId) return;
        event.preventDefault();
        const rect = joystick.getBoundingClientRect();
        this._updateJoystick(event.clientX, event.clientY, rect);
      });
      const end = (event) => {
        if (this.joystickPointer !== event.pointerId) return;
        this.joystickPointer = null;
        this._resetJoystick();
      };
      joystick.addEventListener('pointerup', end);
      joystick.addEventListener('pointercancel', end);
      joystick.addEventListener('lostpointercapture', end);
    }

    const bindVertical = (button, value) => {
      if (!button) return;
      const start = (event) => {
        if (!this.enabled) return;
        event.preventDefault();
        this.setVerticalInput(value);
        button.classList.add('is-active');
        button.setPointerCapture?.(event.pointerId);
      };
      const stop = () => {
        this.setVerticalInput(0);
        button.classList.remove('is-active');
      };
      button.addEventListener('pointerdown', start);
      button.addEventListener('pointerup', stop);
      button.addEventListener('pointercancel', stop);
      button.addEventListener('pointerleave', stop);
    };
    bindVertical(upButton, 1);
    bindVertical(downButton, -1);

    if (lockButton) {
      lockButton.addEventListener('click', () => {
        if (!this.enabled) return;
        if (this.pointerLocked) this.exitPointerLock();
        else this.requestPointerLock();
      });
    }
  }

  _updateJoystick(clientX, clientY, rect) {
    const radius = this.joystickRadius;
    let dx = clientX - this.joystickCenter.x;
    let dy = clientY - this.joystickCenter.y;
    const distance = Math.hypot(dx, dy);
    if (distance > radius) {
      dx = (dx / distance) * radius;
      dy = (dy / distance) * radius;
    }
    if (this.joystickKnob) {
      this.joystickKnob.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px)`;
    }
    this.setMoveInput(dx / radius, -dy / radius);
  }

  _resetJoystick() {
    this.setMoveInput(0, 0);
    if (this.joystickKnob) this.joystickKnob.style.transform = 'translate(-50%, -50%)';
    if (this.joystickElement) this.joystickElement.classList.remove('is-active');
  }

  update(dt) {
    if (!this.enabled) return;

    const forwardInput =
      (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) -
      (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) +
      this.moveInput.y;
    const strafeInput =
      (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) -
      (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0) +
      this.moveInput.x;
    const verticalInput =
      (this.keys.has('KeyE') ? 1 : 0) -
      (this.keys.has('KeyQ') ? 1 : 0) +
      this.verticalInput;

    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const speed = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 24 : 11;
    const targetX = clamp(
      (forward.x * forwardInput + right.x * strafeInput) * speed,
      -speed,
      speed
    );
    const targetZ = clamp(
      (forward.z * forwardInput + right.z * strafeInput) * speed,
      -speed,
      speed
    );
    const targetY = clamp(verticalInput, -1, 1) * 7.2;

    this.velocity.x = damp(this.velocity.x, targetX, 9, dt);
    this.velocity.z = damp(this.velocity.z, targetZ, 9, dt);
    this.velocity.y = damp(this.velocity.y, targetY, 8, dt);

    this.camera.position.x += this.velocity.x * dt;
    this.camera.position.z += this.velocity.z * dt;
    this.camera.position.y += this.velocity.y * dt;
    this._constrainPosition();
    this._applyOrientation();
  }

  _constrainPosition() {
    this.camera.position.y = clamp(this.camera.position.y, 1.65, NAV_BOUNDS.freeLookY);
    this.camera.position.x = clamp(this.camera.position.x, -NAV_BOUNDS.freeLookXZ, NAV_BOUNDS.freeLookXZ);
    this.camera.position.z = clamp(this.camera.position.z, -NAV_BOUNDS.freeLookXZ, NAV_BOUNDS.freeLookXZ);
    resolveCameraCollision(this.camera.position, this.colliders, 0.75);
  }

  dispose() {
    this.exit();
  }
}
