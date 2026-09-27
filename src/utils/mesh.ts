import * as THREE from 'three';

type Vec3Tuple = [x: number, y: number, z: number];

/** An empty group at (x, y, z) under `parent`: a joint or attachment point. */
export function pivot(parent: THREE.Object3D, x: number, y: number, z: number): THREE.Group {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  parent.add(g);
  return g;
}

/** A shadow-casting mesh under `parent`. */
export function part(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  parent: THREE.Object3D,
  position?: Vec3Tuple,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (position) mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

/** Remove `object` from its parent and free the GPU resources of everything in it. */
export function disposeObject(object: THREE.Object3D): void {
  object.removeFromParent();
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.geometry.dispose();
    const materials: THREE.Material[] = Array.isArray(child.material) ? child.material : [child.material];
    for (const m of materials) m.dispose();
  });
}
