// src/game/state.js
export const GAME_STATES = {
  INTRO: "intro",
  PLAYING: "playing",
  GAMEOVER: "gameover",
};

let currentState = GAME_STATES.INTRO;

export function getGameState() {
  return currentState;
}

export function setGameState(state) {
  currentState = state;
}
