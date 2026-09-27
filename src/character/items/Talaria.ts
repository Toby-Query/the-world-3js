import * as THREE from 'three';
import type { Character } from '../Character';
import type { Ability } from '../abilities/Ability';
import { limbIndex, type BodySlot } from '../equipment/BodySlot';
import type { Equipped, Item } from '../equipment/Item';
import { SIDES } from '../animation/Pose';
import { part } from '../../utils/mesh';
import { material } from './itemParts';

/** Hermes' winged sandals. Both feet. Faster, higher, nimbler in the air. */
export class Talaria implements Item {
  readonly id = 'talaria';
  readonly label = 'Talaria';
  readonly description = 'Winged sandals: faster, jump higher, steer better in the air';
  readonly kind = 'wearable';
  readonly occupies = ['foot', 'foot'] as const;

  equip(slots: readonly BodySlot[]): Equipped {
    const wings: THREE.Object3D[] = [];
    const models: Equipped['models'] = {};
    for (const slot of slots) {
      const { sandal, wing } = buildSandal(SIDES[limbIndex(slot)]);
      models[slot] = sandal;
      wings.push(wing);
    }
    return { models, abilities: [new WingedStride(`${this.id}:stride`, wings)] };
  }
}

class WingedStride implements Ability {
  readonly id: string;
  readonly label = 'Winged stride';
  readonly description = 'Faster, higher jumps';

  private readonly wings: THREE.Object3D[];
  private time = 0;

  constructor(id: string, wings: THREE.Object3D[]) {
    this.id = id;
    this.wings = wings;
  }

  attach(c: Character): void {
    c.stats.modify('moveSpeed', this.id, { mul: 1.35 });
    c.stats.modify('jumpSpeed', this.id, { add: 3 });
    c.stats.modify('airAccel', this.id, { mul: 2 });
    c.stats.modify('flySpeed', this.id, { mul: 1.3 });
  }

  /** Flutter faster the faster we go, and hard while airborne. */
  update(c: Character, dt: number): void {
    const effort = c.grounded ? Math.min(c.horizontalSpeed / 9, 1) : 1;
    this.time += dt * (2 + 16 * effort);
    const flap = 0.25 + Math.sin(this.time) * (0.15 + 0.35 * effort);
    for (const wing of this.wings) wing.rotation.y = wing.userData.side * flap;
  }
}

/** Gold sole with a wing on the outside of the ankle. */
function buildSandal(side: number): { sandal: THREE.Object3D; wing: THREE.Object3D } {
  const gold = material('#f5cf5a', { metalness: 0.9, roughness: 0.25 });
  const feather = material('#fff6dc', { metalness: 0.2, roughness: 0.5, side: THREE.DoubleSide });

  const sandal = new THREE.Group();
  part(new THREE.BoxGeometry(0.17, 0.025, 0.3), gold, sandal, [0, -0.095, 0.05]);
  part(new THREE.TorusGeometry(0.085, 0.012, 6, 16), gold, sandal, [0, -0.02, 0]).rotation.x = Math.PI / 2;

  // The wing hinges at the ankle and sweeps back; update() flaps it.
  const wing = new THREE.Group();
  wing.position.set(side * 0.09, 0, -0.02);
  wing.userData.side = side;
  sandal.add(wing);
  [0.16, 0.13, 0.1].forEach((length, k) => {
    const f = part(new THREE.PlaneGeometry(length, 0.04), feather, wing, [0, 0.03 - k * 0.035, 0]);
    f.position.z = -length / 2;
    f.rotation.y = Math.PI / 2;
    f.rotation.x = 0.35 + k * 0.2;
  });
  return { sandal, wing };
}
