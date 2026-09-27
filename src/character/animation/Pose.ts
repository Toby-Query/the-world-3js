import { lerp } from '../../utils/math';

/** +1 for the +X side of the body, -1 for the -X side. */
export type Side = 1 | -1;

/**
 * Limb order used by the rig and by every PoseFrame limb array. The model
 * faces +Z, so index 0 (+X) is its left and index 1 (-X) its right.
 */
export const SIDES: readonly Side[] = [1, -1];

/** Per-frame motion info a pose can react to. */
export interface PoseContext {
  time: number;
  /** Horizontal speed, m/s. */
  speed: number;
  verticalVelocity: number;
  /** Gait: 0 = idle, 0.5 ≈ walk, 1 = full run. */
  move: number;
  /** sin/cos of the stride phase, which advances with distance travelled. */
  strideSin: number;
  strideCos: number;
  /** Idle breathing, fades out as the character moves. */
  breathe: number;
}

/**
 * Which joints an overlay pose controls. Everything else keeps the pose
 * underneath, so e.g. a sword swing on the right arm plays over running legs.
 */
export interface PoseMask {
  /** Arm indices (see SIDES): shoulder, elbow and wrist. */
  arms?: readonly number[];
  /** Leg indices (see SIDES): hip and knee. */
  legs?: readonly number[];
  /** spineX, spineY, hipsY and headX. */
  torso?: boolean;
  /** bodyPitch, bodyYaw and hipsBob. */
  body?: boolean;
}

/** Overlays are applied lowest first, so higher ones win on shared joints. */
export const OverlayPriority = {
  /** An equipped item's grip, e.g. a shield held forward. */
  hold: 0,
  /** One-shot or held actions, e.g. a swing or a block. */
  action: 10,
} as const;

type Pair = [number, number];

/**
 * Target joint angles (radians) for one pose. Limb arrays are indexed like
 * SIDES. Every field is reset to 0 before a pose writes it, so poses only
 * set what they use.
 */
export class PoseFrame {
  readonly hip: Pair = [0, 0];
  readonly knee: Pair = [0, 0];
  readonly shoulderX: Pair = [0, 0];
  readonly shoulderZ: Pair = [0, 0];
  readonly elbow: Pair = [0, 0];
  /** Tilts the hand (and anything held in it) forward and back, like elbow. */
  readonly wrist: Pair = [0, 0];
  spineX = 0;
  spineY = 0;
  hipsY = 0;
  /** Offset from the standing hip height. */
  hipsBob = 0;
  /** Head tilt on top of the automatic counter-tilt against the spine. */
  headX = 0;
  /** Tilts the whole body forward around the hips, e.g. to fly horizontally. */
  bodyPitch = 0;
  /** Turns the whole body about the vertical axis, e.g. a spin attack. */
  bodyYaw = 0;

  reset(): this {
    for (const pair of this.pairs()) pair.fill(0);
    this.spineX = this.spineY = this.hipsY = this.hipsBob = this.headX = this.bodyPitch = this.bodyYaw = 0;
    return this;
  }

  addWeighted(src: PoseFrame, w: number): void {
    const dst = this.pairs();
    const from = src.pairs();
    for (let p = 0; p < dst.length; p++) {
      dst[p][0] += from[p][0] * w;
      dst[p][1] += from[p][1] * w;
    }
    this.spineX += src.spineX * w;
    this.spineY += src.spineY * w;
    this.hipsY += src.hipsY * w;
    this.hipsBob += src.hipsBob * w;
    this.headX += src.headX * w;
    this.bodyPitch += src.bodyPitch * w;
    this.bodyYaw += src.bodyYaw * w;
  }

  /** Move the joints in `mask` toward `src` by `w` (0 = keep this, 1 = take src). */
  blendMasked(src: PoseFrame, w: number, mask: PoseMask): void {
    for (const i of mask.arms ?? []) {
      this.shoulderX[i] = lerp(this.shoulderX[i], src.shoulderX[i], w);
      this.shoulderZ[i] = lerp(this.shoulderZ[i], src.shoulderZ[i], w);
      this.elbow[i] = lerp(this.elbow[i], src.elbow[i], w);
      this.wrist[i] = lerp(this.wrist[i], src.wrist[i], w);
    }
    for (const i of mask.legs ?? []) {
      this.hip[i] = lerp(this.hip[i], src.hip[i], w);
      this.knee[i] = lerp(this.knee[i], src.knee[i], w);
    }
    if (mask.torso) {
      this.spineX = lerp(this.spineX, src.spineX, w);
      this.spineY = lerp(this.spineY, src.spineY, w);
      this.hipsY = lerp(this.hipsY, src.hipsY, w);
      this.headX = lerp(this.headX, src.headX, w);
    }
    if (mask.body) {
      this.bodyPitch = lerp(this.bodyPitch, src.bodyPitch, w);
      this.bodyYaw = lerp(this.bodyYaw, src.bodyYaw, w);
      this.hipsBob = lerp(this.hipsBob, src.hipsBob, w);
    }
  }

  private pairs(): Pair[] {
    return [this.hip, this.knee, this.shoulderX, this.shoulderZ, this.elbow, this.wrist];
  }
}

export type Pose = (out: PoseFrame, ctx: PoseContext) => void;
