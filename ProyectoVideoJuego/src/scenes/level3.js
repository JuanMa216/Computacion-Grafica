import { createPlayer } from "../entities/player.js";
import { createSlime } from "../entities/slime.js";
import { createOrc } from "../entities/orc.js";
import { createDemon } from "../entities/demon.js";
import { createHUD } from "../entities/hud.js";
import { gameState } from "../state.js";

/**
 * Level 3: "La Torre del Trono del Rey Demonio" (Diseño Vertical: 27 cols x 70 filas)
 *
 * Features & Architecture:
 * - Vertical tower layout: Player begins at the bottom dungeon foundation (y ≈ 1608px)
 *   and ascends 4 vertical tiers of ancient fortress ruins to the rooftop throne.
 * - Dynamic vertical camera tracking: Smoothly locks at width/2 and tracks Mili in Y,
 *   clamped precisely within [height/2, mapHeight - height/2].
 * - Moving platform elevator & horizontal gears across the tower abyss.
 * - Geyser trampoline mushrooms propelling the player through spike corridors.
 * - Final Boss: Rey Demonio (Demon King, 10 HP) with multi-phase AI, cleave and slam attacks,
 *   enrage mode (under 50% HP), HUD health bar, and victory scene transition.
 *
 * @param {import("kaboom").KaboomCtx} k - Kaboom context
 */
