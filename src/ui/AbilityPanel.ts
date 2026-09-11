import type { Input } from '../input/Input';
import type { Character } from '../character/Character';
import type { Ability } from '../character/abilities/Ability';

/**
 * Switches abilities on and off: click a toggle (with the mouse released),
 * or press its number key while playing.
 */
export class AbilityPanel {
  private readonly character: Character;
  private readonly abilities: readonly Ability[];
  private readonly checkboxes: HTMLInputElement[];

  constructor(container: HTMLElement, character: Character, abilities: readonly Ability[]) {
    this.character = character;
    this.abilities = abilities;

    this.checkboxes = abilities.map((ability, i) => {
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.addEventListener('change', () => {
        this.toggle(ability);
        checkbox.blur(); // otherwise Space would toggle it again
      });

      const key = document.createElement('kbd');
      key.textContent = String(i + 1);
      const name = document.createElement('span');
      name.className = 'ability-name';
      name.textContent = ability.label;
      const description = document.createElement('small');
      description.textContent = ability.description;
      const text = document.createElement('span');
      text.append(name, description);

      const row = document.createElement('label');
      row.className = 'ability';
      row.append(checkbox, key, text);
      container.append(row);
      return checkbox;
    });

    character.events.on('abilityChange', () => this.sync());
    this.sync();
  }

  /** Number keys toggle abilities while the mouse is captured. */
  handleInput(input: Input): void {
    this.abilities.forEach((ability, i) => {
      if (input.wasPressed(`Digit${i + 1}`)) this.toggle(ability);
    });
  }

  private toggle(ability: Ability): void {
    if (this.character.hasAbility(ability.id)) this.character.revoke(ability.id);
    else this.character.grant(ability);
  }

  private sync(): void {
    this.abilities.forEach((ability, i) => {
      this.checkboxes[i].checked = this.character.hasAbility(ability.id);
    });
  }
}
