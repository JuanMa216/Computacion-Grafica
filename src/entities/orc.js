import { gameState } from "../state.js";

/**
 * Creates and initializes an Orc Warrior enemy for Level 2 (Caverns).
 * 
 * Features:
 * - Tougher 3 HP elite enemy with heavy club/axe attack.
 * - State machine: PATROL, ALERT, CHASE, ATTACK, HURT, DIE.
 * - Can be blocked with Shield (Shift/C) or struck with sword.
 * - Stomp deals 2 critical damage.
 * - Calibrated bounding box (24px height, 0px sinking).
 * 
 * @param {import("kaboom").KaboomCtx} k - Kaboom context
 * @param {number} x - Initial X coordinate
 * @param {number} y - Initial Y coordinate
 * @param {number} patrolRange - Max distance to wander left/right
 * @returns {import("kaboom").GameObj} The orc game object
 */
export function createOrc(k, x, y, patrolRange = 70) {
  let dir = -1;
  const startX = x;
  const patrolSpeed = 32;
  const chaseSpeed = 54;
  const visionDistance = 140;
  const attackDistance = 38;

  let attackCooldown = 0;

  const orc = k.add([
    k.sprite("orc", { anim: "walk" }),
    k.pos(x, y),
    // Scale orc to 24px (1 map block tall, matching Mili)
    k.scale(24 / 16),
    // Precision hitbox aligned to feet (y=+7 in 100x100 frame) and head (y=-9)
    k.area({ shape: new k.Rect(k.vec2(0, -1), 16, 16) }),
    k.body(),
    k.anchor("center"),
    k.z(6),
    "enemy",
    "orc",
    {
      hp: 3,
      maxHp: 3,
      state: "patrol", // "patrol" | "alert" | "chase" | "attack" | "hurt" | "die"
      isDead: false,
      isHurt: false,

      // Take damage from player melee attacks
      takeDamage(dmg = 1, fromX = 0) {
        if (this.isDead || this.isHurt) return;
        this.hp -= dmg;
        k.play("hit");

        if (this.hp <= 0) {
          this.die();
        } else {
          this.isHurt = true;
          this.state = "hurt";
          this.play("hurt");

          // Knockback
          const knockDir = this.pos.x >= fromX ? 1 : -1;
          this.jump(100);
          this.move(knockDir * 80, 0);

          // Red hit flash feedback
          this.color = k.rgb(255, 110, 110);

          // Damage indicator popup
          const dmgPopup = k.add([
            k.text(`-${dmg}`, { font: "pressstart", size: 8 }),
            k.pos(this.pos.x, this.pos.y - 16),
            k.anchor("center"),
            k.color(255, 90, 90),
            k.z(25)
          ]);
          dmgPopup.onUpdate(() => {
            dmgPopup.pos.y -= 25 * k.dt();
          });
          k.wait(0.4, () => dmgPopup.destroy());

          k.wait(0.4, () => {
            if (this.isDead) return;
            this.color = k.rgb(255, 255, 255);
            this.isHurt = false;
            // Enraged: charge player immediately
            this.state = "chase";
          });
        }
      },

      // Defeat: score popup and fadeout
      die() {
        if (this.isDead) return;
        this.isDead = true;
        this.state = "die";

        k.play("hit");
        gameState.addScore(300);

        // Score award popup
        const scorePopup = k.add([
          k.text("+300", { font: "pressstart", size: 9 }),
          k.pos(this.pos.x, this.pos.y - 16),
          k.anchor("center"),
          k.color(255, 230, 80),
          k.z(30)
        ]);
        scorePopup.onUpdate(() => {
          scorePopup.pos.y -= 30 * k.dt();
        });
        k.wait(0.7, () => scorePopup.destroy());

        this.play("death");
        this.unuse("area");
        this.unuse("body");

        k.wait(0.6, () => {
          this.destroy();
        });
      }
    }
  ]);

  // Shows an "!" alert balloon over the orc when spotting the player
  function showAlertBubble() {
    const alertBox = k.add([
      k.rect(14, 14, { radius: 3 }),
      k.pos(orc.pos.x, orc.pos.y - 22),
      k.anchor("center"),
      k.color(240, 40, 50),
      k.z(20)
    ]);

    const alertMark = k.add([
      k.text("!", { font: "pressstart", size: 9 }),
      k.pos(orc.pos.x, orc.pos.y - 22),
      k.anchor("center"),
      k.color(255, 255, 255),
      k.z(21)
    ]);

    k.wait(0.4, () => {
      alertBox.destroy();
      alertMark.destroy();
    });
  }

  // AI Update Loop
  orc.onUpdate(() => {
    if (orc.isDead) return;
    const dt = k.dt();

    if (attackCooldown > 0) {
      attackCooldown -= dt;
    }

    const player = k.get("player")[0];
    let dx = 0;
    let dy = 0;
    let dist = Infinity;

    if (player && !player.isHurt && !player.isDead) {
      dx = player.pos.x - orc.pos.x;
      dy = player.pos.y - orc.pos.y;
      dist = Math.hypot(dx, dy);
    }

    const playerInSight =
      player &&
      !player.isHurt &&
      !player.isDead &&
      Math.abs(dx) <= visionDistance &&
      Math.abs(dy) <= 60;

    switch (orc.state) {
      // 1. PATROL: Wander platform
      case "patrol": {
        orc.move(patrolSpeed * dir, 0);
        // Default sprite faces right; flip when moving left (dir < 0)
        orc.flipX = dir < 0;

        if (orc.isGrounded() && orc.curAnim() !== "walk") {
          orc.play("walk");
        }

        // Boundary turnaround
        if (orc.pos.x < startX - patrolRange) {
          dir = 1;
        } else if (orc.pos.x > startX + patrolRange) {
          dir = -1;
        }

        if (playerInSight) {
          orc.state = "alert";
          orc.play("idle");
          showAlertBubble();
          k.wait(0.35, () => {
            if (!orc.isDead && orc.state === "alert") {
              orc.state = "chase";
            }
          });
        }
        break;
      }

      // 2. ALERT: Surprise freeze
      case "alert": {
        if (player) {
          dir = dx >= 0 ? 1 : -1;
          orc.flipX = dir < 0;
        }
        break;
      }

      // 3. CHASE: Pursue player actively
      case "chase": {
        if (!player || dist > visionDistance * 1.6) {
          orc.state = "patrol";
          break;
        }

        dir = dx >= 0 ? 1 : -1;
        orc.flipX = dir < 0;

        // Check if close enough for a melee swing
        if (Math.abs(dx) <= attackDistance && Math.abs(dy) <= 24 && attackCooldown <= 0) {
          orc.state = "attack";
          attackCooldown = 1.8;
          orc.play("attack");

          // Swing club/axe forward
          const attackOffsetX = dir * 18;
          k.wait(0.2, () => {
            if (orc.isDead || orc.state !== "attack") return;
            const clubHitbox = k.add([
              k.pos(orc.pos.x + attackOffsetX, orc.pos.y),
              k.area({ shape: new k.Rect(k.vec2(0), 20, 20) }),
              k.anchor("center"),
              "orc_attack"
            ]);
            k.wait(0.2, () => clubHitbox.destroy());
          });

          k.wait(0.6, () => {
            if (!orc.isDead && orc.state === "attack") {
              orc.state = "chase";
            }
          });
          break;
        }

        orc.move(chaseSpeed * dir, 0);
        if (orc.isGrounded() && orc.curAnim() !== "walk") {
          orc.play("walk");
        }
        break;
      }

      // 4. ATTACK: Brief pause during swing
      case "attack": {
        orc.move(dir * (chaseSpeed * 0.2), 0);
        break;
      }

      case "hurt": {
        break;
      }
    }
  });

  // Turn around on solid obstacles
  orc.onCollide("solid", () => {
    dir = -dir;
    orc.flipX = dir < 0;
  });

  // Hurt from player sword melee attack
  orc.onCollide("sword_hitbox", (hitbox) => {
    orc.takeDamage(1, hitbox.pos.x);
  });

  return orc;
}
