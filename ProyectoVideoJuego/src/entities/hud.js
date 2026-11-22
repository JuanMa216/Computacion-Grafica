import { gameState } from "../state.js";

/**
 * Creates and initializes the on-screen HUD (Heads-Up Display).
 * Fulfills Req-3 (Score Counter), Req-4 (Lives/Hearts System), and level tracking.
 * 
 * @param {import("kaboom").KaboomCtx} k - Kaboom context
 * @param {string} levelTitle - Name of the current level to display
 * @returns {object} HUD controller with update methods
 */
export function createHUD(k, levelTitle = "NIVEL 1") {
  // Semi-transparent background banner for HUD
  k.add([
    k.rect(k.width(), 36),
    k.pos(0, 0),
    k.color(14, 12, 22),
    k.opacity(0.85),
    k.fixed(),
    k.z(90)
  ]);

  // Subtle bottom border for the banner
  k.add([
    k.rect(k.width(), 2),
    k.pos(0, 36),
    k.color(59, 45, 84),
    k.fixed(),
    k.z(91)
  ]);

  // --- 1. Hearts / Lives Display (Req-4) ---
  const heartObjects = [];
  const startX = 20;
  const heartSpacing = 26;

  for (let i = 0; i < gameState.maxLives; i++) {
    const heart = k.add([
      k.sprite("heart_full"),
      k.pos(startX + i * heartSpacing, 10),
      k.scale(1.25),
      k.fixed(),
      k.z(100)
    ]);
    heartObjects.push(heart);
  }

  // --- 2. Key Inventory Indicator (Level 2 mechanic) ---
  const keyIcon = k.add([
    k.sprite("key"),
    k.pos(startX + gameState.maxLives * heartSpacing + 10, 8),
    k.scale(1.2),
    k.fixed(),
    k.z(100),
    k.opacity(0) // Hidden until key is collected
  ]);

  // --- 3. Current Level Label ---
  const levelLabel = k.add([
    k.text(levelTitle.toUpperCase(), {
      font: "pressstart",
      size: 10
    }),
    k.pos(k.width() / 2, 18),
    k.anchor("center"),
    k.color(240, 220, 160),
    k.fixed(),
    k.z(100)
  ]);

  // --- 4. Score Counter Display (Req-3) ---
  // Coin icon next to score
  k.add([
    k.sprite("coin"),
    k.pos(k.width() - 120, 9),
    k.scale(1.1),
    k.fixed(),
    k.z(100)
  ]);

  const scoreLabel = k.add([
    k.text("00000", {
      font: "pressstart",
      size: 10
    }),
    k.pos(k.width() - 95, 18),
    k.anchor("left"),
    k.color(255, 230, 100),
    k.fixed(),
    k.z(100)
  ]);

  // --- 5. Real-time update loop for HUD state ---
  const hudUpdater = k.onUpdate(() => {
    // Update hearts based on current lives
    for (let i = 0; i < heartObjects.length; i++) {
      if (i < gameState.lives) {
        heartObjects[i].use(k.sprite("heart_full"));
      } else {
        heartObjects[i].use(k.sprite("heart_empty"));
      }
    }

    // Update score text with 5 leading digits
    const formattedScore = String(gameState.score).padStart(5, "0");
    scoreLabel.text = formattedScore;

    // Update key / book inventory display
    if (gameState.collectedBook === "red") {
      keyIcon.use(k.sprite("book_red"));
      keyIcon.opacity = 1;
    } else if (gameState.collectedBook === "green") {
      keyIcon.use(k.sprite("book_green"));
      keyIcon.opacity = 1;
    } else if (gameState.collectedBook === "blue") {
      keyIcon.use(k.sprite("book_blue"));
      keyIcon.opacity = 1;
    } else if (gameState.hasKey) {
      keyIcon.use(k.sprite("key"));
      keyIcon.opacity = 1;
    } else {
      keyIcon.opacity = 0;
    }
  });

  return {
    destroy() {
      hudUpdater.cancel();
    },

    /**
     * Creates a Boss Health Bar in the HUD for Level 3 (Req-10).
     * @param {string} bossName - Name of the boss (e.g. "REY DEMONIO")
     * @param {number} maxHp - Total boss hit points
     */
    createBossBar(bossName = "REY DEMONIO", maxHp = 10) {
      const barWidth = 240;
      const barHeight = 12;
      const barX = (k.width() - barWidth) / 2;
      const barY = k.height() - 28;

      // Boss name text
      k.add([
        k.text(bossName, { font: "pressstart", size: 8 }),
        k.pos(k.width() / 2, barY - 10),
        k.anchor("center"),
        k.color(255, 100, 100),
        k.fixed(),
        k.z(100)
      ]);

      // Background border
      k.add([
        k.rect(barWidth + 4, barHeight + 4),
        k.pos(barX - 2, barY - 2),
        k.color(20, 10, 25),
        k.fixed(),
        k.z(98)
      ]);

      // Empty bar track (dark red)
      k.add([
        k.rect(barWidth, barHeight),
        k.pos(barX, barY),
        k.color(60, 20, 20),
        k.fixed(),
        k.z(99)
      ]);

      // Dynamic health fill (bright red/orange)
      const healthFill = k.add([
        k.rect(barWidth, barHeight),
        k.pos(barX, barY),
        k.color(230, 40, 50),
        k.fixed(),
        k.z(100)
      ]);

      return {
        update(currentHp) {
          const ratio = Math.max(0, currentHp / maxHp);
          healthFill.width = barWidth * ratio;
        }
      };
    }
  };
}
