import { useState, useEffect } from 'react';

const STORAGE_KEY = 'sidebar-collapsed';

export function useSidebarToggle() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // localStorage에서 초기 상태 로드
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });

  const toggle = () => {
    setIsCollapsed(prev => {
      const newValue = !prev;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newValue));
      return newValue;
    });
  };

  // 상태 변경 시 localStorage에 저장
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  return {
    isCollapsed,
    toggle,
    setIsCollapsed
  };
} 