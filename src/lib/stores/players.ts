import { writable } from 'svelte/store';
import type { Player, Batter, Pitcher } from '../utils/vector.js';
import battersData from '../data/players.json';
import pitchersData from '../data/pitchers-record.json';

// 타자 데이터에 type 필드 추가 (누락된 필드 기본값 설정)
const batters: Batter[] = (battersData as any[]).map(player => ({
  ...player,
  type: 'batter' as const,
  // 일부 타자 데이터에 없을 수 있는 필드들 기본값 설정
  walks: player.walks || 0,
  strikeouts: player.strikeouts || 0,
  games: player.games || 0,
  hit_by_pitch: player.hit_by_pitch || 0
}));

// 투수 데이터에 type 필드 추가 (누락된 필드 기본값 설정)
const pitchers: Pitcher[] = (pitchersData as any[]).map(player => ({
  ...player,
  type: 'pitcher' as const,
  // 일부 투수 데이터에 없을 수 있는 필드들 기본값 설정
  walks: player.walks || 0,
  strikeouts: player.strikeouts || 0,
  games: player.games || 0,
  hit_by_pitch: player.hit_by_pitch || 0
}));

// 통합 선수 데이터
const unifiedPlayers: Player[] = [...batters, ...pitchers];

// 디버깅용 로그
console.log('=== 선수 데이터 로드 ===');
console.log('타자 수:', batters.length);
console.log('투수 수:', pitchers.length);
console.log('총 선수 수:', unifiedPlayers.length);
console.log('첫 번째 타자:', batters[0]?.name, batters[0]?.type);
console.log('첫 번째 투수:', pitchers[0]?.name, pitchers[0]?.type);

export const allPlayers = writable<Player[]>(unifiedPlayers);

export function getPlayerById(id: string): Player | undefined {
  return unifiedPlayers.find(p => p.id === id);
}

export function searchPlayers(query: string): Player[] {
  if (!query.trim()) return [];
  
  const searchTerm = query.toLowerCase();
  const results = unifiedPlayers.filter(p =>
    p.name.toLowerCase().includes(searchTerm) ||
    p.team.toLowerCase().includes(searchTerm)
  );
  
  console.log(`검색어 "${query}" 결과:`, results.length, '명');
  console.log('검색 결과:', results.map(p => `${p.name} (${p.type})`));
  
  return results;
}