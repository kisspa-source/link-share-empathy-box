import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSidebarNavigation } from '@/contexts/SidebarNavigationContext';
import { useBookmarks } from '@/contexts/BookmarkContext';

export const useURLSync = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { navigationPath, navigateToPath, goToRoot } = useSidebarNavigation();
  const { foldersTree } = useBookmarks();

  // URL에서 폴더 경로 추출
  const getFolderPathFromURL = useCallback((pathname: string): string[] => {
    // /folder/{folderId} 패턴 매칭
    const folderMatch = pathname.match(/^\/folder\/([^\/]+)$/);
    if (folderMatch) {
      const folderId = folderMatch[1];
      return [folderId];
    }
    return [];
  }, []);

  // 폴더 ID로 폴더 찾기 (재귀)
  const findFolderById = useCallback((folders: any[], folderId: string): any => {
    for (const folder of folders) {
      if (folder.id === folderId) {
        return folder;
      }
      if (folder.children) {
        const found = findFolderById(folder.children, folderId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // 폴더 ID로 전체 경로 생성
  const getFolderPath = useCallback((folderId: string): string[] => {
    const path: string[] = [];
    
    const findPath = (folders: any[], targetId: string, currentPath: string[] = []): boolean => {
      for (const folder of folders) {
        const newPath = [...currentPath, folder.id];
        
        if (folder.id === targetId) {
          path.push(...newPath);
          return true;
        }
        
        if (folder.children && findPath(folder.children, targetId, newPath)) {
          return true;
        }
      }
      return false;
    };
    
    findPath(foldersTree, folderId);
    return path;
  }, [foldersTree]);

  // URL 변경 시 사이드바 상태 업데이트
  useEffect(() => {
    const urlPath = getFolderPathFromURL(location.pathname);
    
    if (urlPath.length > 0) {
      // URL에 폴더가 있으면 해당 경로로 이동
      const fullPath = getFolderPath(urlPath[0]);
      if (fullPath.length > 0 && JSON.stringify(fullPath) !== JSON.stringify(navigationPath)) {
        navigateToPath(fullPath);
      }
    } else {
      // URL에 폴더가 없으면 루트로 이동
      if (navigationPath.length > 0) {
        goToRoot();
      }
    }
  }, [location.pathname, getFolderPathFromURL, getFolderPath, navigateToPath, goToRoot, navigationPath]);

  // 사이드바 상태 변경 시 URL 업데이트
  useEffect(() => {
    // URL이 이미 올바른 상태인지 확인
    const urlPath = getFolderPathFromURL(location.pathname);
    const currentFolderId = navigationPath.length > 0 ? navigationPath[navigationPath.length - 1] : null;
    
    if (navigationPath.length > 0 && currentFolderId) {
      const expectedURL = `/folder/${currentFolderId}`;
      
      // URL이 다르고, 현재 URL에 폴더가 없거나 다른 폴더인 경우에만 업데이트
      if (location.pathname !== expectedURL && 
          (urlPath.length === 0 || urlPath[0] !== currentFolderId)) {
        navigate(expectedURL, { replace: true });
      }
    } else if (navigationPath.length === 0) {
      // 루트 상태일 때는 홈으로 이동 (단, 이미 홈이 아닌 경우에만)
      if (location.pathname !== '/' && urlPath.length === 0) {
        navigate('/', { replace: true });
      }
    }
  }, [navigationPath, location.pathname, navigate, getFolderPathFromURL]);

  // 브라우저 뒤로가기/앞으로가기 지원
  useEffect(() => {
    const handlePopState = () => {
      const urlPath = getFolderPathFromURL(location.pathname);
      
      if (urlPath.length > 0) {
        const fullPath = getFolderPath(urlPath[0]);
        if (fullPath.length > 0) {
          navigateToPath(fullPath);
        }
      } else {
        goToRoot();
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [getFolderPathFromURL, getFolderPath, navigateToPath, goToRoot, location.pathname]);

  return {
    currentURL: location.pathname,
    currentPath: navigationPath,
    syncToURL: (folderId: string) => {
      const path = getFolderPath(folderId);
      if (path.length > 0) {
        navigateToPath(path);
      }
    }
  };
}; 