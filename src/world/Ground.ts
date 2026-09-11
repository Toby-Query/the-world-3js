import * as THREE from 'three';

const CELL = 10; // metres per texture tile (one major grid square)
const SIZE = 800; // plane size; fog hides the edge

/**
 * "Infinite" ground: a large plane that snaps to the player in whole-tile
 * steps. Because it only ever moves by a full tile, the grid pattern appears
 * fixed in the world.
 */
export class Ground {
  readonly mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;

  constructor(renderer: THREE.WebGLRenderer) {
    const texture = new THREE.CanvasTexture(drawGridTile());
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(SIZE / CELL, SIZE / CELL);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const geometry = new THREE.PlaneGeometry(SIZE, SIZE);
    geometry.rotateX(-Math.PI / 2);

    this.mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95 }));
    this.mesh.receiveShadow = true;
  }

  update(playerPosition: THREE.Vector3): void {
    this.mesh.position.x = Math.round(playerPosition.x / CELL) * CELL;
    this.mesh.position.z = Math.round(playerPosition.z / CELL) * CELL;
  }
}

function drawGridTile(): HTMLCanvasElement {
  const px = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = px;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas not supported');

  ctx.fillStyle = '#8fbf7a';
  ctx.fillRect(0, 0, px, px);

  // 1 m minor lines
  ctx.fillStyle = 'rgba(40, 80, 40, 0.18)';
  const step = px / CELL;
  for (let i = 1; i < CELL; i++) {
    const p = Math.round(i * step);
    ctx.fillRect(p - 1, 0, 2, px);
    ctx.fillRect(0, p - 1, px, 2);
  }

  // 10 m major lines on the tile edges (half on each side so they tile cleanly)
  ctx.fillStyle = 'rgba(30, 60, 30, 0.35)';
  ctx.fillRect(0, 0, 3, px);
  ctx.fillRect(px - 3, 0, 3, px);
  ctx.fillRect(0, 0, px, 3);
  ctx.fillRect(0, px - 3, px, 3);

  return canvas;
}
