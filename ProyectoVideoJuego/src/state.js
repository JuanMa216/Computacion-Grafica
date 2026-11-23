// Global persistent state across scenes
export const gameState = {
  score: 0,
  lives: 3,
  maxLives: 3,
  currentLevel: 1,
  hasKey: false,
  collectedBook: null, // null | "red" | "green" | "blue"
  secretScoreThreshold: 15000,
  foundEasterEgg: false,

  reset() {
    this.score = 0;
    this.lives = this.maxLives;
    this.currentLevel = 1;
    this.hasKey = false;
    this.collectedBook = null;
    this.foundEasterEgg = false;
  },

  loseLife() {
    this.lives = Math.max(0, this.lives - 1);
    return this.lives;
  },

  gainLife() {
    this.lives = Math.min(this.maxLives, this.lives + 1);
  },

  addScore(pts) {
    this.score += pts;
  }
};
