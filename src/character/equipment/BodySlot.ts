/** A place on the body that holds at most one item at a time. */
export type BodySlot = 'head' | 'neck' | 'torso' | 'back' | 'rightHand' | 'leftHand' | 'rightFoot' | 'leftFoot';

/** A kind of slot. An item asking for a part takes any free slot of that kind. */
export type BodyPart = 'head' | 'neck' | 'torso' | 'back' | 'hand' | 'foot';

/**
 * One slot an item needs: either a part ('hand': whichever hand is free) or an
 * exact slot ('leftHand'). An item lists one entry per slot it takes up:
 *
 *   ['hand']          one hand          ['hand', 'hand']  both hands
 *   ['leftHand']      the left hand     ['foot', 'foot']  both feet
 *   ['head']          the head
 */
export type SlotRequest = BodySlot | BodyPart;

/** Slots of each part, in order of preference (the right hand is the main hand). */
export const PART_SLOTS: Record<BodyPart, readonly BodySlot[]> = {
  head: ['head'],
  neck: ['neck'],
  torso: ['torso'],
  back: ['back'],
  hand: ['rightHand', 'leftHand'],
  foot: ['rightFoot', 'leftFoot'],
};

export const SLOT_LABELS: Record<BodySlot, string> = {
  head: 'Head',
  neck: 'Neck',
  torso: 'Torso',
  back: 'Back',
  rightHand: 'Right hand',
  leftHand: 'Left hand',
  rightFoot: 'Right foot',
  leftFoot: 'Left foot',
};

const PART_NAMES: Record<BodyPart, [one: string, all: string]> = {
  head: ['Head', 'Head'],
  neck: ['Neck', 'Neck'],
  torso: ['Torso', 'Torso'],
  back: ['Back', 'Back'],
  hand: ['One hand', 'Both hands'],
  foot: ['One foot', 'Both feet'],
};

export function isBodyPart(request: SlotRequest): request is BodyPart {
  return request in PART_SLOTS;
}

/**
 * Index of the arm or leg a hand or foot slot belongs to, matching SIDES in
 * the animation code (0 = left, 1 = right), or -1 for other slots.
 */
export function limbIndex(slot: BodySlot): number {
  if (slot === 'leftHand' || slot === 'leftFoot') return 0;
  if (slot === 'rightHand' || slot === 'rightFoot') return 1;
  return -1;
}

export const isHand = (slot: BodySlot): boolean => slot === 'rightHand' || slot === 'leftHand';

/** Human-readable summary, e.g. ['hand', 'hand'] → "Both hands". */
export function describeRequests(requests: readonly SlotRequest[]): string {
  const counts = new Map<SlotRequest, number>();
  for (const r of requests) counts.set(r, (counts.get(r) ?? 0) + 1);
  return [...counts]
    .map(([r, n]) => {
      if (!isBodyPart(r)) return SLOT_LABELS[r];
      const [one, all] = PART_NAMES[r];
      return n >= PART_SLOTS[r].length ? all : n === 1 ? one : `${n} × ${r}`;
    })
    .join(' + ');
}
