import { ReactNode, useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
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
  const [containerClass, setContainerClass] = useState("");

  // 사이드바 상태 변경 시 애니메이션 처리
  useEffect(() => {
    if (isAuthenticated && showSidebar) {
      setIsAnimating(true);
      
      // 애니메이션 시작 시 즉시 컨테이너 클래스 설정
      const newContainerClass = isCollapsed 
        ? "container max-w-full px-6" // 접힘: 더 넓은 공간 활용
        : "container max-w-6xl px-4"; // 펼침: 적당한 컨테이너 크기
      
      setContainerClass(newContainerClass);
      
      // 애니메이션 완료 후 상태 업데이트
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 500); // 애니메이션 duration과 동일
      
      return () => clearTimeout(timer);
    } else {
      setContainerClass("container max-w-7xl px-4");
      setIsAnimating(false);
    }
  }, [isCollapsed, isAuthenticated, showSidebar]);

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
          <Sidebar 
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
        )}
        
        <main className={cn(
          "flex-1 min-h-screen transition-all duration-500 ease-in-out",
          isAuthenticated && showSidebar 
            ? isCollapsed 
              ? "md:ml-16" 
              : "md:ml-64" 
            : "",
          isAnimating && "will-change-transform"
        )}>
          <div className={cn(
            "mx-auto p-4 pb-16 transition-all duration-500 ease-in-out",
            containerClass,
            isAnimating && "will-change-layout"
          )}>
            <div className="transition-all duration-300 ease-in-out">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

