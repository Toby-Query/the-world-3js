import type * as THREE from 'three';
import type { Ability } from '../abilities/Ability';
import type { Pose, PoseMask } from '../animation/Pose';
import type { BodySlot, SlotRequest } from './BodySlot';

export type ItemKind = 'weapon' | 'tool' | 'wearable';

/**
 * Something a character can own and equip: a weapon, a tool, a relic.
 *
 * A character can own any number of items, even several that need the same
 * slot; only one item fills each slot at a time. Equipping an item pushes
 * out whatever is in its way (back into the inventory).
 */
export interface Item {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly kind: ItemKind;
  /** The slots it takes up while equipped. See SlotRequest. */
  readonly occupies: readonly SlotRequest[];
  /**
   * Called every time the item is equipped, with the slots it got (one per
   * `occupies` entry, same order). Return fresh meshes and abilities each
   * time; they are thrown away when the item is unequipped.
   */
  equip(slots: readonly BodySlot[]): Equipped;
}

/** What an item adds to the character while it is equipped. */
export interface Equipped {
  /** Meshes to attach, keyed by the slot whose socket they attach to. */
  models?: Partial<Record<BodySlot, THREE.Object3D>>;
  /** How the character holds it, layered over the movement pose. */
  hold?: Pose;
  /** Joints `hold` controls. Defaults to the arms of the hand slots it occupies. */
  holdMask?: PoseMask;
  /**
   * Granted on equip, revoked on unequip. Ids must be unique to the item,
   * e.g. `${item.id}:strike`, so they never clash with other abilities.
   */
  abilities?: Ability[];
}

/**
 * The intent action that uses whatever is in a hand: 'primary' (left mouse)
 * for the right hand, 'secondary' (right mouse) for the left.
 */
export function useAction(hand: BodySlot): string {
  return hand === 'leftHand' ? 'secondary' : 'primary';
}
