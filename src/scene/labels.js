import * as THREE from "three";

function createHandwritingLabel({
  camera,
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
      emissiveIntensity: 0.9
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
    texture.needsUpdate = true;

    const u = x / canvasWidth;
    particle.position.set(
      -width / 2 + width * u,
      -height / 2 + height * (baselineY / canvasHeight),
      0.02
    );
  }

  document.fonts.load(`${fontSizePx}px Parisienne`).then(() => {
    renderSource();
    draw(0);
    fontReady = true;
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

export function createLabels({ scene, camera }) {
  const defs = [
    { text: "Joyeux Noël", position: new THREE.Vector3(-7.2, 5.0, 0.2), delay: 1.3 },
    { text: "Bonne Année", position: new THREE.Vector3(7.2, 5.5, 0.2), delay: 4.3 },
    { text: "2026", position: new THREE.Vector3(7.2, 4.5, 0.2), duration: 2, delay: 6.3 }
  ];

  const labels = defs.map((def) => {
    const label = createHandwritingLabel({ camera, ...def });
    const basePosition = def.position.clone();
    scene.add(label.group);
    return { label, basePosition };
  });

  function applyLayout({ scale = 1, yOffset = 0 } = {}) {
    labels.forEach(({ label, basePosition }) => {
      label.group.scale.setScalar(scale);
      label.group.position.set(
        basePosition.x * scale,
        basePosition.y * scale + yOffset,
        basePosition.z
      );
    });
  }

  return {
    update(t) {
      labels.forEach((entry) => entry.label.update(t));
    },
    applyLayout
  };
}
