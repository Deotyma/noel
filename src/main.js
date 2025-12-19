import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { styleCredits } from "./ui/credits.js";
import { createMusicButton } from "./ui/musicButton.js";

import { createPostprocessing } from "./post/postprocessing.js";

import { createLights } from "./scene/lights.js";
import { createSnow } from "./scene/snow.js";
import { createTree } from "./scene/tree.js";
import { createLabels } from "./scene/labels.js";

/* ===============================
    Renderer / Scene
================================ */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x102b52, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;

document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.background =
  "radial-gradient(circle at top, #4c8bc0, #123763)";
document.body.appendChild(renderer.domElement);

styleCredits();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x123763);
scene.fog = new THREE.Fog(0x123763, 8, 30);

/* ===============================
   Camera
================================ */
const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

const lookTarget = new THREE.Vector3(0, 4.5, 0);
let finalCameraPosition = new THREE.Vector3(0, 6.2, 16);
let introCameraPosition = lookTarget.clone().add(new THREE.Vector3(0.2, 0.5, 1.2));

camera.position.copy(introCameraPosition);
camera.lookAt(lookTarget);

/* UI */
createMusicButton({ camera });

/* Post-processing */
const post = createPostprocessing({ renderer, scene, camera });

/* Controls */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.copy(lookTarget);
controls.enabled = false;
const azLimit = THREE.MathUtils.degToRad(30);
const polarLimit = THREE.MathUtils.degToRad(15);
controls.minAzimuthAngle = -azLimit;
controls.maxAzimuthAngle = azLimit;
controls.minPolarAngle = Math.PI / 2 - polarLimit - 0.2;
controls.maxPolarAngle = Math.PI / 2 + polarLimit;
controls.minDistance = 6;
controls.maxDistance = 18;

/* Scene content */
createLights({ scene, camera });
const snow = createSnow({ scene, snowCount: 1500 });
const tree = createTree({ scene });
const labels = createLabels({ scene, camera });

function applyResponsiveLayout() {
  const w = window.innerWidth;
  const h = window.innerHeight || 1;
  const aspect = w / h;
  const isPortrait = aspect < 1;
  const isNarrow = w <= 520;
  const isTablet = w > 520 && w <= 1100;

  const distanceFactor = isPortrait ? 1.5 : isNarrow ? 1.3 : isTablet ? 1.15 : 1;
  const heightBoost = isPortrait ? 1.2 : isTablet ? 0.6 : 0;

  finalCameraPosition = new THREE.Vector3(0, 6.2 + heightBoost, 16 * distanceFactor);
  introCameraPosition = lookTarget
    .clone()
    .add(new THREE.Vector3(0.2, 0.5 + heightBoost * 0.3, 1.2 * distanceFactor * 0.6));

  const dist = finalCameraPosition.distanceTo(lookTarget);
  controls.minDistance = Math.max(5, dist * 0.55);
  controls.maxDistance = dist * 1.15;

  labels.applyLayout?.({
    scale: isPortrait || isNarrow ? 0.78 : isTablet ? 0.9 : 1,
    yOffset: isPortrait ? -0.4 : 0
  });

  if (introDone) {
    camera.position.copy(finalCameraPosition);
    camera.lookAt(lookTarget);
    controls.update();
  } else {
    camera.position.copy(introCameraPosition);
    camera.lookAt(lookTarget);
    introStart = clock.getElapsedTime();
  }
}

/* ===============================
    Animation Loop
================================ */
const clock = new THREE.Clock();
const introDuration = 3.0;
let introStart = null;
let introDone = false;

function animate() {
  const t = clock.getElapsedTime();

  // Intro camera
  if (!introDone) {
    if (introStart === null) introStart = t;
    const p = Math.min(1, (t - introStart) / introDuration);
    const ease = 1 - Math.pow(1 - p, 3);

    camera.position.lerpVectors(introCameraPosition, finalCameraPosition, ease);
    camera.lookAt(lookTarget);

    if (p >= 1) {
      introDone = true;
      camera.position.copy(finalCameraPosition);
      camera.lookAt(lookTarget);
      controls.enabled = true;
      controls.update();
    }
  }

  tree.update(t);
  snow.update();
  labels.update(t);

  controls.update();
  post.composer.render();
  requestAnimationFrame(animate);
}
animate();

/* Resize */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  post.setSize(window.innerWidth, window.innerHeight);
  applyResponsiveLayout();
});

applyResponsiveLayout();
