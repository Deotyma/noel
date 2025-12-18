import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

/* ===============================
   Setup renderer / scene / camera
================================ */
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.32;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.background =
  "radial-gradient(circle at top, #12324a, #070a12)";
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x070a12, 6, 24);

const camera = new THREE.PerspectiveCamera(
  45,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
const lookTarget = new THREE.Vector3(0, 4.5, 0);
const finalCameraPosition = new THREE.Vector3(0, 5.5, 14);
const introCameraPosition = new THREE.Vector3()
  .subVectors(finalCameraPosition, lookTarget)
  .normalize()
  .multiplyScalar(3.4)
  .add(lookTarget);

camera.position.copy(introCameraPosition);
camera.lookAt(lookTarget);
scene.add(camera);

/* ===============================
   Controls
================================ */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enabled = false;
controls.target.copy(lookTarget);
controls.update();
const baseAzimuth = controls.getAzimuthalAngle();
const azLimit = THREE.MathUtils.degToRad(30);
controls.minAzimuthAngle = baseAzimuth - azLimit;
controls.maxAzimuthAngle = baseAzimuth + azLimit;

const basePolar = controls.getPolarAngle();
const polarLimit = THREE.MathUtils.degToRad(15);
controls.minPolarAngle = Math.max(0.001, basePolar - polarLimit);
controls.maxPolarAngle = Math.min(Math.PI - 0.001, basePolar + polarLimit);

const introDistance = introCameraPosition.distanceTo(controls.target);
const baseDistance = finalCameraPosition.distanceTo(controls.target);
controls.minDistance = Math.max(1.5, introDistance * 0.85);
controls.maxDistance = baseDistance + 2.5;

/* ===============================
   Lights
================================ */
scene.add(new THREE.AmbientLight(0xffffff, 0.22));

const hemiLight = new THREE.HemisphereLight(0xa9dcff, 0x070a12, 0.78);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
keyLight.position.set(6, 10, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 1;
keyLight.shadow.camera.far = 40;
keyLight.shadow.camera.left = -18;
keyLight.shadow.camera.right = 18;
keyLight.shadow.camera.top = 18;
keyLight.shadow.camera.bottom = -18;
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0xa6d8ff, 0.9);
rimLight.position.set(-8, 6, -10);
scene.add(rimLight);

const backLight = new THREE.DirectionalLight(0xd8ecff, 0.9);
backLight.position.set(0, 7, -16);
backLight.target.position.set(0, 4.5, 0);
scene.add(backLight);
scene.add(backLight.target);

const fillLight = new THREE.DirectionalLight(0xfff1db, 0.35);
fillLight.position.set(9, 40, 10);
scene.add(fillLight);

const cameraFillLight = new THREE.PointLight(0xffffff, 0.0, 30, 2);
camera.add(cameraFillLight);

const lightBase = {
  key: keyLight.intensity,
  rim: rimLight.intensity,
  back: backLight.intensity,
  fill: fillLight.intensity
};
const tmpViewDir = new THREE.Vector3();
const tmpKeyDir = new THREE.Vector3();

/* ===============================
   Ground
================================ */
function groundHeight(x, z) {
  const s1 = Math.sin(x * 0.35) * Math.cos(z * 0.5);
  const s2 = 0.5 * Math.sin(x * 0.8 + z * 0.6);
  const s3 = 0.25 * Math.cos(x * 1.6 - z * 1.2);
  return (s1 + s2 + s3) * 0.25;
}

const groundGeometry = new THREE.CircleGeometry(20, 128);
groundGeometry.rotateX(-Math.PI / 2);

const groundPositions = groundGeometry.attributes.position;
for (let i = 0; i < groundPositions.count; i++) {
  const x = groundPositions.getX(i);
  const z = groundPositions.getZ(i);
  const r = Math.hypot(x, z);
  const falloff = Math.max(0, 1 - r / 20);
  const h = groundHeight(x, z) * falloff;
  groundPositions.setY(i, h);
}
groundPositions.needsUpdate = true;
groundGeometry.computeVertexNormals();

const ground = new THREE.Mesh(
  groundGeometry,
  new THREE.MeshStandardMaterial({
    color: 0xf8fbff,
    roughness: 0.95,
    metalness: 0,
    emissive: 0x0b2440,
    emissiveIntensity: 0.06
  })
);
ground.position.y = -0.01;
scene.add(ground);

/* ===============================
   Star on top
================================ */
const star = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.35),
  new THREE.MeshStandardMaterial({
    color: 0xfff2a8,
    emissive: 0xffd36b,
    emissiveIntensity: 1.2,
    roughness: 0.25,
    metalness: 0.3
  })
);
star.position.set(0, 9.4, 0);

