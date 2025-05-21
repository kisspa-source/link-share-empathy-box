
import { Collection } from "@/types/bookmark";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Share2, Lock, Unlock, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    
    await toggleCollectionPublic(collection.id);
  };
  
  const handleCopyShareUrl = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    navigator.clipboard.writeText(`https://${collection.shareUrl}`);
    toast.success("공유 URL이 클립보드에 복사되었습니다");
  };

  return (
    <Card className={cn("overflow-hidden", showToggleVisibility ? "card-hover" : "")}>
      <Link 
        to={`/collections/${collection.id}`}
        className="h-full flex flex-col"
      >
        <div className="relative">
          {collection.coverImage ? (
            <div className="aspect-video w-full overflow-hidden">
              <img 
                src={collection.coverImage} 
                alt={collection.name} 
                className="h-full w-full object-cover transition-transform hover:scale-105"
              />
            </div>
          ) : (
            <div className="aspect-video w-full bg-muted flex items-center justify-center">
              <Share2 className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          
          <Badge 
            className="absolute top-2 right-2"
            variant={collection.isPublic ? "default" : "secondary"}
          >
            {collection.isPublic ? "공개" : "비공개"}
          </Badge>
        </div>
        
        <CardContent className="p-4 flex-1">
          <h3 className="font-medium text-lg mb-1">{collection.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {collection.description}
          </p>
          
          <div className="flex items-center mt-4">
            <Avatar className="h-6 w-6 mr-2">
              <AvatarImage src={collection.userAvatar} alt={collection.userNickname} />
              <AvatarFallback>{collection.userNickname[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm">{collection.userNickname}</span>
          </div>
        </CardContent>
        
        {showToggleVisibility && (
          <CardFooter className="p-4 pt-0 flex justify-between border-t mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center"
              onClick={handleToggleVisibility}
            >
              {collection.isPublic ? (
                <>
                  <Unlock className="h-3.5 w-3.5 mr-1" />
                  <span>공개</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5 mr-1" />
                  <span>비공개</span>
                </>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="flex items-center text-muted-foreground"
              onClick={handleCopyShareUrl}
              disabled={!collection.isPublic}
            >
              <Share2 className="h-3.5 w-3.5 mr-1" />
              <span>공유</span>
            </Button>
          </CardFooter>
        )}
        
        {collection.isPublic && !showToggleVisibility && (
          <CardFooter className="p-4 pt-0 flex justify-end border-t mt-2">
            <a
              href={`https://${collection.shareUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center"
            >
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              <span>공유 페이지 보기</span>
            </a>
          </CardFooter>
        )}
      </Link>
    </Card>
  );
}
