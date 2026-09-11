import * as THREE from 'three';

/** Gradient sky dome that follows the camera. */
export class Sky {
  constructor({ top = '#4f9de0', horizon = '#cfe6f5' } = {}) {
    this.horizonColor = new THREE.Color(horizon);
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(500, 32, 16),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          topColor: { value: new THREE.Color(top) },
          horizonColor: { value: this.horizonColor },
        },
        vertexShader: /* glsl */ `
          varying vec3 vDir;
          void main() {
            vDir = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 topColor;
          uniform vec3 horizonColor;
          varying vec3 vDir;
          void main() {
            float h = max(normalize(vDir).y, 0.0);
            gl_FragColor = vec4(mix(horizonColor, topColor, pow(h, 0.6)), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      }),
    );
    this.mesh.renderOrder = -1;
    this.mesh.frustumCulled = false;
  }

  update(cameraPosition) {
    this.mesh.position.copy(cameraPosition);
  }
}
