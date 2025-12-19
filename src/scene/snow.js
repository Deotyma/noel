import * as THREE from "three";

export function createSnow({ scene, snowCount = 1500 }) {
  const snowGeo = new THREE.BufferGeometry();
  const snowPos = new Float32Array(snowCount * 3);

  for (let i = 0; i < snowCount; i++) {
    snowPos[i * 3] = (Math.random() - 0.5) * 40;
    snowPos[i * 3 + 1] = Math.random() * 25;
    snowPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
  }

  snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
  const snowMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.04,
    transparent: true,
    opacity: 0.8
  });

  const snow = new THREE.Points(snowGeo, snowMat);
  scene.add(snow);

  return {
    object: snow,
    update() {
      const positions = snow.geometry.attributes.position.array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= 0.03;
        if (positions[i] < 0) positions[i] = 20;
      }
      snow.geometry.attributes.position.needsUpdate = true;
    }
  };
}
