import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ExternalLink, MoreHorizontal, Edit3, Trash2, Link as LinkIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Bookmark } from '@/types/bookmark';

interface BookmarkItemProps {
  bookmark: Bookmark;
  onEdit?: (bookmark: Bookmark) => void;
  onDelete?: (bookmark: Bookmark) => void;
  className?: string;
}

export const BookmarkItem = ({ 
  bookmark, 
  onEdit,
  onDelete,
  className 
}: BookmarkItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 드롭다운이 열려있을 때는 마우스 아웃되어도 버튼 상태 유지
  const showButton = isHovered || isDropdownOpen;

  // 북마크 클릭 핸들러
  const handleBookmarkClick = () => {
    window.open(bookmark.url, '_blank', 'noopener,noreferrer');
  };

  // 도메인 추출
  const getDomain = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain;
    } catch {
      return 'unknown';
    }
  };

  return (
    <div 
      className={cn("group relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Button
        variant="ghost"
        className="w-full justify-start pr-2 relative h-auto py-2"
        onClick={handleBookmarkClick}
      >
        <div className="relative">
          {bookmark.favicon ? (
            <img 
              src={bookmark.favicon} 
              alt="" 
              className="h-4 w-4 mr-2 rounded-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <LinkIcon className={cn("h-4 w-4 mr-2", bookmark.favicon ? "hidden" : "")} />
        </div>
        
        <div className="flex-1 text-left min-w-0">
          <div className="truncate font-medium text-sm">
            {bookmark.title || getDomain(bookmark.url)}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {getDomain(bookmark.url)}
          </div>
        </div>
        
        <div className="relative min-w-[24px] flex items-center justify-center">
          {!showButton ? (
            // 마우스 아웃: 외부 링크 아이콘 표시
            <ExternalLink className="h-3 w-3 text-muted-foreground transition-opacity duration-200" />
          ) : (
            // 마우스 오버 또는 드롭다운 열림: "..." 버튼 표시
            <DropdownMenu onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 p-0 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-200 rounded-sm"
                  title="북마크 메뉴"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="z-50">
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.(bookmark);
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  북마크 수정
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(bookmark);
                  }}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  북마크 삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </Button>
    </div>
  );
}; 