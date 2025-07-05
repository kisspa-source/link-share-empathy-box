import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { Bookmark, Collection, Folder, Tag, Category } from '../types/bookmark';
import { toast } from "sonner";
import { useAuth } from './AuthContext';
import {
  supabase,
  bookmarkApi,
  collectionApi,
  directBookmarkInsert,
  directBookmarkDelete,
  folderApi
} from '../lib/supabase';

import { generateShareUrl } from '../lib/utils';

interface BookmarkContextType {
  bookmarks: Bookmark[];
  collections: Collection[];
  folders: Folder[];
  tags: Tag[];
  isLoading: boolean;
  addBookmark: (url: string, description?: string, folderId?: string, tags?: string[]) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  addCollection: (name: string, description: string, isPublic: boolean, bookmarkIds: string[]) => Promise<void>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  toggleCollectionPublic: (id: string, nextPublic: boolean) => Promise<void>;
  addFolder: (name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  getBookmarksByFolder: (folderId?: string) => Bookmark[];
  getCollection: (id: string) => Collection | undefined;
  getUserCollections: (userId: string) => Collection[];
  refreshData: () => void;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const BookmarkProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 중복 실행 방지를 위한 ref들
  const isLoadingData = useRef(false);
  const lastLoadedUserId = useRef<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const refreshData = useCallback(() => {
    setRefreshKey(k => k + 1);
    lastLoadedUserId.current = null; // 강제 새로고침 시 사용자 ID 초기화
  }, []);

  // 병렬 데이터 로딩 최적화
  useEffect(() => {
    console.log('[BookmarkProvider] 데이터 로딩 useEffect 진입', { isAuthLoading, user: !!user });
    
    // 인증 로딩 중이거나 이미 데이터 로딩 중인 경우 스킵
    if (isAuthLoading || isLoadingData.current) {
      return;
    }
    
    // 사용자가 없는 경우 데이터 초기화
    if (!user) {
      console.log('[BookmarkProvider] 사용자 없음, 데이터 초기화');
      setBookmarks([]);
      setCollections([]);
      setFolders([]);
      setIsLoading(false);
      lastLoadedUserId.current = null;
      return;
    }
    
    // 동일한 사용자의 데이터가 이미 로드되었고 강제 새로고침이 아닌 경우 스킵
    if (lastLoadedUserId.current === user.id && refreshKey === 0) {
      console.log('[BookmarkProvider] 이미 로드된 사용자 데이터, 로딩 스킵');
      return;
    }

    const loadAllData = async () => {
      if (isLoadingData.current) return; // 이중 실행 방지
      
      isLoadingData.current = true;
      setIsLoading(true);
      console.log('[BookmarkProvider] 모든 데이터 병렬 로딩 시작', user.id);
      
      try {
        // 세션 갱신 제거 - 불필요한 네트워크 요청 방지
        console.log('[BookmarkProvider] 세션 갱신 생략 (성능 최적화)');

        // 모든 데이터를 병렬로 로딩 - Promise.allSettled 사용으로 한 요청 실패가 전체에 영향 주지 않음
        const [foldersResult, bookmarksResult, collectionsResult] = await Promise.allSettled([
          folderApi.list(user.id),
          supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          collectionApi.list(user.id)
        ]);

        // 폴더 데이터 처리
        if (foldersResult.status === 'fulfilled') {
          console.log('[BookmarkProvider] 폴더 데이터 로딩 성공:', foldersResult.value?.length || 0, '개');
          const formattedFolders: Folder[] = (foldersResult.value || []).map(f => ({
            id: f.id,
            name: f.name,
            bookmarkCount: 0, // 북마크 로딩 후 업데이트
          }));
          setFolders(formattedFolders);
        } else {
          console.error('폴더 로딩 실패:', foldersResult.reason);
          toast.error('폴더를 불러오는 중 오류가 발생했습니다.');
        }

        // 북마크 데이터 처리
        if (bookmarksResult.status === 'fulfilled') {
          const { data: bookmarksData, error: bookmarksError } = bookmarksResult.value;
          console.log('[BookmarkProvider] 북마크 데이터 로딩 결과:', { 
            count: bookmarksData?.length || 0, 
            hasError: !!bookmarksError 
          });
          
          if (bookmarksError) {
            console.error('북마크 불러오기 오류:', bookmarksError);
            toast.error('북마크를 불러오는 중 오류가 발생했습니다.');
          } else {
            const formattedBookmarks: Bookmark[] = (bookmarksData || []).map(item => {
              const itemDomain = item.url.replace(/https?:\/\//, '').split('/')[0];
              return {
                id: item.id,
                user_id: item.user_id,
                url: item.url,
                title: item.title || '',
                description: item.description || '',
                image_url: item.image_url,
                thumbnail: item.thumbnail,
                favicon: `https://www.google.com/s2/favicons?domain=${itemDomain}&sz=32`, // 동적 생성
                category: item.category as Category,
                tags: typeof item.tags === 'string' ? JSON.parse(item.tags) : (Array.isArray(item.tags) ? item.tags : []),
                memo: item.memo,
                folder_id: item.folder_id,
                created_at: item.created_at,
                updated_at: item.updated_at,
                saved_by: item.saved_by
              };
            });
            setBookmarks(formattedBookmarks);
            
            // 폴더별 북마크 개수 업데이트 - 최적화된 방식
            setFolders(prev =>
              prev.map(f => ({
                ...f,
                bookmarkCount: formattedBookmarks.filter(b => b.folder_id === f.id).length,
              }))
            );
          }
        } else {
          console.error('북마크 로딩 실패:', bookmarksResult.reason);
          toast.error('북마크를 불러오는 중 오류가 발생했습니다.');
        }

        // 컬렉션 데이터 처리
        if (collectionsResult.status === 'fulfilled') {
          console.log('[BookmarkProvider] 컬렉션 데이터 로딩 성공:', collectionsResult.value?.length || 0, '개');
          const formattedCollections: Collection[] = (collectionsResult.value || []).map(item => ({
            id: item.id,
            name: item.name,
            description: item.description || '',
            isPublic: item.is_public,
            userId: item.user_id,
            userNickname: item.profiles?.nickname || user.nickname,
            userAvatar: item.profiles?.avatar_url || user.avatarUrl,
            bookmarks: Array.isArray(item.bookmarks) ? item.bookmarks : [],
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            shareUrl: generateShareUrl(item.id),
            coverImage: item.cover_image
          }));
          setCollections(formattedCollections);
        } else {
          console.error('컬렉션 로딩 실패:', collectionsResult.reason);
          toast.error('컬렉션을 불러오는 중 오류가 발생했습니다.');
        }

        console.log('[BookmarkProvider] 모든 데이터 병렬 로딩 완료');
        lastLoadedUserId.current = user.id; // 성공적으로 로드된 사용자 ID 저장
      } catch (error) {
        console.error('데이터 불러오기 치명적 오류:', error);
        toast.error('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
        isLoadingData.current = false;
        console.log('[BookmarkProvider] 로딩 완료, isLoading: false 설정');
      }
    };
    
    loadAllData();
  }, [user?.id, refreshKey]); // 의존성을 user?.id로 단순화

  // 북마크 변경 시 폴더 개수 업데이트 - 최적화된 useEffect
  useEffect(() => {
    if (folders.length > 0) {
      setFolders(prev =>
        prev.map(f => ({
          ...f,
          bookmarkCount: bookmarks.filter(b => b.folder_id === f.id).length,
        }))
      );
    }
  }, [bookmarks.length]); // bookmarks 배열 전체가 아닌 length만 의존성으로 사용

  // 메타데이터 가져오기 (제거 - Edge Functions으로 대체 예정)
  const fetchMetadata = async (url: string) => {
    // Edge Functions으로 대체 예정으로 기본값 반환
    const domain = url.replace(/https?:\/\//, '').split('/')[0];
    return {
      title: url,
      description: '',
      favicon: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : '',
      thumbnail: '',
      tags: []
    };
  };

  useEffect(() => {
    const unique = Array.from(new Set(bookmarks.flatMap(b => b.tags)))
    setTags(unique.map(t => ({ id: t, name: t })))
  }, [bookmarks])

  const addBookmark = async (url: string, description?: string, folderId?: string, tags?: string[]) => {
    setIsLoading(true);
    try {
      // 사용자 로그인 확인
      if (!user) {
        toast.error('북마크를 추가하려면 로그인해야 합니다.');
        return;
      }

      console.log('1. 북마크 저장 시작:', url);

      // URL 유효성 검사 및 프로토콜 추가
      try {
        new URL(url);
      } catch {
        // 프로토콜이 없는 경우 추가
        if (!/^https?:\/\//i.test(url)) {
          url = 'https://' + url;
        }
      }

      // 빠른 저장을 위한 기본 메타데이터 생성
      const domain = url.replace(/https?:\/\//, '').split('/')[0];
      const metadata = {
        title: url,
        description: description || '',
        favicon: domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=32` : '',
        thumbnail: '',
        tags: []
      };

      // 입력된 태그 사용 (분석 태그 제거)
      const tagNames = Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [];
      
      const category: Category = 'Other';

      // 사용자 인증 확인 (RLS 정책 위반 방지)
      if (!user?.id) {
        console.error('사용자 인증 정보가 없습니다.');
        toast.error('로그인이 필요합니다.');
        return;
      }

      // Supabase에 저장할 북마크 데이터 준비 (데이터베이스 스키마에 맞춤)
      const bookmarkData = {
        user_id: user.id,
        url,
        title: metadata.title,
        description: metadata.description,
        image_url: metadata.thumbnail || '',
        folder_id: folderId,
        tags: tagNames,
      };
      
      console.log('2. 북마크 저장 데이터:', bookmarkData);
      
      // 직접 API 호출 방식으로 북마크 추가
      let newBookmarkData;
      try {
        // 현재 세션에서 액세스 토큰 가져오기
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        
        if (!accessToken) {
          throw new Error('인증 토큰을 가져올 수 없습니다. 다시 로그인해 주세요.');
        }
        
        console.log('3. 직접 API 호출로 북마크 추가...');
        const result = await directBookmarkInsert(bookmarkData, accessToken);
        console.log('4. 직접 API 호출 결과:', result);
        
        if (result.error) {
          console.error('직접 API 호출 오류:', result.error);
          toast.error('북마크 추가 중 오류가 발생했습니다.');
          return;
        }
        
        newBookmarkData = result.data;
        console.log('5. 북마크 추가 성공:', newBookmarkData);
        
        if (!newBookmarkData) {
          console.error('북마크 추가 결과가 비어있음');
          toast.error('북마크 추가 결과가 비어 있습니다.');
          return;
        }
      } catch (insertError) {
        console.error('북마크 추가 오류:', insertError);
        toast.error('북마크 추가 중 오류가 발생했습니다.');
        return;
      }

      // 애플리케이션 형식에 맞게 변환 (favicon 동적 생성)
      const urlDomain = newBookmarkData.url.replace(/https?:\/\//, '').split('/')[0];
      const newBookmark: Bookmark = {
        id: newBookmarkData.id,
        user_id: user.id,
        url: newBookmarkData.url,
        title: newBookmarkData.title,
        description: newBookmarkData.description || '',
        image_url: newBookmarkData.image_url || '',
        thumbnail: newBookmarkData.thumbnail,
        favicon: `https://www.google.com/s2/favicons?domain=${urlDomain}&sz=32`, // 동적 생성
        memo: newBookmarkData.memo,
        folder_id: newBookmarkData.folder_id,
        tags: typeof newBookmarkData.tags === 'string' ? JSON.parse(newBookmarkData.tags) : (Array.isArray(newBookmarkData.tags) ? newBookmarkData.tags : []),
        category: category,
        saved_by: newBookmarkData.saved_by || 0,
        created_at: newBookmarkData.created_at,
        updated_at: newBookmarkData.updated_at
      };

      // 상태 업데이트
      setBookmarks(prev => [newBookmark, ...prev]);
      toast.success('북마크가 빠르게 저장되었습니다! 🚀');
      
      // Edge Functions으로 메타데이터 개선 (백그라운드에서 실행)
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          console.log('💡 메타데이터는 Edge Functions에서 백그라운드로 업데이트됩니다.');
        }, 100);
      }
      
    } catch (error) {
      console.error('addBookmark 전체 에러:', error);
      toast.error('북마크 저장에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBookmark = async (id: string) => {
    try {
      if (!user) {
        toast.error('북마크를 삭제하려면 로그인해야 합니다.');
        return;
      }

      console.log('Supabase에서 북마크 삭제 시도:', id);

      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.warn('Supabase 클라이언트 삭제 실패, 직접 API 시도', error);

        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        const directResult = await directBookmarkDelete(id, token);

        if (directResult.error) {
          throw directResult.error;
        }
      }

      console.log('북마크 삭제 성공');
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
      toast.success('북마크가 삭제되었습니다');
    } catch (error) {
      console.error('북마크 삭제 오류:', error);
      toast.error('북마크 삭제에 실패했습니다');
    }
  };

  const addCollection = async (name: string, description: string, isPublic: boolean, bookmarkIds: string[]) => {
    try {
      const collectionBookmarks = bookmarks.filter(bookmark => 
        bookmarkIds.includes(bookmark.id)
      );
      
      if (!user) return;

      const newCollection: Collection = {
        id: `col-${Date.now()}`,
        name,
        description,
        isPublic,
        userId: user.id,
        userNickname: user.nickname,
        userAvatar: user.avatarUrl,
        bookmarks: collectionBookmarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        shareUrl: generateShareUrl(`col-${Date.now()}`),
        coverImage: collectionBookmarks[0]?.thumbnail
      };
      
      setCollections(prev => [newCollection, ...prev]);
      toast.success('컬렉션이 생성되었습니다');
    } catch (error) {
      console.error('Error adding collection:', error);
      toast.error('컬렉션 생성에 실패했습니다');
    }
  };
  
  const updateCollection = async (id: string, updates: Partial<Collection>) => {
    try {
      setCollections(prev => prev.map(collection => 
        collection.id === id ? { ...collection, ...updates } : collection
      ));
      toast.success('컬렉션이 업데이트되었습니다');
    } catch (error) {
      console.error('Error updating collection:', error);
      toast.error('컬렉션 업데이트에 실패했습니다');
    }
  };
  
  const deleteCollection = async (id: string) => {
    try {
      setCollections(prev => prev.filter(collection => collection.id !== id));
      toast.success('컬렉션이 삭제되었습니다');
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('컬렉션 삭제에 실패했습니다');
    }
  };

  const toggleCollectionPublic = async (id: string, nextPublic: boolean) => {
    try {
      await (collectionApi.update as any)(id, { is_public: nextPublic });
      setCollections(prev => prev.map(collection => 
        collection.id === id 
          ? { ...collection, isPublic: nextPublic } 
          : collection
      ));
      toast.success(nextPublic ? '컬렉션이 공개로 설정되었습니다' : '컬렉션이 비공개로 설정되었습니다');
    } catch (error) {
      console.error('Error toggling collection visibility:', error);
      toast.error('컬렉션 공개 설정 변경에 실패했습니다');
    }
  };

  const addFolder = async (name: string) => {
    console.log('[addFolder] 폴더 생성 요청:', name);
    if (!user) {
      console.error('[addFolder] 로그인 필요');
      toast.error('로그인이 필요합니다');
      return;
    }
    // 중복 폴더명 체크
    if (folders.some(f => f.name === name)) {
      console.warn('[addFolder] 중복 폴더명:', name);
      toast.error('중복된 폴더명이 존재합니다');
      return;
    }
    try {
      console.log('[addFolder] Supabase에 폴더 생성 요청:', name, user.id);
      await folderApi.create(name, user.id);
      console.log('[addFolder] Supabase 폴더 생성 성공, 전체 목록 재조회');
      const folderData = await folderApi.list(user.id);
      const formattedFolders: Folder[] = (folderData || []).map(f => ({
        id: f.id,
        name: f.name,
        bookmarkCount: bookmarks.filter(b => b.folder_id === f.id).length
      }));
      setFolders(formattedFolders);
      console.log('[addFolder] setFolders 완료:', formattedFolders);
      toast.success('폴더가 생성되었습니다');
    } catch (error) {
      console.error('[addFolder] 폴더 생성 에러:', error);
      toast.error('폴더 생성에 실패했습니다');
    }
  };

  const deleteFolder = async (id: string) => {
    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }
    try {
      await folderApi.delete(id)
      setFolders(prev => prev.filter(folder => folder.id !== id))
      setBookmarks(prev => prev.map(bookmark =>
        bookmark.folder_id === id
          ? { ...bookmark, folder_id: undefined }
          : bookmark
      ))
      toast.success('폴더가 삭제되었습니다')
    } catch (error) {
      console.error('Error deleting folder:', error)
      toast.error('폴더 삭제에 실패했습니다')
    }
  };

  const getBookmarksByFolder = useCallback((folderId?: string) => {
    if (folderId) {
      return bookmarks.filter(bookmark => bookmark.folder_id === folderId);
    }
    return bookmarks.filter(bookmark => !bookmark.folder_id);
  }, [bookmarks]);

  const getCollection = useCallback((id: string) => {
    return collections.find(collection => collection.id === id);
  }, [collections]);

  const getUserCollections = useCallback((userId: string) => {
    return collections.filter(collection => 
      collection.userId === userId && collection.isPublic
    );
  }, [collections]);

  return (
    <BookmarkContext.Provider value={{
      bookmarks: isLoading ? [] : bookmarks,
      collections: isLoading ? [] : collections,
      folders: isLoading ? [] : folders,
      tags,
      isLoading,
      addBookmark,
      deleteBookmark,
      addCollection,
      updateCollection,
      deleteCollection,
      toggleCollectionPublic,
      addFolder,
      deleteFolder,
      getBookmarksByFolder,
      getCollection,
      getUserCollections,
      refreshData
    }}>
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
};
