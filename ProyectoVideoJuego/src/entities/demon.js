import { gameState } from "../state.js";

/**
 * Creates and initializes the Demon King (Rey Demonio) Final Boss for Level 3.
 * Fulfills Req-10: Boss Fight mechanics, multi-phase AI, health bar integration,
 * custom attack hitboxes, enrage mode, and victory sequence.
 *
 * @param {import("kaboom").KaboomCtx} k - Kaboom context
 * @param {number} x - Initial X coordinate (Throne Arena)
 * @param {number} y - Initial Y coordinate
 * @param {object} bossBar - Controller from hud.createBossBar()
 * @param {Function} onDefeated - Callback invoked upon boss death
 * @returns {import("kaboom").GameObj} The Demon King game object
 */
export function createDemon(k, x, y, bossBar, onDefeated) {
  let dir = -1;
  const normalSpeed = 48;
  const enragedSpeed = 78;
  const attackDistance = 52;
  const visionDistance = 320;

  let attackCooldown = 1.0;
  let isAttacking = false;
  let activeHitbox = null;

  const demon = k.add([
    k.sprite("demon", { anim: "idle" }),
    k.pos(x, y),
    // Scale demon to 1.8x (around 36px visual height, imposing boss stature)
    k.scale(1.8),
    // Precision hitbox calibrated to feet (y=+9 in 100x100 frame) and horns (y=-11)
    k.area({ shape: new k.Rect(k.vec2(2, -1), 20, 20) }),
    k.body(),
    k.anchor("center"),
    k.z(15),
    "enemy",
    "boss",
    "demon",
    {
      hp: 10,
      maxHp: 10,
      isEnraged: false,
      isDead: false,
      isHurt: false,

      // Take damage from player sword melee or stomp
      takeDamage(dmg = 1, fromX = 0) {
        if (this.isDead || this.isHurt) return;
        this.hp -= dmg;
        if (this.hp < 0) this.hp = 0;

        k.play("hit");

        // Update HUD boss health bar
        const bar = this.bossBar || bossBar;
        if (bar && bar.update) {
          bar.update(this.hp);
        }

        // Damage indicator popup
        const dmgPopup = k.add([
          k.text(`-${dmg}`, { font: "pressstart", size: 9 }),
          k.pos(this.pos.x, this.pos.y - 28),
          k.anchor("center"),
          k.color(255, dmg > 1 ? 60 : 220, 60),
          k.z(50)
        ]);
        dmgPopup.onUpdate(() => {
          dmgPopup.pos.y -= 35 * k.dt();
          dmgPopup.opacity = Math.max(0, (dmgPopup.opacity || 1) - 1.2 * k.dt());
          if (dmgPopup.opacity <= 0) dmgPopup.destroy();
        });

        // Check if dead
        if (this.hp <= 0) {
          this.die();
          return;
        }

        // Trigger Phase 2: Enrage mode at 50% HP or lower
        if (!this.isEnraged && this.hp <= this.maxHp / 2) {
          this.triggerEnrage();
        }

        // Hurt state & brief invincibility frame
        this.isHurt = true;
        this.color = k.rgb(255, 80, 80);
        k.shake(4);

        // Knockback resistance (boss only budges slightly)
        const knockDir = this.pos.x >= fromX ? 1 : -1;
        this.move(knockDir * 40, 0);

        k.wait(0.35, () => {
          if (this.isDead) return;
          this.isHurt = false;
          this.color = this.isEnraged ? k.rgb(255, 140, 140) : k.rgb(255, 255, 255);
        });
      },

      // Phase 2: Enraged state
      triggerEnrage() {
        this.isEnraged = true;
        this.color = k.rgb(255, 120, 120);
        k.shake(8);

        // Roar announcement popup
        const roarBanner = k.add([
          k.text("¡EL REY DEMONIO ENTRA EN CÓLERA!", {
            font: "pressstart",
            size: 8
          }),
          k.pos(k.width() / 2, 85),
          k.anchor("center"),
          k.color(255, 60, 60),
          k.fixed(),
          k.z(100)
        ]);
        k.wait(2.5, () => roarBanner.destroy());
      },

      // Perform Cleave attack (attack1)
      performAttack1(targetX) {
        if (isAttacking || this.isDead || this.isHurt) return;
        isAttacking = true;
        dir = targetX < this.pos.x ? -1 : 1;
        this.flipX = dir < 0;
        this.play("attack1");

        // Spawn damaging hitbox during strike frame
        k.wait(0.2, () => {
          if (this.isDead) return;
          k.play("hit");

          activeHitbox = k.add([
            k.pos(this.pos.x + dir * 26, this.pos.y),
            k.area({ shape: new k.Rect(k.vec2(0, 0), 30, 26) }),
            k.anchor("center"),
            "demon_attack",
            { damage: 1, dir: dir }
          ]);

          k.wait(0.25, () => {
            if (activeHitbox) {
              activeHitbox.destroy();
              activeHitbox = null;
            }
          });
        });

        k.wait(0.65, () => {
          isAttacking = false;
          attackCooldown = this.isEnraged ? 0.7 : 1.3;
        });
      },

      // Perform Heavy Ground Slam (attack2)
      performAttack2(targetX) {
        if (isAttacking || this.isDead || this.isHurt) return;
        isAttacking = true;
        dir = targetX < this.pos.x ? -1 : 1;
        this.flipX = dir < 0;
        this.play("attack2");

        // Ground slam creates shockwave
        k.wait(0.3, () => {
          if (this.isDead) return;
          k.shake(this.isEnraged ? 7 : 5);
          k.play("hit");

          activeHitbox = k.add([
            k.pos(this.pos.x + dir * 32, this.pos.y + 4),
            k.area({ shape: new k.Rect(k.vec2(0, 0), 38, 22) }),
            k.anchor("center"),
            "demon_attack",
            { damage: 1, dir: dir }
          ]);

          k.wait(0.25, () => {
            if (activeHitbox) {
              activeHitbox.destroy();
              activeHitbox = null;
            }
          });
        });

        k.wait(0.75, () => {
          isAttacking = false;
          attackCooldown = this.isEnraged ? 0.9 : 1.6;
        });
      },

      // Boss Defeat Sequence
      die() {
        if (this.isDead) return;
        this.isDead = true;
        if (activeHitbox) {
          activeHitbox.destroy();
          activeHitbox = null;
        }

        this.play("death");
        k.shake(14);
        k.play("win");
        gameState.addScore(2500);

        // Slow death effect & call victory callback
        this.color = k.rgb(180, 50, 50);

        k.wait(2.2, () => {
          if (onDefeated) {
            onDefeated();
          }
        });
      }
    }
  ]);

  // Main Boss AI Update Loop
  demon.onUpdate(() => {
    if (demon.isDead) return;

    if (attackCooldown > 0) {
      attackCooldown -= k.dt();
    }

    // Aura pulse when enraged
    if (demon.isEnraged) {
      const pulse = k.wave(180, 255, k.time() * 8);
      demon.color = k.rgb(255, pulse * 0.4, pulse * 0.4);
    }

    if (isAttacking || demon.isHurt) return;

    // Look for player in arena
    const player = k.get("player")[0];
    if (!player || player.isDead) {
      if (demon.curAnim() !== "idle") demon.play("idle");
      return;
    }

    const dist = Math.abs(player.pos.x - demon.pos.x);
    const vertDist = Math.abs(player.pos.y - demon.pos.y);

    // Only engage if player is on or near the throne platform
    if (dist < visionDistance && vertDist < 120) {
      dir = player.pos.x < demon.pos.x ? -1 : 1;
      demon.flipX = dir < 0;

      // In attack range
      if (dist <= attackDistance && attackCooldown <= 0) {
        // Alternate or randomly pick attack pattern
        if (Math.random() < 0.55 || !demon.isEnraged) {
          demon.performAttack1(player.pos.x);
        } else {
          demon.performAttack2(player.pos.x);
        }
        return;
      }

      // Approach player across the arena
      if (dist > attackDistance) {
        const currentSpeed = demon.isEnraged ? enragedSpeed : normalSpeed;
        demon.move(dir * currentSpeed, 0);

        if (demon.curAnim() !== "walk") {
          demon.play("walk");
        }
      } else {
        if (demon.curAnim() !== "idle") {
          demon.play("idle");
        }
      }
    } else {
      if (demon.curAnim() !== "idle") {
        demon.play("idle");
      }
    }
    // Keep Demon King strictly within his grand throne platform bounds (cols 6..22)
    const minThroneX = 160;
    const maxThroneX = 512;
    if (demon.pos.x < minThroneX) {
      demon.pos.x = minThroneX;
    } else if (demon.pos.x > maxThroneX) {
      demon.pos.x = maxThroneX;
    }
  });

  // Handle sword melee attacks from player
  demon.onCollide("sword_hitbox", (hitbox) => {
    if (demon.isDead || demon.isHurt) return;
    const player = k.get("player")[0];
    const fromX = player ? player.pos.x : hitbox.pos.x;
    demon.takeDamage(1, fromX);
  });

  // Default facing direction (towards throne entrance on left)
  demon.flipX = true;

  return demon;
}
