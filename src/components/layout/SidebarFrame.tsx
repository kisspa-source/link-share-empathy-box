import { motion, AnimatePresence } from 'framer-motion';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useSidebarNavigation } from '@/contexts/SidebarNavigationContext';
import { NavigationTitle } from './NavigationTitle';
import { FolderItem } from './FolderItem';
import { Button } from '@/components/ui/button';
import { Heart, Tag, Share2, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreateFolderDialog } from '@/components/folder/CreateFolderDialog';
import { cn } from '@/lib/utils';
import { useMemo, useEffect } from 'react';
import type { Folder } from '@/types/bookmark';

interface SidebarFrameProps {
  frameKey?: number;
}

export const SidebarFrame = ({ frameKey }: SidebarFrameProps) => {
  const { foldersTree, bookmarks } = useBookmarks();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    layerStack,
    activeLayerIndex,
    isAnimating,
    animationDirection,
    navigateToFolder,
    goBack,
    goToRoot,
    setAnimating,
    navigateToLayer,
    updateRootLayer,
    updateLayerData
  } = useSidebarNavigation();

  // 현재 활성 레이어
  const currentLayer = layerStack[activeLayerIndex];

  // 폴더 ID로 폴더 찾기 (재귀)
  const findFolderById = (folders: Folder[], folderId: string): Folder | null => {
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

  // URL에서 폴더 ID 추출
  const currentFolderId = useMemo(() => {
    const urlMatch = location.pathname.match(/^\/folder\/([^\/]+)$/);
    return urlMatch ? urlMatch[1] : null;
  }, [location.pathname]);

  // 폴더 데이터 변경 시 레이어 업데이트
  useEffect(() => {
    if (foldersTree && foldersTree.length > 0) {
      // 루트 레이어 업데이트
      updateRootLayer(foldersTree);
      
      // 각 레이어의 폴더 데이터 업데이트
      layerStack.forEach(layer => {
        if (layer.folderId) {
          const folder = findFolderById(foldersTree, layer.folderId);
          if (folder && folder.children) {
            updateLayerData(layer.folderId, folder.children);
          }
        }
      });
    }
  }, [foldersTree, layerStack, updateRootLayer, updateLayerData]);

  // URL 변경 시 레이어 스택 동기화
  useEffect(() => {
    if (!foldersTree || foldersTree.length === 0) return;

    if (currentFolderId) {
      // 폴더 페이지에 있는 경우
      const folder = findFolderById(foldersTree, currentFolderId);
      if (folder) {
        // 현재 레이어가 해당 폴더와 일치하는지 확인
        const currentLayerFolderId = currentLayer?.folderId;
        
        if (currentLayerFolderId !== currentFolderId) {
          // 레이어 스택에서 해당 폴더를 찾아서 이동
          const targetLayerIndex = layerStack.findIndex(layer => layer.folderId === currentFolderId);
          
          if (targetLayerIndex !== -1) {
            // 기존 레이어로 이동
            navigateToLayer(targetLayerIndex);
          } else {
            // 새 레이어 생성 (이 경우는 일반적이지 않음)
            navigateToFolder(currentFolderId, folder, folder.children || []);
          }
        }
      }
    } else {
      // 루트 페이지에 있는 경우
      if (activeLayerIndex !== 0) {
        navigateToLayer(0);
      }
    }
  }, [currentFolderId, foldersTree, currentLayer, layerStack, activeLayerIndex, navigateToFolder, navigateToLayer]);

  // 루트 레이어 데이터 업데이트
  useEffect(() => {
    if (activeLayerIndex === 0 && foldersTree) {
      // 루트 레이어의 폴더 목록 업데이트
      const rootLayer = layerStack[0];
      if (rootLayer && rootLayer.folders !== foldersTree) {
        // 루트 레이어 업데이트는 컨텍스트에서 처리해야 하지만,
        // 여기서는 간단히 처리
      }
    }
  }, [activeLayerIndex, foldersTree, layerStack]);

  // 폴더 클릭 핸들러
  const handleFolderClick = useMemo(() => {
    return (folderId: string) => {
      const folder = findFolderById(foldersTree, folderId);
      if (folder) {
        // 새 레이어로 이동
        navigateToFolder(folderId, folder, folder.children || []);
        
        // URL도 업데이트
        navigate(`/folder/${folderId}`);
      }
    };
  }, [foldersTree, navigateToFolder, navigate]);

  // 뒤로가기 핸들러
  const handleBackClick = useMemo(() => {
    return () => {
      if (activeLayerIndex > 0) {
        goBack();
        
        // 이전 레이어의 URL로 이동
        const previousLayer = layerStack[activeLayerIndex - 1];
        if (previousLayer.folderId) {
          navigate(`/folder/${previousLayer.folderId}`);
        } else {
          navigate('/');
        }
      }
    };
  }, [activeLayerIndex, layerStack, goBack, navigate]);

  // 메인 메뉴 클릭 핸들러
  const handleMainMenuClick = useMemo(() => {
    return (path: string) => {
      navigate(path);
    };
  }, [navigate]);

  // 애니메이션 완료 핸들러
  const handleAnimationComplete = () => {
    setAnimating(false);
  };

  // 방향에 따른 애니메이션 설정
  const getAnimationProps = (layerIndex: number) => {
    const isActive = layerIndex === activeLayerIndex;
    const isVisible = layerIndex <= activeLayerIndex;
    
    if (!isVisible) {
      return {
        initial: false,
        animate: false,
        exit: false
      };
    }

    if (isActive) {
      // 활성 레이어: 현재 방향에 따라 애니메이션
      if (animationDirection === 'forward') {
        return {
          initial: { x: 320, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: -320, opacity: 0 },
          transition: { duration: 0.3, ease: "easeInOut" },
          onAnimationComplete: handleAnimationComplete
        };
      } else {
        return {
          initial: { x: -320, opacity: 0 },
          animate: { x: 0, opacity: 1 },
          exit: { x: 320, opacity: 0 },
          transition: { duration: 0.3, ease: "easeInOut" },
          onAnimationComplete: handleAnimationComplete
        };
      }
    } else {
      // 비활성 레이어: 고정 위치, 완전히 불투명
      return {
        initial: false,
        animate: { 
          x: 0, 
          opacity: 1,
          scale: 1,
          filter: 'none'
        },
        exit: false,
        transition: { duration: 0.3, ease: "easeInOut" }
      };
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* 레이어 스택 컨테이너 */}
      <div className="relative h-full">
        {layerStack.map((layer, index) => {
          const isActive = index === activeLayerIndex;
          const isVisible = index <= activeLayerIndex;
          
          if (!isVisible) return null;

          const depth = activeLayerIndex - index;

          return (
            <motion.div
              key={layer.id}
              className={cn(
                "absolute inset-0 flex flex-col",
                isActive ? "z-10" : "z-0"
              )}
              style={{
                zIndex: isActive ? 10 : index,
                backgroundColor: 'white', // 라이트 모드
                opacity: 1,
                transformOrigin: 'center center',
                // 다크 모드 대응
                ...(document.documentElement.classList.contains('dark') && {
                  backgroundColor: '#020817' // 다크 모드 배경색
                })
              }}
              {...getAnimationProps(index)}
            >
              {/* 네비게이션 타이틀 */}
              <NavigationTitle
                title={layer.title}
                showBackButton={index > 0}
                onBack={handleBackClick}
              />

              {/* 컨텐츠 영역 */}
              <div 
                className="flex-1 overflow-auto py-3 px-3"
                style={{
                  backgroundColor: 'white', // 라이트 모드
                  ...(document.documentElement.classList.contains('dark') && {
                    backgroundColor: '#020817' // 다크 모드 배경색
                  })
                }}
              >
                {index === 0 ? (
                  // 루트 레이어: 메인 메뉴 + 폴더들
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
                        {foldersTree.map((folder: Folder) => (
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
                  // 폴더 레이어: 하위 폴더들만
                  <div className="space-y-4">
                    {/* 하위 폴더들 */}
                    {layer.folders.length > 0 ? (
                      <div className="space-y-1">
                        {layer.folders.map((folder: Folder) => (
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
        })}
      </div>
    </div>
  );
}; 