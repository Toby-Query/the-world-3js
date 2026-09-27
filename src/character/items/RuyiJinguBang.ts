import * as THREE from 'three';
import type { Character } from '../Character';
import type { Ability } from '../abilities/Ability';
import { ActionClip, type ClipPose } from '../animation/ActionClip';
import { SIDES, type Pose } from '../animation/Pose';
import { track, wrapAngle } from '../animation/tracks';
import type { Equipped, Item } from '../equipment/Item';
import { damp } from '../../utils/math';
import { part } from '../../utils/mesh';
import { material } from './itemParts';

const SPIN_TIME = 0.55;
/** Spinning mid-air holds you up like a rotor, at most this fast downward. */
const SPIN_MAX_FALL = 1.5;
const EXTENDED_LENGTH = 3.5;
const GROW_RATE = 8;

/**
 * Sun Wukong's staff. Both hands. Primary: whirlwind spin. Secondary: grow
 * it to several times its length, and back.
 */
export class RuyiJinguBang implements Item {
  readonly id = 'ruyi-jingu-bang';
  readonly label = 'Ruyi Jingu Bang';
  readonly description = 'Primary: whirlwind spin (slows falls) · Secondary: grow / shrink';
  readonly kind = 'weapon';
  readonly occupies = ['hand', 'hand'] as const;

  equip(): Equipped {
    const staff = new THREE.Group();
    const body = buildStaff();
    staff.add(body);
    // Held in the right hand, reaching across to the left hand.
    staff.position.x = 0.29;
    return {
      models: { rightHand: staff },
      hold: holdPose,
      abilities: [new StaffArts(`${this.id}:arts`, body)],
    };
  }
}

class StaffArts implements Ability {
  readonly id: string;
  readonly label = 'Staff arts';
  readonly description = 'Spin; grow and shrink the staff';

  private readonly staff: THREE.Object3D;
  private readonly spin: ActionClip;
  private extended = false;

  constructor(id: string, staff: THREE.Object3D) {
    this.id = id;
    this.staff = staff;
    this.spin = new ActionClip(id, SPIN_TIME, { arms: [0, 1], torso: true, body: true }, spinPose);
  }

  attach(c: Character): void {
    this.spin.stop(c);
    this.extended = false;
  }

  update(c: Character, dt: number): void {
    const { actions } = c.intent;
    if (actions.has('primary') && !this.spin.playing) this.spin.play(c, this.id);
    if (actions.has('secondary')) this.extended = !this.extended;
    this.spin.update(c, dt);

    if (this.spin.playing && !c.grounded) c.velocity.y = Math.max(c.velocity.y, -SPIN_MAX_FALL);

    const length = damp(this.staff.scale.x, this.extended ? EXTENDED_LENGTH : 1, GROW_RATE, dt);
    this.staff.scale.set(length, 1, 1);
  }
}

/** Held level across the body in both hands, bobbing with the stride. */
const holdPose: Pose = (f, { move, strideCos }) => {
  SIDES.forEach((side, i) => {
    f.shoulderX[i] = -0.45 - 0.2 * move + Math.abs(strideCos) * 0.06 * move;
    f.shoulderZ[i] = side * -0.12;
    f.elbow[i] = -1.0 + 0.2 * move;
  });
};

/** Crouch, extend the arms, and spin the whole body once around. */
const spinYaw = track([0, 0], [0.85, Math.PI * 2]);
const crouch = track([0, 0], [0.2, 1], [0.8, 1], [1, 0]);
const spinPose: ClipPose = (f, _ctx, t) => {
  const c = crouch(t);
  SIDES.forEach((side, i) => {
    f.shoulderX[i] = -0.5 - 0.8 * c;
    f.shoulderZ[i] = side * -0.08;
    f.elbow[i] = -1.0 + 0.7 * c;
  });
  f.bodyYaw = wrapAngle(-spinYaw(t));
  f.spineX = 0.2 * c;
  f.hipsBob = -0.1 * c;
};

/** Red iron core with gold bands, laid along X. `scale.x` sets its length. */
function buildStaff(): THREE.Group {
  const iron = material('#8c1f1a', { metalness: 0.6, roughness: 0.4 });
  const gold = material('#f2c14e', { metalness: 0.9, roughness: 0.25 });
  const g = new THREE.Group();
  const core = part(new THREE.CylinderGeometry(0.028, 0.028, 1.6, 10), iron, g);
  core.rotation.z = Math.PI / 2;
  for (const x of [-0.9, 0.9]) {
    const band = part(new THREE.CylinderGeometry(0.036, 0.036, 0.2, 12), gold, g, [x, 0, 0]);
    band.rotation.z = Math.PI / 2;
  }
  return g;
}
