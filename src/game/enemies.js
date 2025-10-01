// src/game/enemies.js
import jellyfishSprite from "../assets/enemies/jellyfish.png";
import octopusSprite from "../assets/enemies/octopus.png"; // melee

const enemyTypes = {
  jellyfish: {
    sprite: jellyfishSprite,
    size: 32,
    hp: 20,
    speed: 1.2,
    attackType: "ranged",
    damage: 2,
    range: 200,
    cooldown: 90, // frames between shots
  },
  octopus: {
    sprite: octopusSprite,
    size: 36,
    hp: 40,
    speed: 1.6,
    attackType: "melee",
    damage: 0.5,
  },
};

const loadImage = (src) => {
  const img = new Image();
  img.src = src;
  return img;
};

// Preload sprites
for (const type in enemyTypes) {
  enemyTypes[type].spriteImg = loadImage(enemyTypes[type].sprite);
}

function rectCollide(x, y, size, rect) {
  return (
    x + size > rect.x &&
    x - size < rect.x + rect.width &&
    y + size > rect.y &&
    y - size < rect.y + rect.height
  );
}

export class Projectile {
  constructor(x, y, dx, dy, speed = 4, size = 6, damage = 1) {
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
    ctx.fillStyle = "cyan";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  collides(player) {
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    return dist < this.size + player.size;
  }
}

export class Enemy {
  constructor(x, y, typeKey = "jellyfish") {
    const cfg = enemyTypes[typeKey];
    this.type = typeKey;
    this.x = x;
    this.y = y;
    this.size = cfg.size;
    this.hp = cfg.hp;
    this.maxHp = cfg.hp;
    this.speed = cfg.speed;
    this.sprite = cfg.spriteImg;
    this.attackType = cfg.attackType;
    this.damage = cfg.damage;
    this.range = cfg.range || 0;
    this.cooldown = cfg.cooldown || 0;
    this.cooldownTimer = 0;
    this.facingLeft = false;
  }

  update(player, obstacles = [], projectiles = []) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

    this.facingLeft = dx > 0;

    // Movement toward player
    let nextX = this.x + (dx / dist) * this.speed;
    let nextY = this.y;

    if (!obstacles.some(ob => rectCollide(nextX, nextY, this.size, ob))) {
      this.x = nextX;
    }

    nextY = this.y + (dy / dist) * this.speed;
    if (!obstacles.some(ob => rectCollide(this.x, nextY, this.size, ob))) {
      this.y = nextY;
    }

    // Attack logic
    if (this.attackType === "melee") {
      const distance = Math.hypot(player.x - this.x, player.y - this.y);
      if (distance < this.size + player.size) {
        player.hp -= this.damage;
        if (player.hp < 0) player.hp = 0;
      }
    } else if (this.attackType === "ranged") {
      if (this.cooldownTimer > 0) this.cooldownTimer--;
      const distance = Math.hypot(player.x - this.x, player.y - this.y);
      if (distance < this.range && this.cooldownTimer <= 0) {
        const vx = dx / dist;
        const vy = dy / dist;
        projectiles.push(new Projectile(this.x, this.y, vx, vy, 4, 6, this.damage));
        this.cooldownTimer = this.cooldown;
      }
    }
  }

  draw(ctx) {
    if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
      ctx.save();
      ctx.translate(this.x, this.y);
      if (this.facingLeft) ctx.scale(-1, 1);
      ctx.drawImage(this.sprite, -this.size, -this.size, this.size * 2, this.size * 2);
      ctx.restore();
    } else {
      ctx.fillStyle = "red";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // HP bar
    const barWidth = this.size * 2;
    const barHeight = 4;
    const hpPercent = this.hp / this.maxHp;

    ctx.fillStyle = "black";
    ctx.fillRect(this.x - this.size, this.y - this.size - 10, barWidth, barHeight);

    ctx.fillStyle = hpPercent > 0.5 ? "lime" : hpPercent > 0.2 ? "yellow" : "red";
    ctx.fillRect(this.x - this.size, this.y - this.size - 10, barWidth * hpPercent, barHeight);

    ctx.strokeStyle = "white";
    ctx.strokeRect(this.x - this.size, this.y - this.size - 10, barWidth, barHeight);
  }
}

export class EnemyManager {
  constructor(canvasWidth, canvasHeight, onEnemyKilled) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.enemies = [];
    this.projectiles = [];
    this.onEnemyKilled = onEnemyKilled;
    this.typeKeys = Object.keys(enemyTypes);
  }

  spawnEnemy(typeKey = null) {
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    const type = typeKey || this.typeKeys[Math.floor(Math.random() * this.typeKeys.length)];
    const size = enemyTypes[type].size;

    switch (edge) {
      case 0: x = -size; y = Math.random() * this.canvasHeight; break;
      case 1: x = this.canvasWidth + size; y = Math.random() * this.canvasHeight; break;
      case 2: x = Math.random() * this.canvasWidth; y = -size; break;
      case 3: x = Math.random() * this.canvasWidth; y = this.canvasHeight + size; break;
    }

    this.enemies.push(new Enemy(x, y, type));
  }

  update(player, obstacles = []) {
    this.enemies = this.enemies.filter(enemy => {
      enemy.update(player, obstacles, this.projectiles);
      if (enemy.hp <= 0) {
        if (this.onEnemyKilled) this.onEnemyKilled(enemy);
        return false;
      }
      return true;
    });

    this.projectiles = this.projectiles.filter(p => {
      p.update();
      if (p.collides(player)) {
        player.hp -= p.damage;
        if (player.hp < 0) player.hp = 0;
        return false;
      }
      // remove if offscreen
      return (
        p.x >= -20 && p.x <= this.canvasWidth + 20 &&
        p.y >= -20 && p.y <= this.canvasHeight + 20
      );
    });
  }

  draw(ctx) {
    this.enemies.forEach(enemy => enemy.draw(ctx));
    this.projectiles.forEach(p => p.draw(ctx));
  }
}
