import { clamp, lerp } from '../../utils/math';
import { SIDES, type Pose } from './Pose';

/** Idle → walk → run, driven by the stride phase so feet don't slide. */
export const groundPose: Pose = (f, { move, strideSin: s, strideCos: c, breathe }) => {
  const legAmp = lerp(0, 0.95, move);
  const kneeAmp = lerp(0, 1.4, move);
  const armAmp = lerp(0, 1.0, move);

  SIDES.forEach((side, i) => {
    f.hip[i] = -side * s * legAmp;
    f.knee[i] = Math.max(0, side * c) * kneeAmp + 0.05 * move;
    // Arms swing opposite to the legs.
    f.shoulderX[i] = side * s * armAmp + breathe * 0.03;
    f.shoulderZ[i] = side * (0.1 + breathe * 0.02);
    f.elbow[i] = -(0.15 + 0.95 * move);
  });

  // Torso: lean into the run, counter-twist shoulders against hips, bob.
  f.spineX = 0.28 * move * move + breathe * 0.02;
  f.spineY = s * 0.18 * move;
  f.hipsY = -s * 0.1 * move;
  f.hipsBob = (Math.abs(c) - 1) * 0.07 * move;
};

/** Jumping and falling: one leg tucked, arms flung wider the faster we fall. */
export const airPose: Pose = (f, { verticalVelocity }) => {
  const falling = clamp(-verticalVelocity / 10, 0, 1);

  SIDES.forEach((side, i) => {
    // Tuck one leg forward, trail the other.
    f.hip[i] = side > 0 ? -0.9 : 0.25;
    f.knee[i] = side > 0 ? 1.3 : 0.5;
    f.shoulderX[i] = -0.4;
    f.shoulderZ[i] = side * (0.5 + 0.7 * falling);
    f.elbow[i] = -0.5;
  });

  f.spineX = 0.1;
};
