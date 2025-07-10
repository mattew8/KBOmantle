/**
 * 앱 설정 상수들
 */
export const CONFIG = {
  // 사이트 정보
  SITE_NAME: "KBOmantle",
  SITE_URL: "https://kbomantle.vercel.app/",
  SITE_DESCRIPTION:
    "크보맨틀(KBOmantle) - 오늘의 KBO 야구 선수를 맞춰보세요! 선수 이름을 입력하면 정답과 얼마나 비슷한지 알려줍니다.",

  // 소셜 정보
  TWITTER_HANDLE: "@kbomantle",

  // 게임 설정
  GAME_NAME: "KBOmantle",
  GAME_HASHTAGS: ["#KBOmantle", "#크보맨틀", "#KBO", "#야구", "#야구게임"],

  // 로컬 스토리지 설정
  STORAGE_PREFIX: "kbomantle_",
  STORAGE_CLEANUP_DAYS: 7,

  // 시간대 설정
  TIMEZONE_OFFSET: 9, // 한국 시간 (UTC+9)
} as const;

/**
 * 공유 텍스트 생성
 */
export const generateShareText = (
  attempts: number,
  playerName: string,
  isWon: boolean
) => {
  const date = new Date().toLocaleDateString("ko-KR");
  const baseText = `${CONFIG.GAME_NAME} ${date}\n\n`;

  if (isWon) {
    return `${baseText}${attempts}번 만에 ${playerName}를 맞췄습니다! 🎉\n\n${CONFIG.GAME_HASHTAGS.join(
      " "
    )}\n\n${CONFIG.SITE_URL}`;
  } else {
    return `${baseText}현재 ${attempts}번째 시도! 🎯\n\n${CONFIG.GAME_HASHTAGS.join(
      " "
    )}\n\n${CONFIG.SITE_URL}`;
  }
};
