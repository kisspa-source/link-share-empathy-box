
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useBookmarks } from "@/contexts/BookmarkContext";
import Layout from "@/components/layout/Layout";
import BookmarkGrid from "@/components/bookmark/BookmarkGrid";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AddBookmarkDialog from "@/components/bookmark/AddBookmarkDialog";

export default function FolderView() {
  const { folderId } = useParams();
  const { folders, getBookmarksByFolder, isLoading } = useBookmarks();
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);
  
  const folder = folders.find(f => f.id === folderId);
  const bookmarks = getBookmarksByFolder(folderId);

  useEffect(() => {
    document.title = folder 
      ? `${folder.name} 폴더 | LinkBox` 
      : "폴더 | LinkBox";
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {folder ? folder.name : "모든 북마크"}
            </h1>
            <p className="text-muted-foreground">
              {bookmarks.length}개의 북마크
            </p>
          </div>
          
          <Button 
            onClick={() => setIsAddBookmarkOpen(true)}
            className="w-full md:w-auto"
          >
            북마크 추가
          </Button>
        </div>

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
      />
    </Layout>
  );
}
