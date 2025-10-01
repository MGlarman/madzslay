// src/game/drawIntroEffects.js

let bloodParticles = [];
let splashes = [];
let poolWaveOffset = 0;

/**
 * Draw the blood pool at the bottom of the screen
 */
export function drawBloodPool(ctx, canvasHeight) {
  poolWaveOffset += 0.05;
  const bloodPoolHeight = canvasHeight / 2;

  ctx.beginPath();
  ctx.moveTo(0, bloodPoolHeight);
  for (let x = 0; x <= ctx.canvas.width; x += 10) {
    const y = bloodPoolHeight + Math.sin(x * 0.05 + poolWaveOffset) * 10;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(ctx.canvas.width, ctx.canvas.height);
  ctx.lineTo(0, ctx.canvas.height);
  ctx.closePath();

  const grad = ctx.createLinearGradient(0, bloodPoolHeight, 0, ctx.canvas.height);
  grad.addColorStop(0, "#8B0000"); // dark red
  grad.addColorStop(1, "#4B0000"); // darker
  ctx.fillStyle = grad;
  ctx.fill();
}

/**
 * Draw the raining blood effect
 */
export function drawBlood(ctx, canvasWidth, canvasHeight) {
  const bloodPoolHeight = canvasHeight / 2;

  // spawn new blood particles
  for (let i = 0; i < 3; i++) {
    const radius = 2 + Math.random() * 3;
    const color = radius > 4 ? "darkred" : "red";
    const particle = {
      x: Math.random() * canvasWidth,
      y: -30 - Math.random() * 20,
      radius,
      speed: 0.5 + Math.random() * 1,
      dx: (Math.random() - 0.5) * 0.5,
      color,
      visible: false
    };
    setTimeout(() => (particle.visible = true), 1000);
    bloodParticles.push(particle);
  }

  // update and draw particles
  for (let i = bloodParticles.length - 1; i >= 0; i--) {
    const b = bloodParticles[i];
    b.y += b.speed;
    b.x += b.dx;

    if (b.visible) {
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.radius * 0.6, b.radius * 1.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.fill();
    }

    // hit pool, create splash
    if (b.y >= bloodPoolHeight) {
      splashes.push({ x: b.x, y: bloodPoolHeight, radius: b.radius * 2, alpha: 0.8 });
      bloodParticles.splice(i, 1);
    }
  }

  // draw splashes
  for (let i = splashes.length - 1; i >= 0; i--) {
    const s = splashes[i];
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,0,0,${s.alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    s.radius += 1;
    s.alpha -= 0.05;
    if (s.alpha <= 0) splashes.splice(i, 1);
  }
}
