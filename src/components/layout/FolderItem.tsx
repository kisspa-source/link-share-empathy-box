import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getSafeIconByName } from '@/lib/icons';
import { FolderOpen, MoreHorizontal, Edit3, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Folder } from '@/types/bookmark';

interface FolderItemProps {
  folder: Folder;
  onClick: () => void;
  showCount?: boolean;
  onEdit?: (folder: Folder) => void;
  onDelete?: (folder: Folder) => void;
  className?: string;
}

export const FolderItem = ({ 
  folder, 
  onClick, 
  showCount = false,
  onEdit,
  onDelete,
  className 
}: FolderItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 폴더 아이콘 정보 가져오기
  const folderIconInfo = getSafeIconByName(folder.icon_name || 'folder');
  const FolderIconComponent = folderIconInfo?.icon || FolderOpen;

  // 드롭다운이 열려있을 때는 마우스 아웃되어도 버튼 상태 유지
  const showButton = isHovered || isDropdownOpen;

  return (
    <div 
      className={cn("group relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Button
        variant="ghost"
        className="w-full justify-start pr-2 relative h-auto py-2"
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`${folder.name} 폴더로 이동 (${folder.bookmarkCount}개의 북마크)`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
      >
        <div className="relative">
          <FolderIconComponent 
            className="h-4 w-4 mr-2" 
            style={{ color: folder.icon_color || '#3B82F6' }}
          />
        </div>
        
        <span className="flex-1 text-left truncate">{folder.name}</span>
        
        {showCount && (
          <div className="relative min-w-[24px] flex items-center justify-center">
            {!showButton ? (
              // 마우스 아웃: 북마크 개수 표시
              <span 
                className="text-xs text-muted-foreground transition-opacity duration-200"
                title={`${folder.bookmarkCount}개의 북마크`}
              >
                {folder.bookmarkCount}
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
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="z-50">
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit?.(folder);
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    폴더 수정
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.(folder);
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
        )}
      </Button>
    </div>
  );
}; 