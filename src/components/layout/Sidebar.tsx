import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditFolderDialog } from "@/components/folder/EditFolderDialog";
import { getIconByName } from "@/lib/icons";
import type { Folder as FolderType } from "@/types/bookmark";

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export default function Sidebar({ isMobileMenuOpen = false, setIsMobileMenuOpen }: SidebarProps) {
  const { folders, addFolder, deleteFolder } = useBookmarks();
  const location = useLocation();
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const { isCollapsed, toggle } = useSidebarToggle();
  const [editingFolder, setEditingFolder] = useState<FolderType | null>(null);
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  
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

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreateFolderOpen(false);
    } else {
      toast.error("폴더 이름을 입력해주세요");
    }
  };

  const handleEditFolder = (folder: FolderType) => {
    setEditingFolder(folder);
    setIsEditFolderOpen(true);
  };

  const handleDeleteFolder = async (folder: FolderType) => {
    if (window.confirm(`"${folder.name}" 폴더를 삭제하시겠습니까?\n폴더 내 북마크는 "모든 북마크"로 이동됩니다.`)) {
      await deleteFolder(folder.id);
    }
  };

  const handleLinkClick = () => {
    // 모바일에서 링크 클릭 시 사이드바 닫기
    if (isMobile && setIsMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

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
              {(!isCollapsed || isMobile) && "모든 북마크"}
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
              <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>새 폴더 만들기</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      placeholder="폴더 이름"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreateFolder();
                        }
                      }}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={handleCreateFolder}>생성</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {(foldersExpanded || isCollapsed) && (
            <div className="mt-1 space-y-1 px-1">
              {folders.map((folder) => {
                const folderIconInfo = getIconByName(folder.icon_name || 'folder');
                const FolderIconComponent = folderIconInfo?.icon || FolderOpen;
                
                return (
                  <div key={folder.id} className="group relative">
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start pr-8",
                        isActive(`/folder/${folder.id}`) && "bg-accent text-accent-foreground",
                        isCollapsed && !isMobile && "justify-center px-2 pr-2"
                      )}
                      asChild
                      onClick={handleLinkClick}
                    >
                      <Link to={`/folder/${folder.id}`}>
                        <FolderIconComponent 
                          className={cn("h-4 w-4", isCollapsed && !isMobile ? "" : "mr-2")} 
                          style={{ color: folder.icon_color || '#3B82F6' }}
                        />
                        {(!isCollapsed || isMobile) && (
                          <>
                            <span className="flex-1 text-left truncate">{folder.name}</span>
                            <span className="ml-auto text-xs text-muted-foreground mr-6">{folder.bookmarkCount}</span>
                          </>
                        )}
                      </Link>
                    </Button>
                    
                    {/* 폴더 메뉴 (접혀있지 않거나 모바일일 때만 표시) */}
                    {(!isCollapsed || isMobile) && (
                      <div className="absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => e.preventDefault()}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditFolder(folder)}>
                              <Edit3 className="mr-2 h-4 w-4" />
                              편집
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDeleteFolder(folder)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                );
              })}
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
          "sidebar fixed inset-y-0 left-0 z-30 transform bg-background border-r transition-all duration-500 ease-in-out will-change-layout",
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
    </>
  );
}

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
