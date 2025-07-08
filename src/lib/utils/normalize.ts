export function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export const TEAM_CODES: Record<string, number> = {
  LG: 1,
  KT: 2,
  SSG: 3,
  한화: 4,
  NC: 5,
  두산: 6,
  KIA: 7,
  롯데: 8,
  삼성: 9,
  키움: 10,
};

export const POSITION_CODES: Record<string, number> = {
  투수: 1,
  포수: 2,
  "1루수": 3,
  "2루수": 4,
  "3루수": 5,
  유격수: 6,
  좌익수: 7,
  중견수: 8,
  우익수: 9,
  지명타자: 10,
};
