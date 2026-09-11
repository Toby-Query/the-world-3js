import * as THREE from 'three';
import { clamp, damp, lerp } from '../utils/math.js';

const HIP_HEIGHT = 0.91;

const DEFAULT_COLORS = {
  skin: '#e8b48f',
  hair: '#2b1d14',
  shirt: '#3f7fd9',
  pants: '#2d3142',
  boots: '#6b4430',
  accent: '#f2b134',
  eyes: '#1a1a22',
  core: '#5ff3ff',
};

/**
 * Prototype character built from primitives, arranged as a joint hierarchy
 * (hips → spine → head/shoulders, hips → legs) so it can be animated
 * procedurally. Faces +Z. `root` sits at the feet.
 *
 * The joints are named and grouped the way a skinned rig would be, so this
 * can later be swapped for a real model without changing the controller.
 */
export class CharacterModel {
  constructor(colors = {}) {
    const c = { ...DEFAULT_COLORS, ...colors };
    const mat = (color, extra = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.05, ...extra });

    this.materials = {
      skin: mat(c.skin),
      hair: mat(c.hair, { roughness: 0.8 }),
      shirt: mat(c.shirt),
      pants: mat(c.pants),
      boots: mat(c.boots, { roughness: 0.5 }),
      accent: mat(c.accent, { metalness: 0.6, roughness: 0.35 }),
      eyes: mat(c.eyes, { roughness: 0.2 }),
      core: mat(c.core, { emissive: c.core, emissiveIntensity: 2.5 }),
    };
    const m = this.materials;

    this.root = new THREE.Group(); // world position + facing
    this.body = new THREE.Group(); // squash & stretch
    this.root.add(this.body);

    // --- Hips & torso ---
    this.hips = pivot(this.body, 0, HIP_HEIGHT, 0);
    const pelvis = part(new THREE.CapsuleGeometry(0.16, 0.14, 6, 12), m.pants, this.hips);
    pelvis.rotation.z = Math.PI / 2;
    pelvis.scale.set(1, 1, 0.8);
    part(new THREE.BoxGeometry(0.44, 0.06, 0.3), m.accent, this.hips, [0, 0.1, 0]);

    this.spine = pivot(this.hips, 0, 0.05, 0);
    part(new THREE.CapsuleGeometry(0.2, 0.3, 6, 16), m.shirt, this.spine, [0, 0.28, 0]).scale.set(
      1.1,
      1,
      0.78,
    );
    // Glowing chest core, a nod to the futuristic side of the world.
    part(new THREE.CircleGeometry(0.05, 20), m.core, this.spine, [0, 0.36, 0.162]);

    // --- Head ---
    this.head = pivot(this.spine, 0, 0.66, 0);
    part(new THREE.SphereGeometry(0.19, 24, 16), m.skin, this.head, [0, 0.2, 0]);
    const hair = part(
      new THREE.SphereGeometry(0.2, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      m.hair,
      this.head,
      [0, 0.21, 0],
    );
    hair.rotation.x = -0.3;
    for (const x of [-0.07, 0.07]) {
      part(new THREE.SphereGeometry(0.03, 12, 8), m.eyes, this.head, [x, 0.21, 0.17]).scale.y = 1.5;
    }

    // --- Arms & legs (index 0 = +X side, 1 = -X side) ---
    this.arms = [1, -1].map((side) => {
      const shoulder = pivot(this.spine, side * 0.29, 0.5, 0);
      part(new THREE.CapsuleGeometry(0.068, 0.2, 4, 10), m.shirt, shoulder, [0, -0.16, 0]);
      const elbow = pivot(shoulder, 0, -0.32, 0);
      part(new THREE.CapsuleGeometry(0.056, 0.18, 4, 10), m.skin, elbow, [0, -0.14, 0]);
      part(new THREE.SphereGeometry(0.07, 12, 10), m.skin, elbow, [0, -0.3, 0]);
      return { side, shoulder, elbow };
    });

    this.legs = [1, -1].map((side) => {
      const hip = pivot(this.hips, side * 0.1, -0.04, 0);
      part(new THREE.CapsuleGeometry(0.09, 0.24, 4, 10), m.pants, hip, [0, -0.2, 0]);
      const knee = pivot(hip, 0, -0.4, 0);
      part(new THREE.CapsuleGeometry(0.078, 0.22, 4, 10), m.boots, knee, [0, -0.19, 0]);
      const ankle = pivot(knee, 0, -0.38, 0);
      part(new THREE.BoxGeometry(0.15, 0.09, 0.27), m.boots, ankle, [0, -0.045, 0.05]);
      return { side, hip, knee, ankle };
    });

    // Animation state
    this.phase = 0;
    this.time = 0;
    this.airBlend = 0;
    this.squash = 0;
  }

