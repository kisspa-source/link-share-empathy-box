import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import type { Folder } from '@/types/bookmark';

// 레이어 정보 인터페이스
interface NavigationLayer {
  id: string;
  folderId: string | null; // null은 루트 레벨
  title: string;
  folders: Folder[];
  timestamp: number;
}

// 사이드바 탐색 상태 인터페이스
interface SidebarNavigationState {
  // 레이어 스택 (가장 아래가 루트, 위로 쌓임)
  layerStack: NavigationLayer[];
  // 현재 활성 레이어 인덱스
  activeLayerIndex: number;
  // 애니메이션 진행 상태
  isAnimating: boolean;
  // 애니메이션 방향 ('forward' | 'backward')
  animationDirection: 'forward' | 'backward';
  // 모바일 사이드바 상태
  isMobileOpen: boolean;
}

// 사이드바 탐색 액션 인터페이스
interface SidebarNavigationActions {
  // 폴더로 이동 (새 레이어 추가)
  navigateToFolder: (folderId: string, folder: Folder, childFolders: Folder[]) => void;
  // 이전 레이어로 복귀
  goBack: () => void;
  // 루트로 복귀 (모든 레이어 제거)
  goToRoot: () => void;
  // 특정 레이어로 이동
  navigateToLayer: (layerIndex: number) => void;
  // 모바일 사이드바 토글
  toggleMobile: () => void;
  // 모바일 사이드바 닫기
  closeMobile: () => void;
  // 애니메이션 상태 설정
  setAnimating: (isAnimating: boolean) => void;
  // 애니메이션 방향 설정
  setAnimationDirection: (direction: 'forward' | 'backward') => void;
  // 레이어 데이터 업데이트 (폴더 구조 변경 시)
  updateLayerData: (folderId: string | null, newFolders: Folder[]) => void;
  // 루트 레이어 데이터 업데이트
  updateRootLayer: (folders: Folder[]) => void;
}

// 컨텍스트 타입
type SidebarNavigationContextType = SidebarNavigationState & SidebarNavigationActions;

// 컨텍스트 생성
const SidebarNavigationContext = createContext<SidebarNavigationContextType | undefined>(undefined);

// 프로바이더 컴포넌트
export const SidebarNavigationProvider = ({ children }: { children: ReactNode }) => {
  const [layerStack, setLayerStack] = useState<NavigationLayer[]>([
    {
      id: 'root',
      folderId: null,
      title: 'Bookmarks',
      folders: [],
      timestamp: Date.now()
    }
  ]);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'forward' | 'backward'>('forward');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // 폴더로 이동 (새 레이어 추가)
  const navigateToFolder = useCallback((folderId: string, folder: Folder, childFolders: Folder[]) => {
    setLayerStack(prev => {
      // 현재 활성 레이어 이후의 레이어들 제거 (새로운 경로 시작)
      const newStack = prev.slice(0, activeLayerIndex + 1);
      
      // 새 레이어 추가
      const newLayer: NavigationLayer = {
        id: `layer-${Date.now()}`,
        folderId,
        title: folder.name,
        folders: childFolders,
        timestamp: Date.now()
      };
      
      return [...newStack, newLayer];
    });
    
    setActiveLayerIndex(prev => prev + 1);
    setAnimationDirection('forward');
    setIsAnimating(true);
  }, [activeLayerIndex]);

  // 이전 레이어로 복귀
  const goBack = useCallback(() => {
    if (activeLayerIndex > 0) {
      setActiveLayerIndex(prev => prev - 1);
      setAnimationDirection('backward');
      setIsAnimating(true);
    }
  }, [activeLayerIndex]);

  // 루트로 복귀 (모든 레이어 제거)
  const goToRoot = useCallback(() => {
    setLayerStack([{
      id: 'root',
      folderId: null,
      title: 'Bookmarks',
      folders: [],
      timestamp: Date.now()
    }]);
    setActiveLayerIndex(0);
    setAnimationDirection('backward');
    setIsAnimating(true);
  }, []);

  // 특정 레이어로 이동
  const navigateToLayer = useCallback((layerIndex: number) => {
    if (layerIndex >= 0 && layerIndex < layerStack.length) {
      setActiveLayerIndex(layerIndex);
      setAnimationDirection(layerIndex > activeLayerIndex ? 'forward' : 'backward');
      setIsAnimating(true);
    }
  }, [layerStack.length, activeLayerIndex]);

  // 레이어 데이터 업데이트 (폴더 구조 변경 시)
  const updateLayerData = useCallback((folderId: string | null, newFolders: Folder[]) => {
    setLayerStack(prev => 
      prev.map(layer => 
        layer.folderId === folderId 
          ? { ...layer, folders: newFolders }
          : layer
      )
    );
  }, []);

  // 루트 레이어 데이터 업데이트
  const updateRootLayer = useCallback((folders: Folder[]) => {
    setLayerStack(prev => 
      prev.map((layer, index) => 
        index === 0 
          ? { ...layer, folders }
          : layer
      )
    );
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

  // 애니메이션 방향 설정
  const setAnimationDirectionCallback = useCallback((direction: 'forward' | 'backward') => {
    setAnimationDirection(direction);
  }, []);

  const value: SidebarNavigationContextType = {
    // 상태
    layerStack,
    activeLayerIndex,
    isAnimating,
    animationDirection,
    isMobileOpen,
    
    // 액션
    navigateToFolder,
    goBack,
    goToRoot,
    navigateToLayer,
    toggleMobile,
    closeMobile,
    setAnimating,
    setAnimationDirection: setAnimationDirectionCallback,
    updateLayerData,
    updateRootLayer,
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