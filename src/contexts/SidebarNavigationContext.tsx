import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Folder } from '@/types/bookmark';

// 사이드바 탐색 상태 인터페이스
interface SidebarNavigationState {
  // 현재 탐색 경로 (폴더 ID 배열)
  navigationPath: string[];
  // 방문한 폴더들의 히스토리
  navigationHistory: string[][];
  // 현재 표시할 Frame 단계 (0: 루트, 1: 폴더, 2: 북마크)
  currentFrame: number;
  // 애니메이션 진행 상태
  isAnimating: boolean;
  // 모바일 사이드바 상태
  isMobileOpen: boolean;
}

// 사이드바 탐색 액션 인터페이스
interface SidebarNavigationActions {
  // 폴더로 이동
  navigateToFolder: (folderId: string) => void;
  // 이전 단계로 복귀
  goBack: () => void;
  // 루트로 복귀
  goToRoot: () => void;
  // 특정 경로로 이동
  navigateToPath: (path: string[]) => void;
  // 모바일 사이드바 토글
  toggleMobile: () => void;
  // 모바일 사이드바 닫기
  closeMobile: () => void;
  // 애니메이션 상태 설정
  setAnimating: (isAnimating: boolean) => void;
}

// 컨텍스트 타입
type SidebarNavigationContextType = SidebarNavigationState & SidebarNavigationActions;

// 컨텍스트 생성
const SidebarNavigationContext = createContext<SidebarNavigationContextType | undefined>(undefined);

// 프로바이더 컴포넌트
export const SidebarNavigationProvider = ({ children }: { children: ReactNode }) => {
  const [navigationPath, setNavigationPath] = useState<string[]>([]);
  const [navigationHistory, setNavigationHistory] = useState<string[][]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // 폴더로 이동
  const navigateToFolder = useCallback((folderId: string) => {
    setNavigationPath(prev => {
      const newPath = [...prev, folderId];
      setNavigationHistory(history => [...history, prev]);
      setCurrentFrame(newPath.length);
      return newPath;
    });
  }, []);

  // 이전 단계로 복귀
  const goBack = useCallback(() => {
    if (navigationPath.length > 0) {
      setNavigationHistory(history => {
        const newHistory = [...history];
        const previousPath = newHistory.pop();
        
        if (previousPath) {
          // 히스토리에서 이전 경로 복원
          setNavigationPath(previousPath);
          setCurrentFrame(previousPath.length);
        } else {
          // 히스토리가 없으면 한 단계 뒤로
          const newPath = navigationPath.slice(0, -1);
          setNavigationPath(newPath);
          setCurrentFrame(newPath.length);
        }
        
        return newHistory;
      });
    }
  }, [navigationPath]);

  // 루트로 복귀
  const goToRoot = useCallback(() => {
    setNavigationPath([]);
    setNavigationHistory([]);
    setCurrentFrame(0);
  }, []);

  // 특정 경로로 이동
  const navigateToPath = useCallback((path: string[]) => {
    setNavigationPath(path);
    setCurrentFrame(path.length);
  }, []);

  // 모바일 사이드바 토글
  const toggleMobile = useCallback(() => {
    setIsMobileOpen(prev => !prev);
  }, []);

  // 모바일 사이드바 닫기
  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  // 애니메이션 상태 설정
  const setAnimating = useCallback((animating: boolean) => {
    setIsAnimating(animating);
  }, []);

  const value: SidebarNavigationContextType = {
    // 상태
    navigationPath,
    navigationHistory,
    currentFrame,
    isAnimating,
    isMobileOpen,
    
    // 액션
    navigateToFolder,
    goBack,
    goToRoot,
    navigateToPath,
    toggleMobile,
    closeMobile,
    setAnimating,
  };

  return (
    <SidebarNavigationContext.Provider value={value}>
      {children}
    </SidebarNavigationContext.Provider>
  );
};

// 훅
export const useSidebarNavigation = () => {
  const context = useContext(SidebarNavigationContext);
  if (context === undefined) {
    throw new Error('useSidebarNavigation must be used within a SidebarNavigationProvider');
  }
  return context;
}; 