import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useBookmarks } from "@/contexts/BookmarkContext";
import Layout from "@/components/layout/Layout";
import BookmarkGrid from "@/components/bookmark/BookmarkGrid";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AddBookmarkDialog from "@/components/bookmark/AddBookmarkDialog";
import { BookmarkViewSettingsPanel } from "@/components/bookmark/BookmarkViewSettingsPanel";
import { BookmarkViewSelector } from "@/components/bookmark/BookmarkViewSelector";
import { BookmarkSortSelector } from "@/components/bookmark/BookmarkSortSelector";
import { EditFolderDialog } from "@/components/folder/EditFolderDialog";
import { Settings, Filter, Edit3 } from "lucide-react";
import { getSafeIconByName } from "@/lib/icons";

export default function FolderView() {
  const { folderId } = useParams();
  const { folders, getBookmarksByFolder, isLoading } = useBookmarks();
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [isEditFolderOpen, setIsEditFolderOpen] = useState(false);
  
  const folder = folders.find(f => f.id === folderId);
  const bookmarks = getBookmarksByFolder(folderId);

  useEffect(() => {
    document.title = folder 
      ? `${folder.name} 폴더 | linku.me` 
      : "폴더 | linku.me";
  }, [folder]);
  
  if (!folder && folderId) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <h1 className="text-2xl font-bold mb-4">폴더를 찾을 수 없습니다</h1>
          <p className="text-muted-foreground mb-8">
            요청한 폴더가 존재하지 않거나 접근 권한이 없습니다.
          </p>
          <Button asChild>
            <a href="/">홈으로 돌아가기</a>
          </Button>
        </div>
      </Layout>
    );
  }

  // 폴더 아이콘 정보
  const folderIconInfo = getSafeIconByName(folder?.icon_name || 'folder');
  const FolderIconComponent = folderIconInfo?.icon;

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              {folder && FolderIconComponent && (
                <FolderIconComponent 
                  className="h-7 w-7" 
                  style={{ color: folder.icon_color || '#3B82F6' }}
                />
              )}
              <h1 className="text-2xl font-bold tracking-tight">
                {folder ? folder.name : "모든 북마크"}
              </h1>
            </div>
            <p className="text-muted-foreground">
              {bookmarks.length}개의 북마크
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
            
            {/* 폴더 편집 버튼 (폴더가 있을 때만 표시) */}
            {folder && (
              <Button 
                variant="outline"
                size="icon"
                onClick={() => setIsEditFolderOpen(true)}
                className="h-10 w-10"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}
            
            <Button 
              onClick={() => setIsAddBookmarkOpen(true)}
              className="w-full md:w-auto"
            >
              북마크 추가
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
          bookmarks={bookmarks} 
          isLoading={isLoading}
          emptyMessage={
            folder 
              ? `${folder.name} 폴더에 북마크가 없습니다. 북마크를 추가해보세요!`
              : "북마크가 없습니다. 북마크를 추가해보세요!"
          }
        />
      </div>
      
      <AddBookmarkDialog 
        open={isAddBookmarkOpen} 
        onOpenChange={setIsAddBookmarkOpen}
        defaultFolderId={folderId} 
      />
      
      {/* 폴더 편집 다이얼로그 */}
      {folder && (
        <EditFolderDialog
          open={isEditFolderOpen}
          onOpenChange={setIsEditFolderOpen}
          folder={folder}
        />
      )}
    </Layout>
  );
}
