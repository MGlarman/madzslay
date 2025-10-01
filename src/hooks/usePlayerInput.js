import { useEffect, useRef } from "react";

export function usePlayerInput({ canvasRef, playerRef, enemiesRef, bossesRef, skillsRef, gameStarted }) {
  // --- Refs for movement/shooting state ---
  const movingRef = useRef(false);
  const moveTargetRef = useRef(null);
  const shootingRef = useRef(false);
  const targetEnemyRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const getHoveredEnemy = (x, y) => {
      const enemies = enemiesRef.current?.enemies || [];
      const bosses = bossesRef.current?.bosses || [];
      return enemies.concat(bosses).find((enemy) => {
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        return Math.sqrt(dx * dx + dy * dy) < enemy.size;
      });
    };

    const handleKeyDown = (e) => {
      const player = playerRef.current;
      const skills = skillsRef.current;
      if (!gameStarted || !player || player.hp <= 0) return;

      const mouseX = player.hoverX || player.x;
      const mouseY = player.hoverY || player.y;

      if (["q", "w", "e", "r"].includes(e.key.toLowerCase())) {
        skills.cast(e.key.toLowerCase(), mouseX, mouseY);
      }
    };

    const handleMove = (x, y) => {
      const player = playerRef.current;
      if (!player) return;

      const hovered = getHoveredEnemy(x, y);
      player.hoveringEnemy = !!hovered;
      player.hoverX = x;
      player.hoverY = y;

      if (movingRef.current && !shootingRef.current) moveTargetRef.current = { x, y };
    };

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      handleMove(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleMouseDown = (e) => {
      const player = playerRef.current;
      if (!player || player.hp <= 0) return;

      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const clickedEnemy = getHoveredEnemy(clickX, clickY);

      if (clickedEnemy) {
        shootingRef.current = true;
        targetEnemyRef.current = clickedEnemy;
        movingRef.current = false;
        moveTargetRef.current = null;
      } else {
        movingRef.current = true;
        moveTargetRef.current = { x: clickX, y: clickY };
        shootingRef.current = false;
        targetEnemyRef.current = null;
      }
    };

    const handleMouseUp = () => {
      movingRef.current = false;
      shootingRef.current = false;
      targetEnemyRef.current = null;
      moveTargetRef.current = null;
    };

    const handleTouch = (e, start = false) => {
      e.preventDefault();
      const player = playerRef.current;
      if (!player || player.hp <= 0) return;

      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;

      const clickedEnemy = getHoveredEnemy(x, y);

      if (start) {
        if (clickedEnemy) {
          shootingRef.current = true;
          targetEnemyRef.current = clickedEnemy;
          movingRef.current = false;
          moveTargetRef.current = null;
        } else {
          movingRef.current = true;
          moveTargetRef.current = { x, y };
          shootingRef.current = false;
          targetEnemyRef.current = null;
        }
      } else {
        handleMove(x, y);
      }
    };

    // --- Attach events ---
    window.addEventListener("keydown", handleKeyDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("touchmove", (e) => handleTouch(e, false), { passive: false });
    canvas.addEventListener("touchstart", (e) => handleTouch(e, true), { passive: false });
    canvas.addEventListener("touchend", handleMouseUp);
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchmove", (e) => handleTouch(e, false));
      canvas.removeEventListener("touchstart", (e) => handleTouch(e, true));
      canvas.removeEventListener("touchend", handleMouseUp);
    };
  }, [canvasRef, playerRef, enemiesRef, bossesRef, skillsRef, gameStarted]);

  return {
    movingRef,
    moveTargetRef,
    shootingRef,
    targetEnemyRef,
  };
}
