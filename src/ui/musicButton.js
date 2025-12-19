import * as THREE from "three";

export function createMusicButton({
  camera,
  fileName = "Go-Tell-It-On-The-Mountain-4-Verses.mp3"
}) {
  const listener = new THREE.AudioListener();
  camera.add(listener);

  const music = new THREE.Audio(listener);
  const loader = new THREE.AudioLoader();

  const btn = document.createElement("button");
  btn.textContent = "Play music";
  btn.style.position = "fixed";
  btn.style.top = "16px";
  btn.style.right = "16px";
  btn.style.zIndex = "15";
  btn.style.padding = "10px 14px";
  btn.style.border = "none";
  btn.style.borderRadius = "10px";
  btn.style.background = "rgba(255,255,255,0.9)";
  btn.style.color = "#0d2450";
  btn.style.fontFamily = "Inter, system-ui, sans-serif";
  btn.style.fontSize = "14px";
  btn.style.cursor = "pointer";
  btn.style.boxShadow = "0 10px 24px rgba(0,0,0,0.25)";
  btn.style.transition = "transform 0.15s ease, box-shadow 0.15s ease";
  btn.onmouseenter = () => {
    btn.style.transform = "translateY(-1px)";
    btn.style.boxShadow = "0 14px 30px rgba(0,0,0,0.28)";
  };
  btn.onmouseleave = () => {
    btn.style.transform = "translateY(0)";
    btn.style.boxShadow = "0 10px 24px rgba(0,0,0,0.25)";
  };
  document.body.appendChild(btn);

  let isLoaded = false;
  let isLoading = false;
  let isPlaying = false;

  function updateLabel() {
    btn.textContent = isPlaying ? "Pause music" : "Play music";
  }

  btn.onclick = async () => {
    // (optionnel mais utile sur certains navigateurs)
    const ctx = THREE.AudioContext.getContext();
    if (ctx.state === "suspended") await ctx.resume();

    const url = `${import.meta.env.BASE_URL}${fileName}`; // ✅ IMPORTANT

    if (!isLoaded) {
      if (isLoading) return;
      isLoading = true;
      btn.textContent = "Loading...";

      loader.load(
        url,
        (buffer) => {
          music.setBuffer(buffer);
          music.setLoop(true);
          music.setVolume(0.35);
          music.play();
          isLoaded = true;
          isPlaying = true;
          isLoading = false;
          updateLabel();
        },
        undefined,
        () => {
          btn.textContent = "Load failed";
          isLoading = false;
          setTimeout(updateLabel, 1500);
        }
      );
      return;
    }

    if (isPlaying) {
      music.pause();
      isPlaying = false;
    } else {
      music.play();
      isPlaying = true;
    }
    updateLabel();
  };

  updateLabel();
  return { music };
}

