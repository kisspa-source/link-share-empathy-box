import { useState, useEffect, useCallback, memo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useSidebarToggle } from "@/hooks/useSidebarToggle";
import { 
  Heart, 
  FolderOpen, 
  Tag, 
  Share2, 
  Plus,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ChevronRightIcon,
  X,
  Menu,
  MoreHorizontal,
  Edit3,
  Trash2
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditFolderDialog } from "@/components/folder/EditFolderDialog";
import { CreateFolderDialog } from "@/components/folder/CreateFolderDialog";
import DeleteFolderDialog from "@/components/folder/DeleteFolderDialog";
import { getSafeIconByName } from "@/lib/icons";
import type { Folder as FolderType } from "@/types/bookmark";

// 북마크 개수 표시 컴포넌트 (마우스 오버 시 "..." 버튼으로 변경)
const BookmarkCountDisplay = memo(function BookmarkCountDisplay({ 
  count, 
  folder, 
  onEdit, 
  onDelete 
}: { 
  count: number;
  folder: FolderType;
  onEdit: (folder: FolderType) => void;
  onDelete: (folder: FolderType) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 드롭다운이 열려있을 때는 마우스 아웃되어도 버튼 상태 유지
  const showButton = isHovered || isDropdownOpen;

  return (
    <div 
      className="relative min-w-[24px] flex items-center justify-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!showButton ? (
        // 마우스 아웃: 북마크 개수 표시
        <span 
          className="text-xs text-muted-foreground transition-opacity duration-200"
          title={`${count}개의 북마크`}
        >
          {count}
        </span>
      ) : (
        // 마우스 오버 또는 드롭다운 열림: "..." 버튼 표시
        <DropdownMenu onOpenChange={setIsDropdownOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 rounded-sm"
              title="폴더 메뉴"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="z-50">
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(folder);
              }}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              폴더 수정
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(folder);
              }}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              폴더 삭제
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
});

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

