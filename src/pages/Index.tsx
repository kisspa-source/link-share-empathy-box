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
        <Layout showSidebar={false}>
          {/* Hero Section - New Gradient Design */}
        <section className="relative flex flex-col items-center justify-center min-h-screen md:desktop-vh-fix mobile-min-vh-screen text-center overflow-hidden mobile-keyboard-safe">
          {/* Animated Gradient Background */}
          <div className="absolute inset-0 bg-gradient-landing bg-400% animate-gradient-shift" />
          
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />
          
          {/* Top Navigation Area - FloatingNav 뒤 배경 */}
          <div className="absolute top-0 left-0 right-0 h-16 sm:h-14 bg-background/5 backdrop-blur-sm z-10" />

          {/* Content */}
          <motion.div 
            className="relative z-20 max-w-5xl px-4 sm:px-6 lg:px-4 w-full pt-16 sm:pt-8 mobile-container"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            {/* Icon with floating animation */}
            <motion.div 
              className="mx-auto mb-6 sm:mb-8 p-4 sm:p-6 lg:p-8 rounded-full bg-white/10 backdrop-blur-md w-fit border border-white/20"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Bookmark className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 xl:h-14 xl:w-14 text-white" />
            </motion.div>
            
            {/* Main Headline */}
            <motion.h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold tracking-tight mb-6 sm:mb-8 lg:mb-10 text-white leading-tight px-2 sm:px-0 mobile-headline-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent block mb-2 mobile-headline-wrap">
                북마크 저장, 공유, 그리고 발견을
              </span>
              <span className="bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 bg-clip-text text-transparent block mobile-headline-wrap">
                한곳에서
              </span>
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p 
              className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl text-white/90 mb-8 sm:mb-10 lg:mb-12 leading-relaxed font-light max-w-4xl mx-auto px-2 sm:px-0 mobile-text-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              AI가 자동으로 태그와 카테고리를 추가해주는
              <br className="block sm:hidden" />
              <span className="hidden sm:inline"> </span>
              스마트한 북마크 관리 서비스
              <br className="hidden sm:block" />
              <span className="block sm:hidden mt-2" />
              가치 있는 링크를 저장하고 다른 사용자와 공유하세요
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center w-full px-4 sm:px-2 mobile-container"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto max-w-sm sm:max-w-none"
              >
                <Button asChild size="lg" className="text-base sm:text-lg lg:text-xl px-8 sm:px-10 py-4 sm:py-5 lg:py-6 rounded-full bg-white text-gray-900 hover:bg-gray-100 shadow-2xl font-semibold border-0 w-full sm:w-auto min-w-[200px] sm:min-w-[220px] h-14 sm:h-16">
                  <Link to="/signup">무료로 시작하기</Link>
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto max-w-sm sm:max-w-none"
              >
                <Button asChild variant="outline" size="lg" className="text-base sm:text-lg lg:text-xl px-8 sm:px-10 py-4 sm:py-5 lg:py-6 rounded-full bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-md font-semibold w-full sm:w-auto min-w-[180px] h-14 sm:h-16">
                  <Link to="/login">
                    <LogIn className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
                    로그인
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Floating particles effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-white/20 rounded-full"
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${30 + (i % 3) * 20}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.8, 0.3],
                }}
                transition={{
                  duration: 3 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        </section>

        {/* Public Collections Section - Horizontal Scroll Carousel */}
        <section id="public-collections" className="py-12 sm:py-16 lg:py-20 xl:py-24 bg-gradient-to-b from-background to-muted/30">
          <div className="max-w-7xl mx-auto">
            <motion.div 
              className="text-center mb-8 sm:mb-12 lg:mb-16 px-4 sm:px-6 lg:px-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <motion.div 
                className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 rounded-full bg-gradient-to-br from-landing-accent-purple to-landing-accent-blue mb-3 sm:mb-4 lg:mb-6 shadow-lg"
                whileHover={{ scale: 1.1, rotate: 360 }}
                transition={{ duration: 0.3 }}
              >
                <Share2 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-white" />
              </motion.div>
              <motion.h2 
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 sm:mb-4 lg:mb-6 bg-gradient-to-r from-primary via-landing-accent-purple to-primary bg-clip-text text-transparent px-2 sm:px-0"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                인기 컬렉션 둘러보기
              </motion.h2>
              <motion.p 
                className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2 sm:px-0"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                다른 사용자들이 공유한 유용한 링크 컬렉션을 확인해보세요
                <br className="hidden sm:inline" />
                새로운 아이디어와 영감을 발견할 수 있습니다
              </motion.p>
            </motion.div>
            
            {isLoadingPublic ? (
              <div className="px-6 sm:px-8 lg:px-4">
                <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 scrollbar-hide">
                  {[...Array(8)].map((_, i) => (
                    <motion.div 
                      key={i} 
                      className="flex-none w-72 sm:w-80 animate-pulse"
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                    >
                      <div className="bg-muted rounded-2xl aspect-[4/3] mb-4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ) : publicCollections.length > 0 ? (
              <>
                <div className="px-4 sm:px-6 lg:px-4 mobile-container">
                  <motion.div 
                    className="flex gap-3 sm:gap-4 lg:gap-6 overflow-x-auto pb-4 sm:pb-6 scrollbar-hide"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                      WebkitOverflowScrolling: 'touch'
                    }}
                  >
                    {publicCollections.map((collection, index) => (
                      <motion.div
                        key={collection.id}
                        className="flex-none w-64 sm:w-72 lg:w-80 group"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        whileHover={{ y: -8 }}
                      >
                        <div className="relative overflow-hidden rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 p-4 sm:p-6 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500">
                          <div className="absolute inset-0 bg-gradient-to-br from-landing-accent-purple/5 via-landing-accent-blue/5 to-landing-accent-pink/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          
                          <CollectionCard 
                            collection={collection} 
                            showToggleVisibility={false}
                          />
                          
                          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                              <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* View More Card */}
                    <motion.div
                      className="flex-none w-80"
                      initial={{ opacity: 0, x: 50 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: publicCollections.length * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Link to="/collections">
                        <motion.div 
                          className="h-full rounded-2xl bg-gradient-to-br from-landing-accent-purple/10 to-landing-accent-blue/10 border border-dashed border-primary/30 p-8 flex flex-col items-center justify-center text-center hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 group"
                          whileHover={{ scale: 1.02, y: -8 }}
                        >
                          <motion.div 
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-landing-accent-purple to-landing-accent-blue flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Share2 className="w-8 h-8 text-white" />
                          </motion.div>
                          <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">더 많은 컬렉션</h3>
                          <p className="text-muted-foreground text-sm">모든 공개 컬렉션을 확인해보세요</p>
                        </motion.div>
                      </Link>
                    </motion.div>
                  </motion.div>
                </div>
                
                {/* Scroll Indicator */}
                <div className="flex justify-center mt-8 px-4">
                  <motion.p 
                    className="text-sm text-muted-foreground flex items-center gap-2"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    viewport={{ once: true }}
                  >
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      ←
                    </motion.span>
                    좌우로 스크롤해서 더 많은 컬렉션을 확인하세요
                    <motion.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </motion.p>
                </div>
              </>
            ) : (
              <motion.div 
                className="text-center py-12 sm:py-16 px-6 sm:px-8 lg:px-4"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <motion.div 
                  className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted mb-4 sm:mb-6"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <Share2 className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                </motion.div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">아직 공개된 컬렉션이 없습니다</h3>
                <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8 max-w-md mx-auto">
                  지금 가입하여 첫 번째 컬렉션을 만들고 다른 사용자들과 공유해보세요!
                </p>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button asChild className="px-6 sm:px-8 py-2 sm:py-3 rounded-full shadow-lg hover:shadow-xl text-sm sm:text-base">
                    <Link to="/signup">
                      <Bookmark className="w-4 h-4 mr-2" />
                      첫 번째 컬렉션 만들기
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </div>
        </section>

        {/* Features Section - Enhanced Grid Layout */}
        <section id="features" className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-background via-muted/30 to-background">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-4 mobile-container">
            <motion.div 
              className="text-center mb-12 sm:mb-16 lg:mb-20"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <motion.h2 
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent mobile-headline-wrap"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
              >
                여기서 모든 링크를 만나고, 저장하고, 나누세요
              </motion.h2>
              <motion.p 
                className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto mobile-text-wrap"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
              >
                링크 관리의 새로운 경험을 만나보세요
              </motion.p>
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {/* Feature 1 - AI Auto Classification */}
              <motion.div 
                className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-6 sm:p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-landing-accent-purple/5 to-landing-accent-blue/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.div 
                  className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-landing-accent-purple to-landing-accent-blue flex items-center justify-center mb-4 sm:mb-6 shadow-lg"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Bookmark className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </motion.div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 group-hover:text-primary transition-colors">AI 자동 분류</h3>
                <p className="text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed">
                  URL만 입력하면 AI가 메타데이터를 추출하고 태그와 카테고리를 자동으로 설정합니다.
                </p>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                  </div>
                </div>
              </motion.div>
              
              {/* Feature 2 - Collection Sharing */}
              <motion.div 
                className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-6 sm:p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-landing-accent-blue/5 to-landing-accent-pink/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.div 
                  className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-landing-accent-blue to-landing-accent-pink flex items-center justify-center mb-4 sm:mb-6 shadow-lg"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Share2Icon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </motion.div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 group-hover:text-primary transition-colors">컬렉션 공유</h3>
                <p className="text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed">
                  북마크를 컬렉션으로 구성하여 링크트리 스타일의 공유 페이지를 생성하세요.
                </p>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                  </div>
                </div>
              </motion.div>
              
              {/* Feature 3 - Empathy Network */}
              <motion.div 
                className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-3xl p-6 sm:p-8 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 md:col-span-2 lg:col-span-1"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-landing-accent-pink/5 to-landing-accent-purple/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.div 
                  className="relative h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-gradient-to-br from-landing-accent-pink to-landing-accent-purple flex items-center justify-center mb-4 sm:mb-6 shadow-lg"
                  whileHover={{ rotate: [0, -10, 10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </motion.div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 group-hover:text-primary transition-colors">공감 네트워크</h3>
                <p className="text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed">
                  같은 북마크를 저장한 사용자를 발견하고 새로운 컨텐츠를 추천받으세요.
                </p>
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-primary animate-pulse" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 sm:py-20">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-4">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-center mb-12 sm:mb-16">이렇게 한번 써보세요! 간단해요.</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center">
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
