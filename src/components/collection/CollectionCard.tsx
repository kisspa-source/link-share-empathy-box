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

  const isPublic = collection.isPublic;

  // Get bookmarks with images for preview
  // Fix: use image_url instead of imageUrl based on lint error
  const bookmarksWithImages = collection.bookmarks?.filter(b => b.image_url) || [];
  const displayImages = bookmarksWithImages.slice(0, 4);
  const remainingCount = Math.max(0, (collection.bookmarks?.length || 0) - 4);

  return (
    <TooltipProvider>
      <Card className={cn(
        "group h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card/60 backdrop-blur-sm border-muted/40",
        showToggleVisibility ? "hover:shadow-xl" : "hover:shadow-md",
        isPublic
          ? "border-green-200/30 dark:border-green-800/30"
          : "border-border/50"
      )}>
        <Link
          to={`/collections/${collection.id}`}
          className="flex-1 flex flex-col p-5"
        >
          {/* Header: User Info & Status */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6 border border-border">
                <AvatarImage src={collection.userAvatar ?? undefined} />
                <AvatarFallback className="text-[10px]">{collection.userNickname?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground font-medium truncate max-w-[100px]">
                {collection.userNickname ?? "Anonymous"}
              </span>
            </div>

            {showToggleVisibility && (
              <Badge
                variant={isPublic ? "default" : "secondary"}
                className={cn("text-[10px] px-1.5 h-5 font-normal", isPublic ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "")}
              >
                {isPublic ? "Public" : "Private"}
              </Badge>
            )}
            {!showToggleVisibility && (
              <Badge variant="secondary" className="text-[10px] px-1.5 h-5 font-normal bg-muted text-muted-foreground">
                {collection.bookmarks?.length || 0} items
              </Badge>
            )}
          </div>

          {/* Title & Description */}
          <div className="mb-6 flex-1">
            <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {collection.name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {collection.description || "No description provided."}
            </p>
          </div>

          {/* Visual Preview (Stacked Images) */}
          <div className="mt-auto">
            <div className="flex items-center pl-2">
              {displayImages.length > 0 ? (
                <>
                  {displayImages.map((bookmark, idx) => (
                    <div
                      key={bookmark.id}
                      className="relative w-10 h-10 rounded-full border-2 border-background overflow-hidden -ml-3 first:ml-0 transition-transform hover:scale-110 hover:z-10 bg-muted"
                      style={{ zIndex: 5 - idx }}
                    >
                      <img
                        src={bookmark.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {remainingCount > 0 && (
                    <div className="relative w-10 h-10 rounded-full border-2 border-background bg-muted flex items-center justify-center -ml-3 z-0 text-xs font-medium text-muted-foreground">
                      +{remainingCount}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground/50 text-sm italic">
                  <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center border border-border/50">
                    <Bookmark className="w-3 h-3" />
                  </div>
                  <span>No previews</span>
                </div>
              )}
            </div>
          </div>
        </Link>

        {/* Admin Actions Footer */}
        {showToggleVisibility && (
          <div className="px-3 py-2 border-t border-border/50 flex justify-between items-center bg-muted/20">
            <span className="text-xs text-muted-foreground ml-1">
              {collection.bookmarks?.length || 0} bookmarks
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleToggleVisibility}
              >
                {isPublic ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopyShareUrl}
                disabled={!isPublic}
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </TooltipProvider>
  );
}
