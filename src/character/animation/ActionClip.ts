import type { Character } from '../Character';
import { OverlayPriority, type PoseContext, type PoseFrame, type PoseMask } from './Pose';

/** Writes the clip's pose at progress `t` (0 → 1). */
export type ClipPose = (out: PoseFrame, ctx: PoseContext, t: number) => void;

/**
 * A one-shot animation an ability plays, such as a swing. It is layered over
 * the movement pose on just the joints in `mask`, and fades back out when it
 * ends. The ability owns the clip and calls update() every frame.
 *
 *   if (pressed && !clip.playing) clip.play(c, this.id);
 *   clip.update(c, dt);
 *   if (clip.crossed(0.4)) { ...the hit lands... }
 */
export class ActionClip {
  readonly name: string;
  readonly duration: number;
  playing = false;

  private readonly pose: ClipPose;
  private readonly mask: PoseMask;
  private readonly blendRate: number;
  private elapsed = 0;
  private prevT = 0;

  constructor(name: string, duration: number, mask: PoseMask, pose: ClipPose, blendRate = 22) {
    this.name = name;
    this.duration = duration;
    this.mask = mask;
    this.pose = pose;
    this.blendRate = blendRate;
  }

  /** Progress, 0 → 1. */
  get t(): number {
    return Math.min(this.elapsed / this.duration, 1);
  }

  /** Start (or restart) the clip. `source` tags the overlay, usually the ability id. */
  play(c: Character, source: string): void {
    this.elapsed = 0;
    this.prevT = 0;
    this.playing = true;
    c.addOverlay(this.name, (f, ctx) => this.pose(f, ctx, this.t), this.mask, this.blendRate, source, OverlayPriority.action);
  }

  stop(c: Character): void {
    if (!this.playing) return;
    this.playing = false;
    c.removeOverlay(this.name);
  }

  update(c: Character, dt: number): void {
    this.prevT = this.t;
    if (!this.playing) return;
    this.elapsed += dt;
    if (this.elapsed >= this.duration) this.stop(c);
  }

  /** True on the one frame progress passes `at`, e.g. the moment a swing lands. */
  crossed(at: number): boolean {
    return this.prevT < at && this.t >= at;
  }
}
