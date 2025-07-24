import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Menu, X } from 'lucide-react';
import { SidebarFrame } from './SidebarFrame';
import { useSidebarToggle } from '@/hooks/useSidebarToggle';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { useFocusManagement } from '@/hooks/useFocusManagement';

interface PreziSidebarProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export const PreziSidebar = ({ isMobileMenuOpen = false, setIsMobileMenuOpen }: PreziSidebarProps) => {
  const { isCollapsed, toggle } = useSidebarToggle();
  const [isMobile, setIsMobile] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // 포커스 관리
  const { containerRef: focusContainerRef } = useFocusManagement({
    autoFocus: true,
    trapFocus: isMobile && isMobileMenuOpen,
    restoreFocus: true
  });

  // 제스처 지원 (모바일에서만)
  const handleSwipeLeft = () => {
    if (isMobile && window.location.pathname !== '/') {
      window.history.back();
    }
  };

  const handleSwipeRight = () => {
    if (isMobile && window.location.pathname === '/') {
      setIsMobileMenuOpen(false);
    }
  };

  // 제스처 훅 사용
  useSwipeGesture(sidebarRef, {
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    threshold: 50,
    velocity: 0.3,
    preventDefault: false // 스크롤 방지하지 않음
  });

  // 키보드 네비게이션
  useKeyboardNavigation({
    onEscape: () => {
      if (isMobile && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    },
    enabled: true
  });

  // 반응형 처리
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      // 모바일에서 데스크톱으로 변경 시 모바일 메뉴 닫기
      if (!isMobileView && isMobileMenuOpen && setIsMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // 초기 체크
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen, setIsMobileMenuOpen]);

  // 모바일에서 사이드바가 닫혀있으면 null 반환
  if (isMobile && !isMobileMenuOpen) {
    return null;
  }

  const sidebarContent = (
    <>
      {/* 데스크톱 토글 버튼 */}
      {!isMobile && (
        <div className="flex justify-end p-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={toggle}
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
          </Button>
        </div>
      )}

      {/* 모바일 헤더 */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">메뉴</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}

      {/* 사이드바 프레임 컨테이너 */}
      <div ref={focusContainerRef} className="flex-1 overflow-hidden relative">
        <div ref={sidebarRef} className="h-full">
          <SidebarFrame />
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* 데스크톱 사이드바 */}
      {!isMobile && (
        <motion.aside
          className={cn(
            "sidebar fixed inset-y-0 left-0 z-30 border-r",
            "flex flex-col h-screen pt-14",
            isCollapsed ? "w-16" : "w-80"
          )}
          style={{
            backgroundColor: 'white', // 라이트 모드
            ...(document.documentElement.classList.contains('dark') && {
              backgroundColor: '#020817' // 다크 모드 배경색
            })
          }}
          initial={{ width: isCollapsed ? 64 : 320 }}
          animate={{ width: isCollapsed ? 64 : 320 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {sidebarContent}
        </motion.aside>
      )}

      {/* 모바일 사이드바 오버레이 */}
      {isMobile && isMobileMenuOpen && (
        <>
          {/* 백드롭 */}
          <motion.div 
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(false)}
          />
          
          {/* 사이드바 */}
          <motion.aside 
            className="fixed inset-y-0 left-0 z-50 w-80 border-r flex flex-col h-screen pt-14 md:hidden"
            style={{
              backgroundColor: 'white', // 라이트 모드
              ...(document.documentElement.classList.contains('dark') && {
                backgroundColor: '#020817' // 다크 모드 배경색
              })
            }}
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {sidebarContent}
          </motion.aside>
        </>
      )}
    </>
  );
};

// 모바일 사이드바 토글 버튼 컴포넌트
export function MobilePreziSidebarToggle({ 
  isMobileMenuOpen, 
  setIsMobileMenuOpen 
}: { 
  isMobileMenuOpen: boolean; 
  setIsMobileMenuOpen: (open: boolean) => void; 
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden"
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
} 