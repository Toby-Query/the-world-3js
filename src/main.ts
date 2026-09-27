import * as THREE from 'three';
import { Input } from './input/Input';
import { readKeyboardIntent } from './input/KeyboardIntent';
import { CharacterModel } from './character/CharacterModel';
import { Character } from './character/Character';
import { Run } from './character/abilities/Run';
import { Jump } from './character/abilities/Jump';
import { Flight } from './character/abilities/Flight';
import { Mjolnir } from './character/items/Mjolnir';
import { RuyiJinguBang } from './character/items/RuyiJinguBang';
import { Aegis } from './character/items/Aegis';
import { Bashosen } from './character/items/Bashosen';
import { Talaria } from './character/items/Talaria';
import { HelmOfDarkness } from './character/items/HelmOfDarkness';
import { ThirdPersonCamera } from './camera/ThirdPersonCamera';
import { AbilityPanel } from './ui/AbilityPanel';
import { GearPanel } from './ui/GearPanel';
import { Ground } from './world/Ground';
import { Sky } from './world/Sky';
import { Props } from './world/Props';
import { clamp } from './utils/math';

function getElement(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing #${id} in index.html`);
  return el;
}

// --- Renderer ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
getElement('app').appendChild(renderer.domElement);

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
const model = new CharacterModel();
scene.add(model.root);
const character = new Character(model);
const abilities = [new Run(), new Jump(), new Flight()];
for (const ability of abilities) character.grant(ability);
const items = [new Mjolnir(), new Aegis(), new RuyiJinguBang(), new Bashosen(), new Talaria(), new HelmOfDarkness()];
for (const item of items) character.equipment.give(item);
character.equipment.equip('mjolnir');
character.equipment.equip('aegis');
const cameraRig = new ThirdPersonCamera(camera, input);

// --- UI ---
const startOverlay = getElement('start');
const statsEl = getElement('stats');
const abilityPanel = new AbilityPanel(getElement('abilities'), character, abilities);
const gearPanel = new GearPanel(getElement('gear'), character, abilities.length + 1);
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
  abilityPanel.handleInput(input);
  gearPanel.handleInput(input);
  readKeyboardIntent(input, cameraRig.yaw, character.intent);
  character.update(dt);
  cameraRig.update(dt, character.position);

  const p = character.position;
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
    const speed = character.horizontalSpeed;
    statsEl.textContent =
      `FPS   ${fps}\n` +
      `Pos   ${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}\n` +
      `Speed ${speed.toFixed(1)} m/s\n` +
      `Mode  ${character.mode.name}${speed > 0.2 ? ' · moving' : ''}`;
  }
});
