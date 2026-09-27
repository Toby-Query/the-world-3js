import * as THREE from 'three';
import type { CharacterModel } from './CharacterModel';
import type { Ability } from './abilities/Ability';
import type { Pose, PoseMask } from './animation/Pose';
import type { BodySlot } from './equipment/BodySlot';
import { Equipment } from './equipment/Equipment';
import type { MovementMode } from './modes/MovementMode';
import { GroundMode } from './modes/GroundMode';
import { AirMode } from './modes/AirMode';
import { Intent } from './Intent';
import { Stats } from './Stats';
import { Emitter } from '../utils/Emitter';
import { FLAT_WORLD, type Environment } from '../world/Environment';
import { dampAngle } from '../utils/math';

/** Source tag for what every character has built in. */
const CORE = 'core';

const BASE_STATS = {
  moveSpeed: 4.5,
  groundAccel: 45,
  groundDecel: 30,
  airAccel: 12,
  turnSpeed: 14,
  fallMultiplier: 1.4, // fall faster than you rise, feels snappier
  lowJumpMultiplier: 2.2, // release Space early for a short hop
};

export interface CharacterEvents {
  jump: { speed: number };
  land: { impact: number };
  modeChange: { from: string; to: string };
  abilityChange: { id: string; granted: boolean };
  inventoryChange: { itemId: string; owned: boolean };
  equipChange: { itemId: string; equipped: boolean; slots: readonly BodySlot[] };
}

/** A rule for switching modes. Checked in the order added; the first match wins. */
export interface Transition {
  from: string | readonly string[];
  to: string;
  when: (c: Character) => boolean;
}

interface Owned<T> {
  value: T;
  source: string;
}

/**
 * A character's body and everything it can do. Each frame:
 *   1. abilities update (start a jump, change stats...)
 *   2. at most one mode transition fires
 *   3. the active movement mode steers velocity
 *   4. shared for every mode: move, collide with the ground, turn, animate
 *
 * It is driven entirely by `intent`, so the player, NPCs and remote players
 * can all use it. Modes, transitions, stat modifiers, poses and overlays are
 * tagged with a source (an ability or item id) and removed together with it.
 */
export class Character {
  readonly model: CharacterModel;
  readonly intent = new Intent();
  readonly stats = new Stats();
  readonly events = new Emitter<CharacterEvents>();
  readonly equipment: Equipment;
  env: Environment;

  readonly position = new THREE.Vector3();
  readonly velocity = new THREE.Vector3();
  facing = Math.PI; // start facing away from the camera (-Z)
  grounded = true;

  private current: MovementMode;
  private readonly modes = new Map<string, Owned<MovementMode>>();
  private transitions: Owned<Transition>[] = [];
  private readonly poseSources = new Map<string, string>();
  private readonly overlaySources = new Map<string, string>();
  private readonly abilities = new Map<string, Ability>();

  constructor(model: CharacterModel, env: Environment = FLAT_WORLD) {
    this.model = model;
    this.env = env;
    this.stats.setBase(BASE_STATS);
    this.equipment = new Equipment(this);

    const ground = new GroundMode();
    this.current = ground;
    this.addMode(ground, CORE);
    this.addMode(new AirMode(), CORE);
    this.addTransition({ from: 'ground', to: 'air', when: (c) => !c.grounded }, CORE);
    this.addTransition({ from: 'air', to: 'ground', when: (c) => c.grounded }, CORE);

    this.events.on('jump', () => model.onJump());
    this.events.on('land', ({ impact }) => model.onLand(impact));
  }

  get mode(): MovementMode {
    return this.current;
  }

  get horizontalSpeed(): number {
    return Math.hypot(this.velocity.x, this.velocity.z);
  }

  get heightAboveGround(): number {
    return this.position.y - this.env.groundHeightAt(this.position.x, this.position.z);
  }

  /** Unit vector the character faces, on the ground plane. */
  forward(out: THREE.Vector3): THREE.Vector3 {
    return out.set(Math.sin(this.facing), 0, Math.cos(this.facing));
  }

  // --- Abilities ---

