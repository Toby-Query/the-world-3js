import * as THREE from 'three';
import { clamp, damp, lerp } from '../utils/math';
import { part, pivot } from '../utils/mesh';
import { PoseFrame, SIDES, type Pose, type PoseContext, type PoseMask } from './animation/Pose';
import { airPose, groundPose } from './animation/basePoses';
import type { BodySlot } from './equipment/BodySlot';

const HIP_HEIGHT = 0.91;
/** Speed (m/s) at which the full run cycle plays. */
const FULL_RUN_SPEED = 9;
/** Pose weights below this are skipped, and removed poses are dropped. */
const MIN_WEIGHT = 1e-4;

export interface CharacterColors {
  skin: THREE.ColorRepresentation;
  hair: THREE.ColorRepresentation;
  shirt: THREE.ColorRepresentation;
  pants: THREE.ColorRepresentation;
  boots: THREE.ColorRepresentation;
  accent: THREE.ColorRepresentation;
  eyes: THREE.ColorRepresentation;
  core: THREE.ColorRepresentation;
}

const DEFAULT_COLORS: CharacterColors = {
  skin: '#e8b48f',
  hair: '#2b1d14',
  shirt: '#3f7fd9',
  pants: '#2d3142',
  boots: '#6b4430',
  accent: '#f2b134',
  eyes: '#1a1a22',
  core: '#5ff3ff',
};

/** What the character tells the model each frame. */
export interface AnimationState {
  /** Pose to blend toward. Unknown names fall back to 'ground'. */
  pose: string;
  speed: number;
  verticalVelocity: number;
}

interface ArmJoints {
  shoulder: THREE.Group;
  elbow: THREE.Group;
  /** Also the hand's socket. */
  wrist: THREE.Group;
}

interface LegJoints {
  hip: THREE.Group;
  knee: THREE.Group;
  ankle: THREE.Group;
}

interface PoseLayer {
  pose: Pose;
  /** How quickly the model blends into this pose. */
  blendRate: number;
  weight: number;
  /** Removed, but kept until it has faded out so nothing snaps. */
  retiring: boolean;
}

interface OverlayLayer extends PoseLayer {
  name: string;
  mask: PoseMask;
  priority: number;
}

/**
 * Prototype character built from primitives, arranged as a joint hierarchy
 * (hips → spine → head/shoulders, hips → legs) so it can be animated
 * procedurally. Faces +Z. `root` sits at the feet.
 *
 * The joints are named and grouped the way a skinned rig would be, so this
 * can later be swapped for a real model without changing the controller.
 *
 * Animation blends between named poses. 'ground' and 'air' are built in;
 * abilities can add more (e.g. 'fly') with addPose(). Overlays are layered on
 * top of that for just some joints (addOverlay), e.g. holding a weapon in
 * one hand or swinging it while the legs keep running.
 *
 * `sockets` are where equipped items attach. Hand sockets sit in the palm:
 * with the arm hanging, their -Y runs down the arm and +Z points forward.
 */
export class CharacterModel {
  /** World position + facing. */
  readonly root = new THREE.Group();
  /** Squash & stretch. */
  readonly body = new THREE.Group();
  readonly hips: THREE.Group;
  readonly spine: THREE.Group;
  readonly head: THREE.Group;
  readonly arms: ArmJoints[];
  readonly legs: LegJoints[];
  readonly sockets: Record<BodySlot, THREE.Group>;
  readonly materials: Record<keyof CharacterColors, THREE.MeshStandardMaterial>;

  private phase = 0;
  private time = 0;
  private squash = 0;

  private readonly poses = new Map<string, PoseLayer>();
  private readonly overlays = new Map<string, OverlayLayer>();
  /** `overlays`, lowest priority first. */
  private overlayOrder: OverlayLayer[] = [];
  private readonly basePose: PoseLayer = { pose: groundPose, blendRate: 20, weight: 1, retiring: false };
  private readonly blended = new PoseFrame();
  private readonly scratch = new PoseFrame();
  private readonly ctx: PoseContext = {
    time: 0,
    speed: 0,
    verticalVelocity: 0,
    move: 0,
    strideSin: 0,
    strideCos: 1,
    breathe: 0,
  };

  constructor(colors: Partial<CharacterColors> = {}) {
    const c = { ...DEFAULT_COLORS, ...colors };
    const mat = (color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05, ...extra });

    this.materials = {
      skin: mat(c.skin),
      hair: mat(c.hair, { roughness: 0.8 }),
      shirt: mat(c.shirt),
      pants: mat(c.pants),
      boots: mat(c.boots, { roughness: 0.5 }),
      accent: mat(c.accent, { metalness: 0.6, roughness: 0.35 }),
      eyes: mat(c.eyes, { roughness: 0.2 }),
      core: mat(c.core, { emissive: c.core, emissiveIntensity: 2.5 }),
    };
    const m = this.materials;

