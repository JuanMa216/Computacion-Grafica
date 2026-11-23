import { createPlayer } from "../entities/player.js";
import { createSlime } from "../entities/slime.js";
import { createOrc } from "../entities/orc.js";
import { createHUD } from "../entities/hud.js";
import { gameState } from "../state.js";

/**
 * Level 2: "Las Cavernas Oscuras y Minas Subterráneas" (Versión Expandida 120 Columnas)
 * 
 * Features & Mechanics (Req-2, Req-5, Req-8):
 * - Atmospheric Subterranean Cavern background (bg_level2)
 * - RottingPixels natural rock tileset (cave_top, cave_wall, wood_platform, cave_spikes)
 * - Mística Mecánica de Grimorios (Books):
 *     * Grimorio Carmesí (book_red): Abre el portal a la Cripta Carmesí (Dungeon Secreta de Fuego)
 *     * Grimorio Esmeralda (book_green): Abre el portal a la Garganta Esmeralda (Dungeon Secreta Tóxica)
 *     * Grimorio Celestial (book_blue): ¡EL ÚNICO LIBRO SAGRADO que abre el Nivel 3 (El Trono del Rey Demonio)!
 * - Múltiples plataformas móviles (horizontales y ascensor vertical)
 * - Múltiples trampolines elásticos (géiseres)
 * - Escuadrón de Orcos Guerreros (3 HP, ataque de maza) y Slimes cavernícolas
 * 
 * @param {import("kaboom").KaboomCtx} k - Kaboom context
 */
