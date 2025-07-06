import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  iconData, 
  getAllCategories, 
  getIconsByCategory, 
  searchIcons,
  type IconCategory,
  type IconInfo 
} from '@/lib/icons';
import { cn } from '@/lib/utils';

interface FolderIconDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIcon: string;
  onIconSelect: (iconName: string, iconCategory: string) => void;
}

export function FolderIconDialog({ 
  open, 
  onOpenChange, 
  selectedIcon, 
  onIconSelect 
}: FolderIconDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IconCategory>('default');
  
  const categories = getAllCategories();
  
  // 검색된 아이콘 또는 카테고리별 아이콘
  const displayedIcons = useMemo(() => {
    if (searchQuery.trim()) {
      return searchIcons(searchQuery);
    }
    return getIconsByCategory(selectedCategory);
  }, [searchQuery, selectedCategory]);

  const handleIconSelect = (icon: IconInfo) => {
    onIconSelect(icon.name, icon.category);
    onOpenChange(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>폴더 아이콘 선택</DialogTitle>
        </DialogHeader>
        
        {/* 검색 박스 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="아이콘 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={clearSearch}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* 검색 결과가 있을 때는 탭 숨기기 */}
        {!searchQuery.trim() ? (
          <Tabs 
            value={selectedCategory} 
            onValueChange={(value) => setSelectedCategory(value as IconCategory)}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid grid-cols-5 lg:grid-cols-7 gap-1 h-auto p-1">
              {categories.slice(0, 7).map((category) => (
                <TabsTrigger 
                  key={category.key} 
                  value={category.key}
                  className="text-xs p-2"
                >
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* 추가 카테고리가 있으면 두 번째 줄에 표시 */}
            {categories.length > 7 && (
              <TabsList className="grid grid-cols-5 lg:grid-cols-7 gap-1 h-auto p-1 mt-2">
                {categories.slice(7).map((category) => (
                  <TabsTrigger 
                    key={category.key} 
                    value={category.key}
                    className="text-xs p-2"
                  >
                    {category.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            )}

            {categories.map((category) => (
              <TabsContent 
                key={category.key} 
                value={category.key} 
                className="flex-1 min-h-0"
              >
                <IconGrid 
                  icons={getIconsByCategory(category.key)} 
                  selectedIcon={selectedIcon}
                  onIconSelect={handleIconSelect}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <div className="flex-1 min-h-0">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                "{searchQuery}"에 대한 검색 결과 ({displayedIcons.length}개)
              </p>
            </div>
            <IconGrid 
              icons={displayedIcons} 
              selectedIcon={selectedIcon}
              onIconSelect={handleIconSelect}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// 아이콘 그리드 컴포넌트
interface IconGridProps {
  icons: IconInfo[];
  selectedIcon: string;
  onIconSelect: (icon: IconInfo) => void;
}

function IconGrid({ icons, selectedIcon, onIconSelect }: IconGridProps) {
  if (icons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">검색 결과가 없습니다</p>
        <p className="text-sm text-muted-foreground">다른 키워드로 검색해보세요</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-96">
      <div className="grid grid-cols-8 lg:grid-cols-12 gap-2 p-2">
        {icons.map((icon) => {
          const IconComponent = icon.icon;
          const isSelected = selectedIcon === icon.name;
          
          return (
            <button
              key={icon.name}
              type="button"
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all duration-200",
                "hover:bg-muted hover:scale-105",
                isSelected 
                  ? "border-primary bg-primary/10 shadow-md" 
                  : "border-border",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}
              onClick={() => onIconSelect(icon)}
              title={`${icon.name} (${icon.keywords.join(', ')})`}
            >
              <IconComponent className="w-6 h-6 mb-1" />
              <span className="text-xs text-center leading-tight">
                {icon.name}
              </span>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
} 