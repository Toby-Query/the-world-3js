import type { Character } from '../Character';

/**
 * Something a character can have: a power, a relic's effect, a mutation.
 *
 * attach() adds whatever the ability needs (modes, transitions, stat
 * modifiers, poses), tagged with the ability's id. Revoking the ability
 * removes everything with that tag, so detach() is only for extra cleanup.
 * The same instance may be granted again later, so attach() should reset
 * any state the ability keeps.
 */
export interface Ability {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  attach(c: Character): void;
  detach?(c: Character): void;
  /** Runs every frame, before mode transitions and movement. */
  update?(c: Character, dt: number): void;
}
