import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/layout/Layout";
import BookmarkGrid from "@/components/bookmark/BookmarkGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Share2, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import { collectionApi } from "@/lib/supabase";
import { generateShareUrl } from "@/lib/utils";
import type { Collection } from "@/types/bookmark";

export default function CollectionView() {
  const { collectionId } = useParams();
  const { user } = useAuth();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 컬렉션 데이터 로드
  useEffect(() => {
    const loadCollection = async () => {
      if (!collectionId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        const data = await collectionApi.get(collectionId);
        
        // 비로그인 상태에서는 공개 컬렉션만 접근 가능
        if (!user && !data.is_public) {
          setError("비공개 컬렉션입니다.");
          setCollection(null);
          return;
        }
        
        // 로그인 상태에서는 본인 컬렉션만 접근 가능 (비공개 컬렉션의 경우)
        if (!data.is_public && user?.id !== data.user_id) {
          setError("접근 권한이 없는 컬렉션입니다.");
          setCollection(null);
          return;
        }

        setCollection({
          id: data.id,
          name: data.name,
          description: data.description || "",
          isPublic: data.is_public,
          userId: data.user_id,
          userNickname: data.profiles?.nickname || "Unknown",
          userAvatar: data.profiles?.avatar_url,
          bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          shareUrl: generateShareUrl(data.id),
          coverImage: data.cover_image
        });
      } catch (e) {
        console.error("컬렉션 로드 오류:", e);
        setError("컬렉션을 불러오는 중 오류가 발생했습니다.");
        setCollection(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadCollection();
  }, [collectionId, user]);

  useEffect(() => {
    document.title = collection 
      ? `${collection.name} | linku.me` 
      : "컬렉션 | linku.me";
  }, [collection]);
  
  const handleCopyShareUrl = () => {
    if (!collection?.isPublic) {
      toast.error("비공개 컬렉션은 공유할 수 없습니다");
      return;
    }
    
    const shareUrl = `${window.location.origin}/c/${collection.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("공유 URL이 클립보드에 복사되었습니다");
  };
  
  if (isLoading) {
    return (
      <Layout showSidebar={!!user}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          <p className="mt-4 text-muted-foreground">컬렉션을 불러오는 중...</p>
        </div>
      </Layout>
    );
  }

  if (error || !collection) {
    return (
      <Layout showSidebar={!!user}>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold mb-4">
            {error || "컬렉션을 찾을 수 없습니다"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {!error && "요청한 컬렉션이 존재하지 않거나 접근 권한이 없습니다."}
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/collections">컬렉션 목록으로</Link>
            </Button>
            {!user && (
              <Button asChild variant="outline">
                <Link to="/login">로그인</Link>
              </Button>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSidebar={!!user}>
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
        
        {!user && collection.isPublic && (
          <div className="mt-8 p-4 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-3">
              이 컬렉션이 마음에 드시나요? linku.me에 가입하여 나만의 북마크 컬렉션을 만들어보세요!
            </p>
            <div className="flex justify-center gap-2">
              <Button asChild size="sm">
                <Link to="/signup">회원가입</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link to="/login">로그인</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
