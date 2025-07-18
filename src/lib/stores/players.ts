import { derived } from "svelte/store";
import type { Player, Batter, Pitcher } from "../utils/vector.js";
import { gameMode, type GameMode } from "./game.js";
import hitters2025Data from "../data/hitters-2025.json";
import hittersTotalData from "../data/hitters-total.json";
import pitchersRecordData from "../data/pitchers-record.json";
import pitchersTotalData from "../data/pitchers-total.json";

// 2025 타자 데이터에 type 필드 추가
const batters2025: Batter[] = (hitters2025Data as any[]).map((player) => ({
  ...player,
  type: "batter" as const,
}));

// 전체 타자 데이터에 type 필드 추가
const battersCareer: Batter[] = (hittersTotalData as any[]).map((player) => ({
  ...player,
  type: "batter" as const,
}));

// 2025 투수 데이터에 type 필드 추가
const pitchers2025: Pitcher[] = (pitchersRecordData as any[]).map((player) => ({
  ...player,
  type: "pitcher" as const,
}));

// 통산 투수 데이터에 type 필드 추가
const pitchersCareer: Pitcher[] = (pitchersTotalData as any[]).map(
  (player) => ({
    ...player,
    type: "pitcher" as const,
  })
);

// 2025년 모드 선수 데이터
const players2025: Player[] = [...batters2025, ...pitchers2025];

// 통산 모드 선수 데이터
const playersCareer: Player[] = [...battersCareer, ...pitchersCareer];

// 디버깅용 로그
console.log("=== 선수 데이터 로드 ===");
console.log("2025 타자 수:", batters2025.length);
console.log("2025 투수 수:", pitchers2025.length);
console.log("통산 타자 수:", battersCareer.length);
console.log("통산 투수 수:", pitchersCareer.length);
console.log("2025년 모드 총 선수 수:", players2025.length);
console.log("통산 모드 총 선수 수:", playersCareer.length);

// 현재 게임 모드에 따른 선수 데이터
export const allPlayers = derived(gameMode, ($gameMode) => {
  return $gameMode === "2025" ? players2025 : playersCareer;
});

export function getPlayerById(
  id: string,
  mode: GameMode = "2025"
): Player | undefined {
  const players = mode === "2025" ? players2025 : playersCareer;
  return players.find((p) => p.id === id);
}

export function searchPlayers(
  query: string,
  mode: GameMode = "2025"
): Player[] {
  if (!query.trim()) return [];

  const players = mode === "2025" ? players2025 : playersCareer;
  const searchTerm = query.toLowerCase();
  const results = players.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm) ||
      p.team.toLowerCase().includes(searchTerm)
  );

  return results;
}
