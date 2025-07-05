import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import FloatingNav from "@/components/layout/FloatingNav";
import { useBookmarks } from "@/contexts/BookmarkContext";
import CollectionCard from "@/components/collection/CollectionCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarToggle } from "@/hooks/useSidebarToggle";
import { collectionApi } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function CollectionsList() {
  const { collections, isLoading } = useBookmarks();
  const { session } = useAuth();
  const { isCollapsed } = useSidebarToggle();
  const [publicCollections, setPublicCollections] = useState([]);
  const [isPublicLoading, setIsPublicLoading] = useState(false);
  const [gridClass, setGridClass] = useState("");
  const [isLayoutAnimating, setIsLayoutAnimating] = useState(false);

  // 사이드바 상태에 따른 그리드 클래스 조정 (로그인한 사용자만)
  useEffect(() => {
    if (session) {
      setIsLayoutAnimating(true);
      
      const newGridClass = isCollapsed 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" // 접힘: 더 많은 컬럼
        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"; // 펼침: 기본 컬럼
      
      setGridClass(newGridClass);
      
      const timer = setTimeout(() => {
        setIsLayoutAnimating(false);
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      // 비로그인 사용자는 기본 그리드 사용
      setGridClass("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5");
    }
  }, [isCollapsed, session]);

  useEffect(() => {
    document.title = "컬렉션 | linku.me";
  }, []);

  // 비로그인 사용자를 위한 공개 컬렉션 조회
  useEffect(() => {
    if (!session) {
      const fetchPublicCollections = async () => {
        setIsPublicLoading(true);
        try {
          const data = await collectionApi.listPublic();
          setPublicCollections(data);
        } catch (error) {
          console.error('공개 컬렉션 조회 실패:', error);
        } finally {
          setIsPublicLoading(false);
        }
      };
      fetchPublicCollections();
    }
  }, [session]);

  const displayedCollections = session ? collections : publicCollections;
  const loading = session ? isLoading : isPublicLoading;

  // 최종 그리드 클래스 (애니메이션 포함)
  const finalGridClasses = cn(
    "gap-4 transition-all duration-500 ease-in-out",
    gridClass,
    isLayoutAnimating && "will-change-layout"
  );

  return (
    <>
      {!session && <FloatingNav />}
      <Layout>
        <div className={`space-y-6 ${!session ? 'pt-20' : ''}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">컬렉션</h1>
              <p className="text-muted-foreground">
                {session 
                  ? "북마크를 컬렉션으로 구성하고 공유하세요"
                  : "공개된 컬렉션을 둘러보세요"}
              </p>
            </div>
            
            {session && (
              <Button
                asChild
                className="w-full md:w-auto"
              >
                <Link to="/collections/new">
                  <Plus className="mr-2 h-4 w-4" /> 새 컬렉션
                </Link>
              </Button>
            )}
          </div>

          {loading ? (
            <div className={finalGridClasses}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card border rounded-lg overflow-hidden">
                  <div className="h-40 w-full bg-muted animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-5 w-3/4 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-full bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedCollections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="24" 
                  height="24" 
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
              <h3 className="mt-4 text-lg font-medium">
                {session ? "컬렉션이 없습니다" : "공개된 컬렉션이 없습니다"}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                {session 
                  ? "북마크를 컬렉션으로 구성하여 공유하세요"
                  : "로그인하여 나만의 컬렉션을 만들어보세요"}
              </p>
              {session ? (
                <Button asChild>
                  <Link to="/collections/new">컬렉션 만들기</Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/login">로그인하기</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className={finalGridClasses}>
              {displayedCollections.map((collection) => (
                <CollectionCard 
                  key={collection.id} 
                  collection={collection} 
                  showToggleVisibility={!!session}
                />
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
}
