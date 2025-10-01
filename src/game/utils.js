export function drawObstacles(ctx) {
  const obstacles = [
    { x: 200, y: 200, width: 100, height: 50 },
    { x: 400, y: 100, width: 50, height: 150 }
  ];
  ctx.fillStyle = "#555";
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.width, o.height));
}
