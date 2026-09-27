import type { Input } from '../input/Input';
import type { Character } from '../character/Character';
import { describeRequests, SLOT_LABELS } from '../character/equipment/BodySlot';

/**
 * The character's inventory. Click an item (with the mouse released), or
 * press its number key while playing, to equip or unequip it. Shows the
 * slots each item needs and where it is equipped.
 */
export class GearPanel {
  private readonly character: Character;
  private readonly list: HTMLElement;
  private readonly firstKey: number;
  private rows: { id: string; checkbox: HTMLInputElement; where: HTMLElement }[] = [];

  /** Items get number keys starting at `firstKey`, up to 9. */
  constructor(container: HTMLElement, character: Character, firstKey: number) {
    this.character = character;
    this.firstKey = firstKey;
    this.list = document.createElement('div');
    container.append(this.list);

    character.events.on('inventoryChange', () => this.build());
    character.events.on('equipChange', () => this.sync());
    this.build();
  }

  handleInput(input: Input): void {
    this.rows.forEach(({ id }, i) => {
      if (input.wasPressed(`Digit${this.firstKey + i}`)) this.character.equipment.toggle(id);
    });
  }

  private build(): void {
    const { equipment } = this.character;
    this.list.replaceChildren();
    this.rows = equipment.items.map((item, i) => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.addEventListener('change', () => {
        equipment.toggle(item.id);
        checkbox.blur(); // otherwise Space would toggle it again
      });

      const key = document.createElement('kbd');
      const digit = this.firstKey + i;
      key.textContent = digit <= 9 ? String(digit) : '';
      const name = document.createElement('span');
      name.className = 'ability-name';
      name.textContent = item.label;
      const tag = document.createElement('span');
      tag.className = 'gear-tag';
      tag.textContent = `${item.kind} · ${describeRequests(item.occupies)}`;
      const description = document.createElement('small');
      description.textContent = item.description;
      const where = document.createElement('small');
      where.className = 'gear-where';
      const text = document.createElement('span');
      text.append(name, tag, description, where);

      const row = document.createElement('label');
      row.className = 'ability';
      row.append(checkbox, key, text);
      this.list.append(row);
      return { id: item.id, checkbox, where };
    });
    this.sync();
  }

  private sync(): void {
    const { equipment } = this.character;
    for (const { id, checkbox, where } of this.rows) {
      const slots = equipment.slotsOf(id);
      checkbox.checked = slots.length > 0;
      where.textContent = slots.length ? `Equipped: ${slots.map((s) => SLOT_LABELS[s]).join(', ')}` : '';
    }
  }
}
