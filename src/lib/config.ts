/**
 * 앱 설정 상수들
 */
export const CONFIG = {
  // 사이트 정보
  SITE_NAME: 'KBOmantle',
  SITE_URL: 'https://kbomantle.com',
  SITE_DESCRIPTION: '벡터 기반 KBO 선수 유사도 게임',
  
  // 소셜 정보
  TWITTER_HANDLE: '@kbomantle',
  
  // 게임 설정
  GAME_NAME: 'KBOmantle',
  GAME_HASHTAGS: ['#KBOmantle', '#KBO', '#야구게임'],
  
  // 로컬 스토리지 설정
  STORAGE_PREFIX: 'kbomantle_',
  STORAGE_CLEANUP_DAYS: 7,
  
  // 시간대 설정
  TIMEZONE_OFFSET: 9, // 한국 시간 (UTC+9)
} as const;

/**
 * 환경별 설정
 */
export const getEnvironmentConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    isDevelopment,
    isProduction,
    baseUrl: isDevelopment ? 'http://localhost:5173' : CONFIG.SITE_URL,
    enableDebug: isDevelopment,
  };
};

/**
 * 공유 텍스트 생성
 */
export const generateShareText = (attempts: number, playerName: string, isWon: boolean) => {
  const date = new Date().toLocaleDateString('ko-KR');
  const baseText = `${CONFIG.GAME_NAME} ${date} ${attempts}/∞\n\n`;
  
  if (isWon) {
    return `${baseText}${attempts}번 만에 ${playerName}를 맞췄습니다! 🎉\n\n${CONFIG.GAME_HASHTAGS.join(' ')}\n\n${CONFIG.SITE_URL}`;
  } else {
    return `${baseText}현재 ${attempts}번째 시도! 🎯\n\n${CONFIG.GAME_HASHTAGS.join(' ')}\n\n${CONFIG.SITE_URL}`;
  }
};