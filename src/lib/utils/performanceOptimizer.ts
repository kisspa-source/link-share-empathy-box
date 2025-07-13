// 북마크 가져오기 성능 최적화 유틸리티

// 메모리 사용량 모니터링
export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  memoryPressure: 'low' | 'medium' | 'high';
}

// 메모리 정보 가져오기
export const getMemoryInfo = (): MemoryInfo | null => {
  if ('memory' in performance && (performance as any).memory) {
    const memory = (performance as any).memory;
    const usedMB = memory.usedJSHeapSize / (1024 * 1024);
    const totalMB = memory.totalJSHeapSize / (1024 * 1024);
    const limitMB = memory.jsHeapSizeLimit / (1024 * 1024);
    
    // 메모리 압박 수준 계산
    const memoryUsageRatio = usedMB / limitMB;
    let memoryPressure: 'low' | 'medium' | 'high' = 'low';
    
    if (memoryUsageRatio > 0.8) {
      memoryPressure = 'high';
    } else if (memoryUsageRatio > 0.6) {
      memoryPressure = 'medium';
    }
    
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      memoryPressure
    };
  }
  return null;
};

// 적응형 배치 크기 계산
export const calculateOptimalBatchSize = (
  totalItems: number,
  itemComplexity: 'low' | 'medium' | 'high' = 'medium'
): number => {
  const memoryInfo = getMemoryInfo();
  let baseBatchSize = 10;
  
  // 메모리 상태에 따른 배치 크기 조정
  if (memoryInfo) {
    switch (memoryInfo.memoryPressure) {
      case 'high':
        baseBatchSize = 5;
        break;
      case 'medium':
        baseBatchSize = 8;
        break;
      case 'low':
        baseBatchSize = 15;
        break;
    }
  }
  
  // 아이템 복잡도에 따른 조정
  const complexityMultiplier = {
    low: 1.5,
    medium: 1.0,
    high: 0.7
  };
  
  const adjustedBatchSize = Math.floor(baseBatchSize * complexityMultiplier[itemComplexity]);
  
  // 최소 1, 최대 50으로 제한
  return Math.max(1, Math.min(50, adjustedBatchSize));
};

// 메모리 압박 상황에서 가비지 컬렉션 강제 실행
export const forceGarbageCollection = async (): Promise<void> => {
  if ('gc' in window && typeof (window as any).gc === 'function') {
    try {
      (window as any).gc();
    } catch (error) {
      console.warn('가비지 컬렉션 강제 실행 실패:', error);
    }
  }
  
  // 메모리 해제를 위한 짧은 대기
  return new Promise(resolve => setTimeout(resolve, 100));
};

// 큰 객체 처리를 위한 청크 분할
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// 메모리 효율적인 문자열 처리
export const processLargeString = (
  content: string,
  processor: (chunk: string) => void,
  chunkSize: number = 1024 * 1024 // 1MB 청크
): void => {
  for (let i = 0; i < content.length; i += chunkSize) {
    const chunk = content.slice(i, i + chunkSize);
    processor(chunk);
  }
};

