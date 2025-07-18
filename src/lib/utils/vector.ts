import { normalize, TEAM_CODES } from "./normalize.js";

export interface BasePlayer {
  id: string;
  name: string;
  team: string;
  birth_date: string;
  image_url: string;
}

export interface Batter extends BasePlayer {
  type: "batter";
  타율: number;
  경기: number;
  타석: number;
  타수: number;
  득점: number;
  안타: number;
  "2루타": number;
  "3루타": number;
  홈런: number;
  루타: number;
  타점: number;
  도루: number;
  도루실패: number;
  볼넷: number;
  사구: number;
  삼진: number;
  병살타: number;
  장타율: number;
  출루율: number;
  실책: number;
}

export interface Pitcher extends BasePlayer {
  type: "pitcher";
  era: number;
  wins: number;
  losses: number;
  saves: number;
  holds: number;
  win_percentage: number;
  innings_pitched: number;
  hits_allowed: number;
  home_runs_allowed: number;
  runs_allowed: number;
  earned_runs: number;
  whip: number;
  throw_hand?: string;
  strikeouts: number;
  walks: number;
  hit_by_pitch: number;
  games: number;
}

export type Player = Batter | Pitcher;

// 타입 가드 함수들
export function isPitcher(player: Player): player is Pitcher {
  return player.type === "pitcher";
}

export function isBatter(player: Player): player is Batter {
  return player.type === "batter";
}

export function getPlayerType(player: Player): "batter" | "pitcher" {
  return player.type;
}

export function createBatterVector(
  player: Batter,
  mode: "2025" | "career" = "2025"
): number[] {
  console.log("=== 타자 벡터 생성 ===");
  console.log("선수:", player.name, player.id);
  console.log("팀:", player.team);
  console.log("타율:", player.타율);
  console.log("홈런:", player.홈런);
  console.log("타점:", player.타점);
  console.log("모드:", mode);

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
  const teamCode = TEAM_CODES[player.team];
  console.log("팀 코드:", teamCode, "팀명:", player.team);
  if (teamCode && teamCode >= 1 && teamCode <= 10) {
    teamOneHot[teamCode - 1] = 4; // 팀 코드를 인덱스로 변환 (1-10 → 0-9)
  }

  // OPS 계산 (출루율 + 장타율) - 안전한 계산
  const ops = (player.출루율 || 0) + (player.장타율 || 0);
  console.log(
    "OPS 계산:",
    ops,
    "출루율:",
    player.출루율,
    "장타율:",
    player.장타율
  );

  // 모드별 정규화 범위
  const ranges =
    mode === "2025"
      ? {
          // 2025년 기록 범위
          avg: { min: 0.22, max: 0.36 },
          slugging: { min: 0.28, max: 0.62 },
          obp: { min: 0.3, max: 0.44 },
          ops: { min: 0.6, max: 1.0 },
          homeRuns: { min: 0, max: 32 },
          doubles: { min: 0, max: 32 },
          triples: { min: 0, max: 8 },
          rbis: { min: 15, max: 95 },
          runs: { min: 10, max: 75 },
          steals: { min: 0, max: 30 },
          walks: { min: 10, max: 60 },
          strikeouts: { min: 20, max: 100 },
          gidp: { min: 0, max: 12 },
          games: { min: 45, max: 95 },
          plateAppearances: { min: 150, max: 450 },
        }
      : {
          // 통산 기록 범위
          avg: { min: 0.2, max: 0.4 },
          slugging: { min: 0.25, max: 0.7 },
          obp: { min: 0.25, max: 0.5 },
          ops: { min: 0.5, max: 1.2 },
          homeRuns: { min: 0, max: 400 },
          doubles: { min: 0, max: 400 },
          triples: { min: 0, max: 80 },
          rbis: { min: 0, max: 1500 },
          runs: { min: 0, max: 1200 },
          steals: { min: 0, max: 300 },
          walks: { min: 0, max: 1000 },
          strikeouts: { min: 0, max: 1500 },
          gidp: { min: 0, max: 200 },
          games: { min: 0, max: 2500 },
          plateAppearances: { min: 0, max: 10000 },
        };

  // 🎯 순수 스탯 벡터 (보너스 없이 자연스러운 유사도)
  const statVector = [
    // 🔥 핵심 타격 능력 (높은 가중치)
    normalize(player.타율 || 0, ranges.avg.min, ranges.avg.max) * 8, // 타율
    normalize(player.장타율 || 0, ranges.slugging.min, ranges.slugging.max) * 7, // 장타율
    normalize(player.출루율 || 0, ranges.obp.min, ranges.obp.max) * 7, // 출루율
    normalize(ops, ranges.ops.min, ranges.ops.max) * 10, // OPS (최고 가중치)

    // ⚡ 파워 지표 (차별화 강화)
    normalize(player.홈런 || 0, ranges.homeRuns.min, ranges.homeRuns.max) * 6, // 홈런
    normalize(player["2루타"] || 0, ranges.doubles.min, ranges.doubles.max) * 3, // 2루타
    normalize(player["3루타"] || 0, ranges.triples.min, ranges.triples.max) * 4, // 3루타 (희귀성)

    // 💪 생산성 지표
    normalize(player.타점 || 0, ranges.rbis.min, ranges.rbis.max) * 5, // 타점
    normalize(player.득점 || 0, ranges.runs.min, ranges.runs.max) * 4, // 득점
    normalize(player.도루 || 0, ranges.steals.min, ranges.steals.max) * 4, // 도루

    // 🧠 선구안 및 컨택 능력
    normalize(player.볼넷 || 0, ranges.walks.min, ranges.walks.max) * 5, // 볼넷
    normalize(player.삼진 || 0, ranges.strikeouts.max, ranges.strikeouts.min) *
      4, // 삼진 (역정규화)

    // 🎨 타구 성향 (스타일 특성화)
    normalize(player.병살타 || 0, ranges.gidp.max, ranges.gidp.min) * 3, // 병살타 (역정규화)

    // 📈 활용도 및 신뢰성
    normalize(player.경기 || 0, ranges.games.min, ranges.games.max) * 3, // 출장경기수
    normalize(
      player.타석 || 0,
      ranges.plateAppearances.min,
      ranges.plateAppearances.max
    ) * 3, // 타석수

    // 🎂 나이 (경험과 전성기)
    normalize(age, 20, 45) * 3, // 나이
  ];

  // 🎯 최종 벡터 = 스탯 + 팀 원핫
  const finalVector = [...statVector, ...teamOneHot];
  console.log("스탯 벡터 길이:", statVector.length);
  console.log("팀 원핫 벡터 길이:", teamOneHot.length);
  console.log("최종 벡터 길이:", finalVector.length);
  console.log("최종 벡터:", finalVector);
  return finalVector;
}

