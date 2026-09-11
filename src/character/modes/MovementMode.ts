import * as THREE from 'three';
import type { Character } from '../Character';

/**
 * One way of moving: walking, falling, flying, swimming... Exactly one is
 * active at a time. A mode only steers `velocity`; the Character then moves,
 * collides and turns the same way for every mode. The model blends toward
 * the pose with the same name as the active mode.
 */
export interface MovementMode {
  readonly name: string;
  enter?(c: Character): void;
  exit?(c: Character): void;
  update(c: Character, dt: number): void;
}

const _delta = new THREE.Vector3();

/** Move `velocity` toward `target`, changing it by at most `maxStep`. */
export function moveToward(velocity: THREE.Vector3, target: THREE.Vector3, maxStep: number): void {
  _delta.subVectors(target, velocity);
  const len = _delta.length();
  if (len > maxStep) _delta.multiplyScalar(maxStep / len);
  velocity.add(_delta);
}
