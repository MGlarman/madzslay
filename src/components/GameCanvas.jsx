import { useRef, useEffect } from "react";
import { useGameLoop } from "../hooks/useGameLoop";

export default function GameCanvas({ selectedCharacter }) {
  const canvasRef = useRef(null);

  // Player state for this canvas
  const player = useRef({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    size: 20,
    color: selectedCharacter.color,
    speed: selectedCharacter.speed,
    hp: selectedCharacter.maxHp,
    maxHp: selectedCharacter.maxHp,
    target: null
  });

  // Other game entities
  const enemies = useRef([]);
  const projectiles = useRef([]);
  const effects = useRef([]);

  // Start the game loop when canvas mounts
  useEffect(() => {
    if (!canvasRef.current) return;
    const cleanup = useGameLoop(canvasRef, player, enemies, projectiles, effects);
    return cleanup;
  }, [canvasRef, selectedCharacter]); // Re-run if a new character is chosen

  return (
    <canvas
      ref={canvasRef}
      width={window.innerWidth}
      height={window.innerHeight}
      className="bg-black"
    />
  );
}
