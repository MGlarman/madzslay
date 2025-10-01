// src/hooks/useGameLoop.js

import { useEffect, useRef, useState } from "react";
import { createPlayer } from "../game/player";
import { EnemyManager } from "../game/enemies";
import { ProjectileManager } from "../game/projectiles";
import { EffectsManager } from "../game/effects";
import { SkillEffectsManager } from "../game/skillEffects";
import { SkillsManager } from "../game/skills";
import { Obstacle, spriteMap } from "../game/obstacles";
import backgroundTile from "../assets/background/tile.png";
import { BossManager } from "../game/bosses";

export function useGameLoop(canvasRef, selectedCharacter, gameStarted, setGameStarted) {
  const initialized = useRef(false);
  const deathTimeout = useRef(null);
  const deathStart = useRef(null);
  const startTimeRef = useRef(null);
  const bgImage = new Image();

  // HUD state
  const [kills, setKills] = useState(0);
  const killsRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const [playerState, setPlayerState] = useState(null);
  const [skillsState, setSkillsState] = useState(null);

  // Gameplay refs
  const playerRef = useRef(null);
  const skillsRef = useRef(null);
  const obstaclesRef = useRef([]);
  const bossesRef = useRef(null);

  // Managers refs
  const enemiesRef = useRef(null);
  const projectilesRef = useRef(null);
  const bloodEffectsRef = useRef(null);
  const skillEffectsRef = useRef(null);

  // Track which bosses have spawned
  const spawnedBosses = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (gameStarted) {
      killsRef.current = 0;
      setKills(0);
      setElapsed(0);
      startTimeRef.current = Date.now();
      spawnedBosses.current = [];
    }

    const rectCollide = (x, y, size, rect) =>
      x + size > rect.x &&
      x - size < rect.x + rect.width &&
      y + size > rect.y &&
      y - size < rect.y + rect.height;

    // --- initialize environment ---
    const enemies = new EnemyManager(canvas.width, canvas.height);
    const projectiles = new ProjectileManager();
    const bloodEffects = new EffectsManager(canvas.width, canvas.height);
    const skillEffects = new SkillEffectsManager(canvas.width, canvas.height);

    enemiesRef.current = enemies;
    projectilesRef.current = projectiles;
    bloodEffectsRef.current = bloodEffects;
    skillEffectsRef.current = skillEffects;

    // --- Initialize bosses ---
    const bosses = new BossManager(canvas.width, canvas.height, (boss) => {
      console.log(`${boss.type} defeated!`);
      killsRef.current += 5; // optional reward
      setKills(killsRef.current);
    });
    bossesRef.current = bosses;

    // --- Initialize player and obstacles ---
    if (!initialized.current && gameStarted) {
      const spawnX = canvas.width / 2;
      const spawnY = canvas.height / 2;

      const player = createPlayer(selectedCharacter, canvas.width, canvas.height);
      playerRef.current = player;
      bgImage.src = backgroundTile;

      const obstacles = [];
      const obstacleCount = 5;
      const obstacleKeys = Object.keys(spriteMap);

      for (let i = 0; i < obstacleCount; i++) {
        let ob;
        let safe = false;

        while (!safe) {
          const width = 64;
          const height = 64;
          const x = Math.random() * (canvas.width - width);
          const y = Math.random() * (canvas.height - height);

          const overlapsPlayer =
            x < spawnX + player.size &&
            x + width > spawnX - player.size &&
            y < spawnY + player.size &&
            y + height > spawnY - player.size;

          if (!overlapsPlayer) {
            const spriteKey = obstacleKeys[Math.floor(Math.random() * obstacleKeys.length)];
            ob = new Obstacle(x, y, width, height, { sprite: spriteKey });
            safe = true;
          }
        }
        obstacles.push(ob);
      }

      obstaclesRef.current = obstacles;

      const skills = new SkillsManager(player, projectiles, skillEffects, enemies, selectedCharacter);
      skillsRef.current = skills;

      initialized.current = true;
    }

    // --- Input handling ---
    let spawnTimer = 0;
    let shootCooldown = 0;
    let shooting = false;
    let moving = false;
    let targetEnemy = null;
    let moveTarget = null;
    let animationFrameId;

    const handleKeyDown = (e) => {
      const player = playerRef.current;
      const skills = skillsRef.current;
      if (!gameStarted || !player || player.hp <= 0) return;

      const mouseX = player.hoverX || player.x;
      const mouseY = player.hoverY || player.y;

      if (["q", "w", "e", "r"].includes(e.key.toLowerCase())) {
        const killedBySkill = skills.cast(e.key.toLowerCase(), mouseX, mouseY);
        if (killedBySkill > 0) {
          killsRef.current += killedBySkill;
          setKills(killsRef.current);
        }
      }
    };

    const handleMouseMove = (e) => {
      const player = playerRef.current;
      if (!player) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

const hovered = enemies.enemies.concat(bosses.bosses).find((enemy) => {
  const dx = enemy.x - mouseX;
  const dy = enemy.y - mouseY;
  return Math.sqrt(dx * dx + dy * dy) < enemy.size;
});

      player.hoveringEnemy = !!hovered;
      player.hoverX = mouseX;
      player.hoverY = mouseY;

      if (moving && !shooting) moveTarget = { x: mouseX, y: mouseY };
    };

    const handleMouseDown = (e) => {
      const player = playerRef.current;
      if (!gameStarted || !player || player.hp <= 0) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

const clickedEnemy = enemies.enemies.concat(bosses.bosses).find((enemy) => {
  const dx = enemy.x - clickX;
  const dy = enemy.y - clickY;
  return Math.sqrt(dx * dx + dy * dy) < enemy.size;
});

      if (clickedEnemy) {
        shooting = true;
        targetEnemy = clickedEnemy;
        moving = false;
        moveTarget = null;
      } else {
        moving = true;
        moveTarget = { x: clickX, y: clickY };
        shooting = false;
        targetEnemy = null;
      }
    };

    const handleMouseUp = () => {
      shooting = false;
      moving = false;
      targetEnemy = null;
      moveTarget = null;
    };

    const handleTouchMove = (e) => {
      //gets current player object from useRef, which is the latest known version
      const player = playerRef.current;
      if (!player) return;
      e.preventDefault();

      // of canvas, gets the position and size relative to browser window
      const rect = canvas.getBoundingClientRect();
      //e.touches is an array of all touchpoints
      const touch = e.touches[0];
      //touch X and Y are screen coordinates developed by subtracting rect.left and rect.top from the touchpoint
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;

      //enemies and bosses-arrays are concatenated.
      //find loops through the array and returns the first element to which returns true.
    const hovered = enemies.enemies.concat(bosses.bosses).find((enemy) => {
      //finds distance between touchpoint and enemy
      const dx = enemy.x - touchX;
      const dy = enemy.y - touchY;
      //returns the distance via Pythagorean theorem if it is less than the enemy size
      return Math.sqrt(dx * dx + dy * dy) < enemy.size;
    });

    //hovered is an enemy object or undefined - '!!' turns hovered into a boolean, true if hovered exists
      player.hoveringEnemy = !!hovered;
      player.hoverX = touchX;
      player.hoverY = touchY;

      //if moving and not shooting, moves to target coordinates
      if (moving && !shooting) moveTarget = { x: touchX, y: touchY };
    };

    //defines a function with an eventhandler / an event object is passed to the function
    const handleTouchStart = (e) => {
      //gets current player object from useRef / the player reference
      const player = playerRef.current;
      if (!gameStarted || !player || player.hp <= 0) return;
      e.preventDefault();

      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;

    const clickedEnemy = enemies.enemies.concat(bosses.bosses).find((enemy) => {
      const dx = enemy.x - touchX;
      const dy = enemy.y - touchY;
      return Math.sqrt(dx * dx + dy * dy) < enemy.size;
    });


      if (clickedEnemy) {
        shooting = true;
        targetEnemy = clickedEnemy;
        moving = false;
        moveTarget = null;
      } else {
        moving = true;
        moveTarget = { x: touchX, y: touchY };
        shooting = false;
        targetEnemy = null;
      }
    };

    const handleTouchEnd = () => {
      shooting = false;
      moving = false;
      targetEnemy = null;
      moveTarget = null;
    };

    // --- Attach listeners ---
    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false });

    // --- Main loop ---
    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const player = playerRef.current;
      const skills = skillsRef.current;

      // Tile background
      for (let x = 0; x < canvas.width; x += 254) {
        for (let y = 0; y < canvas.height; y += 254) {
          ctx.drawImage(bgImage, x, y, 254, 254);
        }
      }

      // Draw obstacles
      obstaclesRef.current.forEach((ob) => ob.draw(ctx));

      if (!gameStarted) {
        bloodEffects.update();
        bloodEffects.draw(ctx);
      } else if (player) {
        // Mana regen
        if (player.mana < player.maxMana) {
          player.mana = Math.min(player.maxMana, player.mana + player.manaRegen);
        }

        // Player movement
        if (moving && moveTarget) {
          const dx = moveTarget.x - player.x;
          const dy = moveTarget.y - player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 1) {
            const stepX = (dx / dist) * player.speed;
            const stepY = (dy / dist) * player.speed;
            let nextX = player.x + stepX;
            let nextY = player.y + stepY;

            const blocked = obstaclesRef.current.some((ob) =>
              ob.collidesCircle(nextX, nextY, player.size)
            );

            if (!blocked) {
              player.x = nextX;
              player.y = nextY;
            } else {
              const hBlocked = obstaclesRef.current.some((ob) =>
                rectCollide(player.x + stepX, player.y, player.size, ob)
              );
              const vBlocked = obstaclesRef.current.some((ob) =>
                rectCollide(player.x, player.y + stepY, player.size, ob)
              );

              if (!hBlocked) player.x += stepX;
              else if (!vBlocked) player.y += stepY;
            }

            player.facingRight = dx >= 0;
          }
        }

        // Update enemies
        enemies.update(player, obstaclesRef.current);

        // Shooting
        if (shooting && targetEnemy && shootCooldown <= 0) {
          projectiles.shoot(player.x, player.y, targetEnemy.x, targetEnemy.y, 12, "yellow");
          shootCooldown = 20;
        }
        if (shootCooldown > 0) shootCooldown--;

        // Update bosses
        bosses.update(player);
        bosses.draw(ctx);

        // --- Spawn bosses at milestones ---
        if (killsRef.current >= 10 && !spawnedBosses.current.includes("jellyfishBoss")) {
          bosses.spawnBoss("jellyfishBoss");
          spawnedBosses.current.push("jellyfishBoss");
        }

        if (killsRef.current >= 20 && !spawnedBosses.current.includes("redBoss")) {
          bosses.spawnBoss("redBoss");
          spawnedBosses.current.push("redBoss");
        }

          if (killsRef.current >= 40 && !spawnedBosses.current.includes("crystalBoss")) {
          bosses.spawnBoss("crystalBoss");
          spawnedBosses.current.push("crystalBoss");
        }

        // Projectiles
        const killedByProjectile = projectiles.updateAndDraw(ctx, enemies.enemies.concat(bosses.bosses));
        if (killedByProjectile > 0) {
          killsRef.current += killedByProjectile;
          setKills(killsRef.current);
        }

        skills.updateCooldowns();


        // Update HUD
        setPlayerState({
          hp: player.hp,
          maxHp: player.maxHp,
          mana: player.mana,
          maxMana: player.maxMana,
        });
        setSkillsState({
          cooldowns: { ...skills.cooldowns },
          maxCooldown: { ...skills.maxCooldown },
        });

        // Draw everything
        player.draw(ctx);
        enemies.draw(ctx);

        const killedBySkills = skillEffects.update(enemies.enemies.concat(bosses.bosses));
        if (killedBySkills > 0) {
          killsRef.current += killedBySkills;
          setKills(killsRef.current);
        }
        skillEffects.draw(ctx);

        if (player.hoveringEnemy) {
          ctx.strokeStyle = "yellow";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(player.hoverX, player.hoverY, 20, 0, Math.PI * 2);
          ctx.stroke();
        }

        if (startTimeRef.current)
          setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));

        spawnTimer++;
        if (spawnTimer > 120) {
          enemies.spawnEnemy();
          spawnTimer = 0;
        }

        // Death handling
        if (player.hp <= 0) {
          if (!deathStart.current) {
            deathStart.current = Date.now();
            deathTimeout.current = setTimeout(() => {
              initialized.current = false;
              playerRef.current = null;
              skillsRef.current = null;
              obstaclesRef.current = [];
              enemiesRef.current = null;
              projectilesRef.current = null;
              bloodEffectsRef.current = null;
              skillEffectsRef.current = null;
              bossesRef.current = null;

              setGameStarted(false);

              deathTimeout.current = null;
              deathStart.current = null;
            }, 2000);
          }

          const progress = Math.min((Date.now() - deathStart.current) / 2000, 1);
          ctx.fillStyle = `rgba(0,0,0,${progress})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = "white";
          ctx.font = "60px sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("YOU HAVE DIED", canvas.width / 2, canvas.height / 2);
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchstart", handleTouchStart);
      canvas.removeEventListener("touchend", handleTouchEnd);
      if (deathTimeout.current) clearTimeout(deathTimeout.current);
      cancelAnimationFrame(animationFrameId);

      playerRef.current = null;
      skillsRef.current = null;
      obstaclesRef.current = [];
      enemiesRef.current = null;
      projectilesRef.current = null;
      bloodEffectsRef.current = null;
      skillEffectsRef.current = null;
      initialized.current = false;
    };
  }, [canvasRef, selectedCharacter, gameStarted, setGameStarted]);

  return { kills, elapsed, player: playerState, skills: skillsState };
}
