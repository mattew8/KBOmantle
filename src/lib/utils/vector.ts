import { normalize, TEAM_CODES } from "./normalize.js";

export interface Player {
  id: string;
  player_id: string;
  rank: number;
  name: string;
  team: string;
  avg: number;
  games: number;
  plate_appearances: number;
  at_bats: number;
  runs: number;
  hits: number;
  doubles: number;
  triples: number;
  home_runs: number;
  total_bases: number;
  rbis: number;
  sacrifice_bunts: number;
  sacrifice_flies: number;
  walks: number;
  intentional_walks: number;
  hit_by_pitch: number;
  strikeouts: number;
  ground_into_double_play: number;
  slugging_percentage: number;
  on_base_percentage: number;
  ops: number;
  multi_hits: number;
  risp_avg: number;
  pinch_hit_avg: number;
  extra_base_hits: number;
  ground_outs: number;
  air_outs: number;
  go_ao_ratio: number;
  game_winning_rbi: number;
  bb_k_ratio: number;
  pitches_per_pa: number;
  isolated_power: number;
  extra_runs: number;
  gpa: number;
  position: string;
  birth_date: string;
  height_weight: string;
  image_url: string;
}

export interface BatterStats {
  avg: number;
  hr: number;
  rbi: number;
  sb: number;
  ops: number;
}

export interface PitcherStats {
  era: number;
  wins: number;
  strikeouts: number;
  innings: number;
  whip: number;
}

export function createBatterVector(player: Player): number[] {
  const teamCode = TEAM_CODES[player.team] || 1;

  // 포지션 코드 추출 (내야수=1, 외야수=2, 포수=3)
  const getPositionCode = (position: string): number => {
    if (position.includes("포수")) return 3;
    if (position.includes("내야수")) return 1;
    if (position.includes("외야수")) return 2;
    return 1; // 기본값
  };
  const positionCode = getPositionCode(player.position);

  // 나이 계산 (생년월일 → 나이)
  const calculateAge = (birthDate: string): number => {
    const match = birthDate.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
    if (!match) return 25; // 기본값

    const [, year, month, day] = match;
    const birth = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();

    if (
      today.getMonth() < birth.getMonth() ||
      (today.getMonth() === birth.getMonth() &&
        today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
  };
  const age = calculateAge(player.birth_date);

  // 순수 스탯 기반 벡터 구성 (팀/포지션은 보너스로 별도 처리)
  return [
    // 핵심 타격 능력 (높은 가중치)
    normalize(player.avg, 0.2, 0.35) * 4, // 타율
    normalize(player.slugging_percentage || 0, 0.3, 0.65) * 4, // 장타율
    normalize(player.on_base_percentage || 0, 0.3, 0.45) * 4, // 출루율
    normalize(player.ops || 0, 0.6, 1.1) * 5, // OPS (가장 중요한 지표)

    // 파워 지표
    normalize(player.home_runs, 0, 30) * 3, // 홈런
    normalize(player.isolated_power, 0, 0.35) * 3, // ISO
    normalize(player.extra_base_hits, 0, 45) * 2, // 장타수
    normalize(player.doubles, 0, 30) * 1.5, // 2루타

    // 생산성 지표
    normalize(player.rbis, 0, 100) * 2.5, // 타점
    normalize(player.runs, 0, 70) * 2.5, // 득점
    normalize(player.game_winning_rbi, 0, 12) * 1.5, // 결승타

    // 선구안 및 컨택 능력
    normalize(player.walks, 0, 60) * 3, // 볼넷
    normalize(player.strikeouts, 90, 0) * 2, // 삼진 (역정규화)
    normalize(player.bb_k_ratio, 0, 2) * 3, // BB/K 비율
    normalize(player.pitches_per_pa, 3, 5) * 2, // 구당 타석수

    // 클러치 능력
    normalize(player.risp_avg || 0, 0.2, 0.5) * 3, // 득점권 타율
    normalize(player.multi_hits, 0, 40) * 2, // 멀티히트

    // 타구 성향 및 스타일
    normalize(player.go_ao_ratio, 0.4, 3.5) * 2, // GO/AO 비율
    normalize(player.ground_into_double_play, 10, 0) * 1.5, // 병살타 (역정규화)

    // 출장 및 활용도
    normalize(player.games, 50, 90) * 1.5, // 출장경기수
    normalize(player.plate_appearances, 200, 400) * 1.5, // 타석수

    // 고급 지표
    normalize(player.gpa, 0.2, 0.35) * 3, // GPA
    normalize(player.extra_runs, 20, 70) * 2, // Extra Runs

    // 나이 (팀/포지션은 보너스로 별도 처리)
    normalize(age, 20, 45) * 1.5, // 나이
  ];
}

// 현재 데이터가 타자 전용이므로 투수 벡터는 임시로 빈 배열 반환
export function createPitcherVector(player: Player): number[] {
  return [];
}

export function playerToVector(player: Player): number[] {
  // 현재 데이터가 타자 전용이므로 모든 선수를 타자로 처리
  return createBatterVector(player);
}