    this.root.add(this.body);
    this.body.rotation.order = 'YXZ'; // spin (bodyYaw) around the pitched body

    // --- Hips & torso ---
    this.hips = pivot(this.body, 0, HIP_HEIGHT, 0);
    const pelvis = part(new THREE.CapsuleGeometry(0.16, 0.14, 6, 12), m.pants, this.hips);
    pelvis.rotation.z = Math.PI / 2;
    pelvis.scale.set(1, 1, 0.8);
    part(new THREE.BoxGeometry(0.44, 0.06, 0.3), m.accent, this.hips, [0, 0.1, 0]);

    this.spine = pivot(this.hips, 0, 0.05, 0);
    part(new THREE.CapsuleGeometry(0.2, 0.3, 6, 16), m.shirt, this.spine, [0, 0.28, 0]).scale.set(1.1, 1, 0.78);
    // Glowing chest core, a nod to the futuristic side of the world.
    part(new THREE.CircleGeometry(0.05, 20), m.core, this.spine, [0, 0.36, 0.162]);

    // --- Head ---
    this.head = pivot(this.spine, 0, 0.66, 0);
    part(new THREE.SphereGeometry(0.19, 24, 16), m.skin, this.head, [0, 0.2, 0]);
    const hair = part(
      new THREE.SphereGeometry(0.2, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      m.hair,
      this.head,
      [0, 0.21, 0],
    );
    hair.rotation.x = -0.3;
    for (const x of [-0.07, 0.07]) {
      part(new THREE.SphereGeometry(0.03, 12, 8), m.eyes, this.head, [x, 0.21, 0.17]).scale.y = 1.5;
    }

    // --- Arms & legs ---
    this.arms = SIDES.map((side) => {
      const shoulder = pivot(this.spine, side * 0.29, 0.5, 0);
      part(new THREE.CapsuleGeometry(0.068, 0.2, 4, 10), m.shirt, shoulder, [0, -0.16, 0]);
      const elbow = pivot(shoulder, 0, -0.32, 0);
      part(new THREE.CapsuleGeometry(0.056, 0.18, 4, 10), m.skin, elbow, [0, -0.14, 0]);
      const wrist = pivot(elbow, 0, -0.3, 0);
      part(new THREE.SphereGeometry(0.07, 12, 10), m.skin, wrist);
      return { shoulder, elbow, wrist };
    });

    this.legs = SIDES.map((side) => {
      const hip = pivot(this.hips, side * 0.1, -0.04, 0);
      part(new THREE.CapsuleGeometry(0.09, 0.24, 4, 10), m.pants, hip, [0, -0.2, 0]);
      const knee = pivot(hip, 0, -0.4, 0);
      part(new THREE.CapsuleGeometry(0.078, 0.22, 4, 10), m.boots, knee, [0, -0.19, 0]);
      const ankle = pivot(knee, 0, -0.38, 0);
      part(new THREE.BoxGeometry(0.15, 0.09, 0.27), m.boots, ankle, [0, -0.045, 0.05]);
      return { hip, knee, ankle };
    });

    // Index 0 is the +X side, which is the character's left (it faces +Z).
    this.sockets = {
      head: pivot(this.head, 0, 0.2, 0),
      neck: pivot(this.spine, 0, 0.6, 0),
      torso: pivot(this.spine, 0, 0.3, 0),
      back: pivot(this.spine, 0, 0.32, -0.17),
      leftHand: this.arms[0].wrist,
      rightHand: this.arms[1].wrist,
      leftFoot: this.legs[0].ankle,
      rightFoot: this.legs[1].ankle,
    };

    this.poses.set('ground', this.basePose);
    this.addPose('air', airPose, 8);
  }

  /** Register (or replace) a pose. It fades in when `animate` is asked for it by name. */
  addPose(name: string, pose: Pose, blendRate: number): void {
    const existing = this.poses.get(name);
    if (existing === this.basePose) throw new Error(`Can't replace the base pose "${name}"`);
    this.poses.set(name, { pose, blendRate, weight: existing?.weight ?? 0, retiring: false });
  }

  /** Remove a pose. It fades out rather than snapping. */
  removePose(name: string): void {
    const layer = this.poses.get(name);
    if (layer && layer !== this.basePose) layer.retiring = true;
  }

  /**
   * Register (or replace) an overlay: a pose for just the joints in `mask`,
   * layered over the movement pose. It fades in right away. Higher
   * `priority` overlays are applied later, so they win on shared joints.
   */
  addOverlay(name: string, pose: Pose, mask: PoseMask, blendRate: number, priority = 0): void {
    const weight = this.overlays.get(name)?.weight ?? 0;
    this.overlays.set(name, { name, pose, mask, blendRate, priority, weight, retiring: false });
    this.sortOverlays();
  }

