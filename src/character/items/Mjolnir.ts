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

const STRIKE_TIME = 0.6;
/** When in the swing the head comes down. */
const IMPACT = 0.45;
const LUNGE_SPEED = 5;
const SLAM_SPEED = 26;

const _forward = new THREE.Vector3();

/** Thor's hammer. One hand. Overhead smash; used mid-air it slams you into the ground. */
export class Mjolnir implements Item {
  readonly id = 'mjolnir';
  readonly label = 'Mjölnir';
  readonly description = 'Overhead smash · mid-air, slam into the ground';
  readonly kind = 'weapon';
  readonly occupies = ['hand'] as const;

  equip([hand]: readonly BodySlot[]): Equipped {
    const arm = limbIndex(hand);
    return {
      models: { [hand]: buildModel() },
      hold: holdPose(arm),
      abilities: [new HammerStrike(`${this.id}:strike`, useAction(hand), arm)],
    };
  }
}

class HammerStrike implements Ability {
  readonly id: string;
  readonly label = 'Hammer strike';
  readonly description = 'Smash; slam down if airborne';

  private readonly action: string;
  private readonly clip: ActionClip;

  constructor(id: string, action: string, arm: number) {
    this.id = id;
    this.action = action;
    this.clip = new ActionClip(id, STRIKE_TIME, { arms: [arm], torso: true }, strikePose(arm));
  }

  attach(c: Character): void {
    this.clip.stop(c);
  }

  update(c: Character, dt: number): void {
    if (c.intent.actions.has(this.action) && !this.clip.playing) {
      this.clip.play(c, this.id);
      if (!c.grounded) c.velocity.set(0, Math.min(c.velocity.y, 0), 0); // hang for the wind-up
    }
    this.clip.update(c, dt);

    if (this.clip.crossed(IMPACT * 0.8)) {
      if (c.grounded) c.velocity.addScaledVector(c.forward(_forward), LUNGE_SPEED);
      else c.velocity.set(0, -SLAM_SPEED, 0); // the landing squash sells the impact
    }
  }
}

/** Hanging head-down at the side, swinging a little with the stride. */
function holdPose(i: number): Pose {
  const side = SIDES[i];
  return (f, { move, strideSin }) => {
    f.shoulderX[i] = side * strideSin * 0.6 * move;
    f.shoulderZ[i] = side * 0.2;
    f.elbow[i] = -0.25 - 0.4 * move;
    f.wrist[i] = 1.35;
  };
}

/** Wind up overhead (twisting the shoulder back), then chop down and forward. */
function strikePose(i: number): ClipPose {
  const side = SIDES[i];
  const shoulder = track([0, -0.2], [0.3, -2.9], [IMPACT, -0.85]);
  const elbow = track([0, -0.4], [0.3, -1.3], [IMPACT, -0.2]);
  const wrist = track([0, 1.2], [0.3, 0.1], [IMPACT, 1.1]);
  const spineX = track([0, 0], [0.3, -0.15], [IMPACT, 0.5]);
  const twist = track([0, 0], [0.3, 0.35], [IMPACT, -0.25]);
  return (f, _ctx, t) => {
    f.shoulderX[i] = shoulder(t);
    f.shoulderZ[i] = side * 0.15;
    f.elbow[i] = elbow(t);
    f.wrist[i] = wrist(t);
    f.spineX = spineX(t);
    f.spineY = side * twist(t);
    f.headX = -f.spineX * 0.4;
  };
}

function buildModel(): THREE.Object3D {
  const steel = material('#9aa3ad', { metalness: 0.85, roughness: 0.3 });
  const leather = material('#5a3822', { roughness: 0.85, metalness: 0 });
  const rune = glow('#7fe6ff', 2.5);

  const g = grip();
  part(new THREE.CylinderGeometry(0.024, 0.026, 0.36, 10), leather, g, [0, 0.07, 0]);
  part(new THREE.SphereGeometry(0.035, 10, 8), steel, g, [0, -0.12, 0]);
  // The head lies in the swing plane, faces front and back.
  const head = part(new THREE.BoxGeometry(0.16, 0.16, 0.3), steel, g, [0, 0.31, 0]);
  for (const z of [-0.151, 0.151]) {
    const face = part(new THREE.CircleGeometry(0.045, 16), rune, head, [0, 0, z]);
    face.rotation.y = z < 0 ? Math.PI : 0;
  }
  return g;
}
