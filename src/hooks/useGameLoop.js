// src/hooks/useGameLoop.js
import { useEffect, useRef, useState } from "react";
import { createPlayer } from "../game/player";
import { EnemyManager } from "../game/enemies";
import { ProjectileManager } from "../game/projectiles";
import { EffectsManager } from "../game/effects";
import { SkillEffectsManager } from "../game/skillEffects";
import { SkillsManager } from "../game/skills";
import { Obstacle, spriteMap } from "../game/obstacles";
import { BossManager } from "../game/bosses";
import backgroundTile from "../assets/background/tile.png";
import { usePlayerInput } from "./usePlayerInput";
import { updatePlayerPosition, handleDeath } from "../game/helpers";

export function useGameLoop(canvasRef, selectedCharacter, gameStarted, setGameStarted) {
  const initialized = useRef(false);
  const deathStart = useRef(null);
  const startTimeRef = useRef(null);
  const bgImage = useRef(new Image());
  bgImage.current.src = backgroundTile;

  const [kills, setKills] = useState(0);
  const killsRef = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const [playerState, setPlayerState] = useState(null);
  const [skillsState, setSkillsState] = useState(null);

  const playerRef = useRef(null);
  const skillsRef = useRef(null);
  const obstaclesRef = useRef([]);
  const bossesRef = useRef(null);
  const enemiesRef = useRef(null);
  const projectilesRef = useRef(null);
  const bloodEffectsRef = useRef(null);
  const skillEffectsRef = useRef(null);

  // Boss milestone tracking
  const spawnedBosses = useRef([]);
  const bossMilestones = [
    { kills: 10, type: "jellyfishBoss" },
    { kills: 20, type: "redBoss" },
    { kills: 30, type: "crystalBoss" },
  ];

  const { movingRef, moveTargetRef, shootingRef, targetEnemyRef } = usePlayerInput({
    canvasRef,
    playerRef,
    enemiesRef,
    bossesRef,
    skillsRef,
    gameStarted,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Reset counters on new game
    if (gameStarted && !initialized.current) {
      killsRef.current = 0;
      setKills(0);
      startTimeRef.current = Date.now();
      setElapsed(0);
    }

    // Initialize managers
    const enemies = new EnemyManager(canvas.width, canvas.height);
    const projectiles = new ProjectileManager();
    const bloodEffects = new EffectsManager(canvas.width, canvas.height);
    const skillEffects = new SkillEffectsManager(canvas.width, canvas.height);
    const bosses = new BossManager(canvas.width, canvas.height, () => {
      killsRef.current += 5;
      setKills(killsRef.current);
    });

    enemiesRef.current = enemies;
    projectilesRef.current = projectiles;
    bloodEffectsRef.current = bloodEffects;
    skillEffectsRef.current = skillEffects;
    bossesRef.current = bosses;

    // Initialize player & obstacles
    if (!initialized.current && gameStarted) {
      const player = createPlayer(selectedCharacter, canvas.width, canvas.height);
      playerRef.current = player;

      const obstacles = [];
      const obstacleKeys = Object.keys(spriteMap);
      for (let i = 0; i < 5; i++) {
        let ob;
        let safe = false;
        while (!safe) {
          const x = Math.random() * (canvas.width - 64);
          const y = Math.random() * (canvas.height - 64);
          const overlaps =
            x < canvas.width / 2 + player.size &&
            x + 64 > canvas.width / 2 - player.size &&
            y < canvas.height / 2 + player.size &&
            y + 64 > canvas.height / 2 - player.size;
          if (!overlaps) {
            const spriteKey = obstacleKeys[Math.floor(Math.random() * obstacleKeys.length)];
            ob = new Obstacle(x, y, 64, 64, { sprite: spriteKey });
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

    let spawnTimer = 0;
    let shootCooldown = 0;
    let animationFrameId;

    const loop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!gameStarted) {
        bloodEffects.update();
        bloodEffects.draw(ctx);
      } else if (playerRef.current) {
        const player = playerRef.current;

        // ------------------------------
        // UPDATE STEP
        // ------------------------------
        player.mana = Math.min(player.maxMana, player.mana + player.manaRegen);
        updatePlayerPosition(player, obstaclesRef.current, movingRef, moveTargetRef);

        if (shootingRef.current && targetEnemyRef.current && shootCooldown <= 0) {
          projectiles.shoot(player.x, player.y, targetEnemyRef.current.x, targetEnemyRef.current.y, 12, "yellow");
          shootCooldown = 20;
        }
        if (shootCooldown > 0) shootCooldown--;

        enemies.update(player, obstaclesRef.current);
        bosses.update(player);

        const allTargets = enemies.enemies.concat(bosses.bosses);
        const killedByProjectiles = projectiles.update(allTargets, ctx);
        const killedBySkills = skillEffects.update(allTargets);

        // Update kills
        const totalKills = killedByProjectiles + killedBySkills;
        if (totalKills > 0) {
          killsRef.current += totalKills;
          setKills(killsRef.current);
        }

        // ------------------------------
        // Boss spawning based on milestones
        // ------------------------------
        bossMilestones.forEach(({ kills, type }) => {
          if (killsRef.current >= kills && !spawnedBosses.current.includes(type)) {
            bosses.spawnBoss(type);
            spawnedBosses.current.push(type);
          }
        });

        skillsRef.current.updateCooldowns();

        // ------------------------------
        // RENDER STEP
        // ------------------------------
        for (let x = 0; x < canvas.width; x += 254) {
          for (let y = 0; y < canvas.height; y += 254) {
            ctx.drawImage(bgImage.current, x, y, 254, 254);
          }
        }

        obstaclesRef.current.forEach(ob => ob.draw(ctx));
        projectiles.draw(ctx);
        skillEffects.draw(ctx);
        bosses.draw(ctx);
        enemies.draw(ctx);
        player.draw(ctx);

        if (player.hoveringEnemy) {
          ctx.strokeStyle = "yellow";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(player.hoverX, player.hoverY, 20, 0, Math.PI * 2);
          ctx.stroke();
        }

        // ------------------------------
        // SPAWN ENEMIES
        // ------------------------------
        spawnTimer++;
        if (spawnTimer > 120) {
          enemies.spawnEnemy();
          spawnTimer = 0;
        }

        // ------------------------------
        // HUD
        // ------------------------------
        setPlayerState({
          hp: player.hp,
          maxHp: player.maxHp,
          mana: player.mana,
          maxMana: player.maxMana
        });
        setSkillsState({
          cooldowns: { ...skillsRef.current.cooldowns },
          maxCooldown: { ...skillsRef.current.maxCooldown }
        });

        // ------------------------------
        // DEATH
        // ------------------------------
        handleDeath({
          player,
          ctx,
          deathStartRef: deathStart,
          onDeathComplete: () => {
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
            deathStart.current = null;
            spawnedBosses.current = [];

            // Reset counters after death
            killsRef.current = 0;
            setKills(0);
            startTimeRef.current = null;
            setElapsed(0);
          }
        });

        // Update elapsed timer
        if (startTimeRef.current) {
          setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      cancelAnimationFrame(animationFrameId);
      playerRef.current = null;
      skillsRef.current = null;
      obstaclesRef.current = [];
      enemiesRef.current = null;
      projectilesRef.current = null;
      bloodEffectsRef.current = null;
      skillEffectsRef.current = null;
      bossesRef.current = null;
      initialized.current = false;
      spawnedBosses.current = [];
    };
  }, [canvasRef, selectedCharacter, gameStarted, setGameStarted]);

  return { kills, elapsed, player: playerState, skills: skillsState };
}
