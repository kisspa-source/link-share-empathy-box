import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useBookmarks } from "@/contexts/BookmarkContext";
import Layout from "@/components/layout/Layout";
import BookmarkGrid from "@/components/bookmark/BookmarkGrid";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { BookmarkViewSettingsPanel } from "@/components/bookmark/BookmarkViewSettingsPanel";
import { BookmarkViewSelector } from "@/components/bookmark/BookmarkViewSelector";
import { BookmarkSortSelector } from "@/components/bookmark/BookmarkSortSelector";
import { TagIcon, Settings } from "lucide-react";

export default function TagDetail() {
  const { tagId } = useParams<{ tagId: string }>();
  const { bookmarks, tags, isLoading } = useBookmarks();
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  
  const tag = tags.find(t => t.id === tagId);
  
  // 해당 태그를 가진 북마크들만 필터링
  const filteredBookmarks = bookmarks.filter(bookmark => 
    bookmark.tags.some(t => 
      typeof t === 'string' ? t === tagId : (t as any).id === tagId
    )
  );

  useEffect(() => {
    document.title = tag 
      ? `#${tag.name} 태그 | linku.me`
      : "태그 | linku.me";
  }, [tag]);

  if (!tag) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold mb-4">태그를 찾을 수 없습니다</h1>
          <p className="text-muted-foreground">
            요청한 태그가 존재하지 않습니다.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4">
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
          
          {/* 뷰 모드 선택기와 설정 아이콘 */}
          <div className="flex gap-2">
            {/* 정렬 기준 선택 - 항상 표시 */}
            <BookmarkSortSelector />
            
            {/* 뷰 모드 선택 - 항상 표시 */}
            <BookmarkViewSelector dropdown />
            
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
          bookmarks={filteredBookmarks}
          isLoading={isLoading}
          emptyMessage={`#${tag.name} 태그가 붙은 북마크가 없습니다.`}
        />
      </div>
    </Layout>
  );
}
