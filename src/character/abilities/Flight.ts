import type { Character } from '../Character';
import type { Ability } from './Ability';
import { FlyMode } from '../modes/FlyMode';
import { flyPose } from '../animation/flyPose';

/**
 * Below this height while falling, Space is left for the Jump ability's
 * buffered jump instead of taking off, so landing jumps still work.
 */
const MIN_AIR_TAKEOFF_HEIGHT = 1.5;

const toggledFlight = (c: Character) => c.intent.actions.has('toggleFlight');
const jumpedMidAir = (c: Character) =>
  c.intent.jumpPressed && (c.velocity.y > 0 || c.heightAboveGround > MIN_AIR_TAKEOFF_HEIGHT);
const touchedDown = (c: Character) => c.grounded && !c.intent.ascend;

/** Take off with Space mid-air or F anywhere; land by flying into the ground or pressing F. */
export class Flight implements Ability {
  readonly id = 'flight';
  readonly label = 'Flight';
  readonly description = 'Space mid-air or F to fly · Space / C up and down · Shift to boost';

  attach(c: Character): void {
    c.stats.setBase({
      flySpeed: 10,
      flyBoostSpeed: 22,
      flyClimbSpeed: 7,
      flyAccel: 16,
      flyTakeoffSpeed: 6,
    });
    c.addMode(new FlyMode(), this.id);
    c.addPose('fly', flyPose, 6, this.id);
    c.addTransition({ from: 'fly', to: 'air', when: toggledFlight }, this.id);
    c.addTransition({ from: 'fly', to: 'ground', when: touchedDown }, this.id);
    c.addTransition({ from: ['ground', 'air'], to: 'fly', when: toggledFlight }, this.id);
    c.addTransition({ from: 'air', to: 'fly', when: jumpedMidAir }, this.id);
  }
}
