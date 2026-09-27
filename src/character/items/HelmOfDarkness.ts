import * as THREE from 'three';
import type { Character } from '../Character';
import type { Ability } from '../abilities/Ability';
import type { Equipped, Item } from '../equipment/Item';
import { damp } from '../../utils/math';
import { part } from '../../utils/mesh';
import { material } from './itemParts';

/** Opacity while standing still, and while moving at full speed. */
const HIDDEN_OPACITY = 0.1;
const MOVING_OPACITY = 0.55;
const FADE_RATE = 3;

/** Hades' cap of invisibility. Head. The stiller you are, the harder you are to see. */
export class HelmOfDarkness implements Item {
  readonly id = 'helm-of-darkness';
  readonly label = 'Helm of Darkness';
  readonly description = 'Fade from sight; nearly invisible when standing still';
  readonly kind = 'wearable';
  readonly occupies = ['head'] as const;

  equip(): Equipped {
    const helm = buildHelm();
    return { models: { head: helm }, abilities: [new Unseen(`${this.id}:unseen`, helm)] };
  }
}

class Unseen implements Ability {
  readonly id: string;
  readonly label = 'Unseen';
  readonly description = 'Fade out';

  private readonly helm: THREE.Object3D;
  private opacity = 1;

  constructor(id: string, helm: THREE.Object3D) {
    this.id = id;
    this.helm = helm;
  }

  attach(c: Character): void {
    this.opacity = 1;
    for (const m of this.materials(c)) {
      m.transparent = true;
      m.needsUpdate = true;
    }
  }

  detach(c: Character): void {
    for (const m of this.materials(c)) {
      m.transparent = false;
      m.opacity = 1;
      m.needsUpdate = true;
    }
  }

  update(c: Character, dt: number): void {
    const moving = Math.min(c.horizontalSpeed / 6, 1);
    const target = HIDDEN_OPACITY + (MOVING_OPACITY - HIDDEN_OPACITY) * moving;
    this.opacity = damp(this.opacity, target, FADE_RATE, dt);
    for (const m of this.materials(c)) m.opacity = this.opacity;
  }

  /** The body's materials and the helm's own. Other gear stays visible, a telltale sign. */
  private materials(c: Character): THREE.Material[] {
    const own: THREE.Material[] = [];
    this.helm.traverse((o) => {
      if (o instanceof THREE.Mesh) own.push(o.material as THREE.Material);
    });
    return [...Object.values(c.model.materials), ...own];
  }
}

/** Dark bronze dome with a nose guard and a crest. Sits over the head (socket at its centre). */
function buildHelm(): THREE.Object3D {
  const bronze = material('#2d2a33', { metalness: 0.8, roughness: 0.35 });
  const crest = material('#5b1a2a', { metalness: 0, roughness: 0.9 });

  const g = new THREE.Group();
  const dome = part(new THREE.SphereGeometry(0.215, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55), bronze, g, [0, 0.01, 0]);
  dome.rotation.x = -0.15;
  part(new THREE.BoxGeometry(0.03, 0.12, 0.03), bronze, g, [0, -0.02, 0.2]);
  part(new THREE.BoxGeometry(0.04, 0.14, 0.34), crest, g, [0, 0.19, -0.03]);
  return g;
}
