import { ReactNode, useState, useEffect, useCallback, useMemo } from "react";
import Header from "./Header";
import { PreziSidebar } from "./PreziSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useSidebarToggle } from "@/hooks/useSidebarToggle";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export default function Layout({ children, showSidebar = true }: LayoutProps) {
  const { isAuthenticated } = useAuth();
  const { isCollapsed } = useSidebarToggle();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // 컨테이너 클래스를 메모이제이션으로 최적화
  const containerClass = useMemo(() => {
    if (!isAuthenticated || !showSidebar) {
      return "container max-w-7xl px-4";
    }
    return isCollapsed 
      ? "container max-w-full px-6" // 접힘: 더 넓은 공간 활용
      : "container max-w-6xl px-4"; // 펼침: 적당한 컨테이너 크기
  }, [isAuthenticated, showSidebar, isCollapsed]);

  // 리사이즈 이벤트 디바운싱으로 성능 최적화
  const triggerResizeEvent = useCallback(() => {
    // 중복 호출 방지를 위한 디바운싱
    let timeoutId: NodeJS.Timeout;
    return () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50); // 50ms 디바운스
    };
  }, []);

  const debouncedResize = useMemo(() => triggerResizeEvent(), [triggerResizeEvent]);

  // 사이드바 상태 변경 시 최적화된 애니메이션 처리
  useEffect(() => {
    if (isAuthenticated && showSidebar) {
      setIsAnimating(true);
      
      // 즉시 리사이즈 이벤트 발생 (애니메이션 시작)
      debouncedResize();
      
      // CSS transition 완료 후 애니메이션 상태 해제
      const timer = setTimeout(() => {
        setIsAnimating(false);
        // 애니메이션 완료 후 최종 리사이즈 이벤트
        debouncedResize();
      }, 300); // CSS transition duration보다 짧게 설정
      
      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
    }
  }, [isCollapsed, isAuthenticated, showSidebar, debouncedResize]);

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Header는 로그인된 사용자에게만 표시 */}
      {isAuthenticated && (
        <Header 
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />
      )}
      
      <div className="flex flex-1">
        {isAuthenticated && showSidebar && (
          <PreziSidebar 
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
        )}
        
        <main className={cn(
          "flex-1 min-h-screen transition-[margin] duration-300 ease-in-out",
          isAuthenticated && showSidebar 
            ? isCollapsed 
              ? "md:ml-16" 
              : "md:ml-80" 
            : "",
          isAnimating && "will-change-transform"
        )}>
          <div className={cn(
            "mx-auto p-4 pb-16 transition-[max-width,padding] duration-300 ease-in-out",
            containerClass,
            isAnimating && "will-change-layout"
          )}>
            <div className="w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