  onJump() {
    this.squash = -0.12; // stretch
  }

  onLand(impactSpeed) {
    this.squash = clamp(impactSpeed * 0.018, 0.05, 0.28);
  }

  /**
   * @param {number} dt
   * @param {{ speed: number, runSpeed: number, onGround: boolean, verticalVelocity: number }} state
   */
  animate(dt, { speed, runSpeed, onGround, verticalVelocity }) {
    this.time += dt;
    const move = clamp(speed / runSpeed, 0, 1); // 0 = idle, 0.5 ≈ walk, 1 = full run

    // Advance the stride by distance travelled, so feet don't slide.
    const strideLength = lerp(2.2, 3.6, move);
    this.phase += (speed / strideLength) * Math.PI * 2 * dt;
    const s = Math.sin(this.phase);
    const c = Math.cos(this.phase);

    this.airBlend = damp(this.airBlend, onGround ? 0 : 1, onGround ? 20 : 8, dt);
    const air = this.airBlend;
    const falling = clamp(-verticalVelocity / 10, 0, 1);

    const legAmp = lerp(0, 0.95, move);
    const kneeAmp = lerp(0, 1.4, move);
    const armAmp = lerp(0, 1.0, move);
    const breathe = Math.sin(this.time * 2.2) * (1 - move);

    // Legs
    for (const { side, hip, knee, ankle } of this.legs) {
      const groundHip = -side * s * legAmp;
      const groundKnee = Math.max(0, side * c) * kneeAmp + 0.05 * move;
      // Tuck one leg forward, trail the other.
      const airHip = side > 0 ? -0.9 : 0.25;
      const airKnee = side > 0 ? 1.3 : 0.5;

      hip.rotation.x = lerp(groundHip, airHip, air);
      knee.rotation.x = lerp(groundKnee, airKnee, air);
      ankle.rotation.x = -(hip.rotation.x + knee.rotation.x) * 0.6;
    }

    // Arms swing opposite to the legs.
    for (const { side, shoulder, elbow } of this.arms) {
      const groundSwing = side * s * armAmp + breathe * 0.03;
      const groundOut = side * (0.1 + breathe * 0.02);
      const airSwing = -0.4;
      const airOut = side * (0.5 + 0.7 * falling);

      shoulder.rotation.x = lerp(groundSwing, airSwing, air);
      shoulder.rotation.z = lerp(groundOut, airOut, air);
      elbow.rotation.x = lerp(-(0.15 + 0.95 * move), -0.5, air);
    }

    // Torso: lean into the run, counter-twist shoulders against hips, bob.
    const lean = 0.28 * move * move;
    this.spine.rotation.x = lerp(lean + breathe * 0.02, 0.1, air);
    this.spine.rotation.y = s * 0.18 * move * (1 - air);
    this.hips.rotation.y = -s * 0.1 * move * (1 - air);
    this.hips.position.y = HIP_HEIGHT + (Math.abs(c) - 1) * 0.07 * move * (1 - air);
    this.head.rotation.x = -this.spine.rotation.x * 0.6;

    // Squash & stretch, springing back to neutral.
    this.squash = damp(this.squash, 0, 9, dt);
    const sq = this.squash;
    this.body.scale.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6);
  }
}

function pivot(parent, x, y, z) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

function part(geometry, material, parent, position) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (position) mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}
