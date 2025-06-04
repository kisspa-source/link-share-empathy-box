import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";

export default function TagsList() {
  const { tags, bookmarks, isLoading } = useBookmarks();
  
  // Calculate how many bookmarks use each tag
  const tagCounts = tags.map(tag => {
    const count = bookmarks.filter(bookmark => bookmark.tags.includes(tag.name)).length
    return { ...tag, count }
  }).sort((a, b) => b.count - a.count)
  
  useEffect(() => {
    document.title = "태그 | linku.me";
  }, []);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">태그</h1>
          <p className="text-muted-foreground">
            북마크의 태그를 통해 콘텐츠를 분류하고 찾아보세요
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : tagCounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3">
              <Tag className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">태그가 없습니다</h3>
            <p className="text-sm text-muted-foreground mt-2">
              북마크를 추가하면 AI가 자동으로 태그를 생성합니다
            </p>
            <Button className="mt-4" asChild>
              <Link to="/">북마크 추가하기</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {tagCounts.map((tag) => (
              <Link
                key={tag.id}
                to={`/tags/${tag.id}`}
                className="flex flex-col justify-between bg-card border rounded-lg p-4 hover:shadow transition-shadow"
              >
                <div className="font-medium">#{tag.name}</div>
                <div className="text-sm text-muted-foreground">
                  {tag.count}개의 북마크
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
