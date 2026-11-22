import { gameState } from "../state.js";

/**
 * Game Over Scene.
 * Displays final score and allows retrying the game.
 * 
 * @param {import("kaboom").KaboomCtx} k - Kaboom context
 */
export function initGameOver(k) {
  k.scene("gameover", () => {
    k.camPos(k.width() / 2, k.height() / 2);

    // Dark reddish overlay
    k.add([
      k.rect(k.width(), k.height()),
      k.pos(0, 0),
      k.color(15, 8, 12),
      k.fixed()
    ]);

    // Game Over title
    k.add([
      k.text("GAME OVER", { font: "pressstart", size: 24 }),
      k.pos(k.width() / 2, k.height() / 2 - 40),
      k.anchor("center"),
      k.color(240, 60, 70),
      k.fixed()
    ]);

    // Score display
    k.add([
      k.text(`PUNTUACIÓN FINAL: ${gameState.score}`, { font: "pressstart", size: 10 }),
      k.pos(k.width() / 2, k.height() / 2 + 10),
      k.anchor("center"),
      k.color(240, 220, 160),
      k.fixed()
    ]);

    // Retry instructions
    const prompt = k.add([
      k.text("Presiona ESPACIO o ENTER para reintentar", { font: "pressstart", size: 8 }),
      k.pos(k.width() / 2, k.height() / 2 + 55),
      k.anchor("center"),
      k.color(200, 200, 200),
      k.fixed()
    ]);

    // Blinking effect
    k.loop(0.6, () => {
      prompt.opacity = prompt.opacity === 1 ? 0.3 : 1;
    });

    // Key handlers to restart
    for (const key of ["space", "enter", "r"]) {
      k.onKeyPress(key, () => {
        gameState.reset();
        k.go("level1");
      });
    }
  });
}
