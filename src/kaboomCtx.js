import kaboom from "kaboom";

export const k = kaboom({
  width: 640,
  height: 360,
  letterbox: true,
  canvas: document.getElementById("game"),
  background: [18, 16, 25]
});

// Fullscreen toggle with F key
window.addEventListener("keydown", (e) => {
  if (e.key === "f" || e.key === "F") {
    const container = document.getElementById("game-container");
    if (!document.fullscreenElement) {
      container?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }
});

export default k;
