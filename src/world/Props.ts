import * as THREE from 'three';

const CHUNK_SIZE = 32;
const VIEW_RADIUS = 5; // chunks in each direction
const SPAWN_CLEAR_RADIUS = 24; // keep the spawn point open

type Random = () => number;

/**
 * Landmarks scattered procedurally in chunks around the player, so movement
 * is visible on the flat plane. Chunks are seeded by their coordinates: the
 * same spot always gets the same props, whenever you come back.
 * Purely visual for now (no collision).
 */
export class Props {
  readonly group = new THREE.Group();
  private readonly chunks = new Map<string, THREE.Group>();

  private readonly geometries = {
    rock: new THREE.DodecahedronGeometry(1, 0),
    trunk: new THREE.CylinderGeometry(0.15, 0.22, 1, 8).translate(0, 0.5, 0),
    crown: new THREE.ConeGeometry(1, 2.2, 8).translate(0, 1.1, 0),
    box: new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0),
    screen: new THREE.PlaneGeometry(1, 1),
    crystal: new THREE.OctahedronGeometry(1, 0),
  };

  private readonly materials = {
    rock: new THREE.MeshStandardMaterial({ color: '#8d96a3', roughness: 0.9, flatShading: true }),
    trunk: new THREE.MeshStandardMaterial({ color: '#7a5236', roughness: 0.9 }),
    crown: new THREE.MeshStandardMaterial({ color: '#4f9a4a', roughness: 0.8, flatShading: true }),
    pillar: new THREE.MeshStandardMaterial({ color: '#6b7590', roughness: 0.45, metalness: 0.1 }),
    screen: new THREE.MeshStandardMaterial({ color: '#000', emissive: '#39d0ff', emissiveIntensity: 1.6 }),
    crystal: new THREE.MeshStandardMaterial({
      color: '#b58cff',
      emissive: '#7a3cff',
      emissiveIntensity: 0.6,
      roughness: 0.15,
      flatShading: true,
    }),
  };

  update(playerPosition: THREE.Vector3): void {
    const pcx = Math.floor(playerPosition.x / CHUNK_SIZE);
    const pcz = Math.floor(playerPosition.z / CHUNK_SIZE);

    for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
      for (let dz = -VIEW_RADIUS; dz <= VIEW_RADIUS; dz++) {
        const key = `${pcx + dx},${pcz + dz}`;
        if (!this.chunks.has(key)) {
          const chunk = this.buildChunk(pcx + dx, pcz + dz);
          this.chunks.set(key, chunk);
          this.group.add(chunk);
        }
      }
    }

    // Unload a little beyond the view radius to avoid thrashing at borders.
    for (const [key, chunk] of this.chunks) {
      const [cx, cz] = key.split(',').map(Number);
      if (Math.abs(cx - pcx) > VIEW_RADIUS + 1 || Math.abs(cz - pcz) > VIEW_RADIUS + 1) {
        chunk.removeFromParent();
        this.chunks.delete(key);
      }
    }
  }

  private buildChunk(cx: number, cz: number): THREE.Group {
    const rand = mulberry32(hash2(cx, cz));
    const chunk = new THREE.Group();
    const count = 2 + Math.floor(rand() * 4);

    for (let i = 0; i < count; i++) {
      const x = (cx + rand()) * CHUNK_SIZE;
      const z = (cz + rand()) * CHUNK_SIZE;
      const roll = rand();
      if (Math.hypot(x, z) < SPAWN_CLEAR_RADIUS) continue;

      let prop: THREE.Object3D;
      if (roll < 0.4) prop = this.makeRock(rand);
      else if (roll < 0.75) prop = this.makeTree(rand);
      else if (roll < 0.9) prop = this.makePillar(rand);
      else prop = this.makeCrystal(rand);

      prop.position.x += x;
      prop.position.z += z;
      prop.rotation.y = rand() * Math.PI * 2;
      chunk.add(prop);
    }
    return chunk;
  }

  private makeRock(rand: Random): THREE.Object3D {
    const s = 0.5 + rand() * 1.5;
    const rock = this.mesh('rock', 'rock');
    rock.scale.set(s * (0.8 + rand() * 0.6), s * (0.5 + rand() * 0.4), s * (0.8 + rand() * 0.6));
    rock.position.y = rock.scale.y * 0.4;
    return rock;
  }

  private makeTree(rand: Random): THREE.Object3D {
    const tree = new THREE.Group();
    const h = 1.5 + rand() * 2;
    const trunk = this.mesh('trunk', 'trunk');
    trunk.scale.y = h;
    const crown = this.mesh('crown', 'crown');
    crown.position.y = h * 0.8;
    crown.scale.setScalar(1 + rand() * 0.8);
    tree.add(trunk, crown);
    return tree;
  }

  /** A little tower with a glowing screen, a stand-in for the city's always-on screens. */
  private makePillar(rand: Random): THREE.Object3D {
    const pillar = new THREE.Group();
    const h = 3 + rand() * 5;
    const w = 1.2 + rand() * 1.2;
    const body = this.mesh('box', 'pillar');
    body.scale.set(w, h, w);
    const screen = this.mesh('screen', 'screen');
    screen.castShadow = false;
    screen.scale.set(w * 0.8, h * 0.35, 1);
    screen.position.set(0, h * 0.65, w / 2 + 0.01);
    pillar.add(body, screen);
    return pillar;
  }

  private makeCrystal(rand: Random): THREE.Object3D {
    const crystal = this.mesh('crystal', 'crystal');
    const s = 0.6 + rand() * 0.8;
    crystal.scale.set(s * 0.6, s * 1.6, s * 0.6);
    crystal.position.y = s * 1.4;
    return crystal;
  }

  private mesh(geometry: keyof Props['geometries'], material: keyof Props['materials']): THREE.Mesh {
    const m = new THREE.Mesh(this.geometries[geometry], this.materials[material]);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }
}

function hash2(x: number, z: number): number {
  let h = Math.imul(x, 0x27d4eb2d) ^ Math.imul(z, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}

function mulberry32(seed: number): Random {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
