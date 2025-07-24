import { useEffect } from 'react';
import { useSidebarNavigation } from '@/contexts/SidebarNavigationContext';

interface KeyboardNavigationOptions {
  onEscape?: () => void;
  onBackspace?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onHome?: () => void;
  enabled?: boolean;
}

export const useKeyboardNavigation = ({
  onEscape,
  onBackspace,
  onArrowLeft,
  onArrowRight,
  onHome,
  enabled = true
}: KeyboardNavigationOptions = {}) => {
  const { goBack, goToRoot, activeLayerIndex } = useSidebarNavigation();

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // 이미 입력 필드에 포커스가 있는 경우 무시
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          if (onEscape) {
            onEscape();
          } else if (activeLayerIndex > 0) {
            goBack();
          }
          break;

        case 'Backspace':
          event.preventDefault();
          if (onBackspace) {
            onBackspace();
          } else if (activeLayerIndex > 0) {
            goBack();
          }
          break;

        case 'ArrowLeft':
          event.preventDefault();
          if (onArrowLeft) {
            onArrowLeft();
          } else if (activeLayerIndex > 0) {
            goBack();
          }
          break;

        case 'ArrowRight':
          event.preventDefault();
          if (onArrowRight) {
            onArrowRight();
          }
          break;

        case 'Home':
          event.preventDefault();
          if (onHome) {
            onHome();
          } else if (activeLayerIndex > 0) {
            goToRoot();
          }
          break;

        // 브라우저 뒤로가기 단축키 (Alt + Left Arrow)
        case 'ArrowLeft':
          if (event.altKey) {
            event.preventDefault();
            if (activeLayerIndex > 0) {
              goBack();
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onEscape, onBackspace, onArrowLeft, onArrowRight, onHome, goBack, goToRoot, activeLayerIndex]);
}; 