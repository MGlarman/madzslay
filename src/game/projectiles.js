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
}

export class ProjectileManager {
  constructor() {
    this.projectiles = [];
  }

  shoot(x, y, targetX, targetY, speed = 10, color = "yellow") {
    this.projectiles.push(new Projectile(x, y, targetX, targetY, speed, color));
  }

updateAndDraw(ctx, targets) {
  let kills = 0;

  this.projectiles.forEach((p, i) => {
    p.update();
    p.draw(ctx);

    targets.forEach((target) => {
      const dx = target.x - p.x;
      const dy = target.y - p.y;
      const dist = Math.sqrt(dx*dx + dy*dy);

      if (dist < (target.size || 50) + p.size) {
        target.hp -= 10;
        this.projectiles.splice(i, 1);

        // Only increment kills if the target dies
        if (target.hp <= 0 && !target.killed) {
          target.killed = true; // mark so we don't double-count
          kills++;
        }
      }
    });

    // Remove offscreen
    if (p.x < 0 || p.y < 0 || p.x > ctx.canvas.width || p.y > ctx.canvas.height) {
      this.projectiles.splice(i, 1);
    }
  });

  return kills;
}

}
