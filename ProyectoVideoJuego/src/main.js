import k from "./kaboomCtx.js";
import { gameState } from "./state.js";
import { initLevel1 } from "./scenes/level1.js";
import { initLevel2 } from "./scenes/level2.js";
import { initDungeonRed } from "./scenes/dungeon_red.js";
import { initDungeonGreen } from "./scenes/dungeon_green.js";
import { initGameOver } from "./scenes/gameover.js";

// --- 1. Load Character Sprites ---
k.loadSprite("player", "/sprites/player/mili.png", {
  sliceX: 10,
  sliceY: 8,
  anims: {
    idle: { from: 0, to: 5, loop: true, speed: 6 },
    walk: { from: 10, to: 17, loop: true, speed: 10 },
    jump: { from: 20, to: 25, loop: false, speed: 8 },
    block: { from: 30, to: 35, loop: false, speed: 10 },
    attack1: { from: 40, to: 47, loop: false, speed: 14 },
    attack2: { from: 50, to: 57, loop: false, speed: 14 },
    hurt: { from: 60, to: 63, loop: false, speed: 8 },
    death: { from: 70, to: 79, loop: false, speed: 10 }
  }
});

k.loadSprite("slime", "/sprites/enemies/slime.png", {
  sliceX: 10,
  sliceY: 8,
  anims: {
    idle: { from: 0, to: 5, loop: true, speed: 6 },
    walk: { from: 10, to: 17, loop: true, speed: 10 },
    jump: { from: 20, to: 25, loop: false, speed: 10 },
    attack: { from: 30, to: 35, loop: false, speed: 12 },
    hurt: { from: 40, to: 47, loop: false, speed: 10 },
    dash: { from: 50, to: 57, loop: false, speed: 12 },
    die: { from: 70, to: 79, loop: false, speed: 10 }
  }
});

k.loadSprite("orc", "/sprites/enemies/orc/Orc.png", {
  sliceX: 8,
  sliceY: 6,
  anims: {
    idle: { from: 0, to: 5, loop: true, speed: 6 },
    walk: { from: 8, to: 15, loop: true, speed: 8 },
    attack: { from: 16, to: 21, loop: false, speed: 10 },
    hurt: { from: 32, to: 35, loop: false, speed: 8 },
    death: { from: 40, to: 43, loop: false, speed: 8 }
  }
});

k.loadSprite("demon", "/sprites/boss/demon/Demon_A.png", {
  sliceX: 8,
  sliceY: 6,
  anims: {
    idle: { from: 0, to: 5, loop: true, speed: 6 },
    walk: { from: 8, to: 15, loop: true, speed: 8 },
    attack1: { from: 16, to: 22, loop: false, speed: 10 },
    attack2: { from: 24, to: 30, loop: false, speed: 10 },
    hurt: { from: 32, to: 35, loop: false, speed: 8 },
    death: { from: 40, to: 43, loop: false, speed: 8 }
  }
});

// --- 2. RottingPixels Dark Fantasy Medieval Tilesets ---
// Castle (Level 1)
k.loadSprite("stone_top", "/sprites/tiles/stone_top.png");
k.loadSprite("stone_wall", "/sprites/tiles/stone_wall.png");
k.loadSprite("wood_platform", "/sprites/tiles/wood_platform.png");
k.loadSprite("castle_spikes", "/sprites/hazards/castle_spikes.png");

// Cave (Level 2)
k.loadSprite("cave_top", "/sprites/tiles/cave_top.png");
k.loadSprite("cave_wall", "/sprites/tiles/cave_wall.png");
k.loadSprite("cave_spikes", "/sprites/hazards/cave_spikes.png");

// Dungeon / Fortress (Level 3)
k.loadSprite("dungeon_top", "/sprites/tiles/dungeon_top.png");
k.loadSprite("dungeon_wall", "/sprites/tiles/dungeon_wall.png");
k.loadSprite("dungeon_platform", "/sprites/tiles/dungeon_platform.png");
k.loadSprite("dungeon_spikes", "/sprites/hazards/dungeon_spikes.png");

// Collectibles, Items & Props
k.loadSprite("coin", "/sprites/items/coin.png");
k.loadSprite("gem", "/sprites/items/gem.png");
k.loadSprite("key", "/sprites/items/key.png");
k.loadSprite("book_red", "/sprites/items/book_red.png");
k.loadSprite("book_green", "/sprites/items/book_green.png");
k.loadSprite("book_blue", "/sprites/items/book_blue.png");
k.loadSprite("door_closed", "/sprites/tiles/door_closed.png");
k.loadSprite("door_open", "/sprites/tiles/door_open.png");
k.loadSprite("spring", "/sprites/tiles/spring.png");
k.loadSprite("flower_vase", "/sprites/decorations/flower_vase.png");
k.loadSprite("heart_full", "/sprites/items/heart_full.png");
k.loadSprite("heart_empty", "/sprites/items/heart_empty.png");

// --- 3. Atmospheric Dark Fantasy Backgrounds ---
k.loadSprite("bg_level1", "/sprites/backgrounds/bg_level1.png");
k.loadSprite("bg_level2", "/sprites/backgrounds/bg_level2.png");
k.loadSprite("bg_level3", "/sprites/backgrounds/bg_level3.png");

// --- 4. Retro Audio ---
k.loadSound("jump", "/sounds/jump.wav");
k.loadSound("coin", "/sounds/coin.wav");
k.loadSound("hit", "/sounds/hit.wav");
k.loadSound("spring", "/sounds/spring.wav");
k.loadSound("win", "/sounds/win.wav");

// --- 5. Retro Pixel Fonts ---
k.loadFont("pressstart", "/fonts/PressStart2P.ttf");
k.loadFont("vt323", "/fonts/VT323.ttf");

// --- 6. Scene Management ---
initLevel1(k);
initLevel2(k);
initDungeonRed(k);
initDungeonGreen(k);
initGameOver(k);

// Start at Level 1, or Level 2 via URL query param (?level=2)
const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
const initialScene = urlParams?.get("level") === "2" ? "level2" : "level1";
k.go(initialScene);

export default k;
