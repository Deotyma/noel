import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

export function createPostprocessing({ renderer, scene, camera }) {
  const renderScene = new RenderPass(scene, camera);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );

  bloomPass.threshold = 0.2;
  bloomPass.strength = 0.8;
  bloomPass.radius = 0.5;

  const composer = new EffectComposer(renderer);
  composer.addPass(renderScene);
  composer.addPass(bloomPass);

  function setSize(w, h) {
    composer.setSize(w, h);
    bloomPass.setSize(w, h);
  }

  return { composer, setSize };
}
