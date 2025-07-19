import { normalize, TEAM_CODES } from "./normalize.js";

export interface BasePlayer {
  id: string;
  name: string;
  team: string;
  birth_date: string;
  image_url: string | null;
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
  평균자책점: number;
  경기: number;
  완투: number;
  완봉: number;
  승: number;
  패: number;
  세이브: number;
  홀드: number;
  승률: number;
  이닝: number;
  피안타: number;
  홈런: number;
  볼넷: number;
  고의사구: number;
  삼진: number;
  실점: number;
  자책점: number;
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

  // 🎯 팀 가중치 완전 제거

  // OPS 계산 (출루율 + 장타율)
  const ops = (player.출루율 || 0) + (player.장타율 || 0);

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

  // 🎯 최종 벡터 = 스탯만 (팀 가중치 제거)
  console.log("스탯 벡터 길이:", statVector.length);
  console.log("최종 벡터:", statVector);
  return statVector;
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

  // 🎯 팀 가중치 완전 제거

  // 모드별 정규화 범위 (투수)
  const ranges =
    mode === "2025"
      ? {
          // 2025년 투수 기록 범위
          평균자책점: { min: 1.5, max: 6.0 },
          WHIP: { min: 0.8, max: 2.0 },
          승: { min: 0, max: 20 },
          삼진: { min: 50, max: 250 },
          이닝: { min: 50, max: 250 },
          세이브: { min: 0, max: 30 },
          홀드: { min: 0, max: 25 },
          경기: { min: 10, max: 35 },
          패: { min: 0, max: 15 },
        }
      : {
          // 통산 투수 기록 범위
          평균자책점: { min: 1.5, max: 6.0 },
          WHIP: { min: 0.8, max: 2.0 },
          승: { min: 0, max: 300 },
          삼진: { min: 0, max: 2500 },
          이닝: { min: 0, max: 3000 },
          세이브: { min: 0, max: 400 },
          홀드: { min: 0, max: 200 },
          경기: { min: 0, max: 800 },
          패: { min: 0, max: 200 },
        };

  // 🎯 순수 스탯 벡터 - 투수 특화
  const statVector = [
    // 🔥 핵심 투수 능력 (높은 가중치)
    // ERA는 낮을수록 좋으므로 역정규화 후 높은 가중치
    normalize(
      ranges.평균자책점.max - (player.평균자책점 || 0),
      0,
      ranges.평균자책점.max - ranges.평균자책점.min
    ) * 10, // ERA (역정규화, 최고 가중치)
    normalize(
      ranges.WHIP.max - ((player.볼넷 + player.피안타) / player.이닝 || 0),
      0,
      ranges.WHIP.max - ranges.WHIP.min
    ) * 8, // WHIP (계산: (볼넷+피안타)/이닝, 역정규화, 높은 가중치)
    normalize(player.승 || 0, ranges.승.min, ranges.승.max) * 7, // 승수
    normalize(player.삼진 || 0, ranges.삼진.min, ranges.삼진.max) * 8, // 탈삼진 (높은 가중치)
    normalize(player.이닝 || 0, ranges.이닝.min, ranges.이닝.max) * 7, // 이닝

    // ⚡ 추가 성과 지표
    normalize(player.승률 || 0, 0.2, 0.8) * 6, // 승률
    normalize(player.세이브 || 0, ranges.세이브.min, ranges.세이브.max) * 5, // 세이브 (마무리 투수)
    normalize(player.홀드 || 0, ranges.홀드.min, ranges.홀드.max) * 4, // 홀드 (중간 투수)

    // 💪 피안타 및 실점 관련 (낮을수록 좋음) - 간소화
    normalize(player.피안타 || 0, 200, 0) * 5, // 피안타 (역정규화)
    normalize(player.실점 || 0, 100, 0) * 4, // 실점 (역정규화)
    normalize(player.자책점 || 0, 80, 0) * 4, // 자책점 (역정규화)
    normalize(player.홈런 || 0, 20, 0) * 5, // 피홈런 (역정규화)

    // 🧠 제구력 관련
    normalize(player.볼넷 || 0, 60, 0) * 5, // 볼넷 (역정규화)
    normalize(player.고의사구 || 0, 10, 0) * 3, // 고의사구 (역정규화)

    // 📈 활용도 및 신뢰성
    normalize(player.경기 || 0, ranges.경기.min, ranges.경기.max) * 3, // 출장경기수
    normalize(player.패 || 0, ranges.패.max, ranges.패.min) * 2, // 패전 (역정규화)

    // 🎂 나이 (경험과 전성기)
    normalize(age, 20, 45) * 3, // 나이
  ];

  // 🎯 최종 벡터 = 스탯만 (팀 가중치 제거)
  return statVector;
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
