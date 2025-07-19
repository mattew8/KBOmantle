import type { Player } from './vector';
import { CONFIG } from '../config.js';

/**
 * 문자열을 해시코드로 변환하는 함수
 */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  return Math.abs(hash);
}

/**
 * 한국 시간 기준으로 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getTodayDateKST(): string {
  const now = new Date();
  // 한국 시간 (UTC+9)으로 변환
  const kstTime = new Date(now.getTime() + (CONFIG.TIMEZONE_OFFSET * 60 * 60 * 1000));
  return kstTime.toISOString().split('T')[0];
}

/**
 * 날짜를 기반으로 고정된 선수를 선택하는 함수
 */
export function getTodayPlayer(players: Player[], date?: string): Player {
  const targetDate = date || getTodayDateKST();
  
  // 날짜를 시드로 사용 (예: "2024-01-01" -> "20240101")
  const seed = targetDate.replace(/-/g, '');
  const hash = hashCode(seed);
  
  // 해시를 사용해서 선수 배열에서 동일한 인덱스 선택
  const playerIndex = hash % players.length;
  
  return players[playerIndex];
}

/**
 * 게임 상태 인터페이스
 */
export interface DailyGameState {
  date: string;
  mode: "2025" | "career"; // 게임 모드 추가
  targetPlayerId: string;
  guesses: Array<{
    playerId: string;
    playerName: string;
    similarity: number;
    timestamp: number;
  }>;
  isCompleted: boolean;
  completedAt: number | null;
  attempts: number;
}

/**
 * 오늘의 게임 상태를 localStorage에서 가져오기 (모드별 분리)
 */
export function getTodayGameState(mode: "2025" | "career", date?: string): DailyGameState | null {
  const targetDate = date || getTodayDateKST();
  const key = `${CONFIG.STORAGE_PREFIX}${targetDate}-${mode}`;
  
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    
    const state = JSON.parse(saved) as DailyGameState;
    
    // 날짜와 모드가 일치하는지 확인
    if (state.date !== targetDate || state.mode !== mode) {
      localStorage.removeItem(key);
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('게임 상태 로드 실패:', error);
    return null;
  }
}

/**
 * 게임 상태를 localStorage에 저장하기 (모드별 분리)
 */
export function saveTodayGameState(state: DailyGameState): void {
  const key = `${CONFIG.STORAGE_PREFIX}${state.date}-${state.mode}`;
  
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('게임 상태 저장 실패:', error);
  }
}

/**
 * 새로운 게임 상태 초기화 (모드 추가)
 */
export function createNewGameState(targetPlayer: Player, mode: "2025" | "career", date?: string): DailyGameState {
  const targetDate = date || getTodayDateKST();
  
  return {
    date: targetDate,
    mode: mode,
    targetPlayerId: targetPlayer.id,
    guesses: [],
    isCompleted: false,
    completedAt: null,
    attempts: 0
  };
}

/**
 * 게임 상태에 추측 추가
 */
export function addGuessToGameState(
  state: DailyGameState,
  guess: {
    playerId: string;
    playerName: string;
    similarity: number;
  }
): DailyGameState {
  const newState = { ...state };
  
  newState.guesses.push({
    ...guess,
    timestamp: Date.now()
  });
  
  newState.attempts = newState.guesses.length;
  
  // 100% 유사도면 게임 완료
  if (guess.similarity >= 100) {
    newState.isCompleted = true;
    newState.completedAt = Date.now();
  }
  
  return newState;
}

/**
 * 게임이 오늘 이미 완료되었는지 확인
 */
export function isGameCompletedToday(mode: "2025" | "career", date?: string): boolean {
  const state = getTodayGameState(mode, date);
  return state?.isCompleted || false;
}

/**
 * 내일까지 남은 시간 계산 (한국 시간 기준)
 */
export function getTimeUntilTomorrow(): { hours: number; minutes: number; seconds: number } {
  // 현재 UTC 시간
  const now = new Date();
  
  // 오늘 한국 시간 자정 (UTC 기준)
  const todayMidnightKST = new Date();
  todayMidnightKST.setUTCHours(24 - CONFIG.TIMEZONE_OFFSET, 0, 0, 0); // 한국 자정 = UTC 15:00
  
  // 만약 이미 한국 시간 자정이 지났다면 내일 자정으로
  if (now.getTime() >= todayMidnightKST.getTime()) {
    todayMidnightKST.setUTCDate(todayMidnightKST.getUTCDate() + 1);
  }
  
  const diff = todayMidnightKST.getTime() - now.getTime();
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { hours, minutes, seconds };
}

/**
 * 예전 게임 상태 정리 (7일 이상 된 것들)
 */
export function cleanOldGameStates(): void {
  const keys = Object.keys(localStorage);
  const gameKeys = keys.filter(key => key.startsWith(CONFIG.STORAGE_PREFIX));
  
  const cutoffDaysAgo = new Date();
  cutoffDaysAgo.setDate(cutoffDaysAgo.getDate() - CONFIG.STORAGE_CLEANUP_DAYS);
  const cutoffDate = cutoffDaysAgo.toISOString().split('T')[0];
  
  gameKeys.forEach(key => {
    // 새로운 형식: kbomantle-YYYY-MM-DD-MODE 또는 기존 형식: kbomantle-YYYY-MM-DD
    const keyParts = key.replace(CONFIG.STORAGE_PREFIX, '');
    const dateStr = keyParts.includes('-2025') || keyParts.includes('-career') 
      ? keyParts.split('-').slice(0, 3).join('-')  // 모드가 있는 경우
      : keyParts;  // 모드가 없는 기존 형식
    
    if (dateStr < cutoffDate) {
      localStorage.removeItem(key);
    }
  });
}