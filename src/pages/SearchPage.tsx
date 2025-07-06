import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useBookmarks } from "@/contexts/BookmarkContext";
import BookmarkGrid from "@/components/bookmark/BookmarkGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bookmark, Category } from "@/types/bookmark";
import { Search, Filter, Settings } from "lucide-react";
import { BookmarkViewSettingsPanel } from "@/components/bookmark/BookmarkViewSettingsPanel";
import { BookmarkViewSelector } from "@/components/bookmark/BookmarkViewSelector";
import { BookmarkSortSelector } from "@/components/bookmark/BookmarkSortSelector";

export default function SearchPage() {
  const { bookmarks, tags, isLoading } = useBookmarks();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [searchResults, setSearchResults] = useState<Bookmark[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  
  // Categories for filter
  const categories: Category[] = ["IT", "News", "Shopping", "Community", "Education", "Entertainment", "Finance", "Health", "Travel", "Other"];
  
  useEffect(() => {
    document.title = "검색 | linku.me";
  }, []);
  
  const handleSearch = () => {
    setIsSearching(true);
    
    // Simulate search delay
    setTimeout(() => {
      let results = [...bookmarks];
      
      // Filter by search term
      if (searchTerm) {
        results = results.filter(bookmark => 
          bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      bookmark.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bookmark.url.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Filter by category
      if (selectedCategory !== "all") {
        results = results.filter(bookmark => bookmark.category === selectedCategory);
      }
      
      // Filter by tag
      if (selectedTag !== "all") {
        results = results.filter(bookmark => 
          bookmark.tags.some(tag => tag.id === selectedTag)
        );
      }
      
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
  };
  
  useEffect(() => {
    if (searchTerm || selectedCategory !== "all" || selectedTag !== "all") {
      handleSearch();
    } else {
      setSearchResults(bookmarks);
    }
  }, [bookmarks]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">검색</h1>
            <p className="text-muted-foreground">
              북마크를 검색하고 필터링하세요
            </p>
          </div>
          
          <div className="flex gap-2">
            {/* 정렬 기준 선택 */}
            <BookmarkSortSelector className="hidden md:flex" />
            
            {/* 뷰 모드 선택 (컴팩트) */}
            <BookmarkViewSelector dropdown className="hidden md:flex" />
            
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

        {/* 모바일용 정렬 기준 및 뷰 모드 선택 */}
        <div className="md:hidden space-y-4">
          <BookmarkSortSelector />
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

        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="검색어를 입력하세요"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              검색
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="w-full sm:w-auto flex-1 sm:flex-none sm:min-w-[180px]">
              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value as Category | "all")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 카테고리</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-auto flex-1 sm:flex-none sm:min-w-[180px]">
              <Select
                value={selectedTag}
                onValueChange={setSelectedTag}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="태그" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">모든 태그</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      #{tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
                setSelectedTag("all");
                setSearchResults(bookmarks);
              }}
            >
              필터 초기화
            </Button>
          </div>
        </div>
        
        <BookmarkGrid 
          bookmarks={searchResults} 
          isLoading={isLoading || isSearching}
          emptyMessage="검색 결과가 없습니다"
        />
      </div>
    </Layout>
  );
}
