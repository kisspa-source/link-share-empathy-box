import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 뷰 모드 타입 정의
export type ViewMode = 'list' | 'card' | 'title' | 'moodboard';

// 커버 이미지 위치 타입 정의
export type ImagePosition = 'left' | 'right';

// 표시 요소 설정 타입 정의
export interface DisplayElements {
  coverImage: boolean;
  title: boolean;
  note: boolean;
  description: boolean;
  highlight: boolean;
  tags: boolean;
  bookmarkInfo: boolean;
}

// 북마크 뷰 설정 타입 정의
export interface BookmarkViewSettings {
  viewMode: ViewMode;
  displayElements: DisplayElements;
  imagePosition: ImagePosition;
}

// 컨텍스트 타입 정의
interface BookmarkViewContextType {
  // 현재 설정
  viewMode: ViewMode;
  displayElements: DisplayElements;
  imagePosition: ImagePosition;
  
  // 설정 변경 함수들
  setViewMode: (mode: ViewMode) => void;
  setDisplayElements: (elements: Partial<DisplayElements>) => void;
  setImagePosition: (position: ImagePosition) => void;
  
  // 일괄 설정 함수
  updateSettings: (settings: Partial<BookmarkViewSettings>) => void;
  resetToDefaults: () => void;
  
  // 로딩 상태
  isLoading: boolean;
}

// 기본값 정의
const defaultDisplayElements: DisplayElements = {
  coverImage: true,
  title: true,
  note: true,
  description: true,
  highlight: true,
  tags: true,
  bookmarkInfo: true,
};

const defaultSettings: BookmarkViewSettings = {
  viewMode: 'list',
  displayElements: defaultDisplayElements,
  imagePosition: 'left',
};

// 로컬 스토리지 키
const STORAGE_KEY = 'bookmark_view_settings';

// 컨텍스트 생성
const BookmarkViewContext = createContext<BookmarkViewContextType | undefined>(undefined);

// Provider 컴포넌트
export const BookmarkViewProvider = ({ children }: { children: ReactNode }) => {
  const [viewMode, setViewModeState] = useState<ViewMode>(defaultSettings.viewMode);
  const [displayElements, setDisplayElementsState] = useState<DisplayElements>(defaultSettings.displayElements);
  const [imagePosition, setImagePositionState] = useState<ImagePosition>(defaultSettings.imagePosition);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 설정 로드
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem(STORAGE_KEY);
        if (savedSettings) {
          const parsed: BookmarkViewSettings = JSON.parse(savedSettings);
          
          // 저장된 설정 검증 및 적용
          if (parsed.viewMode && ['list', 'card', 'title', 'moodboard'].includes(parsed.viewMode)) {
            setViewModeState(parsed.viewMode);
          }
          
          if (parsed.displayElements && typeof parsed.displayElements === 'object') {
            setDisplayElementsState({ ...defaultDisplayElements, ...parsed.displayElements });
          }
          
          if (parsed.imagePosition && ['left', 'right'].includes(parsed.imagePosition)) {
            setImagePositionState(parsed.imagePosition);
          }
        }
      } catch (error) {
        console.warn('북마크 뷰 설정 로드 실패:', error);
        // 기본값 유지
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // 설정 저장 함수
  const saveSettings = (settings: BookmarkViewSettings) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.warn('북마크 뷰 설정 저장 실패:', error);
    }
  };

  // 뷰 모드 변경 함수
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    const newSettings: BookmarkViewSettings = {
      viewMode: mode,
      displayElements,
      imagePosition,
    };
    saveSettings(newSettings);
  };

  // 표시 요소 변경 함수
  const setDisplayElements = (elements: Partial<DisplayElements>) => {
    const newDisplayElements = { ...displayElements, ...elements };
    setDisplayElementsState(newDisplayElements);
    const newSettings: BookmarkViewSettings = {
      viewMode,
      displayElements: newDisplayElements,
      imagePosition,
    };
    saveSettings(newSettings);
  };

  // 이미지 위치 변경 함수
  const setImagePosition = (position: ImagePosition) => {
    setImagePositionState(position);
    const newSettings: BookmarkViewSettings = {
      viewMode,
      displayElements,
      imagePosition: position,
    };
    saveSettings(newSettings);
  };

  // 일괄 설정 업데이트 함수
  const updateSettings = (newSettings: Partial<BookmarkViewSettings>) => {
    if (newSettings.viewMode !== undefined) {
      setViewModeState(newSettings.viewMode);
    }
    if (newSettings.displayElements !== undefined) {
      setDisplayElementsState({ ...displayElements, ...newSettings.displayElements });
    }
    if (newSettings.imagePosition !== undefined) {
      setImagePositionState(newSettings.imagePosition);
    }

    const finalSettings: BookmarkViewSettings = {
      viewMode: newSettings.viewMode ?? viewMode,
      displayElements: newSettings.displayElements ? { ...displayElements, ...newSettings.displayElements } : displayElements,
      imagePosition: newSettings.imagePosition ?? imagePosition,
    };
    saveSettings(finalSettings);
  };

  // 기본값으로 재설정 함수
  const resetToDefaults = () => {
    setViewModeState(defaultSettings.viewMode);
    setDisplayElementsState(defaultSettings.displayElements);
    setImagePositionState(defaultSettings.imagePosition);
    saveSettings(defaultSettings);
  };

  const value: BookmarkViewContextType = {
    viewMode,
    displayElements,
    imagePosition,
    setViewMode,
    setDisplayElements,
    setImagePosition,
    updateSettings,
    resetToDefaults,
    isLoading,
  };

  return (
    <BookmarkViewContext.Provider value={value}>
      {children}
    </BookmarkViewContext.Provider>
  );
};

// 커스텀 훅
export const useBookmarkView = () => {
  const context = useContext(BookmarkViewContext);
  if (context === undefined) {
    throw new Error('useBookmarkView must be used within a BookmarkViewProvider');
  }
  return context;
}; 