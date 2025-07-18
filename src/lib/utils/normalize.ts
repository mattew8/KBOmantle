export function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

export const TEAM_CODES: Record<string, number> = {
  'LG 트윈스': 1,
  'KT 위즈': 2,
  'SSG 랜더스': 3,
  '한화 이글스': 4,
  'NC 다이노스': 5,
  '두산 베어스': 6,
  'KIA 타이거즈': 7,
  '롯데 자이언츠': 8,
  '삼성 라이온즈': 9,
  '키움 히어로즈': 10,
  // 구버전 호환성 유지
  'LG': 1,
  'KT': 2,
  'SSG': 3,
  '한화': 4,
  'NC': 5,
  '두산': 6,
  'KIA': 7,
  '롯데': 8,
  '삼성': 9,
  '키움': 10,
};
