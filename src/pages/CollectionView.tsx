
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useBookmarks } from "@/contexts/BookmarkContext";
import Layout from "@/components/layout/Layout";
import BookmarkGrid from "@/components/bookmark/BookmarkGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share2, Globe, Lock } from "lucide-react";
import { toast } from "sonner";

export default function CollectionView() {
  const { collectionId } = useParams();
  const { collections, getCollection } = useBookmarks();
  
  const collection = getCollection(collectionId || '');

  useEffect(() => {
    document.title = collection 
      ? `${collection.name} | LinkBox` 
      : "컬렉션 | LinkBox";
  }, [collection]);
  
  const handleCopyShareUrl = () => {
    if (!collection?.isPublic) {
      toast.error("비공개 컬렉션은 공유할 수 없습니다");
      return;
    }
    
    navigator.clipboard.writeText(`https://${collection.shareUrl}`);
    toast.success("공유 URL이 클립보드에 복사되었습니다");
  };
  
  if (!collection) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold mb-4">컬렉션을 찾을 수 없습니다</h1>
          <p className="text-muted-foreground mb-8">
            요청한 컬렉션이 존재하지 않거나 접근 권한이 없습니다.
          </p>
          <Button asChild>
            <Link to="/collections">컬렉션 목록으로</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col space-y-4">
          {collection.coverImage && (
            <div className="relative h-40 md:h-60 w-full overflow-hidden rounded-lg">
              <img 
                src={collection.coverImage} 
                alt={collection.name} 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              
              <div className="absolute bottom-0 left-0 p-4 text-white">
                <Badge 
                  variant={collection.isPublic ? "default" : "outline"}
                  className="mb-2"
                >
                  {collection.isPublic ? (
                    <Globe className="h-3 w-3 mr-1" />
                  ) : (
                    <Lock className="h-3 w-3 mr-1" />
                  )}
                  {collection.isPublic ? "공개" : "비공개"}
                </Badge>
              </div>
            </div>
          )}
          
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{collection.name}</h1>
                <p className="text-muted-foreground">{collection.description}</p>
                
                <div className="flex items-center mt-3">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={collection.userAvatar} alt={collection.userNickname} />
                    <AvatarFallback>{collection.userNickname[0]}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {collection.userNickname} • {new Date(collection.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              
              <Button
                onClick={handleCopyShareUrl}
                disabled={!collection.isPublic}
                variant="outline"
                className="w-full md:w-auto"
              >
                <Share2 className="mr-2 h-4 w-4" /> 공유
              </Button>
            </div>
          </div>
        </div>

        <BookmarkGrid 
          bookmarks={collection.bookmarks} 
          emptyMessage="이 컬렉션에 북마크가 없습니다"
        />
      </div>
    </Layout>
  );
}
