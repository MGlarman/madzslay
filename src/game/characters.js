// src/game/characters.js
import warriorSprite from "../assets/player/warrior.png";
import assassinSprite from "../assets/player/assassin.png";
import tankSprite from "../assets/player/tank.png";

export const characters = [
  {
    name: "Warrior",
    color: "lime",
    speed: 3,
    maxHp: 30,
    maxMana: 100,
    manaRegen: 0.3,
    sprite: warriorSprite,
  },
  {
    name: "Assassin",
    color: "cyan",
    speed: 5,
    maxHp: 15,
    maxMana: 120,
    manaRegen: 0.5,
    sprite: assassinSprite,
  },
  {
    name: "Tank",
    color: "orange",
    speed: 2,
    maxHp: 50,
    maxMana: 80,
    manaRegen: 0.2,
    sprite: tankSprite,
  },
];
