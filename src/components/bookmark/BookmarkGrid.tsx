import { Bookmark } from "@/types/bookmark";
import BookmarkCard from "./BookmarkCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useSidebarToggle } from "@/hooks/useSidebarToggle";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export default function BookmarkGrid({ 
  bookmarks, 
  isLoading = false,
  emptyMessage = "북마크가 없습니다"
}: BookmarkGridProps) {
  const { isCollapsed } = useSidebarToggle();
  const { isAuthenticated } = useAuth();
  const [gridClass, setGridClass] = useState("");
  const [isLayoutAnimating, setIsLayoutAnimating] = useState(false);

  // 사이드바 상태 변경 시 그리드 레이아웃 재조정
  useEffect(() => {
    setIsLayoutAnimating(true);
    
    // 애니메이션 시작 시 즉시 그리드 클래스 설정
    const newGridClass = isAuthenticated && isCollapsed 
      ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7" // 접힘: 더 많은 컬럼
      : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"; // 펼침: 기본 컬럼
    
    setGridClass(newGridClass);
    
    // 애니메이션 완료 후 상태 업데이트
    const timer = setTimeout(() => {
      setIsLayoutAnimating(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [isCollapsed, isAuthenticated]);

  // 최종 그리드 클래스 (애니메이션 포함)
  const finalGridClasses = cn(
    "gap-4 transition-all duration-500 ease-in-out",
    gridClass,
    isLayoutAnimating && "will-change-layout"
  );

  if (isLoading) {
    // Show loading skeleton grid
    return (
      <div className={finalGridClasses}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg overflow-hidden transition-all duration-300 ease-in-out">
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

