import * as THREE from "three";

export function createMusicButton({ camera, audioUrl = "/Go-Tell-It-On-The-Mountain-4-Verses.mp3" }) {
  const listener = new THREE.AudioListener();
  camera.add(listener);

  const music = new THREE.Audio(listener);
  const loader = new THREE.AudioLoader();

  const btn = document.createElement("button");
  btn.textContent = "Play music";
  btn.style.position = "fixed";
  btn.style.top = "16px";
  btn.style.right = "16px";
  btn.style.zIndex = "10";
  btn.style.padding = "10px 14px";
  btn.style.border = "none";
  btn.style.borderRadius = "8px";
  btn.style.background = "rgba(255,255,255,0.85)";
  btn.style.color = "#0e2a53";
  btn.style.fontFamily = "sans-serif";
  btn.style.fontSize = "14px";
  btn.style.cursor = "pointer";
  btn.style.boxShadow = "0 6px 18px rgba(0,0,0,0.25)";

  let isLoaded = false;
  let isLoading = false;
  let isPlaying = false;

  function updateLabel() {
    btn.textContent = isPlaying ? "Pause music" : "Play music";
  }

  btn.onclick = () => {
    if (!isLoaded) {
      if (isLoading) return;
      isLoading = true;
      btn.textContent = "Loading...";

      loader.load(
        audioUrl,
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
  document.body.appendChild(btn);

  return { music };
}