export function initLevel3(k) {
  k.scene("level3", () => {
    gameState.currentLevel = 3;
    gameState.hasKey = false;
    gameState.collectedBook = null;

    const tileSize = 24;
    const cols = 27;
    const rows = 70;
    const mapWidth = cols * tileSize;   // 648 px (exact full-screen width)
    const mapHeight = rows * tileSize; // 1680 px (epic 4.7-screen vertical ascent)

    k.setGravity(980);
    // Start camera at the tower bottom where player teleports in
    k.camPos(k.width() / 2, mapHeight - k.height() / 2);

    // --- Atmospheric Dark Fortress Background ---
    k.add([
      k.sprite("bg_level3"),
      k.pos(0, 0),
      k.fixed(),
      k.scale(k.width() / 640, k.height() / 360),
      k.z(-10)
    ]);

    // Dark moody overlay for tower atmosphere
    k.add([
      k.rect(k.width(), k.height()),
      k.pos(0, 0),
      k.color(12, 8, 20),
      k.opacity(0.35),
      k.fixed(),
      k.z(-8)
    ]);

    // Objective banner under HUD
    k.add([
      k.rect(520, 20),
      k.pos(k.width() / 2, 48),
      k.anchor("center"),
      k.color(20, 10, 18),
      k.opacity(0.85),
      k.fixed(),
      k.z(80)
    ]);

    k.add([
      k.text("OBJETIVO: ¡Asciende por la torre y derrota al Rey Demonio!", {
        font: "pressstart",
        size: 6.5
      }),
      k.pos(k.width() / 2, 48),
      k.anchor("center"),
      k.color(255, 140, 140),
      k.fixed(),
      k.z(81)
    ]);

    // --- Vertical Tower Map Grid (27 columns x 70 rows = 648 x 1680 px) ---
    const layout = [
      "##                       ##", // 0
      "##                       ##", // 1
      "##                       ##", // 2
      "##                       ##", // 3
      "##           B           ##", // 4 Boss spawn (Demon King)
      "##                       ##", // 5
      "##                       ##", // 6
      "##    =================  ##", // 7 Grand Throne Floor (cols 6..22)
      "##                       ##", // 8
      "##   T                 T ##", // 9 Super Trampolines to Throne
      "##  ===       G       ===##", // 10 Balcony platforms
      "##           ---         ##", // 11 Center stepping platform
      "##                       ##", // 12
      "##       ---     ---     ##", // 13 Approach platforms
      "##===                 ===##", // 14 Gate to throne arena
      "##                       ##", // 15
      "##         ^^^^^         ##", // 16
      "##        =======        ##", // 17
      "##                       ##", // 18
      "##   T       $       T   ##", // 19
      "##  ===             ===  ##", // 20
      "##         S   S         ##", // 21
      "##         -----         ##", // 22
      "##           O           ##", // 23 Orc guard
      "##        =======        ##", // 24
      "##                       ##", // 25
      "##   ---           ---   ##", // 26
      "##                       ##", // 27
      "##=================   ===##", // 28
      "##                       ##", // 29
      "##  HHH                  ##", // 30
      "## ======                ##", // 31 Heart item
      "##                       ##", // 32
      "##         1             ##", // 33 Moving platform 1 (horizontal)
      "##                       ##", // 34
      "##                       ##", // 35
      "##                       ##", // 36 Orc guard
      "##                  O    ##", // 37
      "##                ====== ##", // 38
      "##         2             ##", // 39 Moving elevator 2 (vertical)
      "##                       ##", // 40
      "##   ======              ##", // 41
      "##           $$$         ##", // 42
      "##                       ##", // 43
      "##                       ##", // 44
      "##===   =================##", // 45
      "##                       ##", // 46
      "##          S            ##", // 47 Slime
      "##       =======         ##", // 48
      "##    G                  ##", // 49 Gem
      "##  ---             ---  ##", // 50
      "##                       ##", // 51
      "##         ^^^^^         ##", // 52
      "##        =======        ##", // 53
      "##   T                   ##", // 54 Trampoline
      "##  ===           ===    ##", // 55
      "##                 O     ##", // 56 Orc guard
      "##              =======  ##", // 57
      "##          S            ##", // 58
      "##        -----          ##", // 59
      "##                       ##", // 60
      "##                  ===  ##", // 61
      "##   S                   ##", // 62 Slime
      "##  ===                  ##", // 63
      "##          T            ##", // 64
      "##         ===           ##", // 65 Solid block for trampoline
      "##                       ##", // 66
      "##    @                  ##", // 67 Player spawn
      "##=======================##", // 68 Base floor
      "###########################"  // 69 Solid bedrock
    ];

    let player = null;
    let demonBoss = null;
    let bossBar = null;
    let bossBattleTriggered = false;

    const movingPlatforms = [];
    const enemies = [];

    // Helper for floating text notifications
    function showPopup(pos, txt, col = k.rgb(255, 230, 100)) {
      const pop = k.add([
        k.text(txt, { font: "pressstart", size: 8 }),
        k.pos(pos.x, pos.y - 12),
        k.anchor("center"),
        k.color(col),
        k.z(50)
      ]);
      pop.onUpdate(() => {
        pop.pos.y -= 25 * k.dt();
        pop.opacity = Math.max(0, (pop.opacity || 1) - 1.2 * k.dt());
        if (pop.opacity <= 0) pop.destroy();
      });
    }

    // Build the 70-row vertical tower
    for (let row = 0; row < rows; row++) {
      const line = layout[row];
      for (let col = 0; col < cols; col++) {
        const char = line[col];
        const x = col * tileSize;
        const y = row * tileSize;

        switch (char) {
          case "#":
            // Solid stone wall
            k.add([
              k.sprite("dungeon_wall"),
              k.pos(x, y),
              k.scale(tileSize / 16),
              k.area(),
              k.body({ isStatic: true }),
              "solid",
              "wall"
            ]);
            break;

          case "=":
            // Solid stone floor
            k.add([
              k.sprite("dungeon_top"),
              k.pos(x, y),
              k.scale(tileSize / 16),
              k.area(),
              k.body({ isStatic: true }),
              "solid",
              "ground"
            ]);
            break;

          case "-":
            // Thin floating stone platform (Gothic purple stone slab, seamlessly tileable)
            k.add([
              k.sprite("dungeon_platform"),
              k.pos(x, y),
              k.scale(tileSize / 16),
              k.area({ shape: new k.Rect(k.vec2(0, 0), 16, 9) }),
              k.body({ isStatic: true }),
              "solid",
              "platform"
            ]);
            break;

          case "^":
            // Deadly dungeon spikes (flush on top of block below, anchored at bottom)
            k.add([
              k.sprite("dungeon_spikes"),
              k.pos(x, y),
              k.scale(tileSize / 16),
              k.area({ shape: new k.Rect(k.vec2(0, 8), 16, 8) }),
              k.z(3),
              "spikes"
            ]);
            break;

          case "$":
            // Gold coin
            k.add([
              k.sprite("coin"),
              k.pos(x + 4, y + 4),
              k.scale(tileSize / 16),
              k.area(),
              k.z(5),
              "coin"
            ]);
            break;

          case "G":
            // Precious gem
            k.add([
              k.sprite("gem"),
              k.pos(x + 4, y + 4),
              k.scale(tileSize / 16),
              k.area(),
              k.z(5),
              "gem"
            ]);
            break;

          case "H":
            // Restorative Heart
            k.add([
              k.sprite("heart_full"),
              k.pos(x + 4, y + 4),
              k.scale(tileSize / 16),
              k.area(),
              k.z(5),
              "heart_item"
            ]);
            break;

          case "T":
            // Geyser / spring trampoline (flush on block below)
            k.add([
              k.sprite("spring"),
              k.pos(x, y),
              k.scale(tileSize / 16),
              k.area({ shape: new k.Rect(k.vec2(0, 4), 16, 12) }),
              k.z(4),
              "spring"
            ]);
            break;

          case "1":
            // Moving Platform 1 (Horizontal patrol across row 33: x = 168 to 432, 2 tiles wide)
            {
              const plat = k.add([
                k.sprite("dungeon_platform_2x"),
                k.pos(x, y),
                k.scale(tileSize / 16),
                k.area({ shape: new k.Rect(k.vec2(0, 0), 32, 9) }),
                k.body({ isStatic: true }),
                k.z(4),
                "solid",
                "moving_platform",
                {
                  startX: 168,
                  endX: 432,
                  speed: 55,
                  dir: 1,
                  deltaX: 0,
                  deltaY: 0
                }
              ]);
              movingPlatforms.push(plat);
            }
            break;

          case "2":
            // Moving Elevator 2 (Vertical ascent: y = 912 to 1056, 2 tiles wide)
            {
              const elevator = k.add([
                k.sprite("dungeon_platform_2x"),
                k.pos(x, y),
                k.scale(tileSize / 16),
                k.area({ shape: new k.Rect(k.vec2(0, 0), 32, 9) }),
                k.body({ isStatic: true }),
                k.z(4),
                "solid",
                "moving_platform",
                {
                  startY: 912,
                  endY: 1056,
                  speed: 48,
                  dir: -1,
                  deltaX: 0,
                  deltaY: 0
                }
              ]);
              movingPlatforms.push(elevator);
            }
            break;

          default:
            break;
        }
      }
    }

    // Initialize HUD
    const hud = createHUD(k, "NIVEL 3: LA TORRE");

    // Spawn player at "@" position (col 5, row 67 -> x=120, y=1608)
    player = createPlayer(k, 120, 1608, true, 1720);

    // Spawn tower guards
    enemies.push(createSlime(k, 5 * tileSize, 62 * tileSize, 45));
    enemies.push(createOrc(k, 19 * tileSize, 56 * tileSize, 50));
    enemies.push(createSlime(k, 12 * tileSize, 47 * tileSize, 40));
    enemies.push(createOrc(k, 18 * tileSize, 36 * tileSize, 50));
    enemies.push(createOrc(k, 13 * tileSize, 23 * tileSize, 55));

    // Spawn Demon King at row 4, col 13 (x=312, y=96)
    demonBoss = createDemon(k, 312, 110, null, () => {
      // Callback on boss defeat -> Check if Easter Egg secret level is unlocked!
      k.wait(1.5, () => {
        if (gameState.score >= gameState.secretScoreThreshold) {
          k.go("secret");
        } else {
          k.go("victory");
        }
      });
    });

    // Update moving platforms with player drag physics
    k.onUpdate(() => {
      for (const plat of movingPlatforms) {
        if (plat.startX !== undefined) {
          // Horizontal moving platform
          const oldX = plat.pos.x;
          plat.pos.x += plat.speed * plat.dir * k.dt();
          plat.deltaX = plat.pos.x - oldX;
          plat.deltaY = 0;

          if (plat.pos.x >= plat.endX) {
            plat.pos.x = plat.endX;
            plat.dir = -1;
          } else if (plat.pos.x <= plat.startX) {
            plat.pos.x = plat.startX;
            plat.dir = 1;
          }
        } else if (plat.startY !== undefined) {
          // Vertical elevator
          const oldY = plat.pos.y;
          plat.pos.y += plat.speed * plat.dir * k.dt();
          plat.deltaX = 0;
          plat.deltaY = plat.pos.y - oldY;

          if (plat.pos.y >= plat.endY) {
            plat.pos.y = plat.endY;
            plat.dir = -1;
          } else if (plat.pos.y <= plat.startY) {
            plat.pos.y = plat.startY;
            plat.dir = 1;
          }
        }

        // Drag player if standing on moving platform
        if (player && player.isGrounded() && player.isColliding(plat)) {
          player.pos.x += plat.deltaX;
          player.pos.y += plat.deltaY;
        }
      }
    });

    // --- Interactive Collisions & Triggers ---

    // 1. Coins & Collectibles
    player.onCollide("coin", (coin) => {
      coin.destroy();
      gameState.addScore(100);
      k.play("coin");
      showPopup(coin.pos, "+100", k.rgb(255, 230, 80));
    });

    player.onCollide("gem", (gem) => {
      gem.destroy();
      gameState.addScore(300);
      k.play("win");
      showPopup(gem.pos, "+300", k.rgb(100, 240, 255));
    });

    player.onCollide("heart_item", (heart) => {
      heart.destroy();
      if (gameState.lives < gameState.maxLives) {
        gameState.lives++;
        showPopup(heart.pos, "+1 VIDA", k.rgb(255, 120, 150));
      } else {
        gameState.addScore(250);
        showPopup(heart.pos, "+250", k.rgb(255, 200, 100));
      }
      k.play("win");
    });

    // 2. Geyser Trampolines (Super jump)
    player.onCollide("spring", (spr) => {
      k.play("spring");
      player.jump(590);
      spr.scale = k.vec2((tileSize / 16) * 1.3, (tileSize / 16) * 0.7);
      k.wait(0.15, () => {
        spr.scale = k.vec2(tileSize / 16, tileSize / 16);
      });
    });

    // 3. Spikes Hazard
    player.onCollide("spikes", () => {
      player.receiveDamage(0);
    });

    // 4. Combat collisions with enemies and boss
    player.onCollide("enemy", (enemy) => {
      if (enemy.isDead || enemy.isHurt) return;

      // Stomp jump kill / damage: if player falls onto enemy from above
      if (player.vel.y > 0 && player.pos.y < enemy.pos.y - 4) {
        if (enemy.takeDamage) {
          enemy.takeDamage(2, player.pos.x);
        }
        player.jump(280);
        return;
      }

      // Player receives damage and knockback
      const knockDir = player.pos.x < enemy.pos.x ? -1 : 1;
      player.receiveDamage(knockDir);
    });

    player.onCollide("orc_attack", (hitbox) => {
      if (player.isHurt || player.isDead) return;
      const knockDir = player.pos.x < hitbox.pos.x ? -1 : 1;
      player.receiveDamage(knockDir);
    });

    player.onCollide("demon_attack", (hitbox) => {
      if (player.isHurt || player.isDead) return;
      const knockDir = player.pos.x < hitbox.pos.x ? -1 : 1;
      player.receiveDamage(knockDir);
    });

    // Sword melee attack hitting demon boss
    player.onCollide("player_attack", (hitbox) => {
      // handled inside player attack system
    });

    // --- Main Update Loop: Vertical Camera Tracking & Boss Arena Trigger ---
    k.onUpdate(() => {
      if (!player) return;

      // Clamp player within horizontal tower walls
      if (player.pos.x < 18) {
        player.pos.x = 18;
      } else if (player.pos.x > mapWidth - 18) {
        player.pos.x = mapWidth - 18;
      }

      // Instant death if falling into bottom pit (y > 1720)
      if (player.pos.y > 1720 && !player.isDead) {
        player.die();
      }

      // Vertical Camera Tracking: Locks horizontally at width/2 and smoothly follows Mili in Y
      const targetCamY = Math.max(k.height() / 2, Math.min(player.pos.y, mapHeight - k.height() / 2));
      k.camPos(k.width() / 2, targetCamY);

      // Trigger Boss Fight Arena when player reaches the rooftop throne (y < 260)
      if (player.pos.y < 260 && !bossBattleTriggered) {
        bossBattleTriggered = true;
        k.play("win");

        // Spawn Boss Health Bar in the HUD
        bossBar = hud.createBossBar("REY DEMONIO", 10);

        // Assign bossBar to demon instance
        if (demonBoss) {
          demonBoss.bossBar = bossBar;
        }

        // Rooftop entrance banner
        const arenaBanner = k.add([
          k.text("¡EL TRONO DEL REY DEMONIO!", {
            font: "pressstart",
            size: 9
          }),
          k.pos(k.width() / 2, 75),
          k.anchor("center"),
          k.color(255, 60, 60),
          k.fixed(),
          k.z(100)
        ]);
        k.wait(3.0, () => arenaBanner.destroy());
      }
    });
  });
}