export function initLevel2(k) {
  k.scene("level2", () => {
    gameState.currentLevel = 2;
    gameState.hasKey = false;
    gameState.collectedBook = null;

    // Reset camera and gravity
    k.setGravity(980);
    k.camPos(k.width() / 2, k.height() / 2);

    // --- Req-8: Atmospheric Cavern Background ---
    k.add([
      k.sprite("bg_level2"),
      k.pos(0, 0),
      k.fixed(),
      k.scale(k.width() / 640, k.height() / 360),
      k.z(-10)
    ]);

    // Level objective hint under HUD banner
    k.add([
      k.rect(520, 20),
      k.pos(k.width() / 2, 48),
      k.anchor("center"),
      k.color(14, 12, 22),
      k.opacity(0.85),
      k.fixed(),
      k.z(80)
    ]);

    k.add([
      k.text("OBJETIVO: Explora las cavernas y encuentra un libro arcano para la puerta", {
        font: "pressstart",
        size: 6.5
      }),
      k.pos(k.width() / 2, 48),
      k.anchor("center"),
      k.color(240, 210, 110),
      k.fixed(),
      k.z(81)
    ]);

    // --- Level 2 Layout (ASCII Grid: 120 columns x 15 rows = 2880 x 360 px) ---
    // Tile legend:
    // '=' cave_top (ground)
    // '#' cave_wall
    // '-' wood_platform
    // '^' cave_spikes (stalagmites)
    // '$' coin
    // 'G' gem
    // 'T' spring trampoline
    // '1' book_red (Grimorio Carmesi)
    // '2' book_green (Grimorio Esmeralda)
    // '3' book_blue (Grimorio Celestial - Verdadero)
    // 'D' catacomb exit door
    // '@' player spawn
    // 'S' slime
    // 'O' orc warrior
    const mapLayout = [
      "                                                                                                                        ",
      "                                      $$$                                                       3                       ",
      "                                      ===                              ===                    ======               D    ",
      "                  $$$                                                                                                   ",
      "                 =====            1                              ---                                           =====    ",
      "                                 ---                                                                           #####    ",
      "         S              O                        O                               2                                      ",
      "        ---            =====          ---       =====                    ---         ---                                ",
      "                                                                                                                        ",
      "                                                              ---                        ---                            ",
      "      T                                    T                                    T                                       ",
      "     ===                                  ===          ^^^                     ===            ^^^^                      ",
      "     ###                                  ###        =======                   ###          =======                     ",
      "  @                                   S              #######            S                   #######        T         $$$",
      "=================                =============   ==============       ========             ============================="
    ];

    let player = null;
    const enemies = [];
    const movingPlatforms = [];

    // Helper to spawn floating score/notification text
    function showPopup(pos, txt, col = k.rgb(255, 230, 80)) {
      const popup = k.add([
        k.text(txt, { font: "pressstart", size: 8 }),
        k.pos(pos.x, pos.y - 12),
        k.anchor("center"),
        k.color(col),
        k.z(30)
      ]);
      popup.onUpdate(() => {
        popup.pos.y -= 25 * k.dt();
      });
      k.wait(0.6, () => popup.destroy());
    }

    // Build the level using Kaboom's addLevel
    const level = k.addLevel(mapLayout, {
      tileWidth: 24,
      tileHeight: 24,
      pos: k.vec2(0, 0),
      tiles: {
        // RottingPixels Cave Stone Top (Starts at y=0, perfectly flush)
        "=": () => [
          k.sprite("cave_top"),
          k.scale(24 / 16),
          k.area(),
          k.body({ isStatic: true }),
          k.z(1),
          "solid",
          "ground"
        ],
        // RottingPixels Cave Wall Fill
        "#": () => [
          k.sprite("cave_wall"),
          k.scale(24 / 16),
          k.area(),
          k.body({ isStatic: true }),
          k.z(1),
          "solid"
        ],
        // Mining timber platform
        "-": () => [
          k.sprite("wood_platform"),
          k.scale(24 / 16),
          k.area(),
          k.body({ isStatic: true }),
          k.z(1),
          "solid",
          "platform"
        ],
        // Gold Coin (+100 points)
        "$": () => [
          k.sprite("coin"),
          k.scale(24 / 18),
          k.area(),
          k.anchor("center"),
          k.z(2),
          "coin"
        ],
        // Crystal Gem (+250 points)
        "G": () => [
          k.sprite("gem"),
          k.scale(24 / 18),
          k.area(),
          k.anchor("center"),
          k.z(2),
          "gem"
        ],
        // Mineral Stalagmites Hazard
        "^": () => [
          k.sprite("cave_spikes"),
          k.scale(24 / 16),
          k.area({ shape: new k.Rect(k.vec2(0, 8), 16, 8) }),
          k.z(2),
          "spikes",
          "hazard"
        ],
        // Geyser / Bouncy Spring Trampoline
        "T": () => [
          k.sprite("spring"),
          k.scale(24 / 18),
          k.area(),
          k.z(2),
          "spring"
        ],
        // 1: Grimorio Carmesí (Falso -> Cripta de Fuego)
        "1": () => [
          k.sprite("book_red"),
          k.scale(24 / 16),
          k.area(),
          k.anchor("center"),
          k.z(3),
          "book_red",
          "book"
        ],
        // 2: Grimorio Esmeralda (Falso -> Garganta Tóxica)
        "2": () => [
          k.sprite("book_green"),
          k.scale(24 / 16),
          k.area(),
          k.anchor("center"),
          k.z(3),
          "book_green",
          "book"
        ],
        // 3: Grimorio Celestial (Verdadero -> Trono del Rey Demonio)
        "3": () => [
          k.sprite("book_blue"),
          k.scale(24 / 16),
          k.area(),
          k.anchor("center"),
          k.z(3),
          "book_blue",
          "book"
        ],
        // Locked Exit Door (16x32, 2 tiles tall)
        "D": () => [
          k.sprite("door_closed"),
          k.scale(24 / 16),
          k.area({ shape: new k.Rect(k.vec2(0, 0), 16, 32) }),
          k.z(2),
          "exit_door"
        ]
      }
    });

    // Map dimensions (120 cols x 15 rows)
    const mapWidth = 120 * 24; // 2880 px
    const mapHeight = 15 * 24; // 360 px

    // Left solid boundary
    k.add([
      k.rect(32, mapHeight + 600),
      k.pos(-32, -300),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
      "solid",
      "boundary"
    ]);

    // Right solid boundary
    k.add([
      k.rect(32, mapHeight + 600),
      k.pos(mapWidth, -300),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
      "solid",
      "boundary"
    ]);

    // --- Multiple Moving Platforms (Req-5) ---

    // Platform 1: Horizontal over first chasm (cols 17-20)
    const plat1 = k.add([
      k.sprite("wood_platform"),
      k.pos(18 * 24, 11 * 24),
      k.scale(24 / 16),
      k.area(),
      k.body({ isStatic: true }),
      k.z(2),
      "solid",
      "platform",
      "moving_platform",
      { baseX: 18 * 24, deltaX: 0 }
    ]);
    plat1.onUpdate(() => {
      const prevX = plat1.pos.x;
      plat1.pos.x = plat1.baseX + Math.sin(k.time() * 2) * 45;
      plat1.deltaX = plat1.pos.x - prevX;
      carryPlayerHorizontal(plat1);
    });
    movingPlatforms.push(plat1);

    // Platform 2: Vertical Elevator between lower tunnel and upper key chamber (cols 45-50)
    const plat2 = k.add([
      k.sprite("wood_platform"),
      k.pos(45 * 24, 9 * 24),
      k.scale(24 / 16),
      k.area(),
      k.body({ isStatic: true }),
      k.z(2),
      "solid",
      "platform",
      "moving_platform",
      { baseY: 9 * 24, deltaY: 0 }
    ]);
    plat2.onUpdate(() => {
      const prevY = plat2.pos.y;
      plat2.pos.y = plat2.baseY + Math.sin(k.time() * 1.8) * 55;
      plat2.deltaY = plat2.pos.y - prevY;
      carryPlayerVertical(plat2);
    });
    movingPlatforms.push(plat2);

    // Platform 3: Horizontal over third chasm (cols 72-76)
    const plat3 = k.add([
      k.sprite("wood_platform"),
      k.pos(73 * 24, 11 * 24),
      k.scale(24 / 16),
      k.area(),
      k.body({ isStatic: true }),
      k.z(2),
      "solid",
      "platform",
      "moving_platform",
      { baseX: 73 * 24, deltaX: 0 }
    ]);
    plat3.onUpdate(() => {
      const prevX = plat3.pos.x;
      plat3.pos.x = plat3.baseX + Math.sin(k.time() * 2.2) * 55;
      plat3.deltaX = plat3.pos.x - prevX;
      carryPlayerHorizontal(plat3);
    });
    movingPlatforms.push(plat3);

    // Helper: Carries player when standing on moving platform
    function carryPlayerHorizontal(plat) {
      if (!player || !player.isGrounded()) return;
      const pBounds = player.worldArea().bbox();
      const platBounds = plat.worldArea().bbox();
      const isStanding =
        pBounds.pos.x + pBounds.width > platBounds.pos.x &&
        pBounds.pos.x < platBounds.pos.x + platBounds.width &&
        Math.abs(pBounds.pos.y + pBounds.height - platBounds.pos.y) < 5;

      if (isStanding) {
        player.pos.x += plat.deltaX;
      }
    }

    function carryPlayerVertical(plat) {
      if (!player || !player.isGrounded()) return;
      const pBounds = player.worldArea().bbox();
      const platBounds = plat.worldArea().bbox();
      const isStanding =
        pBounds.pos.x + pBounds.width > platBounds.pos.x &&
        pBounds.pos.x < platBounds.pos.x + platBounds.width &&
        Math.abs(pBounds.pos.y + pBounds.height - platBounds.pos.y) < 6;

      if (isStanding) {
        player.pos.y += plat.deltaY;
      }
    }

    // --- Dynamic Portal Door Label ---
    // Col 113, Row 2 -> Door rests on row 4 at y = 96
    const doorLabel = k.add([
      k.text("PUERTA SELLADA: BUSCA UN LIBRO", { font: "pressstart", size: 6.5 }),
      k.pos(113 * 24 + 12, 2 * 24 - 10),
      k.anchor("center"),
      k.color(240, 80, 80),
      k.z(10)
    ]);

    doorLabel.onUpdate(() => {
      if (gameState.hasKey) {
        doorLabel.text = "¡PORTAL DESBLOQUEADO!";
        doorLabel.color = k.rgb(240, 220, 140);
        doorLabel.opacity = k.wave(0.6, 1, k.time() * 4);
      } else {
        doorLabel.text = "PUERTA SELLADA: BUSCA UN LIBRO";
        doorLabel.color = k.rgb(240, 80, 80);
        doorLabel.opacity = k.wave(0.4, 0.9, k.time() * 3);
      }
    });

    // Spawn player at "@" position (col 2, row 13 -> x=48, y=290)
    player = createPlayer(k, 48, 290, true);

    // Spawn Slimes across the cavern
    enemies.push(createSlime(k, 10 * 24, 6 * 24, 35));
    enemies.push(createSlime(k, 36 * 24, 13 * 24, 45));
    enemies.push(createSlime(k, 60 * 24, 13 * 24, 45));
    enemies.push(createSlime(k, 88 * 24, 13 * 24, 40));

    // Spawn Orc Warriors at key camps and high platforms
    enemies.push(createOrc(k, 25 * 24, 6 * 24, 45));
    enemies.push(createOrc(k, 51 * 24, 6 * 24, 50));
    enemies.push(createOrc(k, 75 * 24, 6 * 24, 45));
    enemies.push(createOrc(k, 100 * 24, 6 * 24, 40));

    // Initialize HUD (Req-3 & Req-4)
    createHUD(k, "Nivel 2: Cavernas");

    // --- Collisions & Interactions ---

    // 1. Collect Coins (+100 points)
    player.onCollide("coin", (coin) => {
      coin.destroy();
      k.play("coin");
      gameState.addScore(100);
      showPopup(coin.pos, "+100");
    });

    // 2. Collect Gems (+250 points)
    player.onCollide("gem", (gem) => {
      gem.destroy();
      k.play("coin");
      gameState.addScore(250);
      showPopup(gem.pos, "+250", k.rgb(120, 240, 255));
    });

    // 3. Book Collection Mechanics (Misterio: Sin revelar cuál es el correcto)

    // Grimorio Carmesí (Red Book)
    player.onCollide("book_red", (book) => {
      book.destroy();
      gameState.collectedBook = "red";
      gameState.hasKey = true;
      k.play("win");
      showPopup(book.pos, "¡LIBRO OBTENIDO!", k.rgb(255, 220, 140));

      const banner = k.add([
        k.text("¡HAS RECOGIDO UN LIBRO MISTERIOSO! VE AL PORTAL...", {
          font: "pressstart",
          size: 7
        }),
        k.pos(k.width() / 2, 75),
        k.anchor("center"),
        k.color(255, 230, 150),
        k.fixed(),
        k.z(95)
      ]);
      k.wait(2.5, () => banner.destroy());
    });

    // Grimorio Esmeralda (Green Book)
    player.onCollide("book_green", (book) => {
      book.destroy();
      gameState.collectedBook = "green";
      gameState.hasKey = true;
      k.play("win");
      showPopup(book.pos, "¡LIBRO OBTENIDO!", k.rgb(255, 220, 140));

      const banner = k.add([
        k.text("¡HAS RECOGIDO UN LIBRO MISTERIOSO! VE AL PORTAL...", {
          font: "pressstart",
          size: 7
        }),
        k.pos(k.width() / 2, 75),
        k.anchor("center"),
        k.color(255, 230, 150),
        k.fixed(),
        k.z(95)
      ]);
      k.wait(2.5, () => banner.destroy());
    });

    // Grimorio Celestial (Blue Book)
    player.onCollide("book_blue", (book) => {
      book.destroy();
      gameState.collectedBook = "blue";
      gameState.hasKey = true;
      k.play("win");
      showPopup(book.pos, "¡LIBRO OBTENIDO!", k.rgb(255, 220, 140));

      const banner = k.add([
        k.text("¡HAS RECOGIDO UN LIBRO MISTERIOSO! VE AL PORTAL...", {
          font: "pressstart",
          size: 7
        }),
        k.pos(k.width() / 2, 75),
        k.anchor("center"),
        k.color(255, 230, 150),
        k.fixed(),
        k.z(95)
      ]);
      k.wait(2.5, () => banner.destroy());
    });

    // 4. Stalagmites Hazard (Req-4)
    player.onCollide("spikes", () => {
      player.receiveDamage(0);
    });

    // 5. Spring Trampolines (Req-5)
    player.onCollide("spring", () => {
      k.play("spring");
      player.jump(player.jumpForce * 1.55);
      player.hasDoubleJumped = false;
    });

    // 6. Enemy Collision (Stomp vs Lateral Damage)
    player.onCollide("enemy", (enemy) => {
      if (enemy.isDead || player.isHurt) return;

      const isStomping = player.pos.y < enemy.pos.y - 6;

      if (isStomping && player.isFalling()) {
        if (enemy.is("orc")) {
          enemy.takeDamage(2, player.pos.x);
        } else {
          enemy.die();
        }
        player.jump(player.jumpForce * 0.85);
        player.hasDoubleJumped = false;
        k.play("spring");
      } else {
        const knockDir = player.pos.x < enemy.pos.x ? -1 : 1;
        player.receiveDamage(knockDir);
      }
    });

    // 7. Orc Attack Hitbox
    player.onCollide("orc_attack", (hitbox) => {
      if (player.isHurt || player.isDead) return;
      const knockDir = player.pos.x < hitbox.pos.x ? -1 : 1;
      player.receiveDamage(knockDir);
    });

    // 8. Exit Door Portal Reaction depending on the Book held!
    let reachedDoor = false;
    player.onCollide("exit_door", (door) => {
      if (reachedDoor) return;

      if (!gameState.hasKey || !gameState.collectedBook) {
        // Locked without a book
        k.play("hit");
        showPopup(door.pos, "¡CERRADO! ENCUENTRA UN LIBRO", k.rgb(255, 100, 100));
        return;
      }

      reachedDoor = true;
      k.play("win");
      door.use(k.sprite("door_open"));

      const book = gameState.collectedBook;

      if (book === "blue") {
        // BOOK 1: Leads to Level 3 Final Boss!
        k.add([
          k.rect(k.width(), 70),
          k.pos(0, k.height() / 2 - 35),
          k.color(14, 18, 32),
          k.opacity(0.95),
          k.fixed(),
          k.z(150)
        ]);

        k.add([
          k.text("¡VIAJANDO A TRAVÉS DEL PORTAL...!", { font: "pressstart", size: 11 }),
          k.pos(k.width() / 2, k.height() / 2 - 10),
          k.anchor("center"),
          k.color(160, 220, 255),
          k.fixed(),
          k.z(151)
        ]);

        k.add([
          k.text("¿Hacia dónde te llevará este libro...?", {
            font: "pressstart",
            size: 8
          }),
          k.pos(k.width() / 2, k.height() / 2 + 14),
          k.anchor("center"),
          k.color(240, 220, 160),
          k.fixed(),
          k.z(151)
        ]);

        k.wait(2.0, () => {
          k.go("level3");
        });
      } else if (book === "red") {
        // BOOK 2: Leads to Crimson Crypt!
        k.add([
          k.rect(k.width(), 70),
          k.pos(0, k.height() / 2 - 35),
          k.color(28, 10, 14),
          k.opacity(0.95),
          k.fixed(),
          k.z(150)
        ]);

        k.add([
          k.text("¡VIAJANDO A TRAVÉS DEL PORTAL...!", { font: "pressstart", size: 11 }),
          k.pos(k.width() / 2, k.height() / 2 - 10),
          k.anchor("center"),
          k.color(255, 180, 160),
          k.fixed(),
          k.z(151)
        ]);

        k.add([
          k.text("¿Hacia dónde te llevará este libro...?", { font: "pressstart", size: 8 }),
          k.pos(k.width() / 2, k.height() / 2 + 14),
          k.anchor("center"),
          k.color(255, 200, 160),
          k.fixed(),
          k.z(151)
        ]);

        k.wait(2.0, () => {
          k.go("dungeon_red");
        });
      } else if (book === "green") {
        // BOOK 3: Leads to Emerald Gorge!
        k.add([
          k.rect(k.width(), 70),
          k.pos(0, k.height() / 2 - 35),
          k.color(10, 24, 16),
          k.opacity(0.95),
          k.fixed(),
          k.z(150)
        ]);

        k.add([
          k.text("¡VIAJANDO A TRAVÉS DEL PORTAL...!", { font: "pressstart", size: 11 }),
          k.pos(k.width() / 2, k.height() / 2 - 10),
          k.anchor("center"),
          k.color(160, 255, 190),
          k.fixed(),
          k.z(151)
        ]);

        k.add([
          k.text("¿Hacia dónde te llevará este libro...?", { font: "pressstart", size: 8 }),
          k.pos(k.width() / 2, k.height() / 2 + 14),
          k.anchor("center"),
          k.color(200, 255, 200),
          k.fixed(),
          k.z(151)
        ]);

        k.wait(2.0, () => {
          k.go("dungeon_green");
        });
      }
    });

    // Keep player strictly within map limits (120 cols = 2880 px) and smoothly follow with camera
    k.onUpdate(() => {
      if (!player) return;

      // Hard clamp within map boundaries
      if (player.pos.x < 10) {
        player.pos.x = 10;
      } else if (player.pos.x > mapWidth - 10) {
        player.pos.x = mapWidth - 10;
      }

      // Camera smoothly follows player horizontally within world bounds
      const targetCamX = Math.max(k.width() / 2, Math.min(player.pos.x, mapWidth - k.width() / 2));
      k.camPos(targetCamX, k.height() / 2);
    });
  });
}