  /** Remove an overlay. It fades out rather than snapping. */
  removeOverlay(name: string): void {
    const layer = this.overlays.get(name);
    if (layer) layer.retiring = true;
  }

  onJump(): void {
    this.squash = -0.12; // stretch
  }

  onLand(impactSpeed: number): void {
    this.squash = clamp(impactSpeed * 0.018, 0.05, 0.28);
  }

  animate(dt: number, { pose, speed, verticalVelocity }: AnimationState): void {
    this.time += dt;
    const move = clamp(speed / FULL_RUN_SPEED, 0, 1);

    // Advance the stride by distance travelled, so feet don't slide.
    const strideLength = lerp(2.2, 3.6, move);
    this.phase += (speed / strideLength) * Math.PI * 2 * dt;

    const ctx = this.ctx;
    ctx.time = this.time;
    ctx.speed = speed;
    ctx.verticalVelocity = verticalVelocity;
    ctx.move = move;
    ctx.strideSin = Math.sin(this.phase);
    ctx.strideCos = Math.cos(this.phase);
    ctx.breathe = Math.sin(this.time * 2.2) * (1 - move);

    const frame = this.blendPoses(dt, pose, ctx);
    this.applyOverlays(dt, frame, ctx);
    this.applyPose(frame);

    // Squash & stretch, springing back to neutral.
    this.squash = damp(this.squash, 0, 9, dt);
    const sq = this.squash;
    this.body.scale.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6);
  }

  /** Fade every pose's weight toward the requested one and mix them. */
  private blendPoses(dt: number, name: string, ctx: PoseContext): PoseFrame {
    const requested = this.poses.get(name);
    const active = requested && !requested.retiring ? requested : this.basePose;

    let total = 0;
    for (const [key, layer] of this.poses) {
      layer.weight = damp(layer.weight, layer === active ? 1 : 0, active.blendRate, dt);
      if (layer.retiring && layer.weight < MIN_WEIGHT) this.poses.delete(key);
      else total += layer.weight;
    }

    const out = this.blended.reset();
    for (const layer of this.poses.values()) {
      if (layer.weight < MIN_WEIGHT) continue;
      layer.pose(this.scratch.reset(), ctx);
      out.addWeighted(this.scratch, layer.weight / total);
    }
    return out;
  }

  private applyOverlays(dt: number, out: PoseFrame, ctx: PoseContext): void {
    let removed = false;
    for (const layer of this.overlayOrder) {
      layer.weight = damp(layer.weight, layer.retiring ? 0 : 1, layer.blendRate, dt);
      if (layer.retiring && layer.weight < MIN_WEIGHT) {
        this.overlays.delete(layer.name);
        removed = true;
        continue;
      }
      if (layer.weight < MIN_WEIGHT) continue;
      layer.pose(this.scratch.reset(), ctx);
      out.blendMasked(this.scratch, layer.weight, layer.mask);
    }
    if (removed) this.sortOverlays();
  }

  private sortOverlays(): void {
    this.overlayOrder = [...this.overlays.values()].sort((a, b) => a.priority - b.priority);
  }

  private applyPose(f: PoseFrame): void {
    this.legs.forEach(({ hip, knee, ankle }, i) => {
      hip.rotation.x = f.hip[i];
      knee.rotation.x = f.knee[i];
      ankle.rotation.x = -(f.hip[i] + f.knee[i]) * 0.6; // keep the foot roughly level
    });
    this.arms.forEach(({ shoulder, elbow, wrist }, i) => {
      shoulder.rotation.x = f.shoulderX[i];
      shoulder.rotation.z = f.shoulderZ[i];
      elbow.rotation.x = f.elbow[i];
      wrist.rotation.x = f.wrist[i];
    });

    this.spine.rotation.x = f.spineX;
    this.spine.rotation.y = f.spineY;
    this.hips.rotation.y = f.hipsY;
    this.hips.position.y = HIP_HEIGHT + f.hipsBob;
    this.head.rotation.x = -f.spineX * 0.6 + f.headX;

    // Pitch the whole body around the hips rather than the feet, then spin it
    // about the vertical axis through them.
    this.body.rotation.set(f.bodyPitch, f.bodyYaw, 0);
    const forward = -HIP_HEIGHT * Math.sin(f.bodyPitch);
    this.body.position.set(
      forward * Math.sin(f.bodyYaw),
      HIP_HEIGHT * (1 - Math.cos(f.bodyPitch)),
      forward * Math.cos(f.bodyYaw),
    );
  }
}
