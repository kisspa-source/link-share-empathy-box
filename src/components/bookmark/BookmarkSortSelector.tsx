import { Clock, ChevronDown, ArrowUp, ArrowDown, Type, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { useBookmarkView, SortBy, SortOrder } from '@/contexts/BookmarkViewContext';
import { cn } from '@/lib/utils';

interface SortOption {
  sortBy: SortBy;
  sortOrder: SortOrder;
  label: string;
  icon: typeof Clock;
}

const sortOptions: SortOption[] = [
  {
    sortBy: 'date',
    sortOrder: 'desc',
    label: '날짜순으로 ↑',
    icon: Clock
  },
  {
    sortBy: 'date',
    sortOrder: 'asc',
    label: '날짜순으로 ↓',
    icon: Clock
  },
  {
    sortBy: 'title',
    sortOrder: 'asc',
    label: '이름순으로 (A-Z)',
    icon: Type
  },
  {
    sortBy: 'title',
    sortOrder: 'desc',
    label: '이름순으로 (Z-A)',
    icon: Type
  },
  {
    sortBy: 'site',
    sortOrder: 'asc',
    label: '사이트 (A-Z)',
    icon: Globe
  },
  {
    sortBy: 'site',
    sortOrder: 'desc',
    label: '사이트 (Z-A)',
    icon: Globe
  }
];

interface BookmarkSortSelectorProps {
  className?: string;
}

export function BookmarkSortSelector({ className }: BookmarkSortSelectorProps) {
  const { sortBy, sortOrder, setSortSettings } = useBookmarkView();

  const handleSortChange = (newSortBy: SortBy, newSortOrder: SortOrder) => {
    setSortSettings(newSortBy, newSortOrder);
  };

  // 현재 선택된 정렬 옵션 찾기
  const currentOption = sortOptions.find(option => 
    option.sortBy === sortBy && option.sortOrder === sortOrder
  );

  const getCurrentSortIcon = () => {
    if (sortBy === 'date') return Clock;
    if (sortBy === 'title') return Type;
    if (sortBy === 'site') return Globe;
    return Clock;
  };

  const getCurrentSortLabel = () => {
    if (currentOption) return currentOption.label;
    return '날짜순으로 ↑';
  };

  const SortIcon = getCurrentSortIcon();

  return (
    <div className={cn("", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <SortIcon className="w-4 h-4" />
            <span className="text-sm">정렬기준</span>
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            정렬 기준
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {sortOptions.map((option, index) => {
            const IconComponent = option.icon;
            const isSelected = sortBy === option.sortBy && sortOrder === option.sortOrder;
            
            return (
              <DropdownMenuItem
                key={index}
                onClick={() => handleSortChange(option.sortBy, option.sortOrder)}
                className={cn(
                  "flex items-center gap-2 cursor-pointer",
                  isSelected && "bg-accent"
                )}
              >
                <div className="flex items-center gap-2 flex-1">
                  <IconComponent className="w-4 h-4" />
                  <span className="text-sm">{option.label}</span>
                </div>
                {isSelected && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 