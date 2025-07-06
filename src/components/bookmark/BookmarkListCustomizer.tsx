import { useState } from 'react';
import { Image, FileText, StickyNote, AlignLeft, Star, Hash, Info, Settings } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useBookmarkView, DisplayElements } from '@/contexts/BookmarkViewContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface DisplayElementOption {
  key: keyof DisplayElements;
  label: string;
  icon: typeof Image;
  description: string;
}

const displayElementOptions: DisplayElementOption[] = [
  {
    key: 'coverImage',
    label: '커버 이미지',
    icon: Image,
    description: '북마크 썸네일 이미지'
  },
  {
    key: 'title',
    label: '제목',
    icon: FileText,
    description: '북마크 제목'
  },
  {
    key: 'note',
    label: '노트',
    icon: StickyNote,
    description: '사용자 작성 메모'
  },
  {
    key: 'description',
    label: '설명',
    icon: AlignLeft,
    description: '북마크 설명 및 메타 정보'
  },
  {
    key: 'highlight',
    label: '하이라이트',
    icon: Star,
    description: '중요 표시 및 즐겨찾기'
  },
  {
    key: 'tags',
    label: '태그',
    icon: Hash,
    description: '분류 태그 목록'
  },
  {
    key: 'bookmarkInfo',
    label: '북마크 정보',
    icon: Info,
    description: '생성일, 수정일 등 메타 데이터'
  }
];

interface BookmarkListCustomizerProps {
  className?: string;
  showApplyButton?: boolean;
}

export function BookmarkListCustomizer({ 
  className, 
  showApplyButton = true 
}: BookmarkListCustomizerProps) {
  const { displayElements, setDisplayElements } = useBookmarkView();
  const [isApplying, setIsApplying] = useState(false);

  const handleElementChange = (key: keyof DisplayElements, checked: boolean) => {
    setDisplayElements({ [key]: checked });
  };

  const handleSelectAll = () => {
    const allTrue: DisplayElements = {
      coverImage: true,
      title: true,
      note: true,
      description: true,
      highlight: true,
      tags: true,
      bookmarkInfo: true,
    };
    setDisplayElements(allTrue);
    toast.success('모든 요소가 선택되었습니다.');
  };

  const handleDeselectAll = () => {
    const allFalse: DisplayElements = {
      coverImage: false,
      title: false,
      note: false,
      description: false,
      highlight: false,
      tags: false,
      bookmarkInfo: false,
    };
    setDisplayElements(allFalse);
    toast.success('모든 요소가 해제되었습니다.');
  };

  const handleApplyToAll = async () => {
    setIsApplying(true);
    try {
      // 여기서는 현재 설정이 이미 localStorage에 저장되므로
      // 추가적인 로직이 필요하다면 구현
      await new Promise(resolve => setTimeout(resolve, 500)); // 시뮬레이션
      toast.success('설정이 모든 컬렉션에 적용되었습니다.');
    } catch (error) {
      toast.error('설정 적용 중 오류가 발생했습니다.');
    } finally {
      setIsApplying(false);
    }
  };

  const selectedCount = Object.values(displayElements).filter(Boolean).length;
  const totalCount = displayElementOptions.length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">보기 in 리스트</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {selectedCount}/{totalCount} 선택됨
          </span>
          <Settings className="w-3 h-3 text-muted-foreground" />
        </div>
      </div>

      {/* 빠른 선택 버튼들 */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          className="text-xs h-7"
        >
          전체 선택
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDeselectAll}
          className="text-xs h-7"
        >
          전체 해제
        </Button>
      </div>

      <Separator />

      {/* 체크박스 목록 */}
      <div className="space-y-3">
        {displayElementOptions.map((option) => {
          const IconComponent = option.icon;
          const isChecked = displayElements[option.key];
          
          return (
            <div key={option.key} className="flex items-center space-x-3">
              <Checkbox
                id={`element-${option.key}`}
                checked={isChecked}
                onCheckedChange={(checked) => 
                  handleElementChange(option.key, checked as boolean)
                }
              />
              <Label 
                htmlFor={`element-${option.key}`}
                className="flex items-center gap-2 cursor-pointer font-normal flex-1"
              >
                <IconComponent className="w-4 h-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm">{option.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </div>
              </Label>
            </div>
          );
        })}
      </div>

      {/* 모든 곳에 적용 버튼 */}
      {showApplyButton && (
        <>
          <Separator />
          <Button
            onClick={handleApplyToAll}
            disabled={isApplying}
            className="w-full"
            size="sm"
          >
            {isApplying ? '적용 중...' : '모두 적용하기'}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            현재 설정을 모든 컬렉션과 폴더에 적용합니다
          </p>
        </>
      )}
    </div>
  );
} 