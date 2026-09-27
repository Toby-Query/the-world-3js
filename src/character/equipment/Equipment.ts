import type { Character } from '../Character';
import { OverlayPriority, type PoseMask } from '../animation/Pose';
import { disposeObject } from '../../utils/mesh';
import type { Equipped, Item } from './Item';
import { isBodyPart, isHand, limbIndex, PART_SLOTS, type BodySlot, type SlotRequest } from './BodySlot';

/** How quickly the character eases into holding an item. */
const HOLD_BLEND_RATE = 10;

interface Worn {
  item: Item;
  slots: readonly BodySlot[];
  equipped: Equipped;
}

/**
 * A character's inventory and what is equipped from it.
 *
 * Owning is unlimited; equipping is limited by body slots. Equipping an item
 * unequips whatever already fills the slots it needs, preferring free slots
 * first (so a second one-handed weapon goes in the empty hand rather than
 * replacing the first).
 */
export class Equipment {
  private readonly character: Character;
  private readonly owned = new Map<string, Item>();
  private readonly worn = new Map<string, Worn>();
  private readonly bySlot = new Map<BodySlot, Worn>();

  constructor(character: Character) {
    this.character = character;
  }

  /** Everything owned, in the order it was received. */
  get items(): Item[] {
    return [...this.owned.values()];
  }

  owns(id: string): boolean {
    return this.owned.has(id);
  }

  isEquipped(id: string): boolean {
    return this.worn.has(id);
  }

  /** The slots an equipped item fills, or [] if it isn't equipped. */
  slotsOf(id: string): readonly BodySlot[] {
    return this.worn.get(id)?.slots ?? [];
  }

  /** The item filling a slot, if any. */
  inSlot(slot: BodySlot): Item | undefined {
    return this.bySlot.get(slot)?.item;
  }

  give(item: Item): void {
    if (this.owned.has(item.id)) return;
    this.owned.set(item.id, item);
    this.character.events.emit('inventoryChange', { itemId: item.id, owned: true });
  }

  /** Remove an item from the inventory, unequipping it first. */
  take(id: string): void {
    if (!this.owned.has(id)) return;
    this.unequip(id);
    this.owned.delete(id);
    this.character.events.emit('inventoryChange', { itemId: id, owned: false });
  }

  equip(id: string): void {
    const item = this.owned.get(id);
    if (!item) throw new Error(`Can't equip "${id}": not owned`);
    if (this.worn.has(id)) return;

    const slots = this.resolveSlots(item.occupies);
    for (const slot of slots) {
      const blocking = this.bySlot.get(slot);
      if (blocking) this.unequip(blocking.item.id);
    }

    const c = this.character;
    const equipped = item.equip(slots);
    const worn: Worn = { item, slots, equipped };
    this.worn.set(id, worn);
    for (const slot of slots) this.bySlot.set(slot, worn);

    for (const [slot, model] of Object.entries(equipped.models ?? {})) {
      c.model.sockets[slot as BodySlot].add(model);
    }
    if (equipped.hold) {
      const mask = equipped.holdMask ?? handsMask(slots);
      c.addOverlay(`${id}:hold`, equipped.hold, mask, HOLD_BLEND_RATE, id, OverlayPriority.hold);
    }
    for (const ability of equipped.abilities ?? []) c.grant(ability);

    c.events.emit('equipChange', { itemId: id, equipped: true, slots });
  }

  unequip(id: string): void {
    const worn = this.worn.get(id);
    if (!worn) return;
    const c = this.character;
    const { equipped, slots } = worn;

    for (const ability of equipped.abilities ?? []) c.revoke(ability.id);
    c.removeBySource(id);
    for (const model of Object.values(equipped.models ?? {})) disposeObject(model);

    this.worn.delete(id);
    for (const slot of slots) this.bySlot.delete(slot);
    c.events.emit('equipChange', { itemId: id, equipped: false, slots });
  }

  toggle(id: string): void {
    if (this.worn.has(id)) this.unequip(id);
    else this.equip(id);
  }

  /** Pick a slot for each request: exact slots first, then free slots of each part. */
  private resolveSlots(requests: readonly SlotRequest[]): BodySlot[] {
    const slots = new Array<BodySlot>(requests.length);
    const taken = new Set<BodySlot>();
    requests.forEach((r, i) => {
      if (isBodyPart(r)) return;
      if (taken.has(r)) throw new Error(`Slot "${r}" requested twice`);
      slots[i] = r;
      taken.add(r);
    });
    requests.forEach((r, i) => {
      if (!isBodyPart(r)) return;
      const open = PART_SLOTS[r].filter((s) => !taken.has(s));
      if (open.length === 0) throw new Error(`Not enough "${r}" slots for this item`);
      const slot = open.find((s) => !this.bySlot.has(s)) ?? open[0];
      slots[i] = slot;
      taken.add(slot);
    });
    return slots;
  }
}

function handsMask(slots: readonly BodySlot[]): PoseMask {
  return { arms: slots.filter(isHand).map(limbIndex) };
}
