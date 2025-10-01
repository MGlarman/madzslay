// --- Collision helpers ---
export function rectCollide(x, y, size, rect) {
  return (
    x + size > rect.x &&
    x - size < rect.x + rect.width &&
    y + size > rect.y &&
    y - size < rect.y + rect.height
  );
}

// --- Player movement ---
export function updatePlayerPosition(player, obstacles, movingRef, moveTargetRef) {
  if (!movingRef.current || !moveTargetRef.current) return;

  const dx = moveTargetRef.current.x - player.x;
  const dy = moveTargetRef.current.y - player.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist <= 1) return;

  const stepX = (dx / dist) * player.speed;
  const stepY = (dy / dist) * player.speed;
  let nextX = player.x + stepX;
  let nextY = player.y + stepY;

  const blocked = obstacles.some((ob) =>
    ob.collidesCircle(nextX, nextY, player.size)
  );

  if (!blocked) {
    player.x = nextX;
    player.y = nextY;
  } else {
    const hBlocked = obstacles.some((ob) =>
      rectCollide(player.x + stepX, player.y, player.size, ob)
    );
    const vBlocked = obstacles.some((ob) =>
      rectCollide(player.x, player.y + stepY, player.size, ob)
    );

    if (!hBlocked) player.x += stepX;
    if (!vBlocked) player.y += stepY;
  }

  player.facingRight = dx >= 0;
}

// --- Boss spawning milestones ---
export function handleBossSpawning(killsRef, bosses, spawnedBosses, milestones) {
  milestones.forEach(({ kills, type }) => {
    if (killsRef.current >= kills && !spawnedBosses.current.includes(type)) {
      bosses.spawnBoss(type);
      spawnedBosses.current.push(type);
    }
  });
}

// --- Game update step ---
export function updateGame({
  player,
  skills,
  enemies,
  bosses,
  projectiles,
  skillEffects,
  obstacles,
  movingRef,
  moveTargetRef,
  shootingRef,
  targetEnemyRef,
  killsRef,
  shootCooldownRef,
}) {
  if (!player) return 0;

  // --- Mana regen ---
  player.mana = Math.min(player.maxMana, player.mana + player.manaRegen);

  // --- Player movement ---
  updatePlayerPosition(player, obstacles, movingRef, moveTargetRef);

  // --- Shooting ---
  if (shootingRef.current && targetEnemyRef.current && shootCooldownRef.current <= 0) {
    projectiles.shoot(
      player.x,
      player.y,
      targetEnemyRef.current.x,
      targetEnemyRef.current.y,
      12,
      "yellow"
    );
    shootCooldownRef.current = 20;
  }
  if (shootCooldownRef.current > 0) shootCooldownRef.current--;

  // --- Enemies & bosses AI ---
  enemies.update(player, obstacles);
  bosses.update(player);

  // --- Projectiles & skills ---
  const killedByProjectiles = projectiles.update(enemies.enemies.concat(bosses.bosses));
  const killedBySkills = skillEffects.update(enemies.enemies.concat(bosses.bosses));

  // --- Update kill count ---
  const totalKills = killedByProjectiles + killedBySkills;
  if (totalKills > 0) {
    killsRef.current += totalKills;
  }

  // --- Skills cooldowns ---
  skills.updateCooldowns();

  // Return number of kills this frame (optional, could be useful)
  return totalKills;
}



// --- Game render step ---
export function renderGame({ ctx, bgImage, obstacles, player, enemies, bosses, projectiles, skillEffects }) {
  // Background
  for (let x = 0; x < ctx.canvas.width; x += 254) {
    for (let y = 0; y < ctx.canvas.height; y += 254) {
      ctx.drawImage(bgImage, x, y, 254, 254);
    }
  }

  // Obstacles
  obstacles.forEach(ob => ob.draw(ctx));

  // Projectiles
  projectiles.draw(ctx);

  // Skill effects
  skillEffects.draw(ctx);

  // Bosses & enemies
  bosses.draw(ctx);
  enemies.draw(ctx);

  // Player
  if (player) {
    player.draw(ctx);

    // Hover indicator
    if (player.hoveringEnemy) {
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.hoverX, player.hoverY, 20, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// --- Death overlay ---
export function handleDeath({ player, ctx, deathStartRef, onDeathComplete }) {
  if (!player || player.hp > 0) return false;

  if (!deathStartRef.current) {
    deathStartRef.current = Date.now();
  }

  const progress = Math.min((Date.now() - deathStartRef.current) / 2000, 1);
  ctx.fillStyle = `rgba(0,0,0,${progress})`;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "60px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("YOU HAVE DIED", ctx.canvas.width / 2, ctx.canvas.height / 2);

  if (progress === 1 && onDeathComplete) {
    onDeathComplete();
  }

  return true;
}
