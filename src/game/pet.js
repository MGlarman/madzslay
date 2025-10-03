import petSprite from "../assets/pet/petDog.png"; // <- your pixel dog asset

const petImg = new Image();
petImg.src = petSprite;

export class Pet {
  constructor(player, projectiles) {
    this.player = player;
    this.projectiles = projectiles;

    this.size = 10;
    this.x = player.x - 20; // start offset from player
    this.y = player.y - 20;
    this.speed = 2; // follow speed

    this.attackCooldown = 0;
  }

  update() {
    // --- FOLLOWING LOGIC ---
    const dx = this.player.x - this.x;
    const dy = this.player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 30) { // keep some "pet distance"
      this.x += (dx / dist) * this.speed;
      this.y += (dy / dist) * this.speed;
    }

    // --- RANDOM ATTACK ---
    if (this.attackCooldown <= 0) {
      if (Math.random() < 0.01) { // ~1% chance per frame
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * 8;
        const vy = Math.sin(angle) * 8;
        this.projectiles.shoot(this.x, this.y, this.x + vx, this.y + vy, 8, "pink");
        this.attackCooldown = 60; // cooldown frames
      }
    } else {
      this.attackCooldown--;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (petImg.complete && petImg.naturalWidth > 0) {
      ctx.drawImage(petImg, -this.size, -this.size, this.size * 2, this.size * 2);
    } else {
      ctx.fillStyle = "pink";
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
