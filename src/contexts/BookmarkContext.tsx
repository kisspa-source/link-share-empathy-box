import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Bookmark, Collection, Folder, Tag, Category } from '../types/bookmark';
import { toast } from "sonner";
import { useAuth } from './AuthContext';
import { supabase, bookmarkApi, collectionApi, directBookmarkInsert, folderApi } from '../lib/supabase';

interface BookmarkContextType {
  bookmarks: Bookmark[];
  collections: Collection[];
  folders: Folder[];
  tags: Tag[];
  isLoading: boolean;
  addBookmark: (url: string, memo?: string, folderId?: string) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  addCollection: (name: string, description: string, isPublic: boolean, bookmarkIds: string[]) => Promise<void>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  toggleCollectionPublic: (id: string) => Promise<void>;
  addFolder: (name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  getBookmarksByFolder: (folderId?: string) => Bookmark[];
  getCollection: (id: string) => Collection | undefined;
  getUserCollections: (userId: string) => Collection[];
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const BookmarkProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Supabase에서 데이터 불러오기
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 사용자가 로그인했을 때만 데이터 불러오기
        if (user) {
          console.log('사용자 로그인 확인, 북마크 불러오기 시작', user.id);
          
          // 북마크 불러오기
          const { data: bookmarksData, error: bookmarksError } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (bookmarksError) {
            console.error('북마크 불러오기 오류:', bookmarksError);
            toast.error('북마크를 불러오는 중 오류가 발생했습니다.');
          } else {
            console.log('북마크 불러오기 성공:', bookmarksData?.length);
            
            // Supabase의 북마크 데이터를 애플리케이션 형식에 맞게 변환
            const formattedBookmarks: Bookmark[] = (bookmarksData || []).map(item => ({
              id: item.id,
              user_id: item.user_id,
              url: item.url,
              title: item.title || '',
              description: item.description || '',
              image_url: item.image_url,
              thumbnail: item.thumbnail,
              favicon: item.favicon,
              category: item.category as Category,
              // tags는 이미 string[] 타입이므로 그대로 사용
              tags: Array.isArray(item.tags) ? item.tags : [],
              memo: item.memo,
              folder_id: item.folder_id,
              created_at: item.created_at,
              updated_at: item.updated_at,
              saved_by: item.saved_by
            }));
            
            setBookmarks(formattedBookmarks);
          }
          
          // 콜렉션 불러오기
          const { data: collectionsData, error: collectionsError } = await supabase
            .from('collections')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (collectionsError) {
            console.error('콜렉션 불러오기 오류:', collectionsError);
          } else {
            // 콜렉션 데이터 변환 및 설정
            const formattedCollections: Collection[] = (collectionsData || []).map(item => ({
              id: item.id,
              name: item.name,
              description: item.description || '',
              isPublic: item.is_public,
              userId: item.user_id,
              userNickname: user.nickname,
              userAvatar: user.avatarUrl,
              bookmarks: [], // 북마크는 별도로 불러와야 함
              createdAt: item.created_at,
              updatedAt: item.updated_at,
              shareUrl: item.share_url || `linkbox.co.kr/c/${item.id}`,
              coverImage: item.cover_image
            }));
            
            setCollections(formattedCollections);
          }
        } else {
          // 로그인하지 않은 경우 비운 배열로 초기화
          setBookmarks([]);
          setCollections([]);
        }
        
        if (user) {
          const folderData = await folderApi.list(user.id)
          const formattedFolders: Folder[] = (folderData || []).map(f => ({
            id: f.id,
            name: f.name,
            bookmarkCount: bookmarks.filter(b => b.folder_id === f.id).length
          }))
          setFolders(formattedFolders)
        } else {
          setFolders([])
        }
      } catch (error) {
        console.error('데이터 불러오기 오류:', error);
        toast.error('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // 메타데이터 가져오기
  const fetchMetadata = async (url: string) => {
    try {
      const res = await fetch(`https://r.jina.ai/${url}`)
      const html = await res.text()
      const doc = new DOMParser().parseFromString(html, 'text/html')
      const title = doc.querySelector('title')?.textContent || url
      const description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || ''
      const keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || ''
      const keywordTags = keywords.split(',').map(k => k.trim()).filter(Boolean)
      const domain = url.replace(/https?:\/\//, '').split('/')[0]

      return {
        title,
        description,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        thumbnail: `https://picsum.photos/seed/${encodeURIComponent(url)}/640/360`,
        tags: keywordTags
      }
    } catch (e) {
      console.warn('metadata fetch failed', e)
      return { title: url, description: '', favicon: '', thumbnail: '', tags: [] }
    }
  }

  useEffect(() => {
    const unique = Array.from(new Set(bookmarks.flatMap(b => b.tags)))
    setTags(unique.map(t => ({ id: t, name: t })))
    setFolders(prev => prev.map(f => ({
      ...f,
      bookmarkCount: bookmarks.filter(b => b.folder_id === f.id).length
    })))
  }, [bookmarks])

  const addBookmark = async (url: string, memo?: string, folderId?: string) => {
    setIsLoading(true);
    try {
      // 사용자 로그인 확인
      if (!user) {
        toast.error('북마크를 추가하려면 로그인해야 합니다.');
        return;
      }
      console.log('1. URL 유효성 검사 시작:', url);

      // URL 유효성 검사 및 프로토콜 추가
      try {
        new URL(url);
      } catch {
        // 프로토콜이 없는 경우 추가
        if (!/^https?:\/\//i.test(url)) {
          url = 'https://' + url;
        }
      }
      console.log('2. 메타데이터 가져오기 시작:', url);
      // 메타데이터 가져오기
      const metadata = await fetchMetadata(url);
      console.log('3. 메타데이터 결과:', metadata);
      const tagNames = metadata.tags
      const category: Category = 'Other'
      // 사용자 인증 확인 (RLS 정책 위반 방지)
      if (!user?.id) {
        console.error('사용자 인증 정보가 없습니다.');
        toast.error('로그인이 필요합니다.');
        return;
      }

      // Supabase에 저장할 북마크 데이터 준비 (RLS 정책에 맞게 user_id 필수)
      const bookmarkData = {
        user_id: user.id, // 반드시 인증된 사용자 ID 포함
        url,
        title: metadata.title || url,
        description: metadata.description || '',
        image_url: metadata.image || '', // image_url 컬럼 있음
        tags: tagNames, // text[] 컬럼이므로 string[] 그대로 전달
        // created_at, updated_at은 DB에서 자동 생성
      };
      
      console.log('5. 북마크 저장 데이터:', bookmarkData);
      
      // 디버깅용 로그: 전송되는 데이터 형식 확인
      console.log('전송되는 tags 형식:', typeof bookmarkData.tags, bookmarkData.tags);
      
      console.log('5. 북마크 추가 시도 (카테고리 제외):', bookmarkData);
      
      // 직접 API 호출 방식으로 북마크 추가 시도 (인증 토큰 포함)
      let newBookmarkData;
      try {
        // 현재 세션에서 액세스 토큰 가져오기
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        
        if (!accessToken) {
          throw new Error('인증 토큰을 가져올 수 없습니다. 다시 로그인해 주세요.');
        }
        
        console.log('직접 API 호출 방식으로 북마크 추가 시도...');
        const result = await directBookmarkInsert(bookmarkData, accessToken);
        console.log('6. 직접 API 호출 결과:', result);
        
        if (result.error) {
          console.error('직접 API 호출 오류:', result.error);
          toast.error('북마크 추가 중 오류가 발생했습니다.');
          alert('북마크 추가 오류 상세정보:\n' + JSON.stringify(result.error, null, 2));
          return;
        }
        
        newBookmarkData = result.data;
        console.log('7. 직접 API 호출 성공:', newBookmarkData);
        
        if (!newBookmarkData) {
          console.error('북마크 추가 결과가 비어있음');
          toast.error('북마크 추가 결과가 비어 있습니다.');
          return;
        }
      } catch (insertError) {
        console.error('북마크 추가 오류:', insertError);
        toast.error('북마크 추가 중 오류가 발생했습니다.');
        alert('북마크 추가 오류 상세정보:\n' + JSON.stringify(insertError, null, 2));
        return;
      }
      console.log('7. 북마크 추가 성공:', newBookmarkData);
      // 애플리케이션 형식에 맞게 변환
      const newBookmark: Bookmark = {
        id: newBookmarkData.id,
        user_id: user.id,
        url: newBookmarkData.url,
        title: newBookmarkData.title,
        description: newBookmarkData.description || '',
        image_url: newBookmarkData.image_url || '',
        thumbnail: newBookmarkData.thumbnail,
        favicon: newBookmarkData.favicon,
        memo: newBookmarkData.memo,
        folder_id: newBookmarkData.folder_id,
        // tags는 string[] 타입이어야 함
        tags: Array.isArray(newBookmarkData.tags) ? newBookmarkData.tags : [],
        category: category,
        saved_by: newBookmarkData.saved_by || 0,
        created_at: newBookmarkData.created_at,
        updated_at: newBookmarkData.updated_at
      };
      // 상태 업데이트
      setBookmarks(prev => [newBookmark, ...prev]);
      toast.success('북마크가 저장되었습니다');
    } catch (error) {
      console.error('addBookmark 전체 에러:', error);
      toast.error('북마크 저장에 실패했습니다');
      alert('addBookmark 전체 에러:\n' + JSON.stringify(error, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBookmark = async (id: string) => {
    try {
      // 사용자 로그인 확인
      if (!user) {
        toast.error('북마크를 삭제하려면 로그인해야 합니다.');
        return;
      }

      console.log('Supabase에서 북마크 삭제 시도:', id);
      
      // Supabase에서 북마크 삭제
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // 사용자 ID로 필터링하여 보안 강화
      
      if (error) {
        console.error('Supabase 북마크 삭제 오류:', error);
        throw new Error(`북마크 삭제 오류: ${error.message}`);
      }
      
      console.log('Supabase 북마크 삭제 성공');
      
      // 상태 업데이트
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
        shareUrl: `linkbox.co.kr/c/${Date.now().toString(36)}`,
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

  const toggleCollectionPublic = async (id: string) => {
    try {
      setCollections(prev => prev.map(collection => 
        collection.id === id 
          ? { ...collection, isPublic: !collection.isPublic } 
          : collection
      ));
      
      const collection = collections.find(c => c.id === id);
      if (collection) {
        toast.success(
          collection.isPublic 
            ? '컬렉션이 비공개로 설정되었습니다' 
            : '컬렉션이 공개로 설정되었습니다'
        );
      }
    } catch (error) {
      console.error('Error toggling collection visibility:', error);
      toast.error('컬렉션 공개 설정 변경에 실패했습니다');
    }
  };

  const addFolder = async (name: string) => {
    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }
    try {
      const created = await folderApi.create(name, user.id)
      const newFolder: Folder = { id: created.id, name: created.name, bookmarkCount: 0 }
      setFolders(prev => [...prev, newFolder])
      toast.success('폴더가 생성되었습니다')
    } catch (error) {
      console.error('Error adding folder:', error)
      toast.error('폴더 생성에 실패했습니다')
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
      bookmarks,
      collections,
      folders,
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
      getUserCollections
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
