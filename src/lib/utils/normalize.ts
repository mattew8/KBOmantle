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
