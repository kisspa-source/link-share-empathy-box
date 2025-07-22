import { motion } from 'framer-motion';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { NavigationTitle } from './NavigationTitle';
import { FolderItem } from './FolderItem';
import { Button } from '@/components/ui/button';
import { Heart, Tag, Share2, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreateFolderDialog } from '@/components/folder/CreateFolderDialog';
import { cn } from '@/lib/utils';
import { useMemo, useState, useEffect } from 'react';

interface SidebarFrameProps {
  frameKey?: number;
}

export const SidebarFrame = ({ frameKey }: SidebarFrameProps) => {
  const { foldersTree, bookmarks } = useBookmarks();
  const navigate = useNavigate();
  const location = useLocation();
  
  // 네비게이션 방향 추적 (forward: 앞으로, backward: 뒤로)
  const [navigationDirection, setNavigationDirection] = useState<'forward' | 'backward'>('forward');
  const [previousPath, setPreviousPath] = useState<string>('');
  
  // 네비게이션 히스토리 추적 (최대 10개까지)
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  // 폴더 ID로 폴더 찾기 (재귀)
  const findFolderById = (folders: any[], folderId: string): any => {
    for (const folder of folders) {
      if (folder.id === folderId) {
        return folder;
      }
      if (folder.children) {
        const found = findFolderById(folder.children, folderId);
        if (found) return found;
      }
    }
    return null;
  };

  // 폴더의 부모 폴더 찾기 (재귀) - 개선된 버전
  const findParentFolder = (folders: any[], targetFolderId: string, parent: any = null): any => {
    for (const folder of folders) {
      // 현재 폴더가 대상인지 확인 (루트 레벨 폴더의 경우)
      if (folder.id === targetFolderId) {
        return null;
      }
      
      if (folder.children) {
        for (const child of folder.children) {
          if (child.id === targetFolderId) {
            return folder; // 현재 폴더가 부모
          }
        }
        // 하위 폴더에서 찾기
        const found = findParentFolder(folder.children, targetFolderId, folder);
        if (found) return found;
      }
    }
    return null;
  };

  // 경로 변경 감지 및 네비게이션 방향 결정 (히스토리 기반)
  useEffect(() => {
    if (previousPath && previousPath !== location.pathname) {
      // 히스토리에서 현재 경로가 이전에 방문했던 경로인지 확인
      const historyIndex = navigationHistory.indexOf(location.pathname);
      
      if (historyIndex !== -1) {
        // 히스토리에 있는 경로로 이동 = 뒤로가기
        setNavigationDirection('backward');
        // 히스토리에서 현재 경로 이후의 항목들 제거
        setNavigationHistory(prev => prev.slice(0, historyIndex + 1));
      } else {
        // 새로운 경로로 이동 = 앞으로가기
        setNavigationDirection('forward');
        // 히스토리에 현재 경로 추가
        setNavigationHistory(prev => {
          const newHistory = [...prev, location.pathname];
          // 최대 10개까지만 유지
          return newHistory.slice(-10);
        });
      }
    } else if (!previousPath && location.pathname) {
      // 초기 로드 시
      setNavigationHistory([location.pathname]);
    }
    
    setPreviousPath(location.pathname);
  }, [location.pathname, previousPath, navigationHistory]);

  // 현재 URL에서 폴더 ID 추출 (React Router location 사용)
  const currentFolderId = useMemo(() => {
    const urlMatch = location.pathname.match(/^\/folder\/([^\/]+)$/);
    return urlMatch ? urlMatch[1] : null;
  }, [location.pathname]);

  // 현재 표시할 데이터 결정 (메모이제이션)
  const currentData = useMemo(() => {
    if (!currentFolderId) {
      // 루트 레벨: 메인 메뉴 + 루트 폴더들
      return {
        type: 'root',
        title: 'Bookmarks',
        folders: foldersTree,
        showBackButton: false
      };
    } else {
      // 폴더 레벨: 선택된 폴더의 하위 폴더들
      const currentFolder = findFolderById(foldersTree, currentFolderId);
      const childFolders = currentFolder?.children || [];
      
      return {
        type: 'folder',
        title: currentFolder?.name || '폴더',
        folders: childFolders,
        showBackButton: true
      };
    }
  }, [currentFolderId, foldersTree]);

  // 폴더 클릭 핸들러
  const handleFolderClick = useMemo(() => {
    return (folderId: string) => {
      // 해당 폴더 페이지로 이동 (방향은 useEffect에서 자동 감지)
      navigate(`/folder/${folderId}`);
    };
  }, [navigate]);

  // 뒤로가기 핸들러 (히스토리 기반)
  const handleBackClick = useMemo(() => {
    return () => {
      // 히스토리에서 이전 경로 찾기
      const currentIndex = navigationHistory.indexOf(location.pathname);
      
      if (currentIndex > 0) {
        // 히스토리에 이전 경로가 있으면 그곳으로 이동
        const previousPath = navigationHistory[currentIndex - 1];
        navigate(previousPath);
      } else if (currentFolderId) {
        // 히스토리가 없으면 부모 폴더로 이동 (fallback)
        const parentFolder = findParentFolder(foldersTree, currentFolderId);
        
        if (parentFolder) {
          navigate(`/folder/${parentFolder.id}`);
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    };
  }, [currentFolderId, foldersTree, navigate, navigationHistory, location.pathname]);

  // 메인 메뉴 클릭 핸들러
  const handleMainMenuClick = useMemo(() => {
    return (path: string) => {
      // 해당 페이지로 이동
      navigate(path);
    };
  }, [navigate]);

  // 폴더 간 이동인지 확인 (애니메이션 적용 여부 결정)
  const isFolderNavigation = currentFolderId !== null;

  // 방향에 따른 애니메이션 설정
  const getAnimationProps = () => {
    // 폴더 데이터가 로드되지 않았거나 폴더 네비게이션이 아닌 경우 애니메이션 비활성화
    if (!isFolderNavigation || !foldersTree || foldersTree.length === 0) {
      return {
        initial: false,
        animate: false,
        exit: false,
        transition: {}
      };
    }

    if (navigationDirection === 'forward') {
      // 앞으로 이동: 오른쪽에서 들어와서 왼쪽으로 나감
      return {
        initial: { x: 300, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: -300, opacity: 0 },
        transition: { duration: 0.3, ease: "easeInOut" }
      };
    } else {
      // 뒤로 이동: 왼쪽에서 들어와서 오른쪽으로 나감
      return {
        initial: { x: -300, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        exit: { x: 300, opacity: 0 },
        transition: { duration: 0.3, ease: "easeInOut" }
      };
    }
  };

  const animationProps = getAnimationProps();

  return (
    <motion.div
      key={frameKey || 'default'}
      className="h-full flex flex-col"
      {...animationProps}
    >
      {/* 네비게이션 타이틀 */}
      <NavigationTitle
        title={currentData.title}
        showBackButton={currentData.showBackButton}
        onBack={handleBackClick}
      />

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-auto py-3 px-3">
        {!currentData.showBackButton ? (
          // 루트 레벨: 메인 메뉴 + 폴더들
          <div className="space-y-4">
            {/* 메인 메뉴 */}
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleMainMenuClick('/')}
              >
                <Heart className="h-5 w-5 mr-2" />
                <span>모든 북마크</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {bookmarks.length}
                </span>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleMainMenuClick('/tags')}
              >
                <Tag className="h-5 w-5 mr-2" />
                <span>태그</span>
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleMainMenuClick('/collections')}
              >
                <Share2 className="h-5 w-5 mr-2" />
                <span>컬렉션</span>
              </Button>
            </div>

            {/* 폴더 섹션 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1 px-3">
                <span className="text-sm font-medium text-muted-foreground">폴더</span>
                <CreateFolderDialog
                  trigger={
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                />
              </div>
              
              <div className="space-y-1">
                {currentData.folders.map((folder: any) => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    onClick={() => handleFolderClick(folder.id)}
                    showCount={true}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          // 폴더 레벨: 하위 폴더들만
          <div className="space-y-4">
            {/* 하위 폴더들 */}
            {currentData.folders.length > 0 ? (
              <div className="space-y-1">
                {currentData.folders.map((folder: any) => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    onClick={() => handleFolderClick(folder.id)}
                    showCount={true}
                  />
                ))}
              </div>
            ) : (
              // 빈 폴더 상태
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="text-muted-foreground mb-2">
                  이 폴더에 하위 폴더가 없습니다
                </div>
                <Button variant="outline" size="sm">
                  폴더 추가
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}; 