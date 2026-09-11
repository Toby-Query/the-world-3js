import { clamp, lerp } from '../../utils/math';
import { SIDES, type Pose } from './Pose';

/** Horizontal speed (m/s) at which the full stretched-out flying pose is reached. */
const CRUISE_SPEED = 9;

/**
 * Hovering: upright, arms out, legs treading air. Cruising: stretched out
 * horizontally with arms swept back. Climbing pitches up, diving pitches down.
 */
export const flyPose: Pose = (f, { time, speed, verticalVelocity }) => {
  const cruise = clamp(speed / CRUISE_SPEED, 0, 1);
  const climb = clamp(verticalVelocity / 7, -1, 1);
  const bob = Math.sin(time * 2.4);

  SIDES.forEach((side, i) => {
    const kick = Math.sin(time * 3 + i * Math.PI); // legs tread out of phase
    f.hip[i] = lerp(-0.3 + kick * 0.15, 0.1 + kick * 0.05, cruise);
    f.knee[i] = lerp(0.6 + kick * 0.2, 0.2, cruise);
    f.shoulderX[i] = lerp(-0.1, 0.35, cruise);
    f.shoulderZ[i] = side * lerp(0.8 + bob * 0.08, 0.2, cruise);
    f.elbow[i] = lerp(-0.4, -0.1, cruise);
  });

  f.bodyPitch = clamp(lerp(0.05, 1.25, cruise) - climb * lerp(0.15, 0.45, cruise), -0.25, 1.45);
  f.headX = -f.bodyPitch * 0.75; // keep looking where we're going
  f.spineX = 0.1 * cruise;
  f.hipsBob = bob * 0.04 * (1 - cruise);
};
