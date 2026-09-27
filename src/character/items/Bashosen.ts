import * as THREE from 'three';
import type { Character } from '../Character';
import type { Ability } from '../abilities/Ability';
import { ActionClip, type ClipPose } from '../animation/ActionClip';
import { SIDES, type Pose } from '../animation/Pose';
import { track } from '../animation/tracks';
import { limbIndex, type BodySlot } from '../equipment/BodySlot';
import { useAction, type Equipped, type Item } from '../equipment/Item';
import { part } from '../../utils/mesh';
import { glow, grip, material } from './itemParts';

const SWEEP_TIME = 0.5;
/** When in the sweep the gust fires. */
const GUST = 0.4;
const GUST_SPEED = 13;

/**
 * The Princess Iron Fan's palm-leaf fan. One hand. Sweep it at the ground to
 * blow yourself into the air; once more while airborne.
 */
export class Bashosen implements Item {
  readonly id = 'bashosen';
  readonly label = 'Bashōsen';
  readonly description = 'Sweep a gust that launches you upward (once per landing)';
  readonly kind = 'tool';
  readonly occupies = ['hand'] as const;

  equip([hand]: readonly BodySlot[]): Equipped {
    const arm = limbIndex(hand);
    return {
      models: { [hand]: buildFan() },
      hold: holdPose(arm),
      abilities: [new GustSweep(`${this.id}:gust`, useAction(hand), arm)],
    };
  }
}

class GustSweep implements Ability {
  readonly id: string;
  readonly label = 'Gust';
  readonly description = 'Launch upward';

  private readonly action: string;
  private readonly clip: ActionClip;
  private charged = true;

  constructor(id: string, action: string, arm: number) {
    this.id = id;
    this.action = action;
    this.clip = new ActionClip(id, SWEEP_TIME, { arms: [arm], torso: true }, sweepPose(arm));
  }

  attach(c: Character): void {
    this.clip.stop(c);
    this.charged = true;
  }

  update(c: Character, dt: number): void {
    if (c.grounded && !this.clip.playing) this.charged = true;
    if (c.intent.actions.has(this.action) && !this.clip.playing && this.charged) {
      this.charged = false;
      this.clip.play(c, this.id);
    }
    this.clip.update(c, dt);

    if (this.clip.crossed(GUST)) {
      c.velocity.y = Math.max(c.velocity.y, 0) + GUST_SPEED;
      c.grounded = false;
      c.events.emit('jump', { speed: GUST_SPEED });
    }
  }
}

/** Carried upright in front, rocking with the stride. */
function holdPose(i: number): Pose {
  const side = SIDES[i];
  return (f, { move, strideSin }) => {
    f.shoulderX[i] = -0.15 + side * strideSin * 0.3 * move;
    f.shoulderZ[i] = side * 0.15;
    f.elbow[i] = -0.7;
    f.wrist[i] = -0.3;
  };
}

/** Raise the fan high behind the shoulder, then sweep it down past the hip. */
function sweepPose(i: number): ClipPose {
  const side = SIDES[i];
  const shoulder = track([0, -0.3], [0.3, -2.7], [GUST, -0.2]);
  const elbow = track([0, -0.7], [0.3, -0.9], [GUST, -0.1]);
  const wrist = track([0, -0.3], [0.3, -0.2], [GUST, 1.0]);
  const spineX = track([0, 0], [0.3, -0.12], [GUST, 0.4]);
  return (f, _ctx, t) => {
    f.shoulderX[i] = shoulder(t);
    f.shoulderZ[i] = side * 0.2;
    f.elbow[i] = elbow(t);
    f.wrist[i] = wrist(t);
    f.spineX = spineX(t);
  };
}

function buildFan(): THREE.Object3D {
  const handle = material('#7a1f1f', { metalness: 0.2, roughness: 0.6 });
  const leaf = material('#3f8a4a', { metalness: 0.1, roughness: 0.7, side: THREE.DoubleSide });
  const vein = glow('#d9ff8a', 1.2);

  const g = grip();
  part(new THREE.CylinderGeometry(0.02, 0.024, 0.34, 8), handle, g, [0, 0.07, 0]);
  // A broad leaf in the grip's XY plane, so it pushes air in the swing direction.
  const blade = part(new THREE.CircleGeometry(0.34, 24, Math.PI * 0.12, Math.PI * 0.76), leaf, g, [0, 0.1, 0]);
  blade.scale.set(1, 1.25, 1);
  part(new THREE.BoxGeometry(0.012, 0.42, 0.012), vein, g, [0, 0.33, 0.005]);
  return g;
}
