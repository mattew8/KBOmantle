// 팀별 색상 매핑 (KBO 공식 팀 색상)
export const TEAM_COLORS: Record<string, string> = {
  '키움': '#570514',     // 키움 히어로즈 - 다크 레드
  '두산': '#1A1748',     // 두산 베어스 - 다크 네이비
  '롯데': '#041E42',     // 롯데 자이언츠 - 네이비
  '삼성': '#074CA1',     // 삼성 라이온즈 - 블루
  '한화': '#FC4E00',     // 한화 이글스 - 오렌지
  'KIA': '#EA0029',      // KIA 타이거즈 - 레드
  'LG': '#C30452',       // LG 트윈스 - 마젠타
  'SSG': '#CE0E2D',      // SSG 랜더스 - 레드
  'NC': '#315288',       // NC 다이노스 - 블루
  'KT': '#000000'        // KT 위즈 - 블랙
};

// 팀 색상을 가져오는 헬퍼 함수
export function getTeamColor(teamName: string): string {
  return TEAM_COLORS[teamName] || '#666666'; // 기본값: 회색
}

// 팀 색상 목록을 반환하는 함수 (범례 등에 사용)
export function getTeamColorEntries(): Array<{ team: string; color: string }> {
  return Object.entries(TEAM_COLORS).map(([team, color]) => ({
    team,
    color
  }));
}