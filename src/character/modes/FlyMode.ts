import * as THREE from 'three';
import type { Character } from '../Character';
import { moveToward, type MovementMode } from './MovementMode';

const _target = new THREE.Vector3();

/** Free flight: no gravity, climb and sink on demand, sprint to boost. */
export class FlyMode implements MovementMode {
  readonly name = 'fly';

  enter(c: Character): void {
    // Taking off from the ground: hop up so we don't count as landed straight away.
    if (c.grounded) {
      c.velocity.y = c.stats.get('flyTakeoffSpeed');
      c.grounded = false;
    }
  }

  update(c: Character, dt: number): void {
    const { stats, intent, velocity } = c;
    const speed = stats.get(intent.sprint ? 'flyBoostSpeed' : 'flySpeed');
    const climb = (intent.ascend ? 1 : 0) - (intent.descend ? 1 : 0);
    _target.set(intent.move.x * speed, climb * stats.get('flyClimbSpeed'), intent.move.z * speed);
    moveToward(velocity, _target, stats.get('flyAccel') * dt);
  }
}
