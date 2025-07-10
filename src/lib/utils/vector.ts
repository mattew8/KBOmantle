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

  // 🎯 원핫인코딩 - 팀 벡터 (10개 팀) - 포케맨틀 스타일 가중치
  const teamOneHot = new Array(10).fill(0);
  const teamIndex = Object.keys(TEAM_CODES).indexOf(player.team);
  if (teamIndex !== -1) teamOneHot[teamIndex] = 4; // 팀 일치시 중간 유사도 기여

  // 🎯 원핫인코딩 - 포지션 벡터 (3개 포지션) - 포케맨틀 스타일 가중치
  const positionOneHot = new Array(3).fill(0);
  if (player.position.includes("포수")) positionOneHot[0] = 5; // 포지션 일치시 중간 유사도 기여
  else if (player.position.includes("내야수")) positionOneHot[1] = 5;
  else if (player.position.includes("외야수")) positionOneHot[2] = 5;

  // 🎯 순수 스탯 벡터 (보너스 없이 자연스러운 유사도)
  const statVector = [
    // 🔥 핵심 타격 능력 (높은 가중치)
    normalize(player.avg, 0.22, 0.36) * 8, // 타율 (가중치 증가)
    normalize(player.slugging_percentage || 0, 0.28, 0.62) * 7, // 장타율
    normalize(player.on_base_percentage || 0, 0.30, 0.44) * 7, // 출루율
    normalize(player.ops || 0, 0.60, 1.00) * 10, // OPS (최고 가중치)

    // ⚡ 파워 지표 (차별화 강화)
    normalize(player.home_runs, 0, 32) * 6, // 홈런 (가중치 증가)
    normalize(player.isolated_power, 0, 0.32) * 6, // ISO
    normalize(player.extra_base_hits, 0, 50) * 4, // 장타수
    normalize(player.doubles, 0, 32) * 3, // 2루타
    normalize(player.triples, 0, 8) * 4, // 3루타 (희귀성)

    // 💪 생산성 지표
    normalize(player.rbis, 15, 95) * 5, // 타점
    normalize(player.runs, 10, 75) * 4, // 득점
    normalize(player.game_winning_rbi, 0, 15) * 4, // 결승타

    // 🧠 선구안 및 컨택 능력
    normalize(player.walks, 10, 60) * 5, // 볼넷
    normalize(player.strikeouts, 100, 20) * 4, // 삼진 (역정규화)
    normalize(player.bb_k_ratio, 0.2, 1.4) * 6, // BB/K 비율
    normalize(player.pitches_per_pa, 3.0, 5.0) * 3, // 구당 타석수

    // 🎯 클러치 능력
    normalize(player.risp_avg || 0, 0.18, 0.45) * 5, // 득점권 타율
    normalize(player.multi_hits, 0, 45) * 4, // 멀티히트

    // 🎨 타구 성향 (스타일 특성화)
    normalize(player.go_ao_ratio, 0.4, 3.5) * 4, // GO/AO 비율
    normalize(player.ground_into_double_play, 12, 0) * 3, // 병살타

    // 📈 활용도 및 신뢰성
    normalize(player.games, 45, 95) * 3, // 출장경기수
    normalize(player.plate_appearances, 150, 450) * 3, // 타석수

    // 🔬 고급 지표
    normalize(player.gpa, 0.20, 0.35) * 5, // GPA
    normalize(player.extra_runs, 15, 75) * 4, // Extra Runs

    // 🎂 나이 (경험과 전성기)
    normalize(age, 20, 45) * 3, // 나이
  ];

  // 🎯 최종 벡터 = 스탯 + 팀 원핫 + 포지션 원핫
  return [...statVector, ...teamOneHot, ...positionOneHot];
}

// 현재 데이터가 타자 전용이므로 투수 벡터는 임시로 빈 배열 반환
export function createPitcherVector(player: Player): number[] {
  return [];
}

export function playerToVector(player: Player): number[] {
  // 현재 데이터가 타자 전용이므로 모든 선수를 타자로 처리
  return createBatterVector(player);
}
