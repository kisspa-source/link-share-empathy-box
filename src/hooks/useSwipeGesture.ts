import { useEffect, useRef, useCallback } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // 최소 스와이프 거리 (px)
  velocity?: number; // 최소 스와이프 속도 (px/ms)
  preventDefault?: boolean; // 기본 동작 방지 여부
}

interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export const useSwipeGesture = (
  elementRef: React.RefObject<HTMLElement>,
  options: SwipeGestureOptions = {}
) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    velocity = 0.3,
    preventDefault = true
  } = options;

  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);
  const isSwiping = useRef(false);

  // 터치 시작 핸들러
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventDefault) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    touchEnd.current = null;
    isSwiping.current = false;
  }, [preventDefault]);

  // 터치 이동 핸들러
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return;
    
    const touch = e.touches[0];
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    
    // 스와이프 중임을 표시
    isSwiping.current = true;
  }, []);

  // 터치 종료 핸들러
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart.current || !touchEnd.current) return;
    
    const start = touchStart.current;
    const end = touchEnd.current;
    
    // 스와이프 거리 계산
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // 스와이프 시간 계산
    const duration = end.timestamp - start.timestamp;
    const swipeVelocity = distance / duration;
    
    // 임계값과 속도 확인
    if (distance >= threshold && swipeVelocity >= velocity) {
      // 주 방향 결정 (수평 또는 수직)
      const isHorizontal = Math.abs(deltaX) > Math.abs(deltaY);
      
      if (isHorizontal) {
        // 수평 스와이프
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      } else {
        // 수직 스와이프
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }
    
    // 상태 초기화
    touchStart.current = null;
    touchEnd.current = null;
    isSwiping.current = false;
  }, [threshold, velocity, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  // 이벤트 리스너 등록
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // 터치 이벤트 리스너 등록
    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]);

  // 현재 스와이프 상태 반환
  const getSwipeState = useCallback(() => ({
    isSwiping: isSwiping.current,
    touchStart: touchStart.current,
    touchEnd: touchEnd.current
  }), []);

  return {
    getSwipeState,
    isSwiping: isSwiping.current
  };
}; 