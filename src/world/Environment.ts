/**
 * The physical rules where a character is. Zones can hand out their own
 * (low-gravity islands, space, uneven terrain) instead of the defaults.
 */
export interface Environment {
  gravity: number;
  groundHeightAt(x: number, z: number): number;
}

/** The prototype world: flat ground at y = 0. Gravity is tuned for feel, not 9.8. */
export const FLAT_WORLD: Environment = {
  gravity: 25,
  groundHeightAt: () => 0,
};