  hasAbility(id: string): boolean {
    return this.abilities.has(id);
  }

  grant(ability: Ability): void {
    if (this.abilities.has(ability.id)) return;
    this.abilities.set(ability.id, ability);
    ability.attach(this);
    this.events.emit('abilityChange', { id: ability.id, granted: true });
  }

  revoke(id: string): void {
    const ability = this.abilities.get(id);
    if (!ability) return;
    ability.detach?.(this);
    this.removeBySource(id);
    this.abilities.delete(id);
    this.events.emit('abilityChange', { id, granted: false });
  }

  // --- Building blocks abilities add ---

  addMode(mode: MovementMode, source: string): void {
    this.modes.set(mode.name, { value: mode, source });
  }

  addTransition(transition: Transition, source: string): void {
    this.transitions.push({ value: transition, source });
  }

  addPose(name: string, pose: Pose, blendRate: number, source: string): void {
    this.model.addPose(name, pose, blendRate);
    this.poseSources.set(name, source);
  }

  /** Layer a pose over some joints (see CharacterModel.addOverlay). */
  addOverlay(name: string, pose: Pose, mask: PoseMask, blendRate: number, source: string, priority = 0): void {
    this.model.addOverlay(name, pose, mask, blendRate, priority);
    this.overlaySources.set(name, source);
  }

  /** Fade an overlay out, e.g. when an attack finishes. */
  removeOverlay(name: string): void {
    this.model.removeOverlay(name);
    this.overlaySources.delete(name);
  }

  /** Remove every mode, transition, stat modifier, pose and overlay added by `source`. */
  removeBySource(source: string): void {
    this.stats.removeBySource(source);
    this.transitions = this.transitions.filter((t) => t.source !== source);
    for (const [name, owner] of this.poseSources) {
      if (owner !== source) continue;
      this.model.removePose(name);
      this.poseSources.delete(name);
    }
    for (const [name, owner] of this.overlaySources) {
      if (owner === source) this.removeOverlay(name);
    }
    for (const [name, { value, source: owner }] of this.modes) {
      if (owner !== source) continue;
      if (value === this.current) this.setMode(this.grounded ? 'ground' : 'air');
      this.modes.delete(name);
    }
  }

  setMode(name: string): void {
    const next = this.modes.get(name)?.value;
    if (!next) throw new Error(`Unknown movement mode "${name}"`);
    if (next === this.current) return;
    const prev = this.current;
    prev.exit?.(this);
    this.current = next;
    next.enter?.(this);
    this.events.emit('modeChange', { from: prev.name, to: next.name });
  }

  // --- Simulation ---

  update(dt: number): void {
    for (const ability of this.abilities.values()) ability.update?.(this, dt);
    this.applyTransitions();
    this.current.update(this, dt);
    this.integrate(dt);
    this.turn(dt);

    this.model.root.position.copy(this.position);
    this.model.root.rotation.y = this.facing;
    this.model.animate(dt, {
      pose: this.current.name,
      speed: this.horizontalSpeed,
      verticalVelocity: this.velocity.y,
    });
  }

  private applyTransitions(): void {
    const from = this.current.name;
    for (const { value: t } of this.transitions) {
      const matches = typeof t.from === 'string' ? t.from === from : t.from.includes(from);
      if (matches && t.to !== from && this.modes.has(t.to) && t.when(this)) {
        this.setMode(t.to);
        return;
      }
    }
  }

  private integrate(dt: number): void {
    const p = this.position;
    p.addScaledVector(this.velocity, dt);

    const groundY = this.env.groundHeightAt(p.x, p.z);
    if (p.y > groundY) {
      this.grounded = false;
      return;
    }
    if (!this.grounded) this.events.emit('land', { impact: -this.velocity.y });
    p.y = groundY;
    this.velocity.y = 0;
    this.grounded = true;
  }

  /** Face the direction we're trying to move. */
  private turn(dt: number): void {
    if (!this.intent.hasMove) return;
    const { move } = this.intent;
    this.facing = dampAngle(this.facing, Math.atan2(move.x, move.z), this.stats.get('turnSpeed'), dt);
  }
}
