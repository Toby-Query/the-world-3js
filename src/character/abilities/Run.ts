import type { Character } from '../Character';
import type { Ability } from './Ability';

const RUN_MULTIPLIER = 2; // 4.5 m/s walk → 9 m/s run

/** Hold sprint to move faster, on the ground and in the air. */
export class Run implements Ability {
  readonly id = 'run';
  readonly label = 'Run';
  readonly description = 'Hold Shift to move twice as fast';

  private running = false;

  attach(): void {
    this.running = false;
  }

  update(c: Character): void {
    if (c.intent.sprint === this.running) return;
    this.running = c.intent.sprint;
    if (this.running) c.stats.modify('moveSpeed', this.id, { mul: RUN_MULTIPLIER });
    else c.stats.remove('moveSpeed', this.id);
  }
}
