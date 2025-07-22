import { useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onBackspace?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  enabled?: boolean;
  preventDefault?: boolean;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const {
    onEscape,
    onBackspace,
    onArrowLeft,
    onArrowRight,
    onArrowUp,
    onArrowDown,
    onEnter,
    onSpace,
    enabled = true,
    preventDefault = true
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const { key, target } = event;
    
    // 입력 필드나 편집 가능한 요소에서는 기본 동작 방지하지 않음
    const isInputElement = target instanceof HTMLInputElement || 
                          target instanceof HTMLTextAreaElement || 
                          target instanceof HTMLSelectElement ||
                          (target as HTMLElement)?.contentEditable === 'true';

    if (isInputElement) return;

    let handled = false;

    switch (key) {
      case 'Escape':
        if (onEscape) {
          onEscape();
          handled = true;
        }
        break;
      
      case 'Backspace':
        if (onBackspace) {
          onBackspace();
          handled = true;
        }
        break;
      
      case 'ArrowLeft':
        if (onArrowLeft) {
          onArrowLeft();
          handled = true;
        }
        break;
      
      case 'ArrowRight':
        if (onArrowRight) {
          onArrowRight();
          handled = true;
        }
        break;
      
      case 'ArrowUp':
        if (onArrowUp) {
          onArrowUp();
          handled = true;
        }
        break;
      
      case 'ArrowDown':
        if (onArrowDown) {
          onArrowDown();
          handled = true;
        }
        break;
      
      case 'Enter':
        if (onEnter) {
          onEnter();
          handled = true;
        }
        break;
      
      case ' ':
        if (onSpace) {
          onSpace();
          handled = true;
        }
        break;
    }

    if (handled && preventDefault) {
      event.preventDefault();
    }
  }, [enabled, preventDefault, onEscape, onBackspace, onArrowLeft, onArrowRight, onArrowUp, onArrowDown, onEnter, onSpace]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);

  return {
    isEnabled: enabled
  };
}; 