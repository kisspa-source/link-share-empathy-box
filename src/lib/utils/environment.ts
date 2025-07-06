/**
 * 환경 감지 유틸리티 함수들
 */

/**
 * 로컬 개발 환경인지 확인하는 함수
 * @returns {boolean} 로컬 개발 환경 여부
 */
export const isLocalDevelopment = (): boolean => {
  // 브라우저 환경이 아닌 경우 (SSR 등)
  if (typeof window === 'undefined') {
    return false;
  }

  const hostname = window.location.hostname;
  
  // 로컬 개발 환경 도메인 체크
  return hostname === 'localhost' || 
         hostname === '127.0.0.1' || 
         hostname.startsWith('192.168.') ||
         hostname.startsWith('10.') ||
         hostname.startsWith('172.') ||
         hostname.includes('.local');
};

/**
 * 개발 모드인지 확인하는 함수
 * @returns {boolean} 개발 모드 여부
 */
export const isDevelopmentMode = (): boolean => {
  return import.meta.env.MODE === 'development';
};

/**
 * 테스트 환경인지 확인하는 함수
 * @returns {boolean} 테스트 환경 여부
 */
export const isTestEnvironment = (): boolean => {
  return import.meta.env.MODE === 'test';
};

/**
 * 프로덕션 환경인지 확인하는 함수
 * @returns {boolean} 프로덕션 환경 여부
 */
export const isProductionEnvironment = (): boolean => {
  return import.meta.env.MODE === 'production';
};

/**
 * 테스트 패널을 표시해야 하는지 확인하는 함수
 * 로컬 개발 환경이면서 개발 모드일 때만 표시
 * @returns {boolean} 테스트 패널 표시 여부
 */
export const shouldShowTestPanel = (): boolean => {
  return isLocalDevelopment() && isDevelopmentMode();
};

/**
 * 현재 환경 정보를 반환하는 함수
 * @returns {object} 환경 정보 객체
 */
export const getEnvironmentInfo = () => {
  return {
    mode: import.meta.env.MODE,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    isLocal: isLocalDevelopment(),
    isDev: isDevelopmentMode(),
    isTest: isTestEnvironment(),
    isProd: isProductionEnvironment(),
    showTestPanel: shouldShowTestPanel()
  };
}; 