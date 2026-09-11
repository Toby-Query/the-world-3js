import * as THREE from 'three';
import { dampAngle } from '../utils/math.js';

const _wish = new THREE.Vector3();
const _delta = new THREE.Vector3();

/**
 * Camera-relative movement with acceleration, jumping (with coyote time and
 * jump buffering), and variable jump height. The world is flat for now, so
 * the ground is simply y = 0.
 */
export class CharacterController {
  constructor(model, input) {
    this.model = model;
    this.input = input;

    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.facing = Math.PI; // start facing away from the camera (-Z)
    this.onGround = true;

    // Tuning
    this.walkSpeed = 4.5;
    this.runSpeed = 9;
    this.groundAccel = 45;
    this.groundDecel = 30;
    this.airAccel = 12;
    this.turnSpeed = 14;
    this.jumpSpeed = 8.5;
    this.gravity = 25;
    this.fallMultiplier = 1.4; // fall faster than you rise, feels snappier
    this.lowJumpMultiplier = 2.2; // release Space early for a short hop
    this.coyoteTime = 0.12; // can still jump just after leaving the ground
    this.jumpBufferTime = 0.12; // Space pressed just before landing still counts

    this._coyote = 0;
    this._jumpBuffer = 0;
  }

  get horizontalSpeed() {
    return Math.hypot(this.velocity.x, this.velocity.z);
  }

  update(dt, cameraYaw) {
    const input = this.input;

    // --- Desired direction, relative to where the camera looks ---
    const forward = (input.isDown('KeyW', 'ArrowUp') ? 1 : 0) - (input.isDown('KeyS', 'ArrowDown') ? 1 : 0);
    const right = (input.isDown('KeyD', 'ArrowRight') ? 1 : 0) - (input.isDown('KeyA', 'ArrowLeft') ? 1 : 0);
    const sin = Math.sin(cameraYaw);
    const cos = Math.cos(cameraYaw);
    _wish.set(-sin * forward + cos * right, 0, -cos * forward - sin * right);
    const hasInput = _wish.lengthSq() > 0;
    if (hasInput) _wish.normalize();

    const running = input.isDown('ShiftLeft', 'ShiftRight');
    const targetSpeed = hasInput ? (running ? this.runSpeed : this.walkSpeed) : 0;

    // --- Accelerate horizontal velocity toward the target ---
    const accel = this.onGround ? (hasInput ? this.groundAccel : this.groundDecel) : this.airAccel;
    _delta.set(_wish.x * targetSpeed - this.velocity.x, 0, _wish.z * targetSpeed - this.velocity.z);
    const maxStep = accel * dt;
    const len = _delta.length();
    if (len > maxStep) _delta.multiplyScalar(maxStep / len);
    this.velocity.x += _delta.x;
    this.velocity.z += _delta.z;

    // --- Jump ---
    this._jumpBuffer = input.wasPressed('Space') ? this.jumpBufferTime : Math.max(0, this._jumpBuffer - dt);
    this._coyote = this.onGround ? this.coyoteTime : Math.max(0, this._coyote - dt);
    if (this._jumpBuffer > 0 && this._coyote > 0) {
      this.velocity.y = this.jumpSpeed;
      this.onGround = false;
      this._jumpBuffer = 0;
      this._coyote = 0;
      this.model.onJump();
    }

    // --- Gravity ---
    if (!this.onGround) {
      let g = this.gravity;
      if (this.velocity.y > 0 && !input.isDown('Space')) g *= this.lowJumpMultiplier;
      else if (this.velocity.y < 0) g *= this.fallMultiplier;
      this.velocity.y -= g * dt;
    }

    // --- Integrate & ground collision ---
    this.position.addScaledVector(this.velocity, dt);
    if (this.position.y <= 0) {
      if (!this.onGround) this.model.onLand(-this.velocity.y);
      this.position.y = 0;
      this.velocity.y = 0;
      this.onGround = true;
    }

    // --- Face the direction we're trying to move ---
    if (hasInput) {
      this.facing = dampAngle(this.facing, Math.atan2(_wish.x, _wish.z), this.turnSpeed, dt);
    }

    this.model.root.position.copy(this.position);
    this.model.root.rotation.y = this.facing;
    this.model.animate(dt, {
      speed: this.horizontalSpeed,
      runSpeed: this.runSpeed,
      onGround: this.onGround,
      verticalVelocity: this.velocity.y,
    });
  }
}
