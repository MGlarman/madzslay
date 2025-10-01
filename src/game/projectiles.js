// src/game/projectiles.js

// --- Individual projectile ---
export class Projectile {
  constructor(x, y, targetX, targetY, speed = 10, color = "yellow") {
    this.x = x;
    this.y = y;
    this.size = 5;
    this.color = color;

    const dx = targetX - x;
    const dy = targetY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    this.vx = (dx / dist) * speed;
    this.vy = (dy / dist) * speed;

    this.active = true; // mark if it should be removed
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }

  checkCollision(targets) {
    let kills = 0;
    targets.forEach(target => {
      if (!this.active || target.hp <= 0) return;
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < (target.size || 50) + this.size) {
        target.hp -= 10;
        this.active = false;

        if (target.hp <= 0 && !target.killed) {
          target.killed = true;
          kills++;
        }
      }
    });
    return kills;
  }

  isOffscreen(canvasWidth, canvasHeight) {
    return this.x < 0 || this.y < 0 || this.x > canvasWidth || this.y > canvasHeight;
  }
}

// --- Projectile Manager ---
export class ProjectileManager {
  constructor() {
    this.projectiles = [];
  }

  shoot(x, y, targetX, targetY, speed = 10, color = "yellow") {
    this.projectiles.push(new Projectile(x, y, targetX, targetY, speed, color));
  }

  // Update all projectiles, check collisions, and remove inactive ones
  update(targets, canvasWidth, canvasHeight) {
    let totalKills = 0;

    this.projectiles.forEach(p => {
      if (!p.active) return;
      p.update();
      totalKills += p.checkCollision(targets);
      if (p.isOffscreen(canvasWidth, canvasHeight)) p.active = false;
    });

    // Remove inactive projectiles
    this.projectiles = this.projectiles.filter(p => p.active);
    return totalKills;
  }

  // Draw all projectiles
  draw(ctx) {
    this.projectiles.forEach(p => p.draw(ctx));
  }
}
