import { useRef, useCallback, useEffect } from 'react';

interface FocusManagementOptions {
  autoFocus?: boolean;
  trapFocus?: boolean;
  restoreFocus?: boolean;
}

export const useFocusManagement = (options: FocusManagementOptions = {}) => {
  const {
    autoFocus = true,
    trapFocus = false,
    restoreFocus = true
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // 포커스 가능한 요소들 찾기
  const getFocusableElements = useCallback(() => {
    if (!containerRef.current) return [];
    
    return Array.from(
      containerRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => {
      const element = el as HTMLElement;
      return !element.disabled && element.offsetParent !== null;
    }) as HTMLElement[];
  }, []);

  // 첫 번째 포커스 가능한 요소에 포커스
  const focusFirstElement = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  // 마지막 포커스 가능한 요소에 포커스
  const focusLastElement = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [getFocusableElements]);

  // 다음 요소로 포커스 이동
  const focusNextElement = useCallback(() => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.findIndex(el => el === document.activeElement);
    
    if (currentIndex >= 0 && currentIndex < focusableElements.length - 1) {
      focusableElements[currentIndex + 1].focus();
    } else if (trapFocus && focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements, trapFocus]);

  // 이전 요소로 포커스 이동
  const focusPreviousElement = useCallback(() => {
    const focusableElements = getFocusableElements();
    const currentIndex = focusableElements.findIndex(el => el === document.activeElement);
    
    if (currentIndex > 0) {
      focusableElements[currentIndex - 1].focus();
    } else if (trapFocus && focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [getFocusableElements, trapFocus]);

  // 포커스 트랩 설정
  useEffect(() => {
    if (!trapFocus || !containerRef.current) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements();
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (event.shiftKey) {
          // Shift + Tab: 이전 요소로
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: 다음 요소로
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    const container = containerRef.current;
    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [trapFocus, getFocusableElements]);

  // 자동 포커스 설정
  useEffect(() => {
    if (autoFocus) {
      // 이전 포커스 저장
      if (restoreFocus) {
        previousFocusRef.current = document.activeElement as HTMLElement;
      }
      
      // 첫 번째 요소에 포커스
      setTimeout(() => {
        focusFirstElement();
      }, 100);
    }
  }, [autoFocus, restoreFocus, focusFirstElement]);

  // 컴포넌트 언마운트 시 포커스 복원
  useEffect(() => {
    return () => {
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [restoreFocus]);

  return {
    containerRef,
    focusFirstElement,
    focusLastElement,
    focusNextElement,
    focusPreviousElement,
    getFocusableElements
  };
}; 