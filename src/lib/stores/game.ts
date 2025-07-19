import { writable, derived } from "svelte/store";
import type { Player } from "../utils/vector.js";
import {
  getTodayGameState,
  saveTodayGameState,
  createNewGameState,
  addGuessToGameState,
  getTodayPlayer,
  isGameCompletedToday,
  cleanOldGameStates,
  type DailyGameState,
} from "../utils/daily.js";

export interface Guess {
  player: Player;
  similarity: number;
  timestamp: number;
}

export type GameMode = "2025" | "career";

export const gameMode = writable<GameMode>("2025");
export const targetPlayer = writable<Player | null>(null);
export const guesses = writable<Guess[]>([]);
export const currentInput = writable<string>("");
export const gameWon = writable<boolean>(false);
export const gameStarted = writable<boolean>(false);
export const dailyGameState = writable<DailyGameState | null>(null);

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

export function addGuess(
  player: Player,
  similarity: number,
  targetPlayer: Player | null = null
) {
  const roundedSimilarity = Math.round(similarity * 100) / 100;

  guesses.update((current) => [
    ...current,
    {
      player,
      similarity: roundedSimilarity,
      timestamp: Date.now(),
    },
  ]);

  // 데일리 게임 상태 업데이트
  dailyGameState.update((currentState) => {
    if (!currentState) return null;

    const newState = addGuessToGameState(currentState, {
      playerId: player.id,
      playerName: player.name,
      similarity: roundedSimilarity,
    });

    // localStorage에 저장
    saveTodayGameState(newState);

    return newState;
  });

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
  dailyGameState.set(null);
}

export function setGameMode(mode: GameMode) {
  gameMode.set(mode);
  // 모드 변경 시 게임 상태 초기화
  resetGame();
}

/**
 * 데일리 게임 초기화 - 오늘의 게임 상태 로드 또는 새로 생성
 */
export function initializeDailyGame(allPlayers: Player[], mode: "2025" | "career"): boolean {
  // 오래된 게임 상태 정리
  cleanOldGameStates();

  // 오늘의 선수 선택
  const todayPlayer = getTodayPlayer(allPlayers);

  // 기존 게임 상태 확인 (모드별)
  const existingState = getTodayGameState(mode);

  if (existingState) {
    // 기존 게임 상태 복원
    restoreGameFromState(existingState, todayPlayer, allPlayers);
    return existingState.isCompleted;
  } else {
    // 새로운 게임 시작
    const newState = createNewGameState(todayPlayer, mode);
    dailyGameState.set(newState);
    saveTodayGameState(newState);

    targetPlayer.set(todayPlayer);
    gameStarted.set(true);
    return false;
  }
}

/**
 * 저장된 게임 상태에서 게임 복원
 */
function restoreGameFromState(
  state: DailyGameState,
  todayPlayer: Player,
  allPlayers: Player[]
) {
  // 플레이어 객체 복원
  const restoredGuesses: Guess[] = state.guesses
    .map((guess) => {
      const player = allPlayers.find((p) => p.id === guess.playerId);
      if (!player) {
        console.warn(`Player not found: ${guess.playerId}`);
        return null;
      }
      return {
        player,
        similarity: guess.similarity,
        timestamp: guess.timestamp,
      };
    })
    .filter(Boolean) as Guess[];

  // 스토어 상태 복원
  dailyGameState.set(state);
  targetPlayer.set(todayPlayer);
  guesses.set(restoredGuesses);
  gameWon.set(state.isCompleted);
  gameStarted.set(true);
}

/**
 * 오늘 게임이 완료되었는지 확인
 */
export function isTodayGameCompleted(): boolean {
  return isGameCompletedToday();
}