// 비동기 배치 처리 최적화
export const processBatchesWithBackpressure = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: {
    initialBatchSize?: number;
    maxConcurrency?: number;
    memoryThreshold?: number;
    onProgress?: (processed: number, total: number) => void;
    onMemoryPressure?: (memoryInfo: MemoryInfo) => void;
  } = {}
): Promise<R[]> => {
  const {
    initialBatchSize = 10,
    maxConcurrency = 5,
    memoryThreshold = 0.8,
    onProgress,
    onMemoryPressure
  } = options;
  
  const results: R[] = [];
  let batchSize = initialBatchSize;
  let processed = 0;
  
  const batches = chunkArray(items, batchSize);
  
  for (const batch of batches) {
    // 메모리 모니터링
    const memoryInfo = getMemoryInfo();
    if (memoryInfo && memoryInfo.memoryPressure === 'high') {
      onMemoryPressure?.(memoryInfo);
      
      // 메모리 압박 시 배치 크기 감소
      batchSize = Math.max(1, Math.floor(batchSize * 0.7));
      
      // 가비지 컬렉션 시도
      await forceGarbageCollection();
    }
    
    // 동시성 제한을 고려한 배치 처리
    const concurrentChunks = chunkArray(batch, maxConcurrency);
    
    for (const chunk of concurrentChunks) {
      const chunkResults = await Promise.all(
        chunk.map(item => processor(item))
      );
      
      results.push(...chunkResults);
      processed += chunk.length;
      
      // 진행률 업데이트
      onProgress?.(processed, items.length);
      
      // 작은 대기 시간 추가 (이벤트 루프 양보)
      await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
  
  return results;
};

// 파일 크기 기반 처리 전략 결정
export const getProcessingStrategy = (fileSizeBytes: number): {
  strategy: 'streaming' | 'batch' | 'immediate';
  batchSize: number;
  shouldUseWorker: boolean;
} => {
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  
  if (fileSizeMB < 1) {
    return {
      strategy: 'immediate',
      batchSize: 50,
      shouldUseWorker: false
    };
  } else if (fileSizeMB < 10) {
    return {
      strategy: 'batch',
      batchSize: calculateOptimalBatchSize(100, 'medium'),
      shouldUseWorker: false
    };
  } else {
    return {
      strategy: 'streaming',
      batchSize: calculateOptimalBatchSize(100, 'high'),
      shouldUseWorker: true
    };
  }
};

// 성능 메트릭 수집
export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage: {
    initial: MemoryInfo | null;
    final: MemoryInfo | null;
    peak: MemoryInfo | null;
  };
  itemsProcessed: number;
  averageItemProcessingTime: number;
  errorCount: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private itemProcessingTimes: number[] = [];
  private peakMemory: MemoryInfo | null = null;
  
  constructor() {
    this.metrics = {
      startTime: performance.now(),
      memoryUsage: {
        initial: getMemoryInfo(),
        final: null,
        peak: null
      },
      itemsProcessed: 0,
      averageItemProcessingTime: 0,
      errorCount: 0
    };
  }
  
  recordItemProcessed(processingTime: number): void {
    this.metrics.itemsProcessed++;
    this.itemProcessingTimes.push(processingTime);
    
    // 평균 처리 시간 계산
    this.metrics.averageItemProcessingTime = 
      this.itemProcessingTimes.reduce((sum, time) => sum + time, 0) / 
      this.itemProcessingTimes.length;
    
    // 메모리 사용량 모니터링
    const currentMemory = getMemoryInfo();
    if (currentMemory && (!this.peakMemory || 
        currentMemory.usedJSHeapSize > this.peakMemory.usedJSHeapSize)) {
      this.peakMemory = currentMemory;
    }
  }
  
  recordError(): void {
    this.metrics.errorCount++;
  }
  
  finish(): PerformanceMetrics {
    this.metrics.endTime = performance.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    this.metrics.memoryUsage.final = getMemoryInfo();
    this.metrics.memoryUsage.peak = this.peakMemory;
    
    return this.metrics;
  }
  
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }
}

// 성능 최적화 추천 사항 생성
export const generateOptimizationRecommendations = (
  metrics: PerformanceMetrics
): string[] => {
  const recommendations: string[] = [];
  
  // 메모리 사용량 분석
  if (metrics.memoryUsage.peak && metrics.memoryUsage.peak.memoryPressure === 'high') {
    recommendations.push('메모리 사용량이 높습니다. 배치 크기를 줄이거나 여러 세션으로 나누어 처리하세요.');
  }
  
  // 처리 시간 분석
  if (metrics.averageItemProcessingTime > 1000) {
    recommendations.push('평균 처리 시간이 깁니다. 네트워크 연결을 확인하거나 배치 크기를 조정하세요.');
  }
  
  // 에러율 분석
  if (metrics.errorCount > 0) {
    const errorRate = (metrics.errorCount / metrics.itemsProcessed) * 100;
    if (errorRate > 5) {
      recommendations.push(`에러율이 ${errorRate.toFixed(1)}%입니다. 데이터 품질을 확인하세요.`);
    }
  }
  
  // 전체 처리 시간 분석
  if (metrics.duration && metrics.duration > 30000) {
    recommendations.push('전체 처리 시간이 깁니다. 배치 크기를 늘리거나 병렬 처리를 고려하세요.');
  }
  
  return recommendations;
}; 