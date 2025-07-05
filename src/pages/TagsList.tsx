import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tag, Search, Sparkles, TrendingUp, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

type SortOption = 'count' | 'name' | 'recent';

export default function TagsList() {
  const { tags, bookmarks, isLoading } = useBookmarks();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("count");
  
  // Calculate how many bookmarks use each tag with additional metadata
  const tagCounts = useMemo(() => {
    return tags.map(tag => {
      const relatedBookmarks = bookmarks.filter(bookmark => 
        bookmark.tags.some(t => 
          typeof t === 'string' ? t === tag.name : t.name === tag.name
        )
      );
      const count = relatedBookmarks.length;
      const recentlyUsed = relatedBookmarks.reduce((latest, bookmark) => {
        const bookmarkDate = new Date(bookmark.createdAt || 0);
        return bookmarkDate > latest ? bookmarkDate : latest;
      }, new Date(0));
      
      return { 
        ...tag, 
        count, 
        recentlyUsed,
        // Generate consistent color based on tag name
        color: generateTagColor(tag.name)
      };
    });
  }, [tags, bookmarks]);

  // Filter and sort tags
  const filteredAndSortedTags = useMemo(() => {
    let filtered = tagCounts.filter(tag => 
      tag.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (sortBy) {
      case 'count':
        return filtered.sort((a, b) => b.count - a.count);
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'recent':
        return filtered.sort((a, b) => b.recentlyUsed.getTime() - a.recentlyUsed.getTime());
      default:
        return filtered;
    }
  }, [tagCounts, searchQuery, sortBy]);

  // Generate consistent color for tags
  function generateTagColor(tagName: string): string {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    
    let hash = 0;
    for (let i = 0; i < tagName.length; i++) {
      hash = tagName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  // Get size class based on usage frequency
  function getTagSizeClass(count: number, maxCount: number): string {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'text-2xl p-6';
    if (ratio > 0.6) return 'text-xl p-5';
    if (ratio > 0.4) return 'text-lg p-4';
    if (ratio > 0.2) return 'text-base p-4';
    return 'text-sm p-3';
  }
  
  useEffect(() => {
    document.title = "태그 | linku.me";
  }, []);

  const maxCount = Math.max(...tagCounts.map(t => t.count), 1);

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            태그
          </h1>
          <p className="text-muted-foreground">
            북마크의 태그를 통해 콘텐츠를 분류하고 찾아보세요
          </p>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="태그 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="정렬 기준" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="count">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  북마크 수
                </div>
              </SelectItem>
              <SelectItem value="name">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  태그 이름
                </div>
              </SelectItem>
              <SelectItem value="recent">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  최근 사용
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results Summary */}
        {!isLoading && filteredAndSortedTags.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{filteredAndSortedTags.length}개</Badge>
            <span>태그 {searchQuery && `"${searchQuery}" 검색 결과`}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-wrap gap-3 justify-center">
            {Array.from({ length: 12 }).map((_, i) => (
              <div 
                key={i} 
                className="h-12 bg-muted animate-pulse rounded-full px-4 py-2"
                style={{ width: `${80 + Math.random() * 60}px` }}
              />
            ))}
          </div>
        ) : filteredAndSortedTags.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3">
              <Tag className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-medium">
              {searchQuery ? '검색 결과가 없습니다' : '태그가 없습니다'}
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              {searchQuery 
                ? '다른 검색어를 시도해보세요' 
                : '북마크를 추가하면 AI가 자동으로 태그를 생성합니다'
              }
            </p>
            {!searchQuery && (
              <Button className="mt-4" asChild>
                <Link to="/">북마크 추가하기</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 justify-center items-center min-h-[300px] p-4">
            {filteredAndSortedTags.map((tag) => (
              <Link
                key={tag.id}
                to={`/tags/${tag.id}`}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full transition-all duration-200 hover:scale-110 hover:shadow-lg active:scale-95",
                  "border-2 bg-background/80 backdrop-blur-sm hover:bg-background/90",
                  getTagSizeClass(tag.count, maxCount)
                )}
                style={{
                  borderColor: tag.color,
                  color: tag.color,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${tag.color}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '';
                }}
              >
                <span className="font-medium">#{tag.name}</span>
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{ 
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    border: `1px solid ${tag.color}30`
                  }}
                >
                  {tag.count}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