const Sidebar = memo(function Sidebar({ isMobileMenuOpen = false, setIsMobileMenuOpen }: SidebarProps) {
  const { folders, foldersTree, deleteFolder, bookmarks } = useBookmarks();
  const location = useLocation();
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const { isCollapsed, toggle } = useSidebarToggle();
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  const [deletingFolder, setDeletingFolder] = useState<FolderType | null>(null);
  const [isDeleteFolderOpen, setIsDeleteFolderOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // 북마크 가져오기 완료 이벤트 처리 (개선된 버전)
  useEffect(() => {
    const handleImportCompleted = (event: CustomEvent) => {
      if (event.detail?.expandedFolders) {
        console.log('📁 사이드바 폴더 펼침 상태 업데이트:', event.detail.expandedFolders.length, '개 폴더');
        setExpandedFolders(new Set(event.detail.expandedFolders));
        
        // 가져오기 완료 알림
        if (event.detail.totalBookmarks && event.detail.totalFolders) {
          console.log('✅ 북마크 가져오기 완료:', {
            bookmarks: event.detail.totalBookmarks,
            folders: event.detail.totalFolders
          });
        }
      }
    };

    window.addEventListener('bookmarkImportCompleted', handleImportCompleted as EventListener);
    
    return () => {
      window.removeEventListener('bookmarkImportCompleted', handleImportCompleted as EventListener);
    };
  }, []);
  
  // Function to determine if a link is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Responsive sidebar state
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      // 모바일에서 데스크톱으로 변경 시 모바일 메뉴 닫기
      if (!isMobileView && isMobileMenuOpen && setIsMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);



  const handleEditFolder = useCallback((folder: FolderType) => {
    setEditingFolder(folder);
    setIsEditFolderOpen(true);
  }, []);

  const handleDeleteFolder = useCallback((folder: FolderType) => {
    setDeletingFolder(folder);
    setIsDeleteFolderOpen(true);
  }, []);

  const handleLinkClick = useCallback(() => {
    // 모바일에서 링크 클릭 시 사이드바 닫기
    if (isMobile && setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, [isMobile, setIsMobileMenuOpen]);

  const toggleFolderExpansion = useCallback((folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  }, []);

  // 재귀적으로 폴더 트리를 렌더링하는 함수 (메모이제이션)
  const renderFolderTree = useCallback((folders: FolderType[], depth = 0): React.ReactNode => {
    return folders.map((folder) => {
      const folderIconInfo = getSafeIconByName(folder.icon_name || 'folder');
      const FolderIconComponent = folderIconInfo?.icon || FolderOpen;
      const hasChildren = folder.children && folder.children.length > 0;
      const isExpanded = expandedFolders.has(folder.id);
      const indentClass = depth > 0 ? `ml-${depth * 4}` : '';
      
      return (
        <div key={folder.id}>
          <div className="group relative">
            <div className="flex items-center">
              {/* 확장/축소 버튼 (자식이 있는 경우만) */}
              {hasChildren && (!isCollapsed || isMobile) && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 p-0 mr-1"
                  onClick={() => toggleFolderExpansion(folder.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}
              
              {/* 폴더 버튼 */}
              <Button
                variant="ghost"
                className={cn(
                  "flex-1 justify-start pr-2 relative",
                  isActive(`/folder/${folder.id}`) && "bg-accent text-accent-foreground",
                  isCollapsed && !isMobile && "justify-center px-2 pr-2",
                  indentClass
                )}
                asChild
                onClick={handleLinkClick}
              >
                <Link to={`/folder/${folder.id}`}>
                  <div className="relative">
                    <FolderIconComponent 
                      className={cn("h-4 w-4", isCollapsed && !isMobile ? "" : "mr-2")} 
                      style={{ color: folder.icon_color || '#3B82F6' }}
                    />
                    {/* 접힌 상태에서 하위 폴더 존재 인디케이터 */}
                    {hasChildren && isCollapsed && !isMobile && (
                      <div 
                        className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary/60 border border-background"
                        title={`${folder.children?.length}개의 하위 폴더`}
                      />
                    )}
                  </div>
                  {(!isCollapsed || isMobile) && (
                    <>
                      <span className="flex-1 text-left truncate">{folder.name}</span>
                      <BookmarkCountDisplay 
                        count={folder.bookmarkCount} 
                        folder={folder}
                        onEdit={handleEditFolder}
                        onDelete={handleDeleteFolder}
                      />
                    </>
                  )}
                </Link>
              </Button>

            </div>
          </div>
          
          {/* 자식 폴더들 재귀 렌더링 */}
          {hasChildren && isExpanded && (
            <div className="ml-4">
              {renderFolderTree(folder.children!, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  }, [isCollapsed, isMobile, expandedFolders, handleLinkClick, handleEditFolder, handleDeleteFolder, toggleFolderExpansion]);

  // 모바일에서 사이드바가 닫혀있으면 null 반환
  if (isMobile && !isMobileMenuOpen) {
    return null;
  }

  const sidebarContent = (
    <>
      {/* Toggle Button (데스크톱 전용) */}
      {!isMobile && (
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={toggle}
          >
            {isCollapsed ? (
              <ChevronRightIcon className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* 모바일 헤더 */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">메뉴</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      
      <div className="flex-1 overflow-auto py-3 px-3">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              isActive("/") && "bg-accent text-accent-foreground",
              isCollapsed && !isMobile && "justify-center px-2"
            )}
            asChild
            onClick={handleLinkClick}
          >
            <Link to="/">
              <Heart className={cn("h-5 w-5", isCollapsed && !isMobile ? "" : "mr-2")} />
              {(!isCollapsed || isMobile) && (
                <div className="flex items-center justify-between w-full">
                  <span>모든 북마크</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {bookmarks.length}
                  </span>
                </div>
              )}
            </Link>
          </Button>
        </div>
        
        <div className="mt-4">
          {(!isCollapsed || isMobile) && (
            <div className="flex items-center justify-between py-1 px-3">
              <button 
                onClick={() => setFoldersExpanded(!foldersExpanded)}
                className="flex items-center text-sm font-medium"
              >
                {foldersExpanded ? (
                  <ChevronDown className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1" />
                )}
                <span>폴더</span>
              </button>
              <CreateFolderDialog
                trigger={
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                }
              />
            </div>
          )}

          {(foldersExpanded || isCollapsed) && (
            <div className="mt-1 space-y-1 px-1">
              {renderFolderTree(foldersTree)}
            </div>
          )}
        </div>

        <div className="mt-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              isActive("/tags") && "bg-accent text-accent-foreground",
              isCollapsed && !isMobile && "justify-center px-2"
            )}
            asChild
            onClick={handleLinkClick}
          >
            <Link to="/tags">
              <Tag className={cn("h-5 w-5", isCollapsed && !isMobile ? "" : "mr-2")} />
              {(!isCollapsed || isMobile) && "태그"}
            </Link>
          </Button>
          
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start",
              isActive("/collections") && "bg-accent text-accent-foreground",
              isCollapsed && !isMobile && "justify-center px-2"
            )}
            asChild
            onClick={handleLinkClick}
          >
            <Link to="/collections">
              <Share2 className={cn("h-5 w-5", isCollapsed && !isMobile ? "" : "mr-2")} />
              {(!isCollapsed || isMobile) && "컬렉션"}
            </Link>
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* 데스크톱 사이드바 */}
      {!isMobile && (
        <aside className={cn(
          "sidebar fixed inset-y-0 left-0 z-30 transform bg-background border-r transition-[width] duration-300 ease-in-out will-change-transform",
          "flex flex-col h-screen pt-14",
          isCollapsed ? "w-16" : "w-64"
        )}>
          {sidebarContent}
        </aside>
      )}

      {/* 모바일 사이드바 오버레이 */}
      {isMobile && isMobileMenuOpen && (
        <>
          {/* 백드롭 */}
          <div 
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
          />
          
          {/* 사이드바 */}
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r flex flex-col h-screen pt-14 md:hidden">
            {sidebarContent}
          </aside>
        </>
      )}
      
      {/* 폴더 편집 다이얼로그 */}
      {editingFolder && (
        <EditFolderDialog
          open={isEditFolderOpen}
          onOpenChange={setIsEditFolderOpen}
          folder={editingFolder}
        />
      )}
      
      {/* 폴더 삭제 다이얼로그 */}
      <DeleteFolderDialog
        open={isDeleteFolderOpen}
        onOpenChange={setIsDeleteFolderOpen}
        folder={deletingFolder}
      />
    </>
  );
});

export default Sidebar;

// 모바일 사이드바 토글 버튼 컴포넌트
export function MobileSidebarToggle({ 
  isMobileMenuOpen, 
  setIsMobileMenuOpen 
}: { 
  isMobileMenuOpen: boolean; 
  setIsMobileMenuOpen: (open: boolean) => void; 
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
