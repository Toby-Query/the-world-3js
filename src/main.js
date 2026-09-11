import * as THREE from 'three';
import { Input } from './input/Input.js';
import { CharacterModel } from './character/CharacterModel.js';
import { CharacterController } from './character/CharacterController.js';
import { ThirdPersonCamera } from './camera/ThirdPersonCamera.js';
import { Ground } from './world/Ground.js';
import { Sky } from './world/Sky.js';
import { Props } from './world/Props.js';
import { clamp } from './utils/math.js';

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.getElementById('app').appendChild(renderer.domElement);

// --- Scene ---
const scene = new THREE.Scene();
const sky = new Sky();
scene.background = sky.horizonColor;
scene.fog = new THREE.Fog(sky.horizonColor, 70, 320);
scene.add(sky.mesh);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);

// --- Lighting ---
scene.add(new THREE.HemisphereLight('#dff1ff', '#5d7a4a', 1.4));

const sun = new THREE.DirectionalLight('#fff4e0', 2.6);
const sunOffset = new THREE.Vector3(30, 50, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = sun.shadow.camera.bottom = -35;
sun.shadow.camera.right = sun.shadow.camera.top = 35;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 150;
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
scene.add(sun, sun.target);

// --- World ---
const ground = new Ground(renderer);
const props = new Props();
scene.add(ground.mesh, props.group);

// --- Player ---
const input = new Input(renderer.domElement);
const character = new CharacterModel();
scene.add(character.root);
const controller = new CharacterController(character, input);
const cameraRig = new ThirdPersonCamera(camera, input);

// --- UI ---
const startOverlay = document.getElementById('start');
const statsEl = document.getElementById('stats');
startOverlay.addEventListener('click', () => input.lockPointer());
renderer.domElement.addEventListener('click', () => input.lockPointer());
document.addEventListener('pointerlockchange', () => {
  startOverlay.hidden = input.pointerLocked;
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// --- Loop ---
const timer = new THREE.Timer();
timer.connect(document); // pauses cleanly when the tab is hidden
let fpsFrames = 0;
let fpsTime = 0;
let fps = 0;

renderer.setAnimationLoop((timestamp) => {
  timer.update(timestamp);
  // Clamp: the first frame's timestamp can precede the timer's start (negative
  // delta), and long hitches shouldn't launch the player across the map.
  const dt = clamp(timer.getDelta(), 0, 0.05);

  cameraRig.handleInput();
  controller.update(dt, cameraRig.yaw);
  cameraRig.update(dt, controller.position);

  const p = controller.position;
  ground.update(p);
  props.update(p);
  sky.update(camera.position);
  sun.position.copy(p).add(sunOffset);
  sun.target.position.copy(p);

  input.endFrame();
  renderer.render(scene, camera);

  fpsFrames++;
  fpsTime += dt;
  if (fpsTime >= 0.25) {
    fps = Math.round(fpsFrames / fpsTime);
    fpsFrames = 0;
    fpsTime = 0;
    statsEl.textContent =
      `FPS   ${fps}\n` +
      `Pos   ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}\n` +
      `Speed ${controller.horizontalSpeed.toFixed(1)} m/s\n` +
      `State ${controller.onGround ? (controller.horizontalSpeed > 0.2 ? 'moving' : 'idle') : 'airborne'}`;
  }
});
