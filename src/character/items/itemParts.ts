import * as THREE from 'three';

export const material = (color: THREE.ColorRepresentation, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.3, ...extra });

export const glow = (color: THREE.ColorRepresentation, intensity = 2) =>
  new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity });

/**
 * A group for a hand socket whose +Y runs out of the fist, pointing forward
 * when the arm hangs. Build handles along +Y with the grip at the origin; the
 * wrist then tilts the whole thing.
 */
export function grip(): THREE.Group {
  const g = new THREE.Group();
  g.rotation.x = Math.PI / 2;
  return g;
}
