import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useBookmarks } from "@/contexts/BookmarkContext";
import Layout from "@/components/layout/Layout";
import BookmarkGrid from "@/components/bookmark/BookmarkGrid";
import CollectionCard from "@/components/collection/CollectionCard";
import FloatingNav from "@/components/layout/FloatingNav";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Bookmark, LogIn, Settings, Share2 } from "lucide-react";
import { collectionApi } from "@/lib/supabase";
import type { Collection } from "@/types/bookmark";
import { BookmarkViewSettingsPanel } from "@/components/bookmark/BookmarkViewSettingsPanel";
import { BookmarkViewSelector } from "@/components/bookmark/BookmarkViewSelector";
import { BookmarkSortSelector } from "@/components/bookmark/BookmarkSortSelector";

export default function Index() {
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const { bookmarks, collections, isLoading: isBookmarksLoading } = useBookmarks();
  const [tab, setTab] = useState("all");
  const [isClient, setIsClient] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [publicCollections, setPublicCollections] = useState<Collection[]>([]);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);

  useEffect(() => {
    console.log('Index 컴포넌트 마운트됨', { isAuthenticated, isAuthLoading, user });
    document.title = "linku.me - AI-powered Bookmark Sharing Platform";

    const timer = setTimeout(() => {
      setIsClient(true);
      setInitialLoad(false);
    }, 100);

    // 백그라운드 복귀 시 스타일 재적용
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // 페이지가 다시 보이게 되었을 때 스타일 재적용
        setTimeout(() => {
          // 애니메이션과 레이아웃 강제 재계산
          const elements = document.querySelectorAll('.motion-div, [class*="motion-"], .mobile-container, .mobile-text-wrap');
          elements.forEach(el => {
            if (el instanceof HTMLElement) {
              // 스타일 재계산 강제 실행
              el.style.transform = el.style.transform;
              // 리플로우 강제 실행
              el.offsetHeight;
            }
          });

          // 백그라운드 애니메이션 재시작
          const gradientElements = document.querySelectorAll('.animate-gradient-shift, .bg-gradient-landing');
          gradientElements.forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.animationPlayState = 'running';
            }
          });
        }, 100);
      }
    };

    // 리사이즈 및 orientation change 이벤트 핸들러
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        // 모바일 뷰포트 높이 재계산 (키보드 노출/숨김 대응)
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);

        // 레이아웃 재계산 강제 실행
        const containers = document.querySelectorAll('.mobile-container');
        containers.forEach(container => {
          if (container instanceof HTMLElement) {
            container.offsetHeight; // 리플로우 강제 실행
          }
        });
      }, 150); // 디바운싱 150ms
    };

    const handleOrientationChange = () => {
      setTimeout(() => {
        handleResize();
        // orientation change 후 추가 지연으로 안정화
        setTimeout(handleResize, 500);
      }, 100);
    };

    // 초기 뷰포트 높이 설정
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleOrientationChange, { passive: true });

    return () => {
      clearTimeout(timer);
      clearTimeout(resizeTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
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
        {/* 1. Compact Hero Section */}
        <section className="relative pt-24 pb-12 md:pt-32 md:pb-16 text-center overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-landing bg-400% animate-gradient-shift opacity-10" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

          <motion.div
            className="relative z-10 max-w-4xl mx-auto px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              100% Free for Everyone
            </motion.div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-6 text-foreground">
              Linku<span className="text-blue-600">.me</span>
              <span className="block text-2xl sm:text-3xl md:text-4xl font-light text-muted-foreground mt-2">
                Your Digital Brain, <span className="text-foreground font-semibold">Organized.</span>
              </span>
            </h1>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
              <Button asChild size="lg" className="rounded-full px-8 h-12 text-base font-semibold shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5 transition-all">
                <Link to="/signup">Start for Free</Link>
              </Button>
              <Button asChild variant="ghost" size="lg" className="rounded-full px-8 h-12 text-base">
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </motion.div>
        </section>

        {/* 2. Public Collections - Main Content (Visible on ALL devices) */}
        <section id="public-collections" className="py-8 sm:py-12 bg-muted/30 min-h-[600px]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-500" />
                Trending Collections
              </h2>
              <Link to="/collections" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                View All <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>

            {isLoadingPublic ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-[4/3] bg-muted/50 rounded-xl animate-pulse" />
                    <div className="h-4 bg-muted/50 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-muted/50 rounded w-1/2 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : publicCollections.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {publicCollections.map((collection, index) => (
                  <motion.div
                    key={collection.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="h-full"
                  >
                    <CollectionCard
                      collection={collection}
                      showToggleVisibility={false}
                    />
                  </motion.div>
                ))}

                {/* "More" Card for Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="h-full min-h-[280px]"
                >
                  <Link to="/collections" className="h-full block">
                    <div className="h-full rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-blue-500/50 hover:bg-blue-50/50 transition-all flex flex-col items-center justify-center text-center p-6 bg-card/50">
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4 text-blue-600">
                        <Share2 className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1">Discover More</h3>
                      <p className="text-sm text-muted-foreground">Browse thousands of public collections</p>
                    </div>
                  </Link>
                </motion.div>
              </div>
            ) : (
              <div className="text-center py-20 px-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground">No public collections yet</h3>
                <p className="text-muted-foreground mb-6">Be the first to share your collection!</p>
                <Button asChild variant="outline">
                  <Link to="/signup">Create Collection</Link>
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* 3. Compact Features Section (Trust/Value) */}
        <section id="features" className="py-12 border-t bg-card">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mb-3">
                  <Bookmark className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">AI Auto-Tagging</h3>
                <p className="text-sm text-muted-foreground">Save links, let AI organize them.</p>
              </div>
              <div className="space-y-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-3">
                  <Share2 className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">Share to World</h3>
                <p className="text-sm text-muted-foreground">Create beautiful pages from your bookmarks.</p>
              </div>
              <div className="space-y-2">
                <div className="mx-auto w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 mb-3">
                  <Settings className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-foreground">Total Control</h3>
                <p className="text-sm text-muted-foreground">Manage privacy, layout, and more.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Simple CTA */}
        <section className="py-12 bg-foreground text-background text-center">
          <div className="px-4">
            <h2 className="text-2xl font-bold mb-4">Ready to Organize?</h2>
            <Button asChild size="lg" className="rounded-full bg-background text-foreground hover:bg-background/90 font-semibold px-8">
              <Link to="/signup">Get Started for Free</Link>
            </Button>
          </div>
        </section>
      </>
    );
  }

  return (
    <div className="space-y-4 md:desktop-content-area">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            안녕하세요, {user?.nickname}님
          </h1>
          <p className="text-muted-foreground">
            북마크와 컬렉션을 관리하세요
          </p>
        </div>

        {/* 뷰 모드 선택기와 설정 아이콘 */}
        <div className="flex gap-2">
          {/* 북마크 탭일 때만 정렬 기준과 뷰 모드 선택기 표시 */}
          {tab === "all" && (
            <>
              <BookmarkSortSelector />
              <BookmarkViewSelector dropdown />
            </>
          )}

          {/* 설정 패널 토글 버튼 - 항상 표시 */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSettingsPanelOpen(!isSettingsPanelOpen)}
            className="h-10 w-10"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="all" className="flex-1 md:flex-initial">북마크</TabsTrigger>
          <TabsTrigger value="collections" className="flex-1 md:flex-initial">내 컬렉션</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6 space-y-6">
          {/* 설정 패널 */}
          {isSettingsPanelOpen && (
            <div className="relative">
              {/* 오버레이 - 클릭 시 패널 닫기 */}
              <div
                className="fixed inset-0 z-40 bg-black/20"
                onClick={() => setIsSettingsPanelOpen(false)}
              />

              <div className="absolute right-0 top-0 w-80 z-50">
                <BookmarkViewSettingsPanel
                  onClose={() => setIsSettingsPanelOpen(false)}
                  showCloseButton={true}
                  className="bg-background border rounded-lg shadow-lg"
                />
              </div>
            </div>
          )}

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
