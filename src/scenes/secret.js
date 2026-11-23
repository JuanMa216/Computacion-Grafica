import { createPlayer } from "../entities/player.js";
import { createHUD } from "../entities/hud.js";
import { gameState } from "../state.js";

/**
 * Secret Easter Egg Scene: "El Origen de la Leyenda"
 * 
 * Unlocked only if the player finishes Level 3 with score >= secretScoreThreshold (5000+ pts).
 * Features:
 * - Nostalgic background image (user photo).
 * - Celebratory golden playground with coins, gems, and trampolines.
 * - Interactive bouncy basketball & mini-hoop interaction.
 * - Golden Trophy exit to True 100% Victory screen.
 * 
 * @param {import("kaboom").KaboomCtx} k - Kaboom context
 */
export function initSecret(k) {
  k.scene("secret", () => {
    k.camPos(k.width() / 2, k.height() / 2);
    k.play("win");

    // 1. Photo Background (fitted cleanly across 640x360 canvas)
    k.add([
      k.sprite("bg_secret"),
      k.pos(k.width() / 2, 0),
      k.anchor("top"),
      k.scale(k.width() / 720), // 640/720 = 0.8889 -> exactly 640w x 480h
      k.fixed(),
      k.z(-10)
    ]);

    // Soft dark contrast overlay so platforms, Mili, and text stand out clearly
    k.add([
      k.rect(k.width(), k.height()),
      k.pos(0, 0),
      k.color(15, 12, 22),
      k.opacity(0.35),
      k.fixed(),
      k.z(-5)
    ]);

    // 2. Celebratory Top Banners
    k.add([
      k.text("★ ¡NIVEL SECRETO: EL ORIGEN DE LA LEYENDA! ★", {
        font: "pressstart",
        size: 9
      }),
      k.pos(k.width() / 2, 22),
      k.anchor("center"),
      k.color(255, 220, 60),
      k.fixed(),
      k.z(50)
    ]);

    const subBanner = k.add([
      k.text("¡FELICIDADES! ¡HAS DESBLOQUEADO EL EASTER EGG!", {
        font: "pressstart",
        size: 7
      }),
      k.pos(k.width() / 2, 38),
      k.anchor("center"),
      k.color(200, 245, 255),
      k.fixed(),
      k.z(50)
    ]);
    k.loop(0.7, () => {
      subBanner.color = subBanner.color.r === 200 ? k.rgb(255, 180, 220) : k.rgb(200, 245, 255);
    });

    // 3. Ground and Floating Platforms
    const tileSize = 24;
    const floorY = 320;

    // Solid floor at the bottom
    for (let c = 0; c < 27; c++) {
      k.add([
        k.sprite("stone_top"),
        k.pos(c * tileSize, floorY),
        k.scale(tileSize / 16),
        k.area(),
        k.body({ isStatic: true }),
        k.z(2),
        "solid"
      ]);
    }

    // Left and Right Invisible Walls
    k.add([
      k.rect(12, 360),
      k.pos(-12, 0),
      k.area(),
      k.body({ isStatic: true }),
      "solid"
    ]);
    k.add([
      k.rect(12, 360),
      k.pos(640, 0),
      k.area(),
      k.body({ isStatic: true }),
      "solid"
    ]);

    // Stepping platforms leading up to the hoop and trophy
    const platformDefs = [
      // Left approach to basket
      { x: 5 * tileSize, y: 250, w: 3 },
      { x: 9 * tileSize, y: 190, w: 3 },
      { x: 13 * tileSize, y: 140, w: 4 }, // Hoop observation platform
      // Right approach to trophy
      { x: 18 * tileSize, y: 200, w: 3 },
      { x: 22 * tileSize, y: 250, w: 3 }
    ];

    for (const p of platformDefs) {
      for (let i = 0; i < p.w; i++) {
        k.add([
          k.sprite("dungeon_platform"),
          k.pos(p.x + i * tileSize, p.y),
          k.scale(tileSize / 16),
          k.area({ shape: new k.Rect(k.vec2(0, 0), 16, 9) }),
          k.body({ isStatic: true }),
          k.z(2),
          "solid",
          "platform"
        ]);
      }
    }

    // 4. Spring Trampolines (Super jump boosters!)
    const trampolines = [
      { x: 3 * tileSize, y: floorY - 14 },
      { x: 17 * tileSize, y: floorY - 14 }
    ];

    for (const t of trampolines) {
      k.add([
        k.sprite("spring"),
        k.pos(t.x, t.y),
        k.scale(1.5),
        k.area({ shape: new k.Rect(k.vec2(0, 0), 18, 10) }),
        k.z(3),
        "spring_secret"
      ]);
    }

    // 5. Golden Coins scattered in celebratory arches
    const coinCoords = [
      // Arch 1 over trampoline 1
      [2, 280], [3, 240], [4, 210], [5, 210],
      // Arch 2 over platform to hoop
      [8, 150], [9, 140], [10, 140], [11, 110], [12, 95], [13, 95], [14, 105],
      // Arch 3 descending to right
      [16, 170], [17, 160], [18, 160], [19, 160], [21, 210], [22, 210], [23, 220]
    ];

    for (const [col, yPos] of coinCoords) {
      k.add([
        k.sprite("coin"),
        k.pos(col * tileSize + 4, yPos),
        k.scale(1.4),
        k.area(),
        k.z(5),
        "secret_coin"
      ]);
    }

    // 6. Sparkling Royal Gems (+250 pts each)
    const gemCoords = [
      [9 * tileSize + 4, 160],
      [14 * tileSize + 4, 110],
      [23 * tileSize + 4, 220]
    ];
    for (const [gx, gy] of gemCoords) {
      k.add([
        k.sprite("gem"),
        k.pos(gx, gy),
        k.scale(1.5),
        k.area(),
        k.z(5),
        "secret_gem"
      ]);
    }

    // 7. Interactive Basketball & Hoop Zone!
    // Mini-hoop sensor (aligns with basketball hoop on the photo around x=285, y=70)
    const hoopSensor = k.add([
      k.rect(36, 10),
      k.pos(285, 78),
      k.area(),
      k.opacity(0),
      k.z(10),
      "hoop_target"
    ]);

    let basketScored = false;
    const triggerBasket = (byX) => {
      if (basketScored) return;
      basketScored = true;
      gameState.addScore(500);
      k.shake(8);
      k.play("win");

      const scoreBanner = k.add([
        k.text("¡CANASTA LEGENDARIA! +500 PTS", {
          font: "pressstart",
          size: 11
        }),
        k.pos(k.width() / 2, 105),
        k.anchor("center"),
        k.color(255, 120, 30),
        k.z(100)
      ]);
      scoreBanner.onUpdate(() => {
        scoreBanner.pos.y -= 25 * k.dt();
      });
      k.wait(2.5, () => scoreBanner.destroy());
    };

    // Bouncy Basketball Entity
    const ball = k.add([
      k.circle(10),
      k.pos(140, floorY - 30),
      k.color(255, 110, 20),
      k.outline(2, k.rgb(40, 20, 10)),
      k.area(),
      k.body({ bounce: 0.82 }),
      k.anchor("center"),
      k.z(8),
      "basketball",
      {
        velX: 0
      }
    ]);

    // Ball physics and hoop collision
    ball.onUpdate(() => {
      if (Math.abs(ball.velX) > 0.5) {
        ball.move(ball.velX, 0);
        ball.velX *= 0.96;
      }
      if (ball.pos.x < 15) {
        ball.pos.x = 15;
        ball.velX = Math.abs(ball.velX);
      } else if (ball.pos.x > 625) {
        ball.pos.x = 625;
        ball.velX = -Math.abs(ball.velX);
      }
    });

    ball.onCollide("hoop_target", () => {
      triggerBasket(ball.pos.x);
    });

    // 8. Golden Victory Trophy (Exit to True Victory)
    const trophy = k.add([
      k.sprite("door_closed"),
      k.pos(23 * tileSize, floorY - 32),
      k.scale(tileSize / 16),
      k.area(),
      k.z(4),
      "trophy_door"
    ]);

    // Floating banner above trophy
    const trophyLabel = k.add([
      k.text("¡COPA SUPREMA!", { font: "pressstart", size: 6 }),
      k.pos(23 * tileSize + 12, floorY - 44),
      k.anchor("center"),
      k.color(255, 230, 80),
      k.z(10)
    ]);
    trophyLabel.onUpdate(() => {
      trophyLabel.pos.y = (floorY - 44) + Math.sin(k.time() * 4) * 3;
    });

    // 9. Mili Player Entity
    const player = createPlayer(k, 40, floorY - 40, true, 420);

    // Bounce Mili high on spring trampolines
    player.onCollide("spring_secret", () => {
      k.play("jump");
      player.jump(520); // Super jump high into the basketball court
      k.shake(3);
    });

    // Mili interacting with the basketball (kick / launch)
    player.onCollide("basketball", (b) => {
      const launchDir = player.pos.x < b.pos.x ? 1 : -1;
      b.velX = launchDir * 180;
      b.jump(340);
      k.play("hit");
    });

    // Sword melee attack launches the basketball
    player.onCollide("sword_hitbox", () => {});
    k.onCollide("sword_hitbox", "basketball", (hitbox, b) => {
      const launchDir = player.facing === "right" ? 1 : -1;
      b.velX = launchDir * 280;
      b.jump(420);
      k.play("hit");
      k.shake(4);
    });

    // If Mili herself jumps through the hoop
    player.onCollide("hoop_target", () => {
      triggerBasket(player.pos.x);
    });

    // Coin collection (+100)
    player.onCollide("secret_coin", (c) => {
      k.play("coin");
      c.destroy();
      gameState.addScore(100);
    });

    // Gem collection (+250)
    player.onCollide("secret_gem", (g) => {
      k.play("gem");
      g.destroy();
      gameState.addScore(250);
    });

    // Reaching Trophy -> Grand Finale!
    let finishing = false;
    player.onCollide("trophy_door", () => {
      if (finishing) return;
      finishing = true;
      gameState.foundEasterEgg = true;
      gameState.addScore(1000);
      k.play("win");
      k.shake(12);

      const victoryPopup = k.add([
        k.text("¡VICTORIA SUPREMA 100%!", {
          font: "pressstart",
          size: 14
        }),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
        k.color(255, 230, 80),
        k.z(100)
      ]);

      k.wait(2.0, () => {
        k.go("victory");
      });
    });

    // 10. Persistent HUD
    createHUD(k, "NIVEL SECRETO: EASTER EGG");
  });
}
