import { useState } from 'react';
import { Settings, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookmarkViewSelector } from './BookmarkViewSelector';
import { BookmarkListCustomizer } from './BookmarkListCustomizer';
import { BookmarkImagePosition } from './BookmarkImagePosition';
import { useBookmarkView } from '@/contexts/BookmarkViewContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface BookmarkViewSettingsPanelProps {
  className?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function BookmarkViewSettingsPanel({ 
  className, 
  onClose,
  showCloseButton = false
}: BookmarkViewSettingsPanelProps) {
  const { viewMode, resetToDefaults, isLoading } = useBookmarkView();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetToDefaults = async () => {
    setIsResetting(true);
    try {
      resetToDefaults();
      toast.success('설정이 기본값으로 재설정되었습니다.');
    } catch (error) {
      toast.error('설정 재설정 중 오류가 발생했습니다.');
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("p-4 space-y-4", className)}>
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 animate-spin" />
          <span className="text-sm text-muted-foreground">설정 로드 중...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("bg-background border rounded-lg shadow-lg", className)}>
      {/* 헤더 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <h3 className="font-medium text-base">북마크 뷰 설정</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetToDefaults}
              disabled={isResetting}
              className="text-xs h-7"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              {isResetting ? '재설정 중...' : '기본값'}
            </Button>
            
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 설정 내용 */}
      <ScrollArea className="h-[calc(100vh-200px)] min-h-[400px] max-h-[500px]">
        <div className="p-4 space-y-6">
          {/* 뷰 모드 선택 */}
          <BookmarkViewSelector />

          <Separator />

          {/* 리스트 뷰 전용 설정 */}
          {viewMode === 'list' && (
            <>
              <BookmarkListCustomizer />
              <Separator />
              <BookmarkImagePosition />
            </>
          )}

          {/* 카드 뷰 전용 설정 */}
          {viewMode === 'card' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">카드 뷰 설정</h4>
              <p className="text-xs text-muted-foreground">
                카드 뷰에서는 썸네일 이미지와 제목이 기본으로 표시됩니다.
              </p>
              <BookmarkImagePosition />
            </div>
          )}

          {/* 제목 뷰 전용 설정 */}
          {viewMode === 'title' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">제목 뷰 설정</h4>
              <p className="text-xs text-muted-foreground">
                제목 뷰에서는 북마크 제목과 URL만 간단히 표시됩니다.
              </p>
            </div>
          )}

          {/* 무드보드 뷰 전용 설정 */}
          {viewMode === 'moodboard' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">무드보드 뷰 설정</h4>
              <p className="text-xs text-muted-foreground">
                무드보드 뷰에서는 이미지를 중심으로 한 타일 형태로 표시됩니다.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 푸터 */}
      <div className="p-4 border-t bg-muted/50">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>설정은 자동으로 저장됩니다</span>
          <span>현재 뷰: {
            viewMode === 'list' ? '리스트' :
            viewMode === 'card' ? '카드' :
            viewMode === 'title' ? '제목' :
            '무드보드'
          }</span>
        </div>
      </div>
    </div>
  );
} 