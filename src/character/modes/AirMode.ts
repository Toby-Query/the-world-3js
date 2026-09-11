import * as THREE from 'three';
import type { Character } from '../Character';
import { moveToward, type MovementMode } from './MovementMode';

const _target = new THREE.Vector3();

/**
 * Airborne under gravity with limited air control. Falls faster than it
 * rises, and rises less if jump is released early (variable jump height).
 */
export class AirMode implements MovementMode {
  readonly name = 'air';

  update(c: Character, dt: number): void {
    const { stats, intent, velocity } = c;
    const speed = stats.get('moveSpeed');
    _target.set(intent.move.x * speed, velocity.y, intent.move.z * speed);
    moveToward(velocity, _target, stats.get('airAccel') * dt);

    let g = c.env.gravity;
    if (velocity.y > 0 && !intent.jumpHeld) g *= stats.get('lowJumpMultiplier');
    else if (velocity.y < 0) g *= stats.get('fallMultiplier');
    velocity.y -= g * dt;
  }
}
