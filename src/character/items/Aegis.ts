import * as THREE from 'three';
import type { Character } from '../Character';
import type { Ability } from '../abilities/Ability';
import { OverlayPriority, SIDES, type Pose } from '../animation/Pose';
import { limbIndex } from '../equipment/BodySlot';
import { useAction, type Equipped, type Item } from '../equipment/Item';
import { part } from '../../utils/mesh';
import { glow, material } from './itemParts';

const HAND = 'leftHand';
const BLOCK_SPEED_MULTIPLIER = 0.45;

/** Athena's shield, strapped to the left arm. Hold to raise it and brace. */
export class Aegis implements Item {
  readonly id = 'aegis';
  readonly label = 'Aegis';
  readonly description = 'Hold to raise the shield and brace (slower while braced)';
  readonly kind = 'wearable';
  readonly occupies = [HAND] as const;

  equip(): Equipped {
    const arm = limbIndex(HAND);
    return {
      models: { [HAND]: buildShield() },
      hold: carryPose(arm),
      abilities: [new ShieldBlock(`${this.id}:block`, useAction(HAND), arm)],
    };
  }
}

class ShieldBlock implements Ability {
  readonly id: string;
  readonly label = 'Shield block';
  readonly description = 'Hold to block';

  private readonly action: string;
  private readonly pose: Pose;
  private readonly arm: number;
  private blocking = false;

  constructor(id: string, action: string, arm: number) {
    this.id = id;
    this.action = action;
    this.arm = arm;
    this.pose = blockPose(arm);
  }

  attach(): void {
    this.blocking = false;
  }

  update(c: Character): void {
    const held = c.intent.held.has(this.action);
    if (held === this.blocking) return;
    this.blocking = held;
    if (held) {
      c.addOverlay(this.id, this.pose, { arms: [this.arm], torso: true }, 18, this.id, OverlayPriority.action);
      c.stats.modify('moveSpeed', this.id, { mul: BLOCK_SPEED_MULTIPLIER });
    } else {
      c.removeOverlay(this.id);
      c.stats.remove('moveSpeed', this.id);
    }
  }
}

/*
 * The shield faces the hand's -Z. With shoulder + elbow + wrist summing to
 * about -π (a raised forearm), that is straight ahead.
 */

/** Forearm forward at the waist, shield facing ahead. */
function carryPose(i: number): Pose {
  const side = SIDES[i];
  return (f, { move, strideSin }) => {
    f.shoulderX[i] = -0.1 + side * strideSin * 0.15 * move;
    f.shoulderZ[i] = side * 0.22;
    f.elbow[i] = -1.3;
    f.wrist[i] = -1.55;
  };
}

/** Upper arm raised, forearm up in front of the face, leaning in behind it. */
function blockPose(i: number): Pose {
  const side = SIDES[i];
  return (f) => {
    f.shoulderX[i] = -1.25;
    f.shoulderZ[i] = side * -0.3;
    f.elbow[i] = -1.45;
    f.wrist[i] = -0.45;
    f.spineX = 0.18;
    f.spineY = side * 0.2;
  };
}

function buildShield(): THREE.Object3D {
  const bronze = material('#b8893a', { metalness: 0.85, roughness: 0.3 });
  const rim = material('#7a5a24', { metalness: 0.8, roughness: 0.4 });
  const gorgon = glow('#9fffc8', 1.6);

  const g = new THREE.Group();
  g.position.set(0, 0.06, -0.06); // just in front of the forearm
  const disc = part(new THREE.CylinderGeometry(0.3, 0.3, 0.035, 32), bronze, g);
  disc.rotation.x = Math.PI / 2;
  part(new THREE.TorusGeometry(0.3, 0.02, 8, 32), rim, g);
  const boss = part(new THREE.SphereGeometry(0.07, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), gorgon, g, [0, 0, -0.018]);
  boss.rotation.x = -Math.PI / 2; // dome bulges out of the front (-Z)
  return g;
}
