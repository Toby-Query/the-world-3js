import * as THREE from 'three';
import type { Input } from '../input/Input';
import { clamp, damp } from '../utils/math';

const _desiredFocus = new THREE.Vector3();

/**
 * Orbit camera that follows a target. Mouse moves yaw/pitch, scroll zooms.
 * yaw = 0 places the camera on +Z looking toward -Z.
 */
export class ThirdPersonCamera {
  readonly camera: THREE.PerspectiveCamera;
  readonly input: Input;

  yaw = 0;
  pitch = 0.3;
  distance = 7;
  targetDistance = 7;
  minDistance = 2.5;
  maxDistance = 20;
  minPitch = -0.35;
  maxPitch = 1.35;
  sensitivity = 0.0025;
  focusHeight = 1.4;
  followSharpness = 14;

  readonly focus = new THREE.Vector3();
  private initialized = false;

  constructor(camera: THREE.PerspectiveCamera, input: Input) {
    this.camera = camera;
    this.input = input;
  }

  /** Read mouse input. Call before moving the character so it uses this frame's yaw. */
  handleInput(): void {
    const input = this.input;
    this.yaw -= input.mouseDX * this.sensitivity;
    this.pitch = clamp(this.pitch + input.mouseDY * this.sensitivity, this.minPitch, this.maxPitch);
    this.targetDistance = clamp(this.targetDistance + input.wheel * 0.01, this.minDistance, this.maxDistance);
  }

  update(dt: number, targetPosition: THREE.Vector3): void {
    this.distance = damp(this.distance, this.targetDistance, 10, dt);

    _desiredFocus.copy(targetPosition);
    _desiredFocus.y += this.focusHeight;
    if (!this.initialized) {
      this.focus.copy(_desiredFocus);
      this.initialized = true;
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
