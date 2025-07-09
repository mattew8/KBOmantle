import { writable, derived } from "svelte/store";
import type { Player } from "../utils/vector.js";

export interface Guess {
  player: Player;
  similarity: number;
  timestamp: number;
}

export const targetPlayer = writable<Player | null>(null);
export const guesses = writable<Guess[]>([]);
export const currentInput = writable<string>("");
export const gameWon = writable<boolean>(false);
export const gameStarted = writable<boolean>(false);

export const sortedGuesses = derived(guesses, ($guesses) =>
  [...$guesses].sort((a, b) => b.similarity - a.similarity)
);

export const attemptCount = derived(guesses, ($guesses) => $guesses.length);

export const bestSimilarity = derived(guesses, ($guesses) =>
  $guesses.length > 0 ? Math.max(...$guesses.map((g) => g.similarity)) : 0
);

export const hasGuessedPlayer = derived(guesses, ($guesses) => {
  return (playerId: string) => $guesses.some((g) => g.player.id === playerId);
});

export function addGuess(player: Player, similarity: number, targetPlayer: Player | null = null) {
  guesses.update((current) => [
    ...current,
    {
      player,
      similarity: Math.round(similarity * 100) / 100,
      timestamp: Date.now(),
    },
  ]);

  // 정답 판정은 선수 ID가 정확히 일치할 때만
  if (targetPlayer && player.id === targetPlayer.id) {
    gameWon.set(true);
  }
}

export function resetGame() {
  guesses.set([]);
  currentInput.set("");
  gameWon.set(false);
  gameStarted.set(false);
  targetPlayer.set(null);
}

export function startNewGame(target: Player) {
  resetGame();
  targetPlayer.set(target);
  gameStarted.set(true);
}
