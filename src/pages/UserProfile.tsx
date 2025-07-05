import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import FloatingNav from "@/components/layout/FloatingNav";
import { 
  ExternalLink, 
  Share2, 
  Twitter, 
  Facebook, 
  Copy,
  Globe,
  Bookmark
} from "lucide-react";
import { fetchProfile, fetchPublicCollections } from "@/lib/supabase";
import { generateShareUrl, cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSidebarToggle } from '@/hooks/useSidebarToggle';

interface Collection {
  id: string;
  name: string;
  description?: string;
  coverImage?: string;
  bookmarks: { id: string }[];
}

interface ProfileUser {
  id: string;
  nickname: string;
  avatarUrl?: string;
}

export default function UserProfile() {
  const { userId } = useParams();
  const { user } = useAuth();
  const { isCollapsed } = useSidebarToggle();

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gridClass, setGridClass] = useState("");
  const [isLayoutAnimating, setIsLayoutAnimating] = useState(false);

  const isOwnProfile = user && user.id === userId;

  // 사이드바 상태에 따른 그리드 클래스 조정 (로그인한 사용자만)
  useEffect(() => {
    if (user) {
      setIsLayoutAnimating(true);
      
      const newGridClass = isCollapsed 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" // 접힘: 더 많은 컬럼
        : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"; // 펼침: 기본 컬럼
      
      setGridClass(newGridClass);
      
      const timer = setTimeout(() => {
        setIsLayoutAnimating(false);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      // 비로그인 사용자는 기본 그리드 사용
      setGridClass("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5");
    }
  }, [isCollapsed, user]);

  // 소셜 공유 함수들
  const handleCopyUrl = (collectionId: string, collectionName: string) => {
    const url = `${window.location.origin}/c/${collectionId}`;
    navigator.clipboard.writeText(url);
    toast.success(`"${collectionName}" 컬렉션 링크가 복사되었습니다`);
  };

  const handleShareTwitter = (collectionId: string, collectionName: string) => {
    const url = `${window.location.origin}/c/${collectionId}`;
    const text = `${collectionName} - ${profileUser?.nickname}님의 북마크 컬렉션을 확인해보세요!`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleShareFacebook = (collectionId: string) => {
    const url = `${window.location.origin}/c/${collectionId}`;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
  };

  const handleCopyProfileUrl = () => {
    const url = `${window.location.origin}/u/${userId}`;
    navigator.clipboard.writeText(url);
    toast.success('프로필 링크가 복사되었습니다');
  };

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      try {
        setIsLoading(true);
        const profile = await fetchProfile(userId);
        setProfileUser({
          id: profile.id,
          nickname: profile.nickname || '사용자',
          avatarUrl: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
        });

        const data = await fetchPublicCollections(userId);
        const formatted = (data || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description || '',
          isPublic: c.is_public,
          userId: c.user_id,
          userNickname: profile.nickname || '',
          userAvatar: profile.avatar_url || undefined,
          bookmarks: [],
          createdAt: c.created_at,
          updatedAt: c.updated_at,
          coverImage: c.cover_image,
          shareUrl: generateShareUrl(c.id)
        }));
        setCollections(formatted);
      } catch (e) {
        console.error('Failed to load profile:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [userId]);
  
  useEffect(() => {
    if (profileUser) {
      document.title = `${profileUser.nickname}의 linku.me`;
    }
  }, [profileUser]);

  if (isLoading || !profileUser) {
    return (
      <>
        {!user && <FloatingNav />}
        <div className={`flex items-center justify-center min-h-screen ${!user ? 'pt-20' : ''}`}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </>
    );
  }

  return (
    <>
      {!user && <FloatingNav />}
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
        <div className={`container max-w-7xl mx-auto py-8 px-4 ${!user ? 'pt-20' : ''}`}>
        <div className="text-center mb-10">
          <Avatar className="h-24 w-24 mx-auto mb-4 ring-4 ring-background shadow-lg">
            <AvatarImage src={profileUser.avatarUrl} alt={profileUser.nickname} />
            <AvatarFallback className="text-xl">{profileUser.nickname[0]}</AvatarFallback>
          </Avatar>

          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {profileUser.nickname}의 linku.me
          </h1>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="secondary" className="gap-1">
              <Globe className="h-3 w-3" />
              {collections.length}개의 공개 컬렉션
            </Badge>
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-6">
            {isOwnProfile && (
              <Button asChild variant="outline" size="sm">
                <Link to="/profile">프로필 편집</Link>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyProfileUrl}
              className="gap-1"
            >
              <Share2 className="h-4 w-4" />
              프로필 공유
            </Button>
          </div>
        </div>
        
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6">컬렉션</h2>
          
          {collections.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Bookmark className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">공개된 컬렉션이 없습니다.</p>
            </div>
          ) : (
            <div className={cn(
              "gap-6 transition-all duration-500 ease-in-out",
              gridClass,
              isLayoutAnimating && "will-change-layout"
            )}>
              {collections.map(collection => (
                <Card 
                  key={collection.id} 
                  className="group overflow-hidden hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer"
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      <a 
                        href={`${window.location.origin}/c/${collection.id}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="aspect-[4/3] overflow-hidden">
                          {collection.coverImage ? (
                            <img 
                              src={collection.coverImage} 
                              alt={collection.name} 
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div className="h-full w-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="48" 
                                height="48" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="1.5" 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                className="text-primary/60"
                              >
                                <circle cx="18" cy="5" r="3"></circle>
                                <circle cx="6" cy="12" r="3"></circle>
                                <circle cx="18" cy="19" r="3"></circle>
                                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                              </svg>
                            </div>
                          )}
                        </div>
                        
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                            {collection.name}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {collection.description || '설명이 없습니다.'}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary" className="gap-1">
                              <Bookmark className="h-3 w-3" />
                              {collection.bookmarks.length}개
                            </Badge>
                            <Button variant="ghost" size="sm" className="gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              보기
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </a>
                      
                      {/* 공유 버튼들 */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              handleCopyUrl(collection.id, collection.name);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              handleShareTwitter(collection.id, collection.name);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Twitter className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              handleShareFacebook(collection.id);
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Facebook className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-16 text-center text-sm text-muted-foreground">
          <p>
            <a 
              href="/" 
              className="underline hover:text-foreground"
            >
              linku.me
            </a>
            로 만들어진 페이지입니다
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
