import { Bookmark } from "@/types/bookmark";
import BookmarkCard from "./BookmarkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSidebarToggle } from "@/hooks/useSidebarToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useBookmarkView } from "@/contexts/BookmarkViewContext";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { 
  ExternalLink, 
  Calendar, 
  Hash, 
  Star, 
  StickyNote, 
  FileText,
  Image as ImageIcon,
  Edit,
  Trash2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import EditBookmarkDialog from "./EditBookmarkDialog";
import DeleteBookmarkDialog from "./DeleteBookmarkDialog";

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  isLoading?: boolean;
  emptyMessage?: string;
}

// 리스트 뷰 컴포넌트
function BookmarkListView({ 
  bookmarks, 
  onEdit, 
  onDelete, 
  canModify 
}: { 
  bookmarks: Bookmark[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  canModify: (bookmark: Bookmark) => boolean;
}) {
  const { displayElements, imagePosition } = useBookmarkView();
  
  const handleBookmarkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };
  
  return (
    <div className="space-y-2">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 md:p-4 bg-card border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group relative overflow-hidden bookmark-item"
          onClick={() => handleBookmarkClick(bookmark.url)}
        >
          {/* 커버 이미지 - 왼쪽 */}
          {displayElements.coverImage && imagePosition === 'left' && (
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 bookmark-image">
              {bookmark.image_url ? (
                <img 
                  src={bookmark.image_url} 
                  alt={bookmark.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-muted-foreground bookmark-icon" />
              )}
            </div>
          )}
          
          {/* 메인 내용 */}
          <div className="flex-1 min-w-0">
            {/* 제목 */}
            {displayElements.title && (
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium text-sm truncate flex-1 min-w-0 bookmark-title">{bookmark.title}</h3>
                <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              </div>
            )}
            
            {/* 설명 */}
            {displayElements.description && bookmark.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2 break-words">
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
              <div className="flex items-start gap-1 mb-2">
                <Hash className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex gap-1 flex-wrap min-w-0">
                  {bookmark.tags.slice(0, 1).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-1 py-0 truncate max-w-16 sm:max-w-20 bookmark-tag">
                      {tag}
                    </Badge>
                  ))}
                  {bookmark.tags.length > 1 && (
                    <Badge variant="secondary" className="text-xs px-1 py-0 flex-shrink-0">
                      +{bookmark.tags.length - 1}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* 북마크 정보 */}
            {displayElements.bookmarkInfo && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span className="flex-shrink-0">{new Date(bookmark.created_at).toLocaleDateString()}</span>
                <span className="flex-shrink-0">•</span>
                <span className="truncate flex-1 min-w-0">{getDomainFromUrl(bookmark.url)}</span>
              </div>
            )}
          </div>
          
          {/* 수정/삭제 버튼 */}
          {canModify(bookmark) && (
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-0.5 sm:gap-1 bg-background/80 backdrop-blur-sm rounded-md p-0.5 sm:p-1 border shadow-sm">
                                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 bookmark-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(bookmark);
                    }}
                  >
                    <Edit className="h-2.5 w-2.5 sm:h-3 sm:w-3 bookmark-icon" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 sm:h-6 sm:w-6 p-0 text-red-500 hover:text-red-700 bookmark-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(bookmark);
                    }}
                  >
                    <Trash2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 bookmark-icon" />
                  </Button>
              </div>
            </div>
          )}
          
          {/* 커버 이미지 - 오른쪽 */}
          {displayElements.coverImage && imagePosition === 'right' && (
            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 bookmark-image">
              {bookmark.image_url ? (
                <img 
                  src={bookmark.image_url} 
                  alt={bookmark.title}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 md:w-6 md:h-6 text-muted-foreground bookmark-icon" />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// 제목 뷰 컴포넌트
function BookmarkTitleView({ 
  bookmarks, 
  onEdit, 
  onDelete, 
  canModify 
}: { 
  bookmarks: Bookmark[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  canModify: (bookmark: Bookmark) => boolean;
}) {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleBookmarkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };
  
  // 동적으로 최대 너비 계산
  const getTitleMaxWidth = () => {
    const baseWidth = windowWidth;
    const reservedSpace = 120; // 아이콘 + 버튼 + 패딩 + 도메인 공간
    const availableWidth = baseWidth - reservedSpace;
    const titleRatio = 0.75; // 사용 가능한 공간의 75%를 제목에 할당
    
    return Math.max(200, Math.min(600, availableWidth * titleRatio));
  };
  
  const getDomainMaxWidth = () => {
    const baseWidth = windowWidth;
    if (baseWidth <= 500) return 70;
    if (baseWidth <= 640) return 90;
    if (baseWidth <= 768) return 110;
    return 120;
  };
  
  return (
    <div className="space-y-1">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent/50 rounded-md transition-colors cursor-pointer group relative overflow-hidden bookmark-item"
          onClick={() => handleBookmarkClick(bookmark.url)}
        >
          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          
          {/* 제목과 URL을 포함하는 메인 영역 */}
          <div className="flex-1 min-w-0 pr-16">
            <div className="flex items-center gap-2">
              <span 
                className="text-sm font-medium truncate bookmark-title flex-shrink-0"
                style={{ maxWidth: `${getTitleMaxWidth()}px` }}
              >
                {bookmark.title}
              </span>
              <span 
                className="text-xs text-muted-foreground truncate flex-shrink-0 bookmark-url"
                style={{ maxWidth: `${getDomainMaxWidth()}px` }}
              >
                {getDomainFromUrl(bookmark.url)}
              </span>
            </div>
          </div>
          
          {/* 수정/삭제 버튼 영역 - 절대 위치로 항상 보이도록 */}
          {canModify(bookmark) && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 backdrop-blur-sm rounded border">
              <div className="flex gap-0.5 p-0.5">
                                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 bookmark-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(bookmark);
                    }}
                  >
                    <Edit className="h-2.5 w-2.5 bookmark-icon" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 text-red-500 hover:text-red-700 bookmark-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(bookmark);
                    }}
                  >
                    <Trash2 className="h-2.5 w-2.5 bookmark-icon" />
                  </Button>
              </div>
            </div>
          )}
          
          {!canModify(bookmark) && (
            <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 absolute right-1 top-1/2 transform -translate-y-1/2" />
          )}
        </div>
      ))}
    </div>
  );
}

