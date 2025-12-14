import { useSidebarNavigation } from '@/contexts/SidebarNavigationContext';

export function useSidebarToggle() {
  const { isCollapsed, toggleSidebar } = useSidebarNavigation();

  return {
    isCollapsed,
    toggle: toggleSidebar
  };
} 