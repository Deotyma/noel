import * as THREE from "three";

export function createTree({ scene }) {
  const COUNT = 3000;
  const HEIGHT = 9;
  const BASE_RADIUS = 4.0;

  const ballMat = new THREE.MeshStandardMaterial({
    roughness: 0.1,
    metalness: 0.8,
    emissiveIntensity: 0.5
  });

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
  balls.frustumCulled = false;

  const offsets = new Float32Array(COUNT * 3);
  const phases = new Float32Array(COUNT);
  const scales = new Float32Array(COUNT);

  const colors = [0xe63946, 0xffbe0b, 0x2a9d8f, 0xff006e, 0xf1faee].map(
    (c) => new THREE.Color(c)
  );

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

    balls.setColorAt(i, colors[(Math.random() * colors.length) | 0]);
  }

  ballGeo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3));
  ballGeo.setAttribute("aPhase", new THREE.InstancedBufferAttribute(phases, 1));
  ballGeo.setAttribute("aScale", new THREE.InstancedBufferAttribute(scales, 1));

  scene.add(balls);

  const star = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.4, 0),
    new THREE.MeshStandardMaterial({
      color: 0xfff2a8,
      emissive: 0xffd36b,
      emissiveIntensity: 2
    })
  );
  star.position.set(0, 10.3, 0);
  scene.add(star);

  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(20, 32).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: 0x0b2440, roughness: 0.8 })
  );
  scene.add(ground);

  return {
    balls,
    star,
    update(t) {
      if (ballMat.userData.shader) {
        ballMat.userData.shader.uniforms.uTime.value = t;
      }
      star.rotation.y = t;
      star.scale.setScalar(1 + Math.sin(t * 2) * 0.1);
    }
  };
}
