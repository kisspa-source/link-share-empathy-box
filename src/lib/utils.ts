import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";
import { PostgrestBuilder } from "@supabase/postgrest-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 간단한 메모리 캐시 (개발용)
const requestCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30초

// 캐시 키 생성 함수
function getCacheKey(promise: any): string {
  if (promise && typeof promise.eq === 'function') {
    // Supabase query builder인 경우 대략적인 키 생성
    return `supabase_${promise.constructor.name}_${Date.now().toString(36)}`;
  }
  return `request_${Date.now().toString(36)}`;
}

// Fetch helper with timeout support and basic caching
export async function fetchWithTimeout<T>(
  promise: Promise<T> | PostgrestBuilder<any, any>,
  timeoutMs: number,
  enableCache: boolean = false
): Promise<T | null> {
  const cacheKey = enableCache ? getCacheKey(promise) : '';
  
  // 캐시 확인 (활성화된 경우)
  if (enableCache && cacheKey) {
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[fetchWithTimeout] 캐시에서 데이터 반환: ${cacheKey}`);
      return cached.data;
    }
  }

  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    console.log(`[fetchWithTimeout] 요청 시작 (타임아웃: ${timeoutMs}ms)`);
    const startTime = performance.now();
    
    const result = await Promise.race([promise, timeoutPromise]);
    
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    console.log(`[fetchWithTimeout] 요청 완료 (소요시간: ${duration}ms)`);
    
    // 성공한 결과를 캐시에 저장 (활성화된 경우)
    if (enableCache && cacheKey && result) {
      requestCache.set(cacheKey, { data: result, timestamp: Date.now() });
      
      // 캐시 크기 제한 (최대 50개 항목)
      if (requestCache.size > 50) {
        const firstKey = requestCache.keys().next().value;
        requestCache.delete(firstKey);
      }
    }
    
    return result as T;
  } catch (error: any) {
    if (error.message && error.message.includes("timed out")) {
      console.warn(`[fetchWithTimeout] 타임아웃 발생 (${timeoutMs}ms), null 반환`);
      // 타임아웃 에러는 null 반환 (기존 동작 유지)
      return null;
    }
    
    // 네트워크 에러나 서버 에러의 경우 상세 정보 로깅
    if (error.code || error.status) {
      console.error(`[fetchWithTimeout] 서버 오류 발생:`, {
        code: error.code,
        status: error.status,
        message: error.message,
        details: error.details
      });
    } else {
      console.error("[fetchWithTimeout] 네트워크 오류:", error);
    }
    
    // 실제 에러는 다시 throw (호출자가 처리)
    throw error;
  }
}

// 캐시 클리어 함수 (필요시 사용)
export function clearRequestCache() {
  requestCache.clear();
  console.log('[utils] 요청 캐시가 클리어되었습니다.');
}

// Unified error handler
export function handleError(error: unknown, context = "") {
  console.error(`Error in ${context}:`, error);
  
  let message = "알 수 없는 오류가 발생했습니다.";
  
  // 에러 타입별로 더 구체적인 메시지 제공
  if (typeof error === "string") {
    message = error;
  } else if (error && typeof error === "object") {
    const errorObj = error as any;
    
    // Supabase 에러 처리
    if (errorObj.code) {
      switch (errorObj.code) {
        case 'PGRST116':
          message = "데이터를 찾을 수 없습니다.";
          break;
        case 'PGRST301':
          message = "접근 권한이 없습니다.";
          break;
        case '23505':
          message = "이미 존재하는 데이터입니다.";
          break;
        default:
          message = errorObj.message || errorObj.error_description || errorObj.error || message;
      }
    } else {
      message = errorObj.message || errorObj.error_description || errorObj.error || message;
    }
  }
  
  // 개발 환경에서만 상세 에러 정보 표시
  if (import.meta.env.DEV && context) {
    console.group(`🚨 Error in ${context}`);
    console.error('Error object:', error);
    console.error('Processed message:', message);
    console.groupEnd();
  }
  
  toast.error(message);
  return { error, message };
}

// 성능 모니터링
const performanceMetrics = {
  authLoadTime: 0,
  dataLoadTime: 0,
  requestCount: 0,
  cacheHits: 0,
  timeouts: 0
};

// 성능 측정 시작
export function startPerformanceTimer(label: string): () => number {
  const startTime = performance.now();
  console.log(`[Performance] ⏱️ ${label} 시작`);
  
  return () => {
    const duration = Math.round(performance.now() - startTime);
    console.log(`[Performance] ✅ ${label} 완료 (${duration}ms)`);
    return duration;
  };
}

// 성능 메트릭 업데이트
export function updatePerformanceMetric(metric: keyof typeof performanceMetrics, value: number) {
  performanceMetrics[metric] = value;
}

// 성능 리포트 출력
export function getPerformanceReport() {
  console.group('📊 성능 보고서');
  console.log('인증 로딩 시간:', performanceMetrics.authLoadTime, 'ms');
  console.log('데이터 로딩 시간:', performanceMetrics.dataLoadTime, 'ms');
  console.log('총 요청 횟수:', performanceMetrics.requestCount);
  console.log('캐시 히트:', performanceMetrics.cacheHits);
  console.log('타임아웃 발생:', performanceMetrics.timeouts);
  console.groupEnd();
  return performanceMetrics;
}

// 도메인 관련 유틸리티 함수
export function getShareDomain(): string {
  return import.meta.env.VITE_SHARE_DOMAIN || 'linkbox.co.kr';
}

export function generateShareUrl(collectionId: string): string {
  return `${getShareDomain()}/c/${collectionId}`;
}