// 무드보드 뷰 컴포넌트 - Masonry 스타일
function BookmarkMoodboardView({ 
  bookmarks, 
  onEdit, 
  onDelete, 
  canModify 
}: { 
  bookmarks: Bookmark[];
  onEdit: (bookmark: Bookmark) => void;
  onDelete: (bookmark: Bookmark) => void;
  canModify: (bookmark: Bookmark) => boolean;
}) {
  const { isCollapsed } = useSidebarToggle();
  const { isAuthenticated } = useAuth();
  const { folders } = useBookmarks();
  
  const handleBookmarkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const getFolderInfo = (folderId?: string) => {
    if (!folderId) return null;
    return folders.find(f => f.id === folderId);
  };
  
  const getDomainFromUrl = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };
  
  // Masonry 스타일 - 콘텐츠에 따라 높이가 유동적으로 변하는 컬럼 레이아웃
  const columnClass = isAuthenticated && isCollapsed 
    ? "columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6"
    : "columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6";
  
  return (
    <div className={cn(columnClass, "gap-4 space-y-4")}>
      {bookmarks.map((bookmark) => {
        const folderInfo = getFolderInfo(bookmark.folder_id);
        const domain = getDomainFromUrl(bookmark.url);
        
        return (
          <div
            key={bookmark.id}
            className="bg-card border rounded-lg overflow-hidden hover:shadow-lg hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300 cursor-pointer group relative mb-4 break-inside-avoid"
            onClick={() => handleBookmarkClick(bookmark.url)}
          >
            {/* 상단 썸네일 영역 - 이미지 비율에 따라 높이 결정 */}
            <div className="relative bg-muted">
              {bookmark.image_url ? (
                <img 
                  src={bookmark.image_url} 
                  alt={bookmark.title}
                  className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                  style={{ 
                    minHeight: '120px',
                    maxHeight: '400px'
                  }}
                />
              ) : (
                <div className="w-full h-32 flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              
              {/* 수정/삭제 버튼 */}
              {canModify(bookmark) && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1 bg-background/90 backdrop-blur-sm rounded-md p-1 border shadow-sm">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(bookmark);
                      }}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(bookmark);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
              
              {/* 폴더 태그 */}
              {folderInfo && (
                <div className="absolute top-2 left-2">
                  <div className="px-2 py-1 bg-background/90 backdrop-blur-sm rounded text-xs font-medium text-foreground border shadow-sm">
                    <span style={{ color: folderInfo.icon_color }}>●</span>
                    <span className="ml-1">{folderInfo.name}</span>
                  </div>
                </div>
              )}
            </div>
            
            {/* 하단 정보 영역 - 콘텐츠에 따라 높이 조정 */}
            <div className="p-3 space-y-2">
              {/* 제목 */}
              <h3 className="font-medium text-sm leading-tight group-hover:text-primary transition-colors">
                {bookmark.title}
              </h3>
              
              {/* 도메인 */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {bookmark.favicon && (
                  <img 
                    src={bookmark.favicon} 
                    alt="" 
                    className="w-3 h-3 rounded-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <span className="truncate">{domain}</span>
              </div>
              
              {/* 설명 - 전체 텍스트 표시 (line-clamp 제거) */}
              {bookmark.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {bookmark.description}
                </p>
              )}
              
              {/* 태그 - 모든 태그 표시 */}
              {bookmark.tags && bookmark.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {bookmark.tags.slice(0, 4).map((tag, index) => (
                    <span 
                      key={index}
                      className="px-1.5 py-0.5 text-xs bg-accent/50 text-accent-foreground rounded border"
                    >
                      #{tag}
                    </span>
                  ))}
                  {bookmark.tags.length > 4 && (
                    <span className="px-1.5 py-0.5 text-xs text-muted-foreground">
                      +{bookmark.tags.length - 4}
                    </span>
                  )}
                </div>
              )}
              
              {/* 날짜 */}
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>{new Date(bookmark.created_at).toLocaleDateString()}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function BookmarkGrid({ 
  bookmarks, 
  isLoading = false,
  emptyMessage = "북마크가 없습니다"
}: BookmarkGridProps) {
  const { isCollapsed } = useSidebarToggle();
  const { isAuthenticated, user } = useAuth();
  const { viewMode, sortBy, sortOrder } = useBookmarkView();
  const [gridClass, setGridClass] = useState("");
  const [isLayoutAnimating, setIsLayoutAnimating] = useState(false);
  
  // 수정/삭제 Dialog 상태 관리
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedBookmark, setSelectedBookmark] = useState<Bookmark | null>(null);

  // 정렬된 북마크 리스트를 메모이제이션
  const sortedBookmarks = useMemo(() => {
    if (!bookmarks || bookmarks.length === 0) return [];
    
    const getDomainFromUrl = (url: string) => {
      try {
        const domain = url.replace(/https?:\/\//, '').split('/')[0];
        return domain.toLowerCase();
      } catch (error) {
        return url.toLowerCase();
      }
    };
    
    const sorted = [...bookmarks].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          const dateA = new Date(a.created_at).getTime();
          const dateB = new Date(b.created_at).getTime();
          comparison = dateA - dateB;
          break;
          
        case 'title':
          comparison = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
          break;
          
        case 'site':
          const siteA = getDomainFromUrl(a.url);
          const siteB = getDomainFromUrl(b.url);
          comparison = siteA.localeCompare(siteB);
          break;
          
        default:
          comparison = 0;
      }
      
      // 정렬 순서 적용
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  }, [bookmarks, sortBy, sortOrder]);
  
  const handleEdit = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    setEditDialogOpen(true);
  };
  
  const handleDelete = (bookmark: Bookmark) => {
    setSelectedBookmark(bookmark);
    setDeleteDialogOpen(true);
  };
  
  const canModifyBookmark = (bookmark: Bookmark) => {
    return user && bookmark.user_id === user.id;
  };

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

  // 윈도우 리사이즈 이벤트 감지하여 레이아웃 재조정
  useEffect(() => {
    const handleResize = () => {
      if (viewMode === 'card') {
        setIsLayoutAnimating(true);
        
        const newGridClass = isAuthenticated && isCollapsed 
          ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7"
          : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";
        
        setGridClass(newGridClass);
        
        setTimeout(() => {
          setIsLayoutAnimating(false);
        }, 100); // 더 빠른 반응을 위해 짧은 딜레이
      }
    };

    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
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
      const moodboardColumnClass = isAuthenticated && isCollapsed 
        ? "columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6"
        : "columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6";
      
      // Masonry 스타일의 다양한 높이를 가진 스켈레톤
      const skeletonHeights = [160, 200, 240, 180, 220, 260, 190, 210, 170, 250, 200, 230];
      
      return (
        <div className={cn(moodboardColumnClass, "gap-4 space-y-4")}>
          {Array.from({ length: 12 }).map((_, i) => {
            const randomHeight = skeletonHeights[i % skeletonHeights.length];
            return (
              <div key={i} className="bg-card border rounded-lg overflow-hidden mb-4 break-inside-avoid">
                <Skeleton 
                  className="w-full" 
                  style={{ height: `${randomHeight}px` }}
                />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  {/* 인덱스 기반으로 다양한 콘텐츠 표시 */}
                  {i % 3 !== 0 && (
                    <>
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </>
                  )}
                  {i % 4 !== 0 && (
                    <div className="flex gap-1 mt-2">
                      <Skeleton className="h-5 w-12" />
                      <Skeleton className="h-5 w-16" />
                      {i % 2 === 0 && <Skeleton className="h-5 w-14" />}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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

  if (sortedBookmarks.length === 0) {
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
  let content;
  switch (viewMode) {
    case 'list':
      content = <BookmarkListView bookmarks={sortedBookmarks} onEdit={handleEdit} onDelete={handleDelete} canModify={canModifyBookmark} />;
      break;
    case 'title':
      content = <BookmarkTitleView bookmarks={sortedBookmarks} onEdit={handleEdit} onDelete={handleDelete} canModify={canModifyBookmark} />;
      break;
    case 'moodboard':
      content = <BookmarkMoodboardView bookmarks={sortedBookmarks} onEdit={handleEdit} onDelete={handleDelete} canModify={canModifyBookmark} />;
      break;
    case 'card':
    default:
      content = (
        <div className={finalGridClasses}>
          {sortedBookmarks.map(bookmark => (
            <div key={bookmark.id} className="transition-all duration-300 ease-in-out">
              <BookmarkCard bookmark={bookmark} />
            </div>
          ))}
        </div>
      );
  }
  
  return (
    <>
      {content}
      
      {/* 수정/삭제 Dialog */}
      <EditBookmarkDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen}
        bookmark={selectedBookmark}
      />
      <DeleteBookmarkDialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen}
        bookmark={selectedBookmark}
      />
    </>
  );
}

