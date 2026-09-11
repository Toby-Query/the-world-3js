import * as THREE from 'three';
import { clamp, damp } from '../utils/math.js';

const _desiredFocus = new THREE.Vector3();

/**
 * Orbit camera that follows a target. Mouse moves yaw/pitch, scroll zooms.
 * yaw = 0 places the camera on +Z looking toward -Z.
 */
export class ThirdPersonCamera {
  constructor(camera, input) {
    this.camera = camera;
    this.input = input;

    this.yaw = 0;
    this.pitch = 0.3;
    this.distance = 7;
    this.targetDistance = 7;
    this.minDistance = 2.5;
    this.maxDistance = 20;
    this.minPitch = -0.35;
    this.maxPitch = 1.35;
    this.sensitivity = 0.0025;
    this.focusHeight = 1.4;
    this.followSharpness = 14;

    this.focus = new THREE.Vector3();
    this._initialized = false;
  }

  /** Read mouse input. Call before moving the character so it uses this frame's yaw. */
  handleInput() {
    const input = this.input;
    this.yaw -= input.mouseDX * this.sensitivity;
    this.pitch = clamp(this.pitch + input.mouseDY * this.sensitivity, this.minPitch, this.maxPitch);
    this.targetDistance = clamp(this.targetDistance + input.wheel * 0.01, this.minDistance, this.maxDistance);
  }

  update(dt, targetPosition) {
    this.distance = damp(this.distance, this.targetDistance, 10, dt);

    _desiredFocus.copy(targetPosition);
    _desiredFocus.y += this.focusHeight;
    if (!this._initialized) {
      this.focus.copy(_desiredFocus);
      this._initialized = true;
    } else {
      this.focus.lerp(_desiredFocus, 1 - Math.exp(-this.followSharpness * dt));
    }

    const horizontal = Math.cos(this.pitch) * this.distance;
    this.camera.position.set(
      this.focus.x + Math.sin(this.yaw) * horizontal,
      this.focus.y + Math.sin(this.pitch) * this.distance,
      this.focus.z + Math.cos(this.yaw) * horizontal,
    );
    this.camera.position.y = Math.max(this.camera.position.y, 0.3); // never dip under the ground
    this.camera.lookAt(this.focus);
  }
}
