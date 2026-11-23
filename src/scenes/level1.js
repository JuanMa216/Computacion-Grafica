import { createPlayer } from "../entities/player.js";
import { createSlime } from "../entities/slime.js";
import { createHUD } from "../entities/hud.js";
import { gameState } from "../state.js";

/**
 * Level 1: "Castillo y Ruinas Medievales"
 * 
 * Uses the authentic RottingPixels medieval castle tileset:
 * - Stone brick floor (stone_top)
 * - Castle masonry wall (stone_wall)
 * - Wooden beam platforms (wood_platform)
 * - Castle iron spikes (castle_spikes)
 * - Shield Block + Jump mechanics (Req-5)
 * 
 * @param {import("kaboom").KaboomCtx} k - Kaboom context
 */
export function initLevel1(k) {
  k.scene("level1", () => {
    gameState.currentLevel = 1;

    // Reset camera and gravity
    k.setGravity(980);
    k.camPos(k.width() / 2, k.height() / 2);

    // --- Req-8: Twilight Castle Background ---
    k.add([
      k.sprite("bg_level1"),
      k.pos(0, 0),
      k.fixed(),
      k.scale(k.width() / 640, k.height() / 360),
      k.z(-10)
    ]);

    // Discrete controls hint under HUD banner
    k.add([
      k.rect(460, 20),
      k.pos(k.width() / 2, 48),
      k.anchor("center"),
      k.color(14, 12, 22),
      k.opacity(0.85),
      k.fixed(),
      k.z(80)
    ]);

    k.add([
      k.text("Z/J: Atacar  •  SHIFT/C: Escudo  •  ESPACIO: Saltar", {
        font: "pressstart",
        size: 8
      }),
      k.pos(k.width() / 2, 48),
      k.anchor("center"),
      k.color(210, 200, 240),
      k.fixed(),
      k.z(81)
    ]);

    // --- Level Layout (ASCII Grid) ---
    // Tile size: 24x24 px. 15 rows = 360 px
    const mapLayout = [
      "                                                                            ",
      "                                                                            ",
      "                                                      $$$            D      ",
      "               $$$                 G                                        ",
      "              ====                ---                              =====    ",
      "                       VVV                S                        #####    ",
      "                       ---              ====             ---                ",
      "             S                          ####                                ",
      "            ===                ---             S               ---          ",
      "            ###                               ===                           ",
      "     $$               T                       ###                           ",
      "    ====             ===               ^^^^^           T                    ",
      "    ####             ###              =======         ===           ^^      ",
      "  @         V                         #######                     ====      ",
      "====================      =================================================="
    ];

    let player = null;
    const slimes = [];

    // Helper to spawn floating score text
    function showScorePopup(pos, pts) {
      const popup = k.add([
        k.text(`+${pts}`, { font: "pressstart", size: 8 }),
        k.pos(pos.x, pos.y - 10),
        k.anchor("center"),
        k.color(255, 230, 80),
        k.z(30)
      ]);
      popup.onUpdate(() => {
        popup.pos.y -= 25 * k.dt();
      });
      k.wait(0.5, () => popup.destroy());
    }

    // Build the level using Kaboom's addLevel
    const level = k.addLevel(mapLayout, {
      tileWidth: 24,
      tileHeight: 24,
      pos: k.vec2(0, 0),
      tiles: {
        // RottingPixels Castle Stone Top
        "=": () => [
          k.sprite("stone_top"),
          k.scale(24 / 16),
          k.area(),
          k.body({ isStatic: true }),
          k.z(1),
          "solid",
          "ground"
        ],
        // RottingPixels Castle Wall Fill
        "#": () => [
          k.sprite("stone_wall"),
          k.scale(24 / 16),
          k.area(),
          k.body({ isStatic: true }),
          k.z(1),
          "solid"
        ],
        // RottingPixels Medieval Wooden Platform
        "-": () => [
          k.sprite("wood_platform"),
          k.scale(24 / 16),
          k.area(),
          k.body({ isStatic: true }),
          k.z(1),
          "solid",
          "platform"
        ],
        // Coin (+100 points)
        "$": () => [
          k.sprite("coin"),
          k.scale(24 / 18),
          k.area(),
          k.anchor("center"),
          k.z(2),
          "coin"
        ],
        // Gem (+250 points)
        "G": () => [
          k.sprite("gem"),
          k.scale(24 / 18),
          k.area(),
          k.anchor("center"),
          k.z(2),
          "gem"
        ],
        // RottingPixels Castle Spikes
        "^": () => [
          k.sprite("castle_spikes"),
          k.scale(24 / 16),
          k.area({ shape: new k.Rect(k.vec2(0, 8), 16, 8) }),
          k.z(2),
          "hazard",
          "spikes"
        ],
        // Castle Background Decoration: Flower Vase
        "V": () => [
          k.sprite("flower_vase"),
          k.scale(24 / 16),
          k.z(1),
          "decoration"
        ],
        // Trampoline / Spring mechanic
        "T": () => [
          k.sprite("spring"),
          k.scale(24 / 18),
          k.area(),
          k.z(2),
          "spring"
        ],
        // Level exit door (Authentic medieval arched wooden door, 16x32)
        "D": () => [
          k.sprite("door_closed"),
          k.scale(24 / 16),
          k.area({ shape: new k.Rect(k.vec2(0, 0), 16, 32) }),
          k.z(2),
          "exit_door"
        ]
      }
    });

    // --- Map Boundaries (Req-5) ---
    // Prevent player and enemies from falling off the start (left) or end (right) of the map
    const mapWidth = mapLayout[0].length * 24; // 76 * 24 = 1824 px
    const mapHeight = mapLayout.length * 24; // 15 * 24 = 360 px

    // Left solid boundary (x <= 0)
    k.add([
      k.rect(32, mapHeight + 600),
      k.pos(-32, -300),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
      "solid",
      "boundary"
    ]);

    // Right solid boundary (x >= mapWidth)
    k.add([
      k.rect(32, mapHeight + 600),
      k.pos(mapWidth, -300),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
      "solid",
      "boundary"
    ]);

    // Animated glowing "SALIDA" indicator above the castle door
    const exitLabel = k.add([
      k.text("SALIDA", { font: "pressstart", size: 8 }),
      k.pos(69 * 24 + 12, 2 * 24 - 10),
      k.anchor("center"),
      k.color(255, 230, 100),
      k.z(10)
    ]);
    exitLabel.onUpdate(() => {
      exitLabel.opacity = k.wave(0.4, 1, k.time() * 4);
    });

    // Spawn player at "@" symbol position
    player = createPlayer(k, 40, 280, true);

    // Spawn Slime enemies at predefined positions
    slimes.push(createSlime(k, 300, 160, 60));
    slimes.push(createSlime(k, 700, 100, 70));
    slimes.push(createSlime(k, 1100, 160, 80));
    slimes.push(createSlime(k, 1350, 100, 60));

    // Initialize HUD (Req-3 & Req-4)
    createHUD(k, "Nivel 1: Castillo");

    // --- Collisions & Interactions ---

    // 1. Collect Coins (Req-3: Score counter)
    player.onCollide("coin", (coin) => {
      coin.destroy();
      k.play("coin");
      gameState.addScore(100);
      showScorePopup(coin.pos, 100);
    });

    // 2. Collect Gems (Req-3: Score counter)
    player.onCollide("gem", (gem) => {
      gem.destroy();
      k.play("coin");
      gameState.addScore(250);
      showScorePopup(gem.pos, 250);
    });

    // 3. Spikes Hazard (Req-4: Lose life)
    player.onCollide("spikes", () => {
      player.receiveDamage(0);
    });

    // 4. Spring / Trampoline Mechanic (Req-5: Level mechanic)
    player.onCollide("spring", () => {
      k.play("spring");
      player.jump(player.jumpForce * 1.5);
      player.hasDoubleJumped = false;
    });

    // 5. Enemy Interaction (Req-5: Stomp vs Shield Block vs Lateral Hit)
    player.onCollide("enemy", (enemy) => {
      if (enemy.isDead) return;

      // Stomp check: If player is falling from above onto enemy
      const isStomping = player.pos.y < enemy.pos.y - 6;

      if (isStomping) {
        enemy.die();
        player.jump(player.jumpForce * 0.85); // Bounce up
        player.hasDoubleJumped = false;
        k.play("jump");
      } else {
        // Lateral hit: Checks shield block or takes damage
        const knockbackDirection = player.pos.x < enemy.pos.x ? -1 : 1;
        player.receiveDamage(knockbackDirection);
      }
    });

    // 6. Level Complete / Exit Door Transition
    let levelFinished = false;
    player.onCollide("exit_door", (door) => {
      if (levelFinished) return;
      levelFinished = true;

      door.use(k.sprite("door_open"));
      k.play("win");

      // Banner message
      k.add([
        k.rect(360, 60),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
        k.color(18, 14, 28),
        k.fixed(),
        k.z(150)
      ]);

      k.add([
        k.text("¡NIVEL 1 SUPERADO!", { font: "pressstart", size: 12 }),
        k.pos(k.width() / 2, k.height() / 2 - 10),
        k.anchor("center"),
        k.color(100, 240, 140),
        k.fixed(),
        k.z(151)
      ]);

      k.add([
        k.text("Entrando a las Catacumbas...", { font: "pressstart", size: 8 }),
        k.pos(k.width() / 2, k.height() / 2 + 14),
        k.anchor("center"),
        k.color(220, 220, 220),
        k.fixed(),
        k.z(151)
      ]);

      k.wait(2.0, () => {
        k.go("level2");
      });
    });

    // Keep player strictly within map limits and smoothly follow with camera
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
