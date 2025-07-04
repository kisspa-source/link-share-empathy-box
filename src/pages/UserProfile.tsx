import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink } from "lucide-react";
import { fetchProfile, fetchPublicCollections } from "@/lib/supabase";
import { generateShareUrl } from "@/lib/utils";

export default function UserProfile() {
  const { userId } = useParams();
  const { user } = useAuth();

  const [profileUser, setProfileUser] = useState<{ id: string; nickname: string; avatarUrl?: string } | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isOwnProfile = user && user.id === userId;

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      <div className="container max-w-3xl mx-auto py-8 px-4">
        <div className="text-center mb-10">
          <Avatar className="h-20 w-20 mx-auto mb-4">
            <AvatarImage src={profileUser.avatarUrl} alt={profileUser.nickname} />
            <AvatarFallback>{profileUser.nickname[0]}</AvatarFallback>
          </Avatar>

          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {profileUser.nickname}의 linku.me
          </h1>
          
          {isOwnProfile && (
            <Button asChild variant="outline" className="mb-8">
              <Link to="/profile">프로필 편집</Link>
            </Button>
          )}
        </div>
        
        <h2 className="text-2xl font-semibold mb-6">컬렉션</h2>
        
        {collections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">공개된 컬렉션이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {collections.map(collection => (
              <Card key={collection.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <a 
                    href={`${window.location.origin}/c/${collection.id}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="grid md:grid-cols-[1fr_2fr] gap-0">
                      <div className="aspect-video md:aspect-square overflow-hidden">
                        {collection.coverImage ? (
                          <img 
                            src={collection.coverImage} 
                            alt={collection.name} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full bg-muted flex items-center justify-center">
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="32" 
                              height="32" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              className="text-muted-foreground"
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
                      
                      <div className="p-6 flex flex-col">
                        <h3 className="text-xl font-medium mb-2">
                          {collection.name}
                        </h3>
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {collection.description}
                        </p>
                        
                        <div className="mt-auto flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {collection.bookmarks.length}개의 북마크
                          </span>
                          <Button variant="ghost" size="sm" className="gap-1">
                            보기
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
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
  );
}
