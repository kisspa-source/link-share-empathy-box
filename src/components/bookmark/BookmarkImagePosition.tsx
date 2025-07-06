import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useBookmarkView, ImagePosition } from '@/contexts/BookmarkViewContext';
import { cn } from '@/lib/utils';

interface ImagePositionOption {
  value: ImagePosition;
  label: string;
  icon: typeof ChevronLeft;
  description: string;
}

const imagePositionOptions: ImagePositionOption[] = [
  {
    value: 'left',
    label: '왼쪽',
    icon: ChevronLeft,
    description: '이미지를 왼쪽에 표시'
  },
  {
    value: 'right',
    label: '오른쪽',
    icon: ChevronRight,
    description: '이미지를 오른쪽에 표시'
  }
];

interface BookmarkImagePositionProps {
  className?: string;
  compact?: boolean;
}

export function BookmarkImagePosition({ 
  className, 
  compact = false 
}: BookmarkImagePositionProps) {
  const { imagePosition, setImagePosition } = useBookmarkView();

  const handlePositionChange = (value: string) => {
    setImagePosition(value as ImagePosition);
  };

  if (compact) {
    // 컴팩트 모드: 아이콘 버튼 형태
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {imagePositionOptions.map((option) => {
          const IconComponent = option.icon;
          const isSelected = imagePosition === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => setImagePosition(option.value)}
              className={cn(
                "p-2 rounded-md transition-colors",
                "hover:bg-muted",
                isSelected 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground"
              )}
              title={`${option.label} - ${option.description}`}
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
      <Label className="text-sm font-medium">커버 이미지 위치</Label>
      
      <RadioGroup 
        value={imagePosition} 
        onValueChange={handlePositionChange}
        className="flex gap-4"
      >
        {imagePositionOptions.map((option) => {
          const IconComponent = option.icon;
          
          return (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem 
                value={option.value} 
                id={`position-${option.value}`}
              />
              <Label 
                htmlFor={`position-${option.value}`}
                className="flex items-center gap-2 cursor-pointer font-normal"
              >
                <IconComponent className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{option.label}</span>
              </Label>
            </div>
          );
        })}
      </RadioGroup>
      
      <p className="text-xs text-muted-foreground">
        리스트 뷰에서 커버 이미지가 표시될 위치를 선택합니다
      </p>
    </div>
  );
} 