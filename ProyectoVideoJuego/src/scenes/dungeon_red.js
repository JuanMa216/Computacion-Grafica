import { createPlayer } from "../entities/player.js";
import { createSlime } from "../entities/slime.js";
import { createOrc } from "../entities/orc.js";
import { createHUD } from "../entities/hud.js";
import { gameState } from "../state.js";

/**
 * Secret Bonus Dungeon: "La Cripta Carmesí de las Llamas"
 * 
 * Triggered when entering the catacomb portal with the Red Grimoire (book_red).
 * Rewards player with +500 bonus points, combat trial, and provides the clue
 * that only the Celestial Blue Grimoire opens the Demon King's Throne.
 * 
 * @param {import("kaboom").KaboomCtx} k - Kaboom context
 */
export function initDungeonRed(k) {
  k.scene("dungeon_red", () => {
    k.setGravity(980);
    k.camPos(k.width() / 2, k.height() / 2);

    // Reddish magma cavern background
    k.add([
      k.sprite("bg_level2"),
      k.pos(0, 0),
      k.color(255, 110, 110),
      k.fixed(),
      k.scale(k.width() / 640, k.height() / 360),
      k.z(-10)
    ]);

    // Hint banner
    k.add([
      k.rect(520, 20),
      k.pos(k.width() / 2, 48),
      k.anchor("center"),
      k.color(28, 10, 14),
      k.opacity(0.85),
      k.fixed(),
      k.z(80)
    ]);

    k.add([
      k.text("CRIPTA CARMESÍ: Dimensión de Fuego. Encuentra el portal de retorno", {
        font: "pressstart",
        size: 7
      }),
      k.pos(k.width() / 2, 48),
      k.anchor("center"),
      k.color(255, 140, 120),
      k.fixed(),
      k.z(81)
    ]);

    // 40 columns x 15 rows map
    const mapLayout = [
      "                                        ",
      "                                        ",
      "                     $$$                ",
      "                    =====             D ",
      "                                        ",
      "          S              G         ==== ",
      "         ---            ---        #### ",
      "                                        ",
      "               ---             ---      ",
      "        T                               ",
      "       ===            M                 ",
      "       ###           ---           T    ",
      "                    =====         ===   ",
      " @                  #####   O     ###   ",
      "=================   ===================="
    ];

    let player = null;
    const enemies = [];

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

    const level = k.addLevel(mapLayout, {
      tileWidth: 24,
      tileHeight: 24,
      pos: k.vec2(0, 0),
      tiles: {
        "=": () => [
          k.sprite("cave_top"),
          k.scale(24 / 16),
          k.area(),
          k.body({ isStatic: true }),
          k.z(1),
          "solid",
          "ground"
        ],
        "#": () => [
          k.sprite("cave_wall"),
          k.scale(24 / 16),
          k.area(),
          k.body({ isStatic: true }),
          k.z(1),
          "solid"
        ],
        "-": () => [
          k.sprite("wood_platform"),
          k.scale(24 / 16),
          k.area(),
          k.body({ isStatic: true }),
          k.z(1),
          "solid",
          "platform"
        ],
        "$": () => [
          k.sprite("coin"),
          k.scale(24 / 18),
          k.area(),
          k.anchor("center"),
          k.z(2),
          "coin"
        ],
        "G": () => [
          k.sprite("gem"),
          k.scale(24 / 18),
          k.area(),
          k.anchor("center"),
          k.z(2),
          "gem"
        ],
        "^": () => [
          k.sprite("cave_spikes"),
          k.scale(24 / 16),
          k.area({ shape: new k.Rect(k.vec2(0, 8), 16, 8) }),
          k.z(2),
          "spikes",
          "hazard"
        ],
        "T": () => [
          k.sprite("spring"),
          k.scale(24 / 18),
          k.area(),
          k.z(2),
          "spring"
        ],
        "D": () => [
          k.sprite("door_open"),
          k.scale(24 / 16),
          k.area({ shape: new k.Rect(k.vec2(0, 0), 16, 32) }),
          k.z(2),
          "return_portal"
        ]
      }
    });

    const mapWidth = 40 * 24; // 960 px
    const mapHeight = 15 * 24;

    // Boundaries
    k.add([
      k.rect(32, mapHeight + 600),
      k.pos(-32, -300),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
      "solid"
    ]);

    k.add([
      k.rect(32, mapHeight + 600),
      k.pos(mapWidth, -300),
      k.area(),
      k.body({ isStatic: true }),
      k.opacity(0),
      "solid"
    ]);

    // Moving Platform
    const movingPlat = k.add([
      k.sprite("wood_platform"),
      k.pos(21 * 24, 10 * 24),
      k.scale(24 / 16),
      k.area(),
      k.body({ isStatic: true }),
      k.z(2),
      "solid",
      "platform",
      {
        baseX: 21 * 24,
        deltaX: 0
      }
    ]);
    movingPlat.onUpdate(() => {
      const prevX = movingPlat.pos.x;
      movingPlat.pos.x = movingPlat.baseX + Math.sin(k.time() * 2) * 50;
      movingPlat.deltaX = movingPlat.pos.x - prevX;

      if (player && player.isGrounded()) {
        const pBounds = player.worldArea().bbox();
        const platBounds = movingPlat.worldArea().bbox();
        if (
          pBounds.pos.x + pBounds.width > platBounds.pos.x &&
          pBounds.pos.x < platBounds.pos.x + platBounds.width &&
          Math.abs(pBounds.pos.y + pBounds.height - platBounds.pos.y) < 4
        ) {
          player.pos.x += movingPlat.deltaX;
        }
      }
    });

    // Portal label
    const portalLabel = k.add([
      k.text("RETORNO", { font: "pressstart", size: 8 }),
      k.pos(38 * 24 + 12, 4 * 24 - 10),
      k.anchor("center"),
      k.color(255, 140, 100),
      k.z(10)
    ]);
    portalLabel.onUpdate(() => {
      portalLabel.opacity = k.wave(0.5, 1, k.time() * 4);
    });

    player = createPlayer(k, 48, 290, true);
    enemies.push(createSlime(k, 10 * 24, 5 * 24, 30));
    enemies.push(createOrc(k, 28 * 24, 13 * 24, 40));

    createHUD(k, "Cripta Carmesí");

    // Collisions
    player.onCollide("coin", (coin) => {
      coin.destroy();
      k.play("coin");
      gameState.addScore(100);
      showPopup(coin.pos, "+100");
    });

    player.onCollide("gem", (gem) => {
      gem.destroy();
      k.play("coin");
      gameState.addScore(250);
      showPopup(gem.pos, "+250", k.rgb(120, 240, 255));
    });

    player.onCollide("spikes", () => {
      player.receiveDamage(0);
    });

    player.onCollide("spring", () => {
      k.play("spring");
      player.jump(player.jumpForce * 1.55);
      player.hasDoubleJumped = false;
    });

    player.onCollide("enemy", (enemy) => {
      if (enemy.isDead || player.isHurt) return;
      const isStomping = player.pos.y < enemy.pos.y - 6;
      if (isStomping && player.isFalling()) {
        if (enemy.is("orc")) enemy.takeDamage(2, player.pos.x);
        else enemy.die();
        player.jump(player.jumpForce * 0.85);
        player.hasDoubleJumped = false;
        k.play("spring");
      } else {
        const knockDir = player.pos.x < enemy.pos.x ? -1 : 1;
        player.receiveDamage(knockDir);
      }
    });

    player.onCollide("orc_attack", (hitbox) => {
      if (player.isHurt || player.isDead) return;
      const knockDir = player.pos.x < hitbox.pos.x ? -1 : 1;
      player.receiveDamage(knockDir);
    });

    // Return to main cavern with mystery clue
    let returned = false;
    player.onCollide("return_portal", () => {
      if (returned) return;
      returned = true;
      k.play("win");
      gameState.addScore(500);

      k.add([
        k.rect(k.width(), 80),
        k.pos(0, k.height() / 2 - 40),
        k.color(18, 10, 14),
        k.opacity(0.95),
        k.fixed(),
        k.z(150)
      ]);

      k.add([
        k.text("¡CRIPTA CARMESÍ PURIFICADA! (+500 BONUS)", { font: "pressstart", size: 10 }),
        k.pos(k.width() / 2, k.height() / 2 - 14),
        k.anchor("center"),
        k.color(255, 140, 120),
        k.fixed(),
        k.z(151)
      ]);

      k.add([
        k.text("¡Este libro no conducía al Trono Real! Prueba otro...", {
          font: "pressstart",
          size: 7
        }),
        k.pos(k.width() / 2, k.height() / 2 + 10),
        k.anchor("center"),
        k.color(240, 220, 180),
        k.fixed(),
        k.z(151)
      ]);

      k.wait(2.8, () => {
        // Return to Level 2 with key reset so player can search for true book
        gameState.hasKey = false;
        gameState.collectedBook = null;
        k.go("level2");
      });
    });

    k.onUpdate(() => {
      if (!player) return;
      if (player.pos.x < 10) player.pos.x = 10;
      else if (player.pos.x > mapWidth - 10) player.pos.x = mapWidth - 10;
      const targetCamX = Math.max(k.width() / 2, Math.min(player.pos.x, mapWidth - k.width() / 2));
      k.camPos(targetCamX, k.height() / 2);
    });
  });
}
