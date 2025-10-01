import { useRef, useState } from "react";
import { useGameLoop } from "./hooks/useGameLoop";
import HUD from "./components/HUD";
import warriorSprite from "./assets/player/warrior.png";
import assassinSprite from "./assets/player/assassin.png";
import tankSprite from "./assets/player/tank.png";

const characters = [
  { name: "Warrior", color: "lime", speed: 3, maxHp: 30, maxMana: 100, sprite: warriorSprite },
  { name: "Assassin", color: "cyan", speed: 5, maxHp: 15, maxMana: 120, sprite: assassinSprite },
  { name: "Tank", color: "orange", speed: 2, maxHp: 50, maxMana: 80, sprite: tankSprite },
];

export default function App() {
  const canvasRef = useRef(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(0);

  // Use the reactive state from the hook
  const { kills, elapsed, player: playerState, skills: skillsState } = useGameLoop(
    canvasRef,
    characters[selectedCharacter],
    gameStarted,
    setGameStarted
  );

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center relative">
      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="bg-black"
      />

      {/* HUD overlay */}
      {gameStarted && playerState && skillsState && (
        <HUD
          player={playerState}   // pass the reactive player object
          kills={kills}
          elapsed={elapsed}
          skills={skillsState}   // pass reactive skills state
        />
      )}

      {/* Intro / Character selection overlay */}
      {!gameStarted && (
        <div className="absolute flex flex-col items-center text-white">
          <h1 className="text-5xl mb-8">
            Welcome to Mad<span className="text-cyan-500">Z</span>Slay!
          </h1>

          <div className="flex gap-8 mb-4">
            {characters.map((char, i) => (
              <div
                key={i}
                onClick={() => setSelectedCharacter(i)}
                className={`w-36 h-44 flex flex-col items-center justify-center cursor-pointer rounded-lg 
                  ${i === selectedCharacter ? "border-4 border-yellow-400" : "border-2 border-gray-700"}
                  bg-gray-800 hover:bg-gray-700`}
              >
                {char.sprite ? (
                  <img
                    src={char.sprite}
                    alt={char.name}
                    className="w-16 h-16 rounded-full mb-2 object-cover"
                  />
                ) : (
                  <div
                    className="w-16 h-16 rounded-full mb-2"
                    style={{ backgroundColor: char.color }}
                  />
                )}
                <span className="text-lg">{char.name}</span>
              </div>
            ))}
          </div>

          <p className="mb-4">Choose a character and press PLAY!</p>

          <button
            className="bg-red-600 px-10 py-4 rounded text-2xl hover:bg-red-700"
            onClick={() => setGameStarted(true)}
          >
            PLAY
          </button>
        </div>
      )}
    </div>
  );
}
