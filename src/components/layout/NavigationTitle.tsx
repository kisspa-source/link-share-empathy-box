import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationTitleProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  className?: string;
}

export const NavigationTitle = ({ 
  title, 
  showBackButton = false, 
  onBack,
  className 
}: NavigationTitleProps) => {
  return (
    <div className={cn(
      "flex items-center gap-2 p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      {showBackButton && onBack && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onBack}
          aria-label="이전 단계로 돌아가기"
          title="이전 단계로 돌아가기"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      
      <h2 className={cn(
        "font-semibold text-lg truncate",
        showBackButton ? "flex-1" : ""
      )}>
        {title}
      </h2>
    </div>
  );
}; 