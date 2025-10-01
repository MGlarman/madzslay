import stoneWall from "../assets/obstacles/stoneWall.png";
import woodBarricade from "../assets/obstacles/woodBarricade.png";
import brokenCart from "../assets/obstacles/brokenCart.png";
import crystal from "../assets/obstacles/crystal.png";
import column from "../assets/obstacles/column.png";
import alienGrowth from "../assets/obstacles/alienGrowth.png";
import brokenWall from "../assets/obstacles/brokenWall.png";

// Map sprite keys to their image sources
export const spriteMap = {
  stoneWall,
  woodBarricade,
  brokenCart,
  crystal,
  column,
  alienGrowth,
  brokenWall,
};

// Define sizes for each sprite (width x height)
export const spriteSizes = {
  stoneWall: { width: 64, height: 64 },
  woodBarricade: { width: 64, height: 64 },
  brokenCart: { width: 128, height: 128 },
  crystal: { width: 128, height: 128 },
  column: { width: 64, height: 64 },
  alienGrowth: { width: 64, height: 64 },
  brokenWall: { width: 256, height: 256 }, // large obstacle
};

// Preload all images to prevent flicker
Object.values(spriteMap).forEach((src) => {
  const img = new Image();
  img.src = src;
});

export class Obstacle {
  constructor(x, y, width = null, height = null, options = {}) {
    this.x = x;
    this.y = y;

    this.spriteKey = options.sprite || null;

    if (this.spriteKey && spriteMap[this.spriteKey]) {
      this.sprite = new Image();
      this.sprite.src = spriteMap[this.spriteKey];

      // Use width/height from constructor, else from size map
      const size = spriteSizes[this.spriteKey] || { width: 64, height: 64 };
      this.width = width || size.width;
      this.height = height || size.height;
    } else {
      this.sprite = null;
      this.width = width || 64;
      this.height = height || 64;
    }

    this.color = options.color || "gray";
  }

  draw(ctx) {
    if (this.sprite && this.sprite.complete && this.sprite.naturalWidth > 0) {
      ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = this.color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  // Collision check with a circle (player/enemy)
  collidesCircle(cx, cy, radius) {
    const nearestX = Math.max(this.x, Math.min(cx, this.x + this.width));
    const nearestY = Math.max(this.y, Math.min(cy, this.y + this.height));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy < radius * radius;
  }
}
