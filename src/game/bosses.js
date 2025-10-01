// src/game/bosses.js
import enemyBossSprite from "../assets/bosses/enemyBoss.png";
import enemyBossRedSprite from "../assets/bosses/enemyBossRed.png";
import enemyBossRedAttackSprite from "../assets/bosses/enemyBossRedAttacking.png";

//object of objects with boss types
const enemyBossTypes = {
  jellyfishBoss: {
    sprite: enemyBossSprite,
    size: 80,
    hp: 200,
    speed: 1,
    attackType: "ranged",
    damage: 5,
    range: 400,
    cooldown: 90,
  },
  redBoss: {
    sprite: enemyBossRedSprite,
    attackSprite: enemyBossRedAttackSprite,
    size: 100,
    hp: 400,
    speed: 1.2,
    attackType: "ranged",
    damage: 10,
    range: 500,
    cooldown: 60,
  },
};

// Preload images
const loadImage = (src) => {
  const img = new Image();
  img.src = src;
  return img;
};

for (const key in enemyBossTypes) {
  enemyBossTypes[key].spriteImg = loadImage(enemyBossTypes[key].sprite);
  if (enemyBossTypes[key].attackSprite) {
    enemyBossTypes[key].attackSpriteImg = loadImage(enemyBossTypes[key].attackSprite);
  }
}

// -------------------- Projectile --------------------
export class Projectile {
  constructor(x, y, dx, dy, speed = 6, size = 10, damage = 5) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.speed = speed;
    this.size = size;
    this.damage = damage;
  }

  update() {
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;
  }

  draw(ctx) {
    ctx.fillStyle = "purple";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  collides(player) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    return dist < this.size + player.size;
  }
}

// -------------------- Boss --------------------
export class Boss {
  constructor(x, y, typeKey = "jellyfishBoss") {
    const cfg = enemyBossTypes[typeKey];
    this.type = typeKey;
    this.x = x;
    this.y = y;
    this.size = cfg.size;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.speed = cfg.speed;
    this.sprite = cfg.spriteImg;
    this.attackSprite = cfg.attackSpriteImg || null;
    this.attackType = cfg.attackType;
    this.damage = cfg.damage;
    this.range = cfg.range || 0;
    this.cooldown = cfg.cooldown || 0;
    this.cooldownTimer = 0;
    this.attackTimer = 0; // frames to show attack sprite
    this.facingLeft = false;
  }

  update(player, projectiles = []) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    this.facingLeft = dx < 0;

    // Move toward player
    this.x += (dx / dist) * this.speed;
    this.y += (dy / dist) * this.speed;

    // Ranged attack
    if (this.attackType === "ranged") {
      if (this.cooldownTimer > 0) this.cooldownTimer--;
      if (dist < this.range && this.cooldownTimer <= 0) {
        const vx = dx / dist;
        const vy = dy / dist;
        projectiles.push(new Projectile(this.x, this.y, vx, vy, 6, 10, this.damage));
        this.cooldownTimer = this.cooldown;

        // Trigger attack animation
        this.attackTimer = 10; // show attack sprite for 10 frames
      }
    }

    // Reduce attack animation timer
    if (this.attackTimer > 0) this.attackTimer--;
  }

  draw(ctx) {
    // Choose sprite
    const spriteToDraw = this.attackTimer > 0 && this.attackSprite ? this.attackSprite : this.sprite;

    if (spriteToDraw && spriteToDraw.complete && spriteToDraw.naturalWidth > 0) {
      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.facingLeft) ctx.scale(-1, 1);
      ctx.drawImage(spriteToDraw, -this.size, -this.size, this.size * 2, this.size * 2);
      ctx.restore();
    } else {
      // fallback circle
      ctx.fillStyle = "purple";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // HP bar
    const barWidth = this.size * 2;
    const barHeight = 6;
    const hpPercent = this.hp / this.maxHp;

    ctx.fillStyle = "black";
    ctx.fillRect(this.x - this.size, this.y - this.size - 12, barWidth, barHeight);

    ctx.fillStyle = hpPercent > 0.5 ? "lime" : hpPercent > 0.2 ? "yellow" : "red";
    ctx.fillRect(this.x - this.size, this.y - this.size - 12, barWidth * hpPercent, barHeight);

    ctx.strokeStyle = "white";
    ctx.strokeRect(this.x - this.size, this.y - this.size - 12, barWidth, barHeight);
  }
}

// -------------------- Boss Manager --------------------
export class BossManager {
  constructor(canvasWidth, canvasHeight, onBossKilled) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.bosses = [];
    this.projectiles = [];
    this.onBossKilled = onBossKilled;
    this.typeKeys = Object.keys(enemyBossTypes);
  }

  spawnBoss(typeKey = null) {
    const type = typeKey || this.typeKeys[0];
    const size = enemyBossTypes[type].size;
    const x = this.canvasWidth / 2;
    const y = -size * 2;
    this.bosses.push(new Boss(x, y, type));
  }

  update(player) {
    // Update bosses
    this.bosses = this.bosses.filter(boss => {
      boss.update(player, this.projectiles);
      if (boss.hp <= 0) {
        if (this.onBossKilled) this.onBossKilled(boss);
        return false;
      }
      return true;
    });

    // Update projectiles
    this.projectiles = this.projectiles.filter(p => {
      p.update();
      if (p.collides(player)) {
        player.hp -= p.damage;
        if (player.hp < 0) player.hp = 0;
        return false;
      }
      return p.x >= -20 && p.x <= this.canvasWidth + 20 &&
             p.y >= -20 && p.y <= this.canvasHeight + 20;
    });
  }

  draw(ctx) {
    this.bosses.forEach(boss => boss.draw(ctx));
    this.projectiles.forEach(p => p.draw(ctx));
  }
}
