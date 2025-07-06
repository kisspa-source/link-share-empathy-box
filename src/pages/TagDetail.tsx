import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useBookmarks } from "@/contexts/BookmarkContext";
import BookmarkGrid from "@/components/bookmark/BookmarkGrid";
import { Button } from "@/components/ui/button";
import { Tag as TagIcon, Settings } from "lucide-react";
import { BookmarkViewSettingsPanel } from "@/components/bookmark/BookmarkViewSettingsPanel";
import { BookmarkViewSelector } from "@/components/bookmark/BookmarkViewSelector";

export default function TagDetail() {
  const { tagId } = useParams<{ tagId: string }>();
  const { bookmarks, tags, isLoading } = useBookmarks();
  const [filteredBookmarks, setFilteredBookmarks] = useState([]);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  
  const tag = tags.find(t => t.id === tagId);
  
  useEffect(() => {
    document.title = `#${tag?.name || '태그'} | linku.me`;
    
    // Filter bookmarks by tag
    const filtered = bookmarks.filter(bookmark => bookmark.tags.includes(tagId || ''));
    setFilteredBookmarks(filtered);
  }, [tagId, bookmarks, tag]);

  if (!tag && !isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">태그를 찾을 수 없습니다</h1>
            <p className="text-muted-foreground">
              요청하신 태그가 존재하지 않습니다
            </p>
          </div>
          
          <Button asChild>
            <a href="/tags">모든 태그 보기</a>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TagIcon className="h-5 w-5" />
              <h1 className="text-2xl font-bold tracking-tight">#{tag?.name}</h1>
            </div>
            <p className="text-muted-foreground">
              {filteredBookmarks.length}개의 북마크가 있습니다
            </p>
          </div>
          
          <div className="flex gap-2">
            {/* 뷰 모드 선택 (컴팩트) */}
            <BookmarkViewSelector compact className="hidden md:flex" />
            
            {/* 설정 패널 토글 버튼 */}
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

        {/* 모바일용 뷰 모드 선택 */}
        <div className="md:hidden">
          <BookmarkViewSelector />
        </div>

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

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[160px] rounded-md bg-muted animate-pulse"></div>
            ))}
          </div>
        ) : filteredBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3">
              <TagIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">북마크가 없습니다</h3>
            <p className="text-sm text-muted-foreground mt-2">
              이 태그로 분류된 북마크가 없습니다
            </p>
          </div>
        ) : (
          <BookmarkGrid bookmarks={filteredBookmarks} />
        )}
      </div>
    </Layout>
  );
}
