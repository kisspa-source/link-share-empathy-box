import { Collection } from "@/types/bookmark";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Share2, Lock, Unlock, ExternalLink, Globe, Eye, EyeOff, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { toast } from "sonner";

interface CollectionCardProps {
  collection: Collection;
  showToggleVisibility?: boolean;
}

export default function CollectionCard({ collection, showToggleVisibility = false }: CollectionCardProps) {
  const { toggleCollectionPublic } = useBookmarks();
  
  const handleToggleVisibility = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    await toggleCollectionPublic(collection.id, !collection.isPublic);
  };
  
  const handleCopyShareUrl = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/c/${collection.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("공유 URL이 클립보드에 복사되었습니다");
  };

  const handleViewSharePage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    window.open(`${window.location.origin}/c/${collection.id}`, '_blank');
  };

  const isPublic = collection.isPublic ?? collection.is_public;

  // 북마크 이미지들을 랜덤한 위치에 배치하는 함수
  const renderBookmarkImages = () => {
    const bookmarksWithImages = collection.bookmarks?.filter(b => b.imageUrl) || [];
    const displayCount = Math.min(bookmarksWithImages.length, 6);
    
    if (displayCount === 0) return null;
    
    return (
      <div className="absolute inset-0 overflow-hidden">
        {bookmarksWithImages.slice(0, displayCount).map((bookmark, index) => (
          <div
            key={bookmark.id}
            className={cn(
              "absolute w-4 h-4 rounded-sm border border-white/20 bg-white/90 backdrop-blur-sm overflow-hidden",
              "opacity-0 group-hover:opacity-100 transition-all duration-500",
              // 랜덤한 위치 배치
              index === 0 && "top-2 left-2",
              index === 1 && "top-4 right-4",
              index === 2 && "bottom-4 left-4",
              index === 3 && "bottom-2 right-2",
              index === 4 && "top-1/2 left-1/3",
              index === 5 && "top-1/3 right-1/3"
            )}
            style={{
              transitionDelay: `${index * 100}ms`,
              transform: `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`
            }}
          >
            <img 
              src={bookmark.imageUrl} 
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <TooltipProvider>
      <Card className={cn(
        "group overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105",
        showToggleVisibility ? "hover:shadow-xl" : "hover:shadow-md",
        isPublic 
          ? "border-green-200/50 dark:border-green-800/50 hover:border-green-300 dark:hover:border-green-700" 
          : "border-border hover:border-border/80"
      )}>
        <Link 
          to={`/collections/${collection.id}`}
          className="h-full flex flex-col"
        >
          <div className="relative">
            {/* Non-public overlay */}
            {!isPublic && (
              <div className="absolute inset-0 bg-black/20 z-20 flex items-center justify-center">
                <div className="bg-black/60 rounded-full p-1.5">
                  <Lock className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
            
            {collection.coverImage ? (
              <div className="aspect-square w-full overflow-hidden relative">
                <img 
                  src={collection.coverImage} 
                  alt={collection.name} 
                  className={cn(
                    "h-full w-full object-cover transition-transform duration-300 group-hover:scale-110",
                    !isPublic && "brightness-75"
                  )}
                />
                {/* 북마크 이미지 인터랙티브 효과 */}
                {renderBookmarkImages()}
              </div>
            ) : (
              <div className={cn(
                "aspect-square w-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center relative",
                !isPublic && "from-muted/60 to-muted/40"
              )}>
                <div className="text-center">
                  <Share2 className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                  <span className="text-xs text-muted-foreground">{collection.bookmarks?.length || 0}개</span>
                </div>
                {/* 북마크 이미지 인터랙티브 효과 */}
                {renderBookmarkImages()}
              </div>
            )}
            
            {/* 공개/비공개 뱃지 */}
            <Badge 
              className={cn(
                "absolute top-2 right-2 gap-1 text-xs",
                isPublic 
                  ? "bg-green-500/90 text-white border-green-400/50 backdrop-blur-sm"
                  : "bg-gray-500/90 text-white border-gray-400/50 backdrop-blur-sm"
              )}
              variant="outline"
            >
              {isPublic ? (
                <>
                  <Globe className="h-2.5 w-2.5" />
                  공개
                </>
              ) : (
                <>
                  <Lock className="h-2.5 w-2.5" />
                  비공개
                </>
              )}
            </Badge>
          </div>
        
          <CardContent className="p-3 flex-1 flex flex-col">
            <h3 className="font-semibold text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">
              {collection.name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 flex-1">
              {collection.description || "설명이 없습니다"}
            </p>
            
            {/* 작성자 정보 */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center">
                <Avatar className="h-4 w-4 mr-1">
                  <AvatarImage src={collection.userAvatar ?? undefined} alt={collection.userNickname ?? "닉네임 없음"} />
                  <AvatarFallback className="text-xs">{collection.userNickname?.[0] ?? "?"}</AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground truncate max-w-[80px]">{collection.userNickname ?? "알 수 없음"}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                <Bookmark className="h-2.5 w-2.5 mr-1" />
                {collection.bookmarks?.length || 0}
              </Badge>
            </div>
          </CardContent>
        
          {/* 관리자 전용 버튼들 */}
          {showToggleVisibility && (
            <CardFooter className="p-2 pt-0 flex justify-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "h-6 px-2 text-xs",
                      isPublic 
                        ? "text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                        : "text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
                    )}
                    onClick={handleToggleVisibility}
                  >
                    {isPublic ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isPublic ? "비공개로 변경" : "공개로 변경"}</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                      "h-6 px-2 text-xs",
                      isPublic 
                        ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                        : "text-muted-foreground cursor-not-allowed"
                    )}
                    onClick={handleCopyShareUrl}
                    disabled={!isPublic}
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isPublic ? "공유 URL 복사" : "공개 상태에서만 공유 가능"}</p>
                </TooltipContent>
              </Tooltip>
            </CardFooter>
          )}
        </Link>
      </Card>
    </TooltipProvider>
  );
}
