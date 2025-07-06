import { List, Grid, FileText, Grid3X3, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useBookmarkView, ViewMode } from '@/contexts/BookmarkViewContext';
import { cn } from '@/lib/utils';

interface ViewOption {
  value: ViewMode;
  label: string;
  icon: typeof List;
  description: string;
}

const viewOptions: ViewOption[] = [
  {
    value: 'list',
    label: '리스트',
    icon: List,
    description: '테이블 형태로 상세 정보 표시'
  },
  {
    value: 'card',
    label: '카드',
    icon: Grid,
    description: '카드 형태로 시각적 표시'
  },
  {
    value: 'title',
    label: '제목',
    icon: FileText,
    description: '제목만 간단히 표시'
  },
  {
    value: 'moodboard',
    label: '무드보드',
    icon: Grid3X3,
    description: '이미지 중심의 타일 형태'
  }
];

interface BookmarkViewSelectorProps {
  className?: string;
  compact?: boolean;
  dropdown?: boolean;
}

export function BookmarkViewSelector({ className, compact = false, dropdown = false }: BookmarkViewSelectorProps) {
  const { viewMode, setViewMode } = useBookmarkView();

  const handleViewModeChange = (value: string) => {
    setViewMode(value as ViewMode);
  };

  // 드롭다운 모드: 현재 보기 방식 아이콘만 표시, 클릭 시 드롭다운 메뉴
  if (dropdown) {
    const currentOption = viewOptions.find(option => option.value === viewMode);
    const CurrentIcon = currentOption?.icon || List;
    
    return (
      <div className={cn("", className)}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-1 text-muted-foreground hover:text-foreground"
            >
              <CurrentIcon className="w-4 h-4" />
              <span className="text-sm">{currentOption?.label}</span>
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {viewOptions.map((option) => {
              const IconComponent = option.icon;
              const isSelected = viewMode === option.value;
              
              return (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setViewMode(option.value)}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    isSelected && "bg-accent"
                  )}
                >
                  <IconComponent className="w-4 h-4" />
                  <div className="flex flex-col">
                    <span className="text-sm">{option.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  if (compact) {
    // 컴팩트 모드: 아이콘만 표시
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {viewOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = viewMode === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => setViewMode(option.value)}
              className={cn(
                "p-2 rounded-md transition-colors",
                "hover:bg-muted",
                isSelected 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground"
              )}
              title={`${option.label} 뷰 - ${option.description}`}
            >
              <IconComponent className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    );
  }

  // 풀 모드: 라디오 버튼 형태
  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-medium">보기</Label>
      
      <RadioGroup 
        value={viewMode} 
        onValueChange={handleViewModeChange}
        className="space-y-2"
      >
        {viewOptions.map((option) => {
          const IconComponent = option.icon;
          
          return (
            <div key={option.value} className="flex items-center space-x-3">
              <RadioGroupItem 
                value={option.value} 
                id={`view-${option.value}`}
                className="mt-0.5"
              />
              <Label 
                htmlFor={`view-${option.value}`}
                className="flex items-center gap-2 cursor-pointer font-normal flex-1"
              >
                <IconComponent className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm">{option.label}</span>
                  {!compact && (
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  )}
                </div>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
} 