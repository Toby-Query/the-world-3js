export interface StatModifier {
  /** Added to the base value. */
  add?: number;
  /** Multiplies the total after additions. */
  mul?: number;
}

/**
 * Named numbers (speeds, accelerations...) with modifiers layered on top.
 * Each modifier is tagged with its source, such as an ability or item id, so
 * it can be removed exactly when that source goes away.
 */
export class Stats {
  private readonly base = new Map<string, number>();
  /** stat name → source → modifier */
  private readonly modifiers = new Map<string, Map<string, StatModifier>>();

  setBase(values: Record<string, number>): void {
    for (const [name, value] of Object.entries(values)) this.base.set(name, value);
  }

  get(name: string): number {
    const base = this.base.get(name);
    if (base === undefined) throw new Error(`Unknown stat "${name}"`);
    const mods = this.modifiers.get(name);
    if (!mods) return base;
    let add = 0;
    let mul = 1;
    for (const m of mods.values()) {
      add += m.add ?? 0;
      mul *= m.mul ?? 1;
    }
    return (base + add) * mul;
  }

  /** Set `source`'s modifier on a stat, replacing any it already had there. */
  modify(name: string, source: string, modifier: StatModifier): void {
    const mods = this.modifiers.get(name) ?? new Map<string, StatModifier>();
    mods.set(source, modifier);
    this.modifiers.set(name, mods);
  }

  remove(name: string, source: string): void {
    this.modifiers.get(name)?.delete(source);
  }

  removeBySource(source: string): void {
    for (const mods of this.modifiers.values()) mods.delete(source);
  }
}
