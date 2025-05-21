
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBookmarks } from "@/contexts/BookmarkContext";
import Layout from "@/components/layout/Layout";
import BookmarkGrid from "@/components/bookmark/BookmarkGrid";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Bookmark, LogIn } from "lucide-react";

export default function Index() {
  const { isAuthenticated, user } = useAuth();
  const { bookmarks, collections, isLoading } = useBookmarks();
  const [tab, setTab] = useState("all");

  useEffect(() => {
    document.title = "LinkBox - AI-powered Bookmark Sharing Platform";
  }, []);

  if (!isAuthenticated) {
    return (
      <Layout showSidebar={false}>
        <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
          <div className="max-w-3xl">
            <div className="mx-auto mb-6 p-3 rounded-full bg-primary/10 w-fit">
              <Bookmark className="h-8 w-8 text-primary" />
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight mb-4 bg-gradient-to-r from-linkbox-purple to-linkbox-blue text-transparent bg-clip-text">
              북마크 저장, 공유, 그리고 발견을 한곳에서
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8">
              AI가 자동으로 태그와 카테고리를 추가해주는 스마트한 북마크 관리 서비스. 가치 있는 링크를 저장하고 다른 사용자와 공유하세요.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg">
                <Link to="/signup">회원가입</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg">
                <Link to="/login">
                  <LogIn className="h-5 w-5 mr-2" />
                  로그인
                </Link>
              </Button>
            </div>
            
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              <div className="bg-card border rounded-lg p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Bookmark className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">AI 자동 분류</h3>
                <p className="text-muted-foreground">
                  URL만 입력하면 AI가 메타데이터를 추출하고 태그와 카테고리를 자동으로 설정합니다.
                </p>
              </div>
              
              <div className="bg-card border rounded-lg p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Share2Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">컬렉션 공유</h3>
                <p className="text-muted-foreground">
                  북마크를 컬렉션으로 구성하여 링크트리 스타일의 공유 페이지를 생성하세요.
                </p>
              </div>
              
              <div className="bg-card border rounded-lg p-6">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-2">공감 네트워크</h3>
                <p className="text-muted-foreground">
                  같은 북마크를 저장한 사용자를 발견하고 새로운 컨텐츠를 추천받으세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
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
          
          <Button
            asChild
            className="w-full md:w-auto"
          >
            <Link to="/bookmarks/new">
              <FileText className="mr-2 h-4 w-4" /> 북마크 추가
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="all" value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="all" className="flex-1 md:flex-initial">북마크</TabsTrigger>
            <TabsTrigger value="collections" className="flex-1 md:flex-initial">내 컬렉션</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <BookmarkGrid 
              bookmarks={bookmarks} 
              isLoading={isLoading} 
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
