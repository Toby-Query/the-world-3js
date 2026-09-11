import * as THREE from 'three';
import type { Character } from '../Character';
import { moveToward, type MovementMode } from './MovementMode';

const _target = new THREE.Vector3();

/** Walking on the ground. Starting a jump is the Jump ability's job. */
export class GroundMode implements MovementMode {
  readonly name = 'ground';

  update(c: Character, dt: number): void {
    const { stats, intent, velocity } = c;
    const speed = stats.get('moveSpeed');
    const accel = intent.hasMove ? stats.get('groundAccel') : stats.get('groundDecel');
    _target.set(intent.move.x * speed, velocity.y, intent.move.z * speed);
    moveToward(velocity, _target, accel * dt);
  }
}
