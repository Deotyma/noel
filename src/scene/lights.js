import * as THREE from "three";

export function createLights({ scene, camera }) {
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
  keyLight.position.set(5, 10, 5);
  scene.add(keyLight);

  return { keyLight };
}