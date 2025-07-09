import type { Player } from './vector';

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
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
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
 * 오늘의 게임 상태를 localStorage에서 가져오기
 */
export function getTodayGameState(date?: string): DailyGameState | null {
  const targetDate = date || getTodayDateKST();
  const key = `kbomantle_${targetDate}`;
  
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return null;
    
    const state = JSON.parse(saved) as DailyGameState;
    
    // 날짜가 일치하는지 확인
    if (state.date !== targetDate) {
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
 * 게임 상태를 localStorage에 저장하기
 */
export function saveTodayGameState(state: DailyGameState): void {
  const key = `kbomantle_${state.date}`;
  
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch (error) {
    console.error('게임 상태 저장 실패:', error);
  }
}

/**
 * 새로운 게임 상태 초기화
 */
export function createNewGameState(targetPlayer: Player, date?: string): DailyGameState {
  const targetDate = date || getTodayDateKST();
  
  return {
    date: targetDate,
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
export function isGameCompletedToday(date?: string): boolean {
  const state = getTodayGameState(date);
  return state?.isCompleted || false;
}

/**
 * 내일까지 남은 시간 계산 (한국 시간 기준)
 */
export function getTimeUntilTomorrow(): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
  
  // 한국 시간 기준 내일 00:00:00
  const tomorrow = new Date(kstNow);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  
  // UTC로 변환해서 차이 계산
  const tomorrowUTC = new Date(tomorrow.getTime() - (9 * 60 * 60 * 1000));
  const diff = tomorrowUTC.getTime() - now.getTime();
  
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
  const kbomantleKeys = keys.filter(key => key.startsWith('kbomantle_'));
  
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const cutoffDate = sevenDaysAgo.toISOString().split('T')[0];
  
  kbomantleKeys.forEach(key => {
    const dateStr = key.replace('kbomantle_', '');
    if (dateStr < cutoffDate) {
      localStorage.removeItem(key);
    }
  });
}