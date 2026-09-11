/** +1 for the +X side of the body, -1 for the -X side. */
export type Side = 1 | -1;

/** Limb order used by the rig and by every PoseFrame limb array. */
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
  spineX = 0;
  spineY = 0;
  hipsY = 0;
  /** Offset from the standing hip height. */
  hipsBob = 0;
  /** Head tilt on top of the automatic counter-tilt against the spine. */
  headX = 0;
  /** Tilts the whole body forward around the hips, e.g. to fly horizontally. */
  bodyPitch = 0;

  reset(): this {
    for (const pair of this.pairs()) pair.fill(0);
    this.spineX = this.spineY = this.hipsY = this.hipsBob = this.headX = this.bodyPitch = 0;
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
  }

  private pairs(): Pair[] {
    return [this.hip, this.knee, this.shoulderX, this.shoulderZ, this.elbow];
  }
}

export type Pose = (out: PoseFrame, ctx: PoseContext) => void;
