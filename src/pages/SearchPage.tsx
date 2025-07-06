import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();
  const { bookmarks, tags, isLoading } = useBookmarks();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [searchResults, setSearchResults] = useState<Bookmark[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  
  // Categories for filter
  const categories: Category[] = ["IT", "News", "Shopping", "Community", "Education", "Entertainment", "Finance", "Health", "Travel", "Other"];
  
  // URL 쿼리 파라미터에서 검색어 가져오기
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const query = urlParams.get('q');
    if (query) {
      setSearchTerm(query);
    }
  }, [location.search]);

  useEffect(() => {
    document.title = searchTerm 
      ? `'${searchTerm}' 검색 결과 | linku.me`
      : "검색 | linku.me";
  }, [searchTerm]);
  
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

  // 검색 결과 필터링
  const filteredBookmarks = bookmarks.filter(bookmark => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      bookmark.title.toLowerCase().includes(searchLower) ||
      bookmark.description?.toLowerCase().includes(searchLower) ||
      bookmark.url.toLowerCase().includes(searchLower) ||
      bookmark.tags.some(tag => tag.name.toLowerCase().includes(searchLower))
    );
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <Layout>
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">검색</h1>
            <p className="text-muted-foreground">
              북마크를 검색하고 필터링하세요
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

        {/* 검색 입력 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="북마크 제목, 설명, URL, 태그로 검색..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10"
          />
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

        {/* 검색 결과 */}
        <div className="space-y-2">
          {searchTerm && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                '{searchTerm}'에 대한 검색 결과: {filteredBookmarks.length}개
              </p>
            </div>
          )}
          
          <BookmarkGrid 
            bookmarks={filteredBookmarks}
            isLoading={isLoading}
            emptyMessage={
              searchTerm 
                ? `'${searchTerm}'에 대한 검색 결과가 없습니다.`
                : "검색어를 입력하여 북마크를 찾아보세요."
            }
          />
        </div>
      </div>
    </Layout>
  );
}
