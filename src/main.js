import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

/* ===============================
    Scene
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
document.body.style.background = "radial-gradient(circle at top, #4c8bc0, #123763)"; 
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x123763);
scene.fog = new THREE.Fog(0x123763, 8, 30);

/* ===============================
   Cameras
================================ */
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
const lookTarget = new THREE.Vector3(0, 4.5, 0);
const finalCameraPosition = new THREE.Vector3(0, 6.2, 16);
const introCameraPosition = lookTarget.clone().add(new THREE.Vector3(0.2, 0.5, 1.2));
camera.position.copy(introCameraPosition);
camera.lookAt(lookTarget);

/* ===============================
   Post-Processing 
================================ */
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.2;
bloomPass.strength = 0.8; 
bloomPass.radius = 0.5;

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);

/* ===============================
   controls
================================ */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.copy(lookTarget);
controls.enabled = false; 
const azLimit = THREE.MathUtils.degToRad(30); 
const polarLimit = THREE.MathUtils.degToRad(15);
controls.minAzimuthAngle = -azLimit;
controls.maxAzimuthAngle = azLimit;
controls.minPolarAngle = Math.PI / 2 - polarLimit - 0.2; // Wokół poziomu wzroku
controls.maxPolarAngle = Math.PI / 2 + polarLimit;
controls.minDistance = 6;
controls.maxDistance = 18;

/* ===============================
   Lights
================================ */
scene.add(new THREE.AmbientLight(0xffffff, 0.3));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(5, 10, 5);
scene.add(keyLight);

/* ===============================
   snow
================================ */
const snowCount = 1500;
const snowGeo = new THREE.BufferGeometry();
const snowPos = new Float32Array(snowCount * 3);
for (let i = 0; i < snowCount; i++) {
  snowPos[i * 3] = (Math.random() - 0.5) * 40;
  snowPos[i * 3 + 1] = Math.random() * 25;
  snowPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
}
snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
const snowMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.8 });
const snow = new THREE.Points(snowGeo, snowMat);
scene.add(snow);

/* ===============================
   Christmas tree (Aanimation GPU)
================================ */
const COUNT = 3000;
const HEIGHT = 9;
const BASE_RADIUS = 4.0;

const ballMat = new THREE.MeshStandardMaterial({ roughness: 0.1, metalness: 0.8, emissiveIntensity: 0.5 });
ballMat.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = { value: 0 };
  shader.vertexShader = `
    uniform float uTime;
    attribute vec3 aOffset;
    attribute float aPhase;
    attribute float aScale;
    ${shader.vertexShader}
  `.replace(
    "#include <begin_vertex>",
    `
    float sway = sin(uTime * 1.5 + aPhase) * 0.15;
    vec3 transformed = vec3(position * aScale);
    transformed.x += sway;
    transformed.z += cos(uTime * 1.2 + aPhase) * 0.15;
    transformed += aOffset;
    `
  );
  ballMat.userData.shader = shader;
};

const ballGeo = new THREE.SphereGeometry(0.06, 8, 8);
const balls = new THREE.InstancedMesh(ballGeo, ballMat, COUNT);
balls.frustumCulled = false; // keep particles visible even when camera goes inside the tree
const offsets = new Float32Array(COUNT * 3);
const phases = new Float32Array(COUNT);
const scales = new Float32Array(COUNT);
const colors = [0xe63946, 0xffbe0b, 0x2a9d8f, 0xff006e, 0xf1faee].map(c => new THREE.Color(c));

for (let i = 0; i < COUNT; i++) {
  const y = Math.random() * HEIGHT;
  const t = 1 - y / HEIGHT;
  const r = Math.sqrt(Math.random()) * BASE_RADIUS * t;
  const angle = Math.random() * Math.PI * 2;
  offsets[i * 3] = Math.cos(angle) * r;
  offsets[i * 3 + 1] = y + 1.2;
  offsets[i * 3 + 2] = Math.sin(angle) * r;
  phases[i] = Math.random() * Math.PI * 2;
  scales[i] = 0.6 + Math.random() * 1.4;
  balls.setColorAt(i, colors[Math.floor(Math.random() * colors.length)]);
}
ballGeo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
ballGeo.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phases, 1));
ballGeo.setAttribute("aScale", new THREE.InstancedBufferAttribute(scales, 1));
scene.add(balls);

const star = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.4, 0),
  new THREE.MeshStandardMaterial({ color: 0xfff2a8, emissive: 0xffd36b, emissiveIntensity: 2 })
);
star.position.set(0, 10.3, 0);
scene.add(star);

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(20, 32).rotateX(-Math.PI / 2),
  new THREE.MeshStandardMaterial({ color: 0x0b2440, roughness: 0.8 })
);
scene.add(ground);

