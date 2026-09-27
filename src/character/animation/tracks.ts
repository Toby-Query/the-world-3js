import { lerp } from '../../utils/math';

export type Key = readonly [time: number, value: number];

/**
 * A keyframed value for timed actions: `track([0, a], [0.3, b], [0.5, c])(t)`.
 * Eases between keys (smoothstep) and holds the first/last value outside them.
 * Keys must be in time order.
 */
export function track(...keys: readonly Key[]): (t: number) => number {
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let k = 1; k < keys.length; k++) {
      const [t1, v1] = keys[k];
      if (t >= t1) continue;
      const [t0, v0] = keys[k - 1];
      const x = (t - t0) / (t1 - t0);
      return lerp(v0, v1, x * x * (3 - 2 * x));
    }
    return keys[keys.length - 1][1];
  };
}

/** Wrap an angle into (-π, π], so a full spin ends back at 0 instead of 2π. */
export const wrapAngle = (a: number): number => Math.atan2(Math.sin(a), Math.cos(a));
