import type { Character } from '../Character';
import type { Ability } from './Ability';

const COYOTE_TIME = 0.12; // can still jump just after leaving the ground
const JUMP_BUFFER_TIME = 0.12; // jump pressed just before landing still counts
const JUMP_FROM: readonly string[] = ['ground', 'air'];

/** Jump with coyote time and jump buffering. Holding for height is handled by AirMode. */
export class Jump implements Ability {
  readonly id = 'jump';
  readonly label = 'Jump';
  readonly description = 'Space to jump, hold for higher';

  private coyote = 0;
  private buffer = 0;

  attach(c: Character): void {
    c.stats.setBase({ jumpSpeed: 8.5 });
    this.coyote = 0;
    this.buffer = 0;
  }

  update(c: Character, dt: number): void {
    this.buffer = c.intent.jumpPressed ? JUMP_BUFFER_TIME : Math.max(0, this.buffer - dt);
    this.coyote = c.grounded ? COYOTE_TIME : Math.max(0, this.coyote - dt);
    if (this.buffer === 0 || this.coyote === 0 || !JUMP_FROM.includes(c.mode.name)) return;

    const speed = c.stats.get('jumpSpeed');
    c.velocity.y = speed;
    c.grounded = false;
    c.intent.jumpPressed = false; // consumed, so e.g. Flight doesn't also react to it
    this.buffer = 0;
    this.coyote = 0;
    c.events.emit('jump', { speed });
  }
}