/* ===============================
   Handwriting Labels
================================ */
function createHandwritingLabel({ text, position, width = 5.6, height = 1.6, fontSizePx = 140, duration = 3.2, delay = 0 }) {
  const canvasWidth = 1024;
  const canvasHeight = 256;
  const padding = 60;
  const baselineY = Math.round(canvasHeight * 0.62);

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = canvasWidth; sourceCanvas.height = canvasHeight;
  const sourceCtx = sourceCanvas.getContext("2d");

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = canvasWidth; maskCanvas.height = canvasHeight;
  const maskCtx = maskCanvas.getContext("2d");

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = canvasWidth; outputCanvas.height = canvasHeight;
  const outputCtx = outputCanvas.getContext("2d");

  function renderSource() {
    sourceCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    sourceCtx.fillStyle = "rgba(255, 255, 255, 0.98)";
    sourceCtx.textAlign = "left";
    sourceCtx.textBaseline = "alphabetic";
    sourceCtx.font = `${fontSizePx}px Parisienne, cursive`;
    sourceCtx.shadowColor = "rgba(0,0,0,0.35)";
    sourceCtx.shadowBlur = 10;
    sourceCtx.shadowOffsetY = 4;
    sourceCtx.fillText(text, padding, baselineY);
  }

  const texture = new THREE.CanvasTexture(outputCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0.98, depthWrite: false })
  );

  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.9 })
  );

  const group = new THREE.Group();
  group.position.copy(position);
  group.add(plane);
  group.add(particle);

  const seed = Math.random() * Math.PI * 2;
  let startTime = null;
  let fontReady = false;

  function draw(progress) {
    const maxX = canvasWidth - padding;
    const minX = padding;
    const x = minX + (maxX - minX) * progress;

    maskCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    maskCtx.fillStyle = "rgba(255,255,255,1)";
    maskCtx.fillRect(0, 0, x, canvasHeight);

    const tip = maskCtx.createRadialGradient(x, baselineY, 0, x, baselineY, 80);
    tip.addColorStop(0, "rgba(255,255,255,1)");
    tip.addColorStop(1, "rgba(255,255,255,0)");
    maskCtx.fillStyle = tip;
    maskCtx.fillRect(x - 90, baselineY - 90, 180, 180);

    outputCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    outputCtx.globalCompositeOperation = "source-over";
    outputCtx.drawImage(sourceCanvas, 0, 0);
    outputCtx.globalCompositeOperation = "destination-in";
    outputCtx.drawImage(maskCanvas, 0, 0);
    texture.needsUpdate = true;
    const u = x / canvasWidth;
    particle.position.set(-width / 2 + width * u, -height / 2 + height * (baselineY / canvasHeight), 0.02);
  }

  document.fonts.load(`${fontSizePx}px Parisienne`).then(() => {
    renderSource(); draw(0); fontReady = true;
  });

  return {
    group,
    update(t) {
      if (!fontReady) return;
      if (startTime === null) startTime = t + delay;
      const local = t - startTime;
      if (local < 0) return;
      const progress = Math.max(0, Math.min(1, local / duration));
      draw(progress);
      particle.position.y += Math.sin(t * 6 + seed) * 0.02;
      plane.lookAt(camera.position);
    }
  };
}

const labels = [
  createHandwritingLabel({ text: "Joyeux Noël", position: new THREE.Vector3(-7.2, 5.0, 0.2), delay: 1.3 }),
  createHandwritingLabel({ text: "Bonne Année", position: new THREE.Vector3(7.2, 5.5, 0.2), delay: 4.3 }),
  createHandwritingLabel({ text: "2026", position: new THREE.Vector3(7.2, 4.5, 0.2), duration: 2, delay: 6.3 })
];
labels.forEach(label => scene.add(label.group));

/* ===============================
    Animation Loop
================================ */
const clock = new THREE.Clock();
const introDuration = 3.0;
let introStart = null;
let introDone = false;

function animate() {
  const t = clock.getElapsedTime();

  // Intro: płynne oddalenie kamery w 3 sekundy, tak by objąć całą choinkę
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

  //Animation of the Christmas balls
  if (ballMat.userData.shader) {
    ballMat.userData.shader.uniforms.uTime.value = t;
  }

  // Animation of the snow
  const positions = snow.geometry.attributes.position.array;
  for (let i = 1; i < positions.length; i += 3) {
    positions[i] -= 0.03;
    if (positions[i] < 0) positions[i] = 20;
  }
  snow.geometry.attributes.position.needsUpdate = true;

  // animation of the star
  star.rotation.y = t;
  star.scale.setScalar(1 + Math.sin(t * 2) * 0.1);

  // Animation of the labels
  labels.forEach(l => l.update(t));

  controls.update();
  composer.render();
  requestAnimationFrame(animate);
}

animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