/* ===============================
   Handwritten wishes
================================ */
function createHandwritingLabel({
  text,
  position,
  width = 5.6,
  height = 1.6,
  fontSizePx = 140,
  duration = 3.2,
  delay = 0
}) {
  const canvasWidth = 1024;
  const canvasHeight = 256;
  const padding = 60;
  const baselineY = Math.round(canvasHeight * 0.62);

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = canvasWidth;
  sourceCanvas.height = canvasHeight;
  const sourceCtx = sourceCanvas.getContext("2d");

  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = canvasWidth;
  maskCanvas.height = canvasHeight;
  const maskCtx = maskCanvas.getContext("2d");

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = canvasWidth;
  outputCanvas.height = canvasHeight;
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
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.98,
      depthWrite: false
    })
  );

  const particle = new THREE.Mesh(
    new THREE.SphereGeometry(0.055, 16, 16),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.9,
      roughness: 0.3,
      metalness: 0.0
    })
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
    outputCtx.globalCompositeOperation = "source-over";

    texture.needsUpdate = true;

    const u = x / canvasWidth;
    const localX = -width / 2 + width * u;
    const localY = -height / 2 + height * (baselineY / canvasHeight);
    particle.position.set(localX, localY, 0.02);
  }

  if (document.fonts?.load) {
    document.fonts
      .load(`${fontSizePx}px Parisienne`)
      .then(() => {
        renderSource();
        draw(0);
        fontReady = true;
      })
      .catch(() => {
        renderSource();
        draw(0);
        fontReady = true;
      });
  } else {
    renderSource();
    draw(0);
    fontReady = true;
  }

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
  createHandwritingLabel({
    text: "Joyeux Noël",
    position: new THREE.Vector3(-7.2, 5.0, 0.2),
    width: 5.6,
    height: 1.6,
    duration: 3.0,
    delay: 1.3
  }),
  createHandwritingLabel({
    text: "Bonne Année",
    position: new THREE.Vector3(7.2, 5.5, 0.2),
    width: 6.6,
    height: 1.6,
    duration: 3.4,
    delay: 4.3
  }),
   createHandwritingLabel({
    text: "2026",
    position: new THREE.Vector3(7.2, 4.5, 0.2),
    width: 6.6,
    height: 1.6,
    duration: 2,
    delay: 6.3
  })
];
for (const label of labels) scene.add(label.group);

/* ===============================
   Christmas balls (particles)
================================ */
const COUNT = 2600;
const HEIGHT = 9;
const BASE_RADIUS = 4.3;
const BALL_SIZE = 0.055;
const SWAY = 0.1;

const colors = [
  0xe63946,
  0xffbe0b,
  0x2a9d8f,
  0x3a86ff,
  0xff006e,
  0x8338ec,
  0xf1faee
].map(c => new THREE.Color(c));

const geometry = new THREE.SphereGeometry(1, 10, 10);
const material = new THREE.MeshStandardMaterial({
  roughness: 0.25,
  metalness: 0.55
});

const balls = new THREE.InstancedMesh(geometry, material, COUNT);
balls.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
balls.instanceColor = new THREE.InstancedBufferAttribute(
  new Float32Array(COUNT * 3),
  3
);

const basePositions = new Float32Array(COUNT * 3);
const phase = new Float32Array(COUNT);
const size = new Float32Array(COUNT);

const dummy = new THREE.Object3D();

function randomInCone() {
  const y = Math.random() * HEIGHT;
  const t = 1 - y / HEIGHT;
  const rMax = BASE_RADIUS * t;
  const angle = Math.random() * Math.PI * 2;
  const radius = Math.sqrt(Math.random()) * rMax;
  return {
    x: Math.cos(angle) * radius,
    y: y + 1.4,
    z: Math.sin(angle) * radius
  };
}

