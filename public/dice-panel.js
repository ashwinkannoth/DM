import * as THREE from './vendor/three/three.module.js';
import { GLTFLoader } from './vendor/three/GLTFLoader.js';

const canvas = document.getElementById('diceCanvas');
const overlay = document.getElementById('diceOverlay');
const resultNode = document.getElementById('diceResult');
const buttons = document.querySelectorAll('.dice-buttons button');

if (!canvas || !overlay || !resultNode) {
  throw new Error('Dice panel elements missing');
}

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
camera.position.set(0, 6, 12);

const ambient = new THREE.AmbientLight(0xffffff, 0.6);
const directional = new THREE.DirectionalLight(0xffffff, 0.65);
directional.position.set(5, 12, 8);
scene.add(ambient, directional);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x0d1426, roughness: 0.9 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.2;
ground.receiveShadow = true;
scene.add(ground);

const loader = new GLTFLoader();
const diceDefinitions = {
  d4: { sides: 4, path: 'dice/d4.glb', position: new THREE.Vector3(-4.5, 0, 0), scale: 1.2 },
  d6: { sides: 6, path: 'dice/d6.glb', position: new THREE.Vector3(-1.5, 0, 0), scale: 1.2 },
  d8: { sides: 8, path: 'dice/d8.glb', position: new THREE.Vector3(1.4, 0, 0), scale: 1.2 },
  d10: { sides: 10, path: 'dice/d10.glb', position: new THREE.Vector3(4.4, 0, 0), scale: 1.2 },
  d12: { sides: 12, path: 'dice/d12.glb', position: new THREE.Vector3(7.4, 0, 0), scale: 1.2 },
  d20: { sides: 20, path: 'dice/d20.glb', position: new THREE.Vector3(10.4, 0, 0), scale: 1.2 },
};

const diceObjects = {};
const rollStates = {};

async function loadDice() {
  let loadedCount = 0;
  const promises = Object.entries(diceDefinitions).map(([type, def]) => new Promise((resolve) => {
    loader.load(def.path, (gltf) => {
      const die = gltf.scene;
      die.position.copy(def.position);
      die.scale.setScalar(def.scale);
      die.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      scene.add(die);
      diceObjects[type] = die;
      loadedCount += 1;
      resolve(type);
    }, undefined, () => {
      overlay.textContent = 'Place GLB dice files into /dice to load models.';
      resolve(null);
    });
  }));

  await Promise.all(promises);
  if (loadedCount > 0) {
    overlay.textContent = 'Awaiting your roll.';
  }
}

function updateResult(type, value) {
  overlay.textContent = `${type.toUpperCase()} → ${value}`;
  resultNode.textContent = `Result: ${value}`;
}

function randomEuler() {
  return new THREE.Euler(
    Math.random() * Math.PI * 4,
    Math.random() * Math.PI * 4,
    Math.random() * Math.PI * 4
  );
}

function rollDie(type) {
  const def = diceDefinitions[type];
  const die = diceObjects[type];
  if (!def || !die) return;

  const startQuat = die.quaternion.clone();
  const targetQuat = new THREE.Quaternion().setFromEuler(randomEuler()).multiply(startQuat);
  const result = Math.floor(Math.random() * def.sides) + 1;
  rollStates[type] = {
    die,
    start: performance.now(),
    duration: 1400,
    startQuat,
    targetQuat,
    result,
    type,
    rolling: true,
  };
}

function animateRolls(now) {
  Object.values(rollStates).forEach((state) => {
    const { die, start, duration, startQuat, targetQuat, type, result } = state;
    if (!state.rolling) return;
    const progress = Math.min(1, (now - start) / duration);
    THREE.Quaternion.slerp(startQuat, targetQuat, die.quaternion, progress);
    if (progress >= 1) {
      state.rolling = false;
      updateResult(type, result);
    }
  });
}

function animate() {
  requestAnimationFrame(animate);
  animateRolls(performance.now());
  renderer.render(scene, camera);
}

function resizeRenderer() {
  const { clientWidth, clientHeight } = canvas.parentElement;
  if (!clientWidth || !clientHeight) return;
  renderer.setSize(clientWidth, clientHeight);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
}

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    const die = button.dataset.die;
    rollDie(die);
  });
});

window.addEventListener('resize', resizeRenderer);

resizeRenderer();
loadDice();
animate();
