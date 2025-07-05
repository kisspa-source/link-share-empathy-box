import { useState } from "react";
import { Bookmark } from "@/types/bookmark";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ExternalLink,
  MoreHorizontal, 
  Trash2,
  Copy,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BookmarkCardProps {
  bookmark: Bookmark;
}

export default function BookmarkCard({ bookmark }: BookmarkCardProps) {
  const { deleteBookmark } = useBookmarks();
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [faviconLoadError, setFaviconLoadError] = useState(false);

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteBookmark(bookmark.id);
    setShowDeleteDialog(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookmark.url);
    toast.success("URL이 클립보드에 복사되었습니다");
  };

  const handleImageError = () => {
    setImageLoadError(true);
  };

  const handleFaviconError = () => {
    setFaviconLoadError(true);
  };

  // 이미지 URL 결정 (image_url을 우선적으로 사용)
  const imageUrl = bookmark.image_url || bookmark.thumbnail;
  const hasImage = imageUrl && !imageLoadError;

  // favicon 표시 여부 결정
  const shouldShowFavicon = bookmark.favicon && !faviconLoadError;

  // Generate random users who saved this bookmark (for MVP)
  const savedCount = bookmark.saved_by || 0;
  const randomUsers = Array.from({ length: Math.min(6, savedCount) }, (_, i) => ({
    id: `user-${i}`,
    nickname: ['민준', '지우', '현지', '승민', '영희', '도현', '지수', '서연', '준호'][Math.floor(Math.random() * 9)],
    avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`
  }));
  
  const categoryColors = {
    'IT': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    'News': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    'Shopping': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'Community': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    'Education': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    'Entertainment': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
    'Finance': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    'Health': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
    'Travel': 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
    'Other': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  };

  return (
    <>
      <Card className="overflow-hidden bookmark-card-hover">
        <CardContent className="p-0">
          <a 
            href={bookmark.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <div className="relative">
              {/* image_url을 우선적으로 사용하고, 없으면 thumbnail 사용 */}
              {hasImage ? (
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <img 
                    src={imageUrl} 
                    alt={bookmark.title} 
                    className="h-full w-full object-cover transition-transform hover:scale-105"
                    onError={handleImageError}
                  />
                </div>
              ) : (
                <div className="aspect-[4/3] w-full bg-muted flex items-center justify-center">
                  <ExternalLink className="h-6 w-6 text-muted-foreground" />
                  <span className="sr-only">이미지 없음</span>
                </div>
              )}
              
              <Badge 
                className={cn(
                  "absolute top-2 right-2 font-normal",
                  categoryColors[bookmark.category]
                )}
              >
                {bookmark.category}
              </Badge>
            </div>
          </a>
          
          <div className="p-3">
            <div className="flex items-center space-x-2 mb-2">
              {shouldShowFavicon ? (
                <img 
                  src={bookmark.favicon} 
                  alt="favicon" 
                  className="w-3 h-3 flex-shrink-0"
                  onError={handleFaviconError}
                />
              ) : (
                <div className="w-3 h-3 flex-shrink-0 rounded-sm bg-muted flex items-center justify-center">
                  <ExternalLink className="h-2 w-2 text-muted-foreground" />
                </div>
              )}
              <h3 className="text-sm font-medium truncate">{bookmark.title}</h3>
            </div>
            
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {bookmark.description}
            </p>
            
            {bookmark.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {bookmark.tags.slice(0, 3).map((tag, idx) => {
                  if (typeof tag === 'string') {
                    return (
                      <span key={tag} className="inline-block px-1.5 py-0.5 bg-muted rounded text-xs">#{tag}</span>
                    );
                  } else if (typeof tag === 'object' && tag !== null) {
                    const tagId = (typeof tag === 'object' && tag !== null && 'id' in tag) ? (tag as any).id : idx;
                    const tagColor = (typeof tag === 'object' && tag !== null && 'color' in tag) ? (tag as any).color : undefined;
                    const tagName = (typeof tag === 'object' && tag !== null && 'name' in tag) ? (tag as any).name : tagId;
                    return (
                      <span
                        key={tagId}
                        className="inline-block px-1.5 py-0.5 bg-muted rounded text-xs"
                        style={{
                          backgroundColor: tagColor ? `${tagColor}20` : undefined,
                          color: tagColor || undefined
                        }}
                      >
                        #{tagName}
                      </span>
                    );
                  } else {
                    return null;
                  }
                })}
                {bookmark.tags.length > 3 && (
                  <span className="inline-block px-1.5 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                    +{bookmark.tags.length - 3}
                  </span>
                )}
              </div>
            )}
            
            {bookmark.memo && (
              <div className="text-xs bg-accent/50 p-2 rounded-md mt-2">
                {bookmark.memo}
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-3 pt-0 flex justify-between items-center border-t mt-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center text-muted-foreground h-7 px-2 text-xs"
            onClick={() => setShowUserDialog(true)}
          >
            <Users className="h-3 w-3 mr-1" />
            <span>{savedCount}명</span>
          </Button>
          
          <div className="flex items-center gap-1">
            <a 
              href={bookmark.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="rounded-md p-1.5 hover:bg-accent"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={copyToClipboard}>
                  <Copy className="mr-2 h-4 w-4" />
                  URL 복사
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="mr-2 h-4 w-4" />
                  삭제
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardFooter>
      </Card>
      
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>이 북마크를 저장한 사용자</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              총 {savedCount}명이 이 북마크를 저장했습니다.
            </p>
            
            <div className="space-y-2">
              {randomUsers.map(user => (
                <div key={user.id} className="flex items-center p-2 hover:bg-accent rounded-md">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarFallback>{user.nickname[0]}</AvatarFallback>
                  </Avatar>
                  <span>{user.nickname}</span>
                </div>
              ))}
              
              {savedCount > 6 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  외 {savedCount - 6}명...
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>북마크 삭제</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-base text-muted-foreground mb-4">정말로 이 북마크를 삭제하시겠습니까?</p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                취소
              </Button>
              <Button variant="destructive" onClick={confirmDelete}>
                삭제
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
