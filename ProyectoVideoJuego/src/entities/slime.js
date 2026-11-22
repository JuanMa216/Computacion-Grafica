import { gameState } from "../state.js";

/**
 * Creates and initializes an advanced Slime enemy with a full Finite State Machine AI:
 * - PATROL: Wanders platform, periodic hops, turns at boundaries and walls.
 * - ALERT: Detects player in vision radius, shows "!" reaction, prepares to chase.
 * - CHASE: Pursues player with increased speed and faces target.
 * - ATTACK: Lunges with biting/slashing animation and forward momentum when in close range.
 * - HURT: 2 HP system; takes damage with knockback and squashing reaction.
 * - DIE: Melts into puddle with particle/popup score feedback.
 * 
 * @param {import("kaboom").KaboomCtx} k - Kaboom context
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} patrolRange - Max distance to patrol left/right
 * @returns {import("kaboom").GameObj} The slime game object
 */
export function createSlime(k, x, y, patrolRange = 80) {
  let dir = -1;
  const startX = x;
  const patrolSpeed = 36;
  const chaseSpeed = 68;
  const attackLungeSpeed = 110;
  const visionDistance = 140;
  const attackDistance = 46;

  let hopTimer = 2.5 + Math.random() * 1.5;
  let attackCooldown = 0;

  const slime = k.add([
    k.sprite("slime", { anim: "walk" }),
    k.pos(x, y),
    // Tight hitbox for the slime body (top at -2, bottom at +12, flush with ground)
    k.area({ shape: new k.Rect(k.vec2(0, 5), 18, 14) }),
    k.body(),
    k.anchor("center"),
    k.z(5),
    "enemy",
    "slime",
    {
      hp: 2,
      maxHp: 2,
      state: "patrol", // "patrol" | "alert" | "chase" | "attack" | "hurt" | "die"
      isDead: false,
      isHurt: false,

      // Take damage from sword melee attack
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

          // Knockback in opposite direction of attacker
          const knockDir = this.pos.x >= fromX ? 1 : -1;
          this.jump(110);
          this.move(knockDir * 90, 0);

          // Red hit flash feedback
          this.color = k.rgb(255, 110, 110);

          // Damage indicator popup
          const dmgPopup = k.add([
            k.text(`-${dmg}`, { font: "pressstart", size: 8 }),
            k.pos(this.pos.x, this.pos.y - 14),
            k.anchor("center"),
            k.color(255, 90, 90),
            k.z(25)
          ]);
          dmgPopup.onUpdate(() => {
            dmgPopup.pos.y -= 25 * k.dt();
          });
          k.wait(0.4, () => dmgPopup.destroy());

          k.wait(0.35, () => {
            if (this.isDead) return;
            this.color = k.rgb(255, 255, 255);
            this.isHurt = false;
            // Become enraged and chase the player immediately
            this.state = "chase";
          });
        }
      },

      // Instant fatal defeat (Stomp from above or lethal sword combo)
      die() {
        if (this.isDead) return;
        this.isDead = true;
        this.state = "die";

        // Sound and score award
        k.play("hit");
        gameState.addScore(200);

        // Show floating score popup (+200) in pixel font
        const popup = k.add([
          k.text("+200", { font: "pressstart", size: 9 }),
          k.pos(this.pos.x, this.pos.y - 12),
          k.anchor("center"),
          k.color(255, 230, 100),
          k.z(25)
        ]);
        popup.onUpdate(() => {
          popup.pos.y -= 25 * k.dt();
        });
        k.wait(0.6, () => popup.destroy());

        // Play the melting death animation from the spritesheet
        this.play("die");
        k.wait(0.8, () => {
          this.destroy();
        });
      }
    }
  ]);

  // Shows an "!" alert balloon over the slime when spotting the player
  function showAlertBubble() {
    const alert = k.add([
      k.text("!", { font: "pressstart", size: 9 }),
      k.pos(slime.pos.x, slime.pos.y - 18),
      k.anchor("center"),
      k.color(255, 60, 60),
      k.z(25)
    ]);
    alert.onUpdate(() => {
      alert.pos.x = slime.pos.x;
      alert.pos.y = slime.pos.y - 18;
    });
    k.wait(0.4, () => alert.destroy());
  }

  // --- Main AI Behavior Loop ---
  slime.onUpdate(() => {
    if (slime.isDead) return;

    const dt = k.dt();
    if (attackCooldown > 0) attackCooldown -= dt;

    // Locate player in the scene
    const player = k.get("player")[0];
    let dx = 0;
    let dy = 0;
    let dist = Infinity;

    if (player && !player.isHurt) {
      dx = player.pos.x - slime.pos.x;
      dy = player.pos.y - slime.pos.y;
      dist = Math.hypot(dx, dy);
    }

    const playerInSight =
      player &&
      !player.isHurt &&
      Math.abs(dx) <= visionDistance &&
      Math.abs(dy) <= 50;

    switch (slime.state) {
      // 1. PATROL: Wander along platform, occasional hop, watch for intruders
      case "patrol": {
        slime.move(patrolSpeed * dir, 0);
        // Default sprite in slime.png faces right, so flip horizontally (flipX = true) when moving left (dir < 0)
        slime.flipX = dir < 0;

        if (slime.isGrounded() && slime.curAnim() !== "walk") {
          slime.play("walk");
        }

        // Boundary turnaround
        if (slime.pos.x < startX - patrolRange) {
          dir = 1;
        } else if (slime.pos.x > startX + patrolRange) {
          dir = -1;
        }

        // Periodic natural hop
        hopTimer -= dt;
        if (hopTimer <= 0 && slime.isGrounded()) {
          slime.jump(130);
          slime.play("jump");
          hopTimer = 3.0 + Math.random() * 1.5;
        }

        // Trigger alert if player steps into sight
        if (playerInSight) {
          slime.state = "alert";
          slime.play("idle");
          showAlertBubble();
          k.wait(0.35, () => {
            if (!slime.isDead && slime.state === "alert") {
              slime.state = "chase";
            }
          });
        }
        break;
      }

      // 2. ALERT: Momentary freeze reaction when discovering the player
      case "alert": {
        if (player) {
          dir = dx >= 0 ? 1 : -1;
          slime.flipX = dir < 0;
        }
        break;
      }

      // 3. CHASE: Actively stalk and close the distance with the player
      case "chase": {
        if (!player || dist > visionDistance * 1.6) {
          // Player escaped; return to patrol
          slime.state = "patrol";
          break;
        }

        // Steer toward player
        dir = dx >= 0 ? 1 : -1;
        slime.flipX = dir < 0;

        // Check if close enough for an attack lunge
        if (Math.abs(dx) <= attackDistance && Math.abs(dy) <= 28 && attackCooldown <= 0) {
          slime.state = "attack";
          attackCooldown = 2.0;
          slime.play("attack");

          // Aggressive lunge forward with a low hop
          if (slime.isGrounded()) {
            slime.jump(135);
          }
          slime.move(dir * attackLungeSpeed, 0);

          k.wait(0.5, () => {
            if (!slime.isDead && slime.state === "attack") {
              slime.state = "chase";
            }
          });
          break;
        }

        // Move actively toward player
        slime.move(chaseSpeed * dir, 0);

        if (slime.isGrounded() && slime.curAnim() !== "walk") {
          slime.play("walk");
        }
        break;
      }

      // 4. ATTACK: Forward momentum during bite/lunge
      case "attack": {
        slime.move(dir * (chaseSpeed * 0.7), 0);
        break;
      }

      // 5. HURT: Recoiling, handled by timer in takeDamage()
      case "hurt": {
        break;
      }
    }
  });

  // Solid obstacle collision: reverse direction
  slime.onCollide("solid", () => {
    dir = -dir;
    slime.flipX = dir < 0;
  });

  // React to player melee attack sword hitbox
  slime.onCollide("sword_hitbox", (hitbox) => {
    slime.takeDamage(1, hitbox.pos.x);
  });

  return slime;
}
