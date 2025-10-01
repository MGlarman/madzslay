// Individual skill effect (grows and fades)
export class SkillEffect {
  constructor(x, y, radius, color, damage = 0, duration = 30) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.duration = duration; // frames remaining
    this.damage = damage;     // damage applied per frame
  }

  update() {
    this.duration--;
    this.radius += 2; // simple growth
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = Math.max(this.duration / 30, 0); // fade out
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isFinished() {
    return this.duration <= 0;
  }

  // ✅ New: apply AoE damage to enemies, return number of kills
  apply(enemies) {
    let kills = 0;
    enemies.forEach(enemy => {
      const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
      if (dist < this.radius && enemy.hp > 0) {
        enemy.hp -= this.damage;
        if (enemy.hp <= 0) kills++;
      }
    });
    return kills;
  }
}

// Manager for all skill effects
export class SkillEffectsManager {
  constructor() {
    this.effects = [];
  }

  add(effect) {
    this.effects.push(effect);
  }

  // ✅ Updated: return total kills from all effects this frame
  update(enemies) {
    let totalKills = 0;
    this.effects.forEach(effect => {
      totalKills += effect.apply(enemies);
      effect.update();
    });
    this.effects = this.effects.filter(e => !e.isFinished());
    return totalKills;
  }

  draw(ctx) {
    this.effects.forEach(e => e.draw(ctx));
  }
}
