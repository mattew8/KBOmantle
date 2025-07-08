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

  // 매우 차별화된 벡터 구성 - 각 차원을 극단적으로 분리
  return [
    // 핵심 타격 능력 (큰 가중치)
    Math.pow(normalize(player.avg, 0.2, 0.35), 2) * 5, // 타율 제곱 (차이 극대화)
    Math.pow(normalize(player.isolated_power, 0, 0.35), 2) * 4, // ISO 제곱 (파워 차이 극대화)
    Math.pow(normalize(player.gpa, 0.2, 0.35), 2) * 4, // GPA 제곱 (종합 능력)

    // 파워 지표 (중간 가중치)
    normalize(player.home_runs, 0, 30) * 3, // 홈런
    normalize(player.extra_base_hits, 0, 45) * 2, // 장타수

    // 생산성 지표
    normalize(player.rbis, 0, 100) * 2, // 타점
    normalize(player.runs, 0, 70) * 2, // 득점
    normalize(player.game_winning_rbi, 0, 12), // 결승타

    // 선구안 및 접촉 능력
    Math.pow(normalize(player.bb_k_ratio, 0, 2), 1.5) * 3, // 볼넷/삼진 비율 (1.5승)
    normalize(player.pitches_per_pa, 3, 5) * 2, // 구당 타석수

    // 타구 성향 (차별화 요소)
    Math.abs(normalize(player.go_ao_ratio, 0.4, 3.5) - 0.5) * 4, // GO/AO 비율 (중간값에서 거리)

    // 포지션 (같은 포지션끼리 유사도 높게)
    normalize(positionCode, 1, 3) * 2, // 포지션 (가중치 2배)

    // 나이 (비슷한 연령대끼리 유사도 높게)
    normalize(age, 20, 45) * 1.5, // 나이 (가중치 1.5배)

    // 팀 (작은 가중치)
    normalize(teamCode, 1, 10) * 0.3, // 팀
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
