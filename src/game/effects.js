// src/game/effects.js

// Individual skill effect (circle that grows and fades)
export class Effect {
  constructor(x, y, radius, color, duration = 30) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.duration = duration; // frames
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
}

// Manager for blood, skill effects, etc.
export class EffectsManager {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    // Blood system
    this.bloodParticles = [];
    this.splashes = [];
    this.poolWaveOffset = 0;
    this.bloodPoolHeight = canvasHeight / 2;

    // Generic skill/other effects
    this.effects = [];
  }

  // ---------------- Blood system ----------------
  spawnBlood() {
    for (let i = 0; i < 3; i++) {
      const radius = 2 + Math.random() * 3;
      const color = radius > 4 ? "darkred" : "red";
      const particle = {
        x: Math.random() * this.canvasWidth,
        y: Math.random() * -50,
        radius,
        speed: 2 + Math.random() * 2,
        dx: (Math.random() - 0.5) * 0.5,
        color,
        visible: false,
      };
      setTimeout(() => (particle.visible = true), 500);
      this.bloodParticles.push(particle);
    }

    if (this.bloodParticles.length > 300)
      this.bloodParticles.splice(0, this.bloodParticles.length - 300);
  }

  drawBlood(ctx) {
    for (let i = this.bloodParticles.length - 1; i >= 0; i--) {
      const b = this.bloodParticles[i];
      b.y += b.speed;
      b.x += b.dx;

      if (b.visible) {
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.radius * 0.6, b.radius * 1.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = b.color;
        ctx.fill();
      }

      const waveY = this.bloodPoolHeight + Math.sin(b.x * 0.05 + this.poolWaveOffset) * 10;
      if (b.y + b.radius * 1.5 >= waveY) {
        this.splashes.push({ x: b.x, y: waveY, radius: b.radius * 2, alpha: 0.8 });
        this.bloodParticles.splice(i, 1);
      }
    }

    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const s = this.splashes[i];
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,0,0,${s.alpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
      s.radius += 1;
      s.alpha -= 0.05;
      if (s.alpha <= 0) this.splashes.splice(i, 1);
    }

    this.spawnBlood();
  }

  drawPool(ctx) {
    this.poolWaveOffset += 0.05;
    ctx.beginPath();
    ctx.moveTo(0, this.bloodPoolHeight);
    for (let x = 0; x <= this.canvasWidth; x += 10) {
      const y = this.bloodPoolHeight + Math.sin(x * 0.05 + this.poolWaveOffset) * 10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(this.canvasWidth, this.canvasHeight);
    ctx.lineTo(0, this.canvasHeight);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, this.bloodPoolHeight, 0, this.canvasHeight);
    grad.addColorStop(0, "#8B0000");
    grad.addColorStop(1, "#4B0000");
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // ---------------- Skill / other effects ----------------
  addEffect(effect) {
    this.effects.push(effect);
  }

  updateEffects() {
    this.effects.forEach(e => e.update());
    this.effects = this.effects.filter(e => !e.isFinished());
  }

  drawEffects(ctx) {
    this.effects.forEach(e => e.draw(ctx));
  }

  // ---------------- Update & draw all ----------------
  update() {
    this.updateEffects();
  }

  draw(ctx) {
    this.drawPool(ctx);
    this.drawBlood(ctx);
    this.drawEffects(ctx);
  }
}
