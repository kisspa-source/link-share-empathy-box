import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBookmarks } from "@/contexts/BookmarkContext";
import Layout from "@/components/layout/Layout";
import BookmarkGrid from "@/components/bookmark/BookmarkGrid";
import CollectionCard from "@/components/collection/CollectionCard";
import FloatingNav from "@/components/layout/FloatingNav";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Bookmark, LogIn } from "lucide-react";
import { collectionApi } from "@/lib/supabase";
import type { Collection } from "@/types/bookmark";

export default function Index() {
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const { bookmarks, collections, isLoading: isBookmarksLoading } = useBookmarks();
  const [tab, setTab] = useState("all");
  const [isClient, setIsClient] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [publicCollections, setPublicCollections] = useState<Collection[]>([]);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);

  useEffect(() => {
    console.log('Index 컴포넌트 마운트됨', { isAuthenticated, isAuthLoading, user });
    document.title = "linku.me - AI-powered Bookmark Sharing Platform";
    
    const timer = setTimeout(() => {
      setIsClient(true);
      setInitialLoad(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // 로그아웃 감지
  useEffect(() => {
    if (!isAuthenticated && isAuthLoading === false) {
      setIsLoggingOut(false);
    }
  }, [isAuthenticated, isAuthLoading]);

  // 디버그용 로그
  useEffect(() => {
    console.log('인증 상태 업데이트:', { isAuthenticated, isAuthLoading, user });
  }, [isAuthenticated, isAuthLoading, user]);

  // 공개 컬렉션 로드 (비로그인 사용자용)
  useEffect(() => {
    const loadPublicCollections = async () => {
      if (!isAuthenticated && !isAuthLoading && isClient) {
        setIsLoadingPublic(true);
        try {
          const data = await collectionApi.listPublic();
          const formattedCollections: Collection[] = (data || [])
            .slice(0, 8) // 최대 8개만 표시
            .map(item => ({
              id: item.id,
              name: item.name,
              description: item.description || '',
              isPublic: item.is_public,
              userId: item.user_id,
              userNickname: item.profiles?.nickname || 'Unknown',
              userAvatar: item.profiles?.avatar_url,
              bookmarks: Array.isArray(item.bookmarks) ? item.bookmarks : [],
              createdAt: item.created_at,
              updatedAt: item.updated_at,
              shareUrl: `${window.location.origin}/c/${item.id}`,
              coverImage: item.cover_image
            }));
          setPublicCollections(formattedCollections);
        } catch (error) {
          console.error('공개 컬렉션 로드 실패:', error);
        } finally {
          setIsLoadingPublic(false);
        }
      }
    };

    loadPublicCollections();
  }, [isAuthenticated, isAuthLoading, isClient]);

  // 로그아웃 중 표시
  if (isLoggingOut) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">로그아웃 중입니다...</p>
        </div>
      </div>
    );
  }

  // 초기 로딩 또는 클라이언트 사이드 체크 중
  if (initialLoad || !isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // 인증 확인 중 로딩 표시 (최대 5초)
  if (isAuthLoading) {
    console.log('isAuthLoading', isAuthLoading);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">사용자 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    );
    console.log('isAuthLoading', isAuthLoading);
  }

  // 인증되지 않은 사용자에게 보여줄 UI
  if (!isAuthenticated) {
    return (
      <>
        <FloatingNav />
        <Layout showSidebar={false}>
          {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center min-h-[40vh] md:min-h-[45vh] text-center overflow-hidden pt-20 md:pt-24">
          {/* Video Background */}
          <div className="absolute top-14 left-0 right-0 bottom-0 w-full z-0">
            <video
              autoPlay
              loop
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover z-0"
            >
              <source src="/background/linku.me.bg.mp4" type="video/mp4" />
            </video>
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/70 to-black/80 backdrop-blur-[1px] z-1" />
          </div>
          
          {/* Top Navigation Area - FloatingNav 뒤 배경 */}
          <div className="absolute top-0 left-0 right-0 h-14 bg-background/10 backdrop-blur-sm z-2" />

          {/* Content */}
          <div className="relative z-20 max-w-4xl px-4">
            <div className="mx-auto mb-8 p-4 rounded-full bg-white/20 backdrop-blur-md w-fit animate-pulse">
              <Bookmark className="h-10 w-10 text-white" />
            </div>
            
            <h1 className="text-2xl md:text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-linkbox-blue to-white text-transparent bg-clip-text animate-gradient drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              북마크 저장, 공유, 그리고 발견을 한곳에서
            </h1>
            
            <p className="text-lg md:text-2xl text-white/90 mb-6 leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] font-medium">
              AI가 자동으로 태그와 카테고리를 추가해주는 스마트한 북마크 관리 서비스.<br />
              가치 있는 링크를 저장하고 다른 사용자와 공유하세요.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button asChild size="default" className="text-base px-6 py-3 rounded-full hover:scale-105 transition-transform bg-white text-primary hover:bg-white/90 shadow-lg">
                <Link to="/signup">무료로 시작하기</Link>
              </Button>
              <Button asChild variant="outline" size="default" className="text-base px-6 py-3 rounded-full hover:scale-105 transition-transform bg-white text-primary hover:bg-white/90 shadow-lg">
                <Link to="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  로그인
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Public Collections Section */}
        <section id="public-collections" className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">인기 컬렉션 둘러보기</h2>
              <p className="text-lg text-muted-foreground">
                다른 사용자들이 공유한 유용한 링크 컬렉션을 확인해보세요
              </p>
            </div>
            
            {isLoadingPublic ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-muted rounded-lg aspect-video mb-3"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : publicCollections.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {publicCollections.map(collection => (
                    <CollectionCard 
                      key={collection.id} 
                      collection={collection} 
                      showToggleVisibility={false}
                    />
                  ))}
                </div>
                <div className="text-center mt-12">
                  <Button asChild variant="outline" size="lg">
                    <Link to="/collections">더 많은 컬렉션 보기</Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">아직 공개된 컬렉션이 없습니다.</p>
                <Button asChild className="mt-4">
                  <Link to="/signup">첫 번째 컬렉션 만들기</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-16">여기서 모든 링크를 만나고, 저장하고, 나누세요.</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Bookmark className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">AI 자동 분류</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  URL만 입력하면 AI가 메타데이터를 추출하고 태그와 카테고리를 자동으로 설정합니다.
                </p>
              </div>
              
              <div className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Share2Icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">컬렉션 공유</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  북마크를 컬렉션으로 구성하여 링크트리 스타일의 공유 페이지를 생성하세요.
                </p>
              </div>
              
              <div className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-4">공감 네트워크</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  같은 북마크를 저장한 사용자를 발견하고 새로운 컨텐츠를 추천받으세요.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-16">이렇게 한번 써보세요! 간단해요.</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex gap-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">링크 저장</h3>
                    <p className="text-muted-foreground">브라우저 확장 프로그램이나 웹사이트에서 링크를 저장하세요.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">AI 분석</h3>
                    <p className="text-muted-foreground">AI가 자동으로 컨텐츠를 분석하고 태그를 추천합니다.</p>
                  </div>
                </div>
                <div className="flex gap-6">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">컬렉션 구성</h3>
                    <p className="text-muted-foreground">북마크를 컬렉션으로 구성하고 공유하세요.</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="aspect-video rounded-2xl bg-muted/30 overflow-hidden">
                  {/* 여기에 데모 영상이나 스크린샷을 추가할 수 있습니다 */}
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* CTA Section */}
        <section className="py-20 bg-primary/5">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">지금 바로 시작하세요</h2>
            <p className="text-xl text-muted-foreground mb-10">
              무료로 시작하고 AI 기반 북마크 관리의 편리함을 경험해보세요.
            </p>
            <Button asChild size="lg" className="text-lg px-8 py-6 rounded-full">
              <Link to="/signup">무료로 시작하기</Link>
            </Button>
          </div>
        </section>
      </Layout>
      </>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              안녕하세요, {user?.nickname}님
            </h1>
            <p className="text-muted-foreground">
              북마크와 컬렉션을 관리하세요
            </p>
          </div>
          
          
        </div>

        <Tabs defaultValue="all" value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="all" className="flex-1 md:flex-initial">북마크</TabsTrigger>
            <TabsTrigger value="collections" className="flex-1 md:flex-initial">내 컬렉션</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <BookmarkGrid 
              bookmarks={bookmarks} 
              isLoading={isBookmarksLoading} 
              emptyMessage="저장된 북마크가 없습니다. 북마크를 추가해보세요!"
            />
          </TabsContent>
          
          <TabsContent value="collections" className="mt-6">
            {collections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full bg-muted p-3">
                  <Share2Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-medium">컬렉션이 없습니다</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  북마크를 컬렉션으로 구성하여 공유하세요
                </p>
                <Button className="mt-4" asChild>
                  <Link to="/collections/new">컬렉션 만들기</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {collections.map(collection => (
                  <Link 
                    key={collection.id} 
                    to={`/collections/${collection.id}`}
                    className="collection-card"
                  >
                    {collection.coverImage ? (
                      <div className="aspect-video w-full overflow-hidden">
                        <img 
                          src={collection.coverImage} 
                          alt={collection.name} 
                          className="h-full w-full object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-muted flex items-center justify-center">
                        <Share2Icon className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium truncate">{collection.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {collection.bookmarks.length}개
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {collection.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Custom icons for examples
function Share2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function Users(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
