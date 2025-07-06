import { Bookmark } from "@/types/bookmark";
import BookmarkCard from "./BookmarkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSidebarToggle } from "@/hooks/useSidebarToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useBookmarkView } from "@/contexts/BookmarkViewContext";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { 
  ExternalLink, 
  Calendar, 
  Hash, 
  Star, 
  StickyNote, 
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  isLoading?: boolean;
  emptyMessage?: string;
}

// 리스트 뷰 컴포넌트
function BookmarkListView({ bookmarks }: { bookmarks: Bookmark[] }) {
  const { displayElements, imagePosition } = useBookmarkView();
  
  const handleBookmarkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <div className="space-y-2">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="flex items-center gap-4 p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
          onClick={() => handleBookmarkClick(bookmark.url)}
        >
          {/* 커버 이미지 - 왼쪽 */}
          {displayElements.coverImage && imagePosition === 'left' && (
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              {bookmark.image_url ? (
                <img 
                  src={bookmark.image_url} 
                  alt={bookmark.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
          )}
          
          {/* 메인 내용 */}
          <div className="flex-1 min-w-0">
            {/* 제목 */}
            {displayElements.title && (
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm truncate">{bookmark.title}</h3>
                <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              </div>
            )}
            
            {/* 설명 */}
            {displayElements.description && bookmark.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {bookmark.description}
              </p>
            )}
            
            {/* 노트 */}
            {displayElements.note && bookmark.note && (
              <div className="flex items-center gap-1 mb-2">
                <StickyNote className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground truncate">{bookmark.note}</p>
              </div>
            )}
            
            {/* 하이라이트 */}
            {displayElements.highlight && bookmark.is_favorite && (
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-xs text-yellow-600">즐겨찾기</span>
              </div>
            )}
            
            {/* 태그 */}
            {displayElements.tags && bookmark.tags && bookmark.tags.length > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <Hash className="w-3 h-3 text-muted-foreground" />
                <div className="flex gap-1 flex-wrap">
                  {bookmark.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-1 py-0">
                      {tag}
                    </Badge>
                  ))}
                  {bookmark.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      +{bookmark.tags.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* 북마크 정보 */}
            {displayElements.bookmarkInfo && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>{new Date(bookmark.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span className="truncate">{bookmark.url}</span>
              </div>
            )}
          </div>
          
          {/* 커버 이미지 - 오른쪽 */}
          {displayElements.coverImage && imagePosition === 'right' && (
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
              {bookmark.image_url ? (
                <img 
                  src={bookmark.image_url} 
                  alt={bookmark.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// 제목 뷰 컴포넌트
function BookmarkTitleView({ bookmarks }: { bookmarks: Bookmark[] }) {
  const handleBookmarkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  return (
    <div className="space-y-1">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="flex items-center gap-2 px-2 py-1 hover:bg-accent/50 rounded-md transition-colors cursor-pointer"
          onClick={() => handleBookmarkClick(bookmark.url)}
        >
          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm truncate flex-1">{bookmark.title}</span>
          <span className="text-xs text-muted-foreground truncate max-w-xs">
            {bookmark.url}
          </span>
          <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

// 무드보드 뷰 컴포넌트
function BookmarkMoodboardView({ bookmarks }: { bookmarks: Bookmark[] }) {
  const { isCollapsed } = useSidebarToggle();
  const { isAuthenticated } = useAuth();
  
  const handleBookmarkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const gridClass = isAuthenticated && isCollapsed 
    ? "grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9"
    : "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8";
  
  return (
    <div className={cn(gridClass, "gap-2")}>
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="aspect-square bg-muted rounded-lg overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer group relative"
          onClick={() => handleBookmarkClick(bookmark.url)}
        >
          {bookmark.image_url ? (
            <img 
              src={bookmark.image_url} 
              alt={bookmark.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-white text-xs font-medium line-clamp-2">
                {bookmark.title}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BookmarkGrid({ 
  bookmarks, 
  isLoading = false,
  emptyMessage = "북마크가 없습니다"
}: BookmarkGridProps) {
  const { isCollapsed } = useSidebarToggle();
  const { isAuthenticated } = useAuth();
  const { viewMode } = useBookmarkView();
  const [gridClass, setGridClass] = useState("");
  const [isLayoutAnimating, setIsLayoutAnimating] = useState(false);

  // 사이드바 상태 변경 시 그리드 레이아웃 재조정 (카드 뷰용)
  useEffect(() => {
    if (viewMode === 'card') {
      setIsLayoutAnimating(true);
      
      const newGridClass = isAuthenticated && isCollapsed 
        ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
        : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";
      
      setGridClass(newGridClass);
      
      const timer = setTimeout(() => {
        setIsLayoutAnimating(false);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isCollapsed, isAuthenticated, viewMode]);

  // 최종 그리드 클래스 (카드 뷰용)
  const finalGridClasses = cn(
    "gap-4 transition-all duration-500 ease-in-out",
    gridClass,
    isLayoutAnimating && "will-change-layout"
  );

  if (isLoading) {
    // 뷰 모드에 따른 로딩 스켈레톤
    if (viewMode === 'list') {
      return (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-card border rounded-lg">
              <Skeleton className="w-16 h-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      );
    } else if (viewMode === 'title') {
      return (
        <div className="space-y-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1">
              <Skeleton className="w-4 h-4" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      );
    } else if (viewMode === 'moodboard') {
      const moodboardGridClass = isAuthenticated && isCollapsed 
        ? "grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-7 xl:grid-cols-8 2xl:grid-cols-9"
        : "grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8";
      
      return (
        <div className={cn(moodboardGridClass, "gap-2")}>
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      );
    } else {
      // 기본 카드 뷰 스켈레톤
      return (
        <div className={finalGridClasses}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-lg overflow-hidden">
              <Skeleton className="h-32 w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <div className="pt-2 flex space-x-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-muted p-3">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-muted-foreground"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium">{emptyMessage}</h3>
      </div>
    );
  }

  // 뷰 모드에 따른 렌더링
  switch (viewMode) {
    case 'list':
      return <BookmarkListView bookmarks={bookmarks} />;
    case 'title':
      return <BookmarkTitleView bookmarks={bookmarks} />;
    case 'moodboard':
      return <BookmarkMoodboardView bookmarks={bookmarks} />;
    case 'card':
    default:
      return (
        <div className={finalGridClasses}>
          {bookmarks.map(bookmark => (
            <div key={bookmark.id} className="transition-all duration-300 ease-in-out">
              <BookmarkCard bookmark={bookmark} />
            </div>
          ))}
        </div>
      );
  }
}