export function createPitcherVector(
  player: Pitcher,
  mode: "2025" | "career" = "2025"
): number[] {
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
  const teamCode = TEAM_CODES[player.team];
  if (teamCode && teamCode >= 1 && teamCode <= 10) {
    teamOneHot[teamCode - 1] = 4; // 팀 코드를 인덱스로 변환 (1-10 → 0-9)
  }

  // 🎯 원핫인코딩 - 포지션 벡터 (투수는 단일 포지션)
  const positionOneHot = new Array(3).fill(0);
  positionOneHot[0] = 5; // 투수 포지션

  // 모드별 정규화 범위 (투수)
  const ranges =
    mode === "2025"
      ? {
          // 2025년 투수 기록 범위
          era: { min: 1.5, max: 6.0 },
          whip: { min: 0.8, max: 2.0 },
          wins: { min: 0, max: 20 },
          strikeouts: { min: 50, max: 250 },
          innings: { min: 50, max: 250 },
          saves: { min: 0, max: 30 },
          holds: { min: 0, max: 25 },
          games: { min: 10, max: 35 },
          losses: { min: 0, max: 15 },
        }
      : {
          // 통산 투수 기록 범위
          era: { min: 1.5, max: 6.0 },
          whip: { min: 0.8, max: 2.0 },
          wins: { min: 0, max: 300 },
          strikeouts: { min: 0, max: 2500 },
          innings: { min: 0, max: 3000 },
          saves: { min: 0, max: 400 },
          holds: { min: 0, max: 200 },
          games: { min: 0, max: 800 },
          losses: { min: 0, max: 200 },
        };

  // 🎯 순수 스탯 벡터 - 투수 특화
  const statVector = [
    // 🔥 핵심 투수 능력 (높은 가중치)
    // ERA는 낮을수록 좋으므로 역정규화 후 높은 가중치
    normalize(
      ranges.era.max - (player.era || 0),
      0,
      ranges.era.max - ranges.era.min
    ) * 10, // ERA (역정규화, 최고 가중치)
    normalize(
      ranges.whip.max - (player.whip || 0),
      0,
      ranges.whip.max - ranges.whip.min
    ) * 8, // WHIP (역정규화, 높은 가중치)
    normalize(player.wins || 0, ranges.wins.min, ranges.wins.max) * 7, // 승수
    normalize(
      player.strikeouts || 0,
      ranges.strikeouts.min,
      ranges.strikeouts.max
    ) * 8, // 탈삼진 (높은 가중치)
    normalize(
      player.innings_pitched || 0,
      ranges.innings.min,
      ranges.innings.max
    ) * 7, // 이닝

    // ⚡ 추가 성과 지표
    normalize(player.win_percentage || 0, 0.2, 0.8) * 6, // 승률
    normalize(player.saves || 0, ranges.saves.min, ranges.saves.max) * 5, // 세이브 (마무리 투수)
    normalize(player.holds || 0, ranges.holds.min, ranges.holds.max) * 4, // 홀드 (중간 투수)

    // 💪 피안타 및 실점 관련 (낮을수록 좋음) - 간소화
    normalize(player.hits_allowed || 0, 200, 0) * 5, // 피안타 (역정규화)
    normalize(player.runs_allowed || 0, 100, 0) * 4, // 실점 (역정규화)
    normalize(player.earned_runs || 0, 80, 0) * 4, // 자책점 (역정규화)
    normalize(player.home_runs_allowed || 0, 20, 0) * 5, // 피홈런 (역정규화)

    // 🧠 제구력 관련
    normalize(player.walks || 0, 60, 0) * 5, // 볼넷 (역정규화)
    normalize(player.hit_by_pitch || 0, 10, 0) * 3, // 몸에 맞는 볼 (역정규화)

    // 📈 활용도 및 신뢰성
    normalize(player.games || 0, ranges.games.min, ranges.games.max) * 3, // 출장경기수
    normalize(player.losses || 0, ranges.losses.max, ranges.losses.min) * 2, // 패전 (역정규화)

    // 🎂 나이 (경험과 전성기)
    normalize(age, 20, 45) * 3, // 나이
  ];

  // 🎯 최종 벡터 = 스탯 + 팀 원핫 + 포지션 원핫
  return [...statVector, ...teamOneHot, ...positionOneHot];
}

export function playerToVector(
  player: Player,
  mode: "2025" | "career" = "2025"
): number[] {
  if (isPitcher(player)) {
    return createPitcherVector(player, mode);
  } else {
    return createBatterVector(player, mode);
  }
}