for (let i = 0; i < COUNT; i++) {
  const p = randomInCone();
  basePositions.set([p.x, p.y, p.z], i * 3);

  phase[i] = Math.random() * Math.PI * 2;
  size[i] = BALL_SIZE * (0.7 + Math.random() * 1.6);

  balls.setColorAt(i, colors[(Math.random() * colors.length) | 0]);

  dummy.position.set(p.x, p.y, p.z);
  dummy.scale.setScalar(size[i]);
  dummy.updateMatrix();
  balls.setMatrixAt(i, dummy.matrix);
}

balls.instanceColor.needsUpdate = true;
scene.add(balls);

/* ===============================
   Background sparkles
================================ */
const starGeo = new THREE.BufferGeometry();
const starCount = 900;
const starPos = new Float32Array(starCount * 3);

for (let i = 0; i < starCount; i++) {
  const r = 30 * Math.random();
  const a = Math.random() * Math.PI * 2;
  starPos[i * 3] = Math.cos(a) * r;
  starPos[i * 3 + 1] = 2 + Math.random() * 18;
  starPos[i * 3 + 2] = Math.sin(a) * r;
}

starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
scene.add(
  new THREE.Points(
    starGeo,
    new THREE.PointsMaterial({ size: 0.03, opacity: 0.9 })
  )
);

/* ===============================
   Animation loop
================================ */
const clock = new THREE.Clock();
const introDuration = 3.0;
let introStart = null;
let introDone = false;
const tmpCamPos = new THREE.Vector3();

function animate() {
  const t = clock.getElapsedTime();

  if (!introDone) {
    if (introStart === null) introStart = t;
    const p = Math.min(1, (t - introStart) / introDuration);
    const ease = 1 - Math.pow(1 - p, 3);
    tmpCamPos.lerpVectors(introCameraPosition, finalCameraPosition, ease);
    camera.position.copy(tmpCamPos);
    camera.lookAt(lookTarget);
    if (p >= 1) {
      introDone = true;
      camera.position.copy(finalCameraPosition);
      camera.lookAt(lookTarget);
      controls.enabled = true;
      controls.update();
    }
  }

  star.rotation.y += 0.01;
  star.scale.setScalar(1 + Math.sin(t * 3) * 0.05);

  tmpViewDir.subVectors(controls.target, camera.position).normalize();
  tmpKeyDir.subVectors(controls.target, keyLight.position).normalize();
  const alignment = THREE.MathUtils.clamp(tmpViewDir.dot(tmpKeyDir), -1, 1);
  const opposite = (1 - alignment) * 0.5;
  const boost = opposite * opposite;

  fillLight.intensity = lightBase.fill + boost * 0.55;
  backLight.intensity = lightBase.back + boost * 0.45;
  rimLight.intensity = lightBase.rim + boost * 0.2;
  cameraFillLight.intensity = boost * 0.9;

  for (let i = 0; i < COUNT; i++) {
    let x = basePositions[i * 3];
    let y = basePositions[i * 3 + 1];
    let z = basePositions[i * 3 + 2];

    const ph = phase[i];
    const sway = SWAY * (0.4 + size[i] * 6);

    x += Math.sin(t * 1.6 + ph) * sway;
    z += Math.cos(t * 1.4 + ph) * sway;
    y += Math.sin(t * 2.1 + ph) * sway * 0.4;

    const localY = Math.max(0, Math.min(HEIGHT, y - 1.4));
    const tCone = 1 - localY / HEIGHT;
    const rMax = BASE_RADIUS * tCone;
    const r = Math.hypot(x, z);
    if (r > rMax) {
      const s = rMax / (r + 0.0001);
      x *= s;
      z *= s;
    }

    dummy.position.set(x, y, z);
    dummy.rotation.y = t * 0.4 + ph;
    dummy.scale.setScalar(size[i]);
    dummy.updateMatrix();
    balls.setMatrixAt(i, dummy.matrix);
  }

  balls.instanceMatrix.needsUpdate = true;

  for (const label of labels) label.update(t);

  if (introDone) controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

/* ===============================
   Resize
================================ */
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});
