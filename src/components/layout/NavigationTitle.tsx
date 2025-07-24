import { Button } from "@/components/ui/button";
import { ChevronLeft, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarNavigation } from "@/contexts/SidebarNavigationContext";

interface NavigationTitleProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
}

export const NavigationTitle = ({ title, showBackButton = false, onBack }: NavigationTitleProps) => {
  const { layerStack, activeLayerIndex, goToRoot } = useSidebarNavigation();

  return (
    <div 
      className="flex items-center justify-between p-4 border-b"
      style={{
        backgroundColor: 'white', // 라이트 모드
        ...(document.documentElement.classList.contains('dark') && {
          backgroundColor: '#020817' // 다크 모드 배경색
        })
      }}
    >
      <div className="flex items-center space-x-2">
        {/* 뒤로가기 버튼 */}
        {showBackButton && onBack && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onBack}
            title="뒤로가기"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        
        {/* 홈 버튼 (루트가 아닌 경우) */}
        {activeLayerIndex > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={goToRoot}
            title="홈으로"
          >
            <Home className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 타이틀 */}
      <div className="flex-1 text-center">
        <h2 className="text-lg font-semibold truncate">{title}</h2>
        
        {/* 레이어 스택 표시 (2개 이상인 경우) */}
        {layerStack.length > 1 && (
          <div className="flex items-center justify-center space-x-1 mt-1">
            {layerStack.slice(0, activeLayerIndex + 1).map((layer, index) => (
              <div
                key={layer.id}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-200",
                  index === activeLayerIndex 
                    ? "bg-primary" 
                    : "bg-muted-foreground/30"
                )}
                title={layer.title}
              />
            ))}
          </div>
        )}
      </div>

      {/* 우측 여백 (균형을 위해) */}
      <div className="w-16" />
    </div>
  );
}; 