import { Collection } from "@/types/bookmark";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Share2, Lock, Unlock, ExternalLink, Globe, Eye, EyeOff } from "lucide-react";
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

  return (
    <TooltipProvider>
      <Card className={cn(
        "overflow-hidden transition-all",
        showToggleVisibility ? "card-hover" : "",
        isPublic 
          ? "border-green-200 dark:border-green-800 shadow-green-100 dark:shadow-green-900/20" 
          : "border-gray-200 dark:border-gray-700"
      )}>
        <Link 
          to={`/collections/${collection.id}`}
          className="h-full flex flex-col"
        >
          <div className="relative">
            {/* Non-public overlay */}
            {!isPublic && (
              <div className="absolute inset-0 bg-black/20 z-10 flex items-center justify-center">
                <div className="bg-black/60 rounded-full p-2">
                  <Lock className="h-5 w-5 text-white" />
                </div>
              </div>
            )}
            
            {collection.coverImage ? (
              <div className="aspect-video w-full overflow-hidden">
                <img 
                  src={collection.coverImage} 
                  alt={collection.name} 
                  className={cn(
                    "h-full w-full object-cover transition-transform hover:scale-105",
                    !isPublic && "brightness-75"
                  )}
                />
              </div>
            ) : (
              <div className={cn(
                "aspect-video w-full bg-muted flex items-center justify-center",
                !isPublic && "bg-muted/60"
              )}>
                <Share2 className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  className={cn(
                    "absolute top-2 right-2 gap-1",
                    isPublic 
                      ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700"
                      : "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                  )}
                  variant="outline"
                >
                  {isPublic ? (
                    <>
                      <Globe className="h-3 w-3" />
                      공개
                    </>
                  ) : (
                    <>
                      <Lock className="h-3 w-3" />
                      비공개
                    </>
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPublic ? "누구나 볼 수 있습니다" : "본인만 볼 수 있습니다"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        
        <CardContent className="p-4 flex-1">
          <h3 className="font-medium text-lg mb-1">{collection.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {collection.description}
          </p>
          
          <div className="flex items-center mt-4">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={collection.userAvatar ?? undefined} alt={collection.userNickname ?? "닉네임 없음"} />
              <AvatarFallback>{collection.userNickname?.[0] ?? "?"}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{collection.userNickname ?? "알 수 없음"}</span>
          </div>
        </CardContent>
        
        {showToggleVisibility && (
          <CardFooter className="p-4 pt-0 flex justify-between border-t mt-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "flex items-center gap-1",
                    isPublic 
                      ? "text-green-700 hover:text-green-800 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-950"
                      : "text-gray-700 hover:text-gray-800 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800"
                  )}
                  onClick={handleToggleVisibility}
                >
                  {isPublic ? (
                    <>
                      <Eye className="h-3.5 w-3.5" />
                      <span>공개</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3.5 w-3.5" />
                      <span>비공개</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>클릭하여 {isPublic ? "비공개" : "공개"}로 변경</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "flex items-center gap-1",
                    isPublic 
                      ? "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-950"
                      : "text-muted-foreground cursor-not-allowed"
                  )}
                  onClick={handleCopyShareUrl}
                  disabled={!isPublic}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>공유</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isPublic ? "공유 URL 복사" : "공개 상태에서만 공유 가능"}</p>
              </TooltipContent>
            </Tooltip>
          </CardFooter>
        )}
        
        {collection.isPublic && !showToggleVisibility && (
          <CardFooter className="p-4 pt-0 flex flex-col items-end border-t mt-2">
            <div
              onClick={handleViewSharePage}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center mb-1 cursor-pointer"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              <span>공유 페이지 보기</span>
            </div>
            <span className="text-xs text-muted-foreground">만든 사람: {collection.userNickname ?? "알 수 없음"}</span>
          </CardFooter>
        )}
        </Link>
      </Card>
    </TooltipProvider>
  );
}
