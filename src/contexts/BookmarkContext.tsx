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
import { ImportedBookmark, ImportedFolder, ImportOptions, BookmarkParseResult, ImportProgress } from '../types/importedBookmark';
import { BookmarkFileValidator } from '../utils/bookmarkValidator';
import { BookmarkParserFactory } from '../lib/parsers/bookmarkParser';
import { FolderStructureMapper, MappingResult } from '../lib/mappers/folderStructureMapper';
import { 
  calculateOptimalBatchSize, 
  getMemoryInfo, 
  forceGarbageCollection,
  PerformanceMonitor,
  generateOptimizationRecommendations 
} from '../lib/utils/performanceOptimizer';

// 폴더 트리에서 특정 폴더의 북마크 개수를 업데이트하는 헬퍼 함수
const updateFolderCountInTree = (folders: Folder[], folderId: string, delta: number): Folder[] => {
  return folders.map(folder => {
    if (folder.id === folderId) {
      return { ...folder, bookmarkCount: Math.max(0, folder.bookmarkCount + delta) };
    }
    if (folder.children && folder.children.length > 0) {
      return { ...folder, children: updateFolderCountInTree(folder.children, folderId, delta) };
    }
    return folder;
  });
};

interface BookmarkContextType {
  bookmarks: Bookmark[];
  collections: Collection[];
  folders: Folder[];
  foldersTree: Folder[]; // 계층 구조로 정렬된 폴더 목록
  tags: Tag[];
  allTags: string[]; // 모든 북마크에서 사용된 태그들의 유니크한 목록
  isLoading: boolean;
  addBookmark: (url: string, description?: string, folderId?: string, tags?: string[]) => Promise<void>;
  updateBookmark: (id: string, updates: { title?: string; description?: string; tags?: string[]; folder_id?: string }) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  addCollection: (name: string, description: string, isPublic: boolean, bookmarkIds: string[]) => Promise<void>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  toggleCollectionPublic: (id: string, nextPublic: boolean) => Promise<void>;
  addFolder: (name: string, iconName?: string, iconColor?: string, iconCategory?: string, parentId?: string) => Promise<void>;
  updateFolder: (id: string, updates: { name?: string; icon_name?: string; icon_color?: string; icon_category?: string; parent_id?: string }) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  getBookmarksByFolder: (folderId?: string) => Bookmark[];
  getCollection: (id: string) => Collection | undefined;
  getUserCollections: (userId: string) => Collection[];
  getFlatFolderList: () => Folder[]; // 부모 폴더 선택을 위한 플랫 목록
  refreshData: () => void;
  // 북마크 가져오기 기능 추가
  importBookmarks: (file: File, options: ImportOptions) => Promise<void>;
  importProgress: ImportProgress | null;
  isImporting: boolean;
  cancelImport: () => void;
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const BookmarkProvider = ({ children }: { children: ReactNode }) => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersTree, setFoldersTree] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 북마크 가져오기 관련 상태
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importCancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  
  // 중복 실행 방지를 위한 ref들
  const isLoadingData = useRef(false);
  const lastLoadedUserId = useRef<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 폴더를 계층 구조로 변환하는 함수
  const buildFoldersTree = useCallback((folders: Folder[]): Folder[] => {
    const folderMap = new Map<string, Folder>();
    const rootFolders: Folder[] = [];

    // 폴더 맵 생성 및 children 초기화
    folders.forEach(folder => {
      folderMap.set(folder.id, { ...folder, children: [], depth: 0, path: [] });
    });

    // 계층 구조 구성
    folders.forEach(folder => {
      const folderWithChildren = folderMap.get(folder.id);
      if (!folderWithChildren) return;

      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(folderWithChildren);
          // depth와 path 설정
          folderWithChildren.depth = (parent.depth || 0) + 1;
          folderWithChildren.path = [...(parent.path || []), parent.name];
        } else {
          // 부모가 없는 경우 루트로 처리
          rootFolders.push(folderWithChildren);
        }
      } else {
        // 루트 폴더
        rootFolders.push(folderWithChildren);
      }
    });

    // 정렬 함수 (알파벳 순)
    const sortFolders = (folders: Folder[]): Folder[] => {
      return folders.sort((a, b) => a.name.localeCompare(b.name)).map(folder => ({
        ...folder,
        children: folder.children ? sortFolders(folder.children) : []
      }));
    };

    return sortFolders(rootFolders);
  }, []);

  // 플랫한 폴더 목록 반환 (부모 폴더 선택용)
  const getFlatFolderList = useCallback((): Folder[] => {
    const flattenFolders = (folders: Folder[], depth = 0): Folder[] => {
      const result: Folder[] = [];
      folders.forEach(folder => {
        result.push({ ...folder, depth });
        if (folder.children && folder.children.length > 0) {
          result.push(...flattenFolders(folder.children, depth + 1));
        }
      });
      return result;
    };
    return flattenFolders(foldersTree);
  }, [foldersTree]);
  
  // 안전한 favicon 생성 함수 (컴포넌트 내 공통 함수)
  const generateSafeFavicon = (domain: string) => {
    const problematicDomains = [
      'picsum.photos',
      'lorem.picsum.photos',
      'placeholder.com',
      'via.placeholder.com',
      'dummyimage.com',
      'fakeimg.pl',
      'placehold.it',
      'placeimg.com'
    ];
    
    if (problematicDomains.some(pd => domain.includes(pd))) {
      return undefined;
    }
    
    if (/^\d+\.\d+\.\d+\.\d+/.test(domain)) {
      return undefined;
    }
    
    if (domain.includes('localhost') || domain.includes('127.0.0.1') || domain.includes('192.168.')) {
      return undefined;
    }
    
    if (domain && domain.includes('.')) {
      return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
    }
    
    return undefined;
  };

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
            bookmarkCount: f.bookmarkCount || 0, // API에서 받아온 개수 사용
            icon_name: f.icon_name || 'folder',
            icon_color: f.icon_color || '#3B82F6',
            icon_category: f.icon_category || 'default',
            parent_id: f.parent_id,
            user_id: f.user_id,
            created_at: f.created_at,
            updated_at: f.updated_at
          }));
          setFolders(formattedFolders);
          setFoldersTree(buildFoldersTree(formattedFolders));
          console.log('[BookmarkProvider] 폴더별 북마크 개수:', formattedFolders.map(f => ({ name: f.name, count: f.bookmarkCount })));
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
              
              // image_url이 비어있는 경우 썸네일 생성
              const generateImageUrl = (url: string, domain: string) => {
                if (item.image_url && item.image_url.trim() !== '') {
                  return item.image_url;
                }
                
                // 무료 썸네일 API 사용 (실제 서비스)
                try {
                  const encodedUrl = encodeURIComponent(url);
                  // 현재 사용 가능한 무료 API들
                  const thumbnailOptions = [
                    `https://image.thum.io/get/width/1200/crop/800/${encodedUrl}`,
                    `https://s0.wp.com/mshots/v1/${encodedUrl}?w=1200&h=800`,
                    `https://mini.s-shot.ru/1200x800/PNG/?${encodedUrl}`,
                    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
                  ];
                  
                  return thumbnailOptions[0]; // thum.io 사용
                } catch (error) {
                  console.warn('썸네일 생성 실패:', error);
                  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
                }
              };
              
              const imageUrl = generateImageUrl(item.url, itemDomain);
              const faviconUrl = generateSafeFavicon(itemDomain);
              
              return {
                id: item.id,
                user_id: item.user_id,
                url: item.url,
                title: item.title || '',
                description: item.description || '',
                image_url: imageUrl,
                thumbnail: item.thumbnail || imageUrl, // 호환성을 위해 thumbnail도 설정
                favicon: faviconUrl, // undefined일 수 있음
                category: item.category as Category,
                tags: typeof item.tags === 'string' ? JSON.parse(item.tags) : (Array.isArray(item.tags) ? item.tags : []),

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

  // 북마크 변경 시 폴더 개수 업데이트는 이제 실시간으로 처리됩니다. // bookmarks 배열 전체가 아닌 length만 의존성으로 사용

  // 메타데이터 가져오기 (Edge Functions 사용) - 개선된 버전
  const fetchMetadata = async (url: string) => {
    try {
      console.log('🔍 Edge Function으로 메타데이터 추출 시작:', url);
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      // 타임아웃 설정
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
      
      const response = await fetch(`${supabaseUrl}/functions/v1/save-bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.metadata) {
        console.log('✅ 메타데이터 추출 성공:', result.metadata);
        return result.metadata;
      } else {
        throw new Error('메타데이터 추출 실패');
      }
      
    } catch (error) {
      console.error('❌ Edge Function 메타데이터 추출 오류:', error);
      
      // 실패 시 기본값 반환 (안전한 favicon 생성)
      const domain = url.replace(/https?:\/\//, '').split('/')[0];
      
      return {
        title: url,
        description: '',
        favicon: generateSafeFavicon(domain),
        image_url: `https://image.thum.io/get/width/1200/crop/800/${encodeURIComponent(url)}`,
        tags: []
      };
    }
  };

  useEffect(() => {
    const unique = Array.from(new Set(bookmarks.flatMap(b => b.tags)))
    setTags(unique.map(t => ({ id: t, name: t })))
    setAllTags(unique)
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

      // 실제 메타데이터 추출 (Edge Functions 사용)
      console.log('📊 Edge Function으로 메타데이터 추출 중...');
      const extractedMetadata = await fetchMetadata(url);
      
      const domain = url.replace(/https?:\/\//, '').split('/')[0];
      
      const metadata = {
        title: extractedMetadata.title || url,
        description: extractedMetadata.description || description || '',
        favicon: extractedMetadata.favicon || generateSafeFavicon(domain),
        image_url: extractedMetadata.image_url || `https://image.thum.io/get/width/1200/crop/800/${encodeURIComponent(url)}`,
        tags: extractedMetadata.tags || []
      };

      console.log('✅ 메타데이터 추출 완료:', metadata);

      // 입력된 태그와 추출된 태그 결합
      const finalTags = Array.from(new Set([
        ...(Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : []),
        ...(metadata.tags || [])
      ]));

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
        image_url: metadata.image_url,
        folder_id: folderId,
        tags: finalTags,
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

        console.log('3. 직접 API 호출로 북마크 추가 시도...');
        const result = await directBookmarkInsert(bookmarkData, accessToken);
        
        if (result.error) {
          console.error('❌ 직접 API 호출 실패:', result.error);
          throw new Error(result.error.userMessage || result.error.message || '북마크 추가에 실패했습니다.');
        }
        
        newBookmarkData = result.data;
        console.log('✅ 직접 API 호출 성공:', newBookmarkData);
        
      } catch (apiError) {
        console.warn('⚠️ 직접 API 호출 실패, Supabase 클라이언트로 재시도...', apiError);
        
        // 백업: Supabase 클라이언트 사용
        const supabaseResult = await bookmarkApi.create(bookmarkData);
        newBookmarkData = supabaseResult;
        console.log('✅ Supabase 클라이언트 성공:', newBookmarkData);
      }

      if (!newBookmarkData) {
        throw new Error('북마크 생성에 실패했습니다.');
      }

      // 생성된 북마크 데이터를 UI에 맞게 변환
      const newBookmark: Bookmark = {
        id: newBookmarkData.id,
        user_id: newBookmarkData.user_id,
        url: newBookmarkData.url,
        title: newBookmarkData.title,
        description: newBookmarkData.description || '',
        image_url: newBookmarkData.image_url,
        thumbnail: newBookmarkData.image_url,
        favicon: metadata.favicon,
        category: category,
        tags: newBookmarkData.tags || [],
        folder_id: newBookmarkData.folder_id,
        created_at: newBookmarkData.created_at,
        updated_at: newBookmarkData.updated_at,
        saved_by: 1 // 저장한 사용자 수 (신규 북마크이므로 1)
      };

      console.log('4. 북마크 상태 업데이트:', newBookmark);
      
      // 로컬 상태에 새 북마크 추가
      setBookmarks(prev => [newBookmark, ...prev]);

      // 🔥 BUG FIX: 폴더 개수 실시간 업데이트 추가
      if (folderId) {
        console.log('📊 [addBookmark] 폴더 개수 업데이트:', folderId);
        
        // 폴더 개수 업데이트
        setFolders(prev => prev.map(folder => 
          folder.id === folderId 
            ? { ...folder, bookmarkCount: folder.bookmarkCount + 1 }
            : folder
        ));
        
        // 폴더 트리도 업데이트
        setFoldersTree(prev => updateFolderCountInTree(prev, folderId, 1));
        
        console.log('✅ [addBookmark] 폴더 개수 업데이트 완료');
      }

      console.log('🎉 북마크 추가 완료!');
      toast.success('북마크가 추가되었습니다');
      
    } catch (error) {
      console.error('💥 북마크 추가 실패:', error);
      
      // 사용자 친화적인 에러 메시지
      const errorMessage = error instanceof Error ? error.message : '북마크 추가에 실패했습니다';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBookmark = async (id: string, updates: { title?: string; description?: string; tags?: string[]; folder_id?: string }) => {
    try {
      if (!user) {
        toast.error('북마크를 수정하려면 로그인해야 합니다.');
        return;
      }

      console.log('🔄 [updateBookmark] 북마크 수정 시도:', id, updates);

      // 🔥 BUG FIX: 폴더 이동 감지 로직 개선
      const currentBookmark = bookmarks.find(b => b.id === id);
      if (!currentBookmark) {
        console.warn('⚠️ [updateBookmark] 수정할 북마크를 찾을 수 없음:', id);
        toast.error('수정할 북마크를 찾을 수 없습니다.');
        return;
      }

      // 폴더 이동 상세 분석
      const oldFolderId = currentBookmark.folder_id || null;
      const newFolderId = updates.folder_id === '' ? null : updates.folder_id || null;
      const isMovingFolder = 'folder_id' in updates && oldFolderId !== newFolderId;

      console.log('📊 [updateBookmark] 폴더 이동 분석:', {
        oldFolderId,
        newFolderId,
        isMovingFolder,
        updates_folder_id: updates.folder_id
      });

      const { error } = await supabase
        .from('bookmarks')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ [updateBookmark] 북마크 수정 오류:', error);
        throw error;
      }

      console.log('✅ [updateBookmark] 북마크 수정 성공');
      
      // 북마크 상태 업데이트
      setBookmarks(prev => prev.map(bookmark => 
        bookmark.id === id 
          ? { ...bookmark, ...updates, updated_at: new Date().toISOString() }
          : bookmark
      ));

      // 🔥 BUG FIX: 폴더 이동 시 개수 업데이트 개선
      if (isMovingFolder) {
        console.log('📊 [updateBookmark] 폴더 이동 감지 - 개수 업데이트 시작');
        
        setFolders(prev => prev.map(folder => {
          if (folder.id === oldFolderId) {
            // 이전 폴더 개수 -1
            const newCount = Math.max(0, folder.bookmarkCount - 1);
            console.log(`📊 [updateBookmark] 이전 폴더 ${oldFolderId} 개수: ${folder.bookmarkCount} → ${newCount}`);
            return { ...folder, bookmarkCount: newCount };
          }
          if (folder.id === newFolderId) {
            // 새 폴더 개수 +1
            const newCount = folder.bookmarkCount + 1;
            console.log(`📊 [updateBookmark] 새 폴더 ${newFolderId} 개수: ${folder.bookmarkCount} → ${newCount}`);
            return { ...folder, bookmarkCount: newCount };
          }
          return folder;
        }));

        // 폴더 트리도 업데이트
        let updatedTree = foldersTree;
        if (oldFolderId) {
          updatedTree = updateFolderCountInTree(updatedTree, oldFolderId, -1);
          console.log(`📊 [updateBookmark] 폴더 트리에서 ${oldFolderId} -1 적용`);
        }
        if (newFolderId) {
          updatedTree = updateFolderCountInTree(updatedTree, newFolderId, 1);
          console.log(`📊 [updateBookmark] 폴더 트리에서 ${newFolderId} +1 적용`);
        }
        setFoldersTree(updatedTree);
        
        console.log('✅ [updateBookmark] 폴더 개수 업데이트 완료');
      }

      toast.success('북마크가 수정되었습니다');
    } catch (error) {
      console.error('💥 [updateBookmark] 북마크 수정 오류:', error);
      
      // 사용자 친화적인 에러 메시지
      const errorMessage = error instanceof Error ? error.message : '북마크 수정에 실패했습니다';
      toast.error(errorMessage);
    }
  };

  const deleteBookmark = async (id: string) => {
    try {
      if (!user) {
        toast.error('북마크를 삭제하려면 로그인해야 합니다.');
        return;
      }

      console.log('🗑️ [deleteBookmark] 북마크 삭제 시작:', id);
      console.log('🗑️ [deleteBookmark] 사용자 ID:', user.id);

      // 🔥 BUG FIX: 삭제될 북마크 정보를 미리 저장 (상태 업데이트 전)
      const deletedBookmark = bookmarks.find(b => b.id === id);
      const deletedBookmarkFolderId = deletedBookmark?.folder_id;
      
      if (!deletedBookmark) {
        console.warn('⚠️ [deleteBookmark] 삭제할 북마크를 찾을 수 없음:', id);
        toast.error('삭제할 북마크를 찾을 수 없습니다.');
        return;
      }

      // 1. 먼저 외래키 제약조건 확인 - collection_bookmarks에서 해당 북마크 제거
      console.log('🔗 [deleteBookmark] 컬렉션-북마크 관계 확인 중...');
      try {
        const { data: collectionBookmarks, error: cbError } = await supabase
          .from('collection_bookmarks')
          .select('collection_id')
          .eq('bookmark_id', id);

        if (cbError) {
          console.warn('⚠️ [deleteBookmark] 컬렉션-북마크 관계 조회 실패:', cbError);
        } else if (collectionBookmarks && collectionBookmarks.length > 0) {
          console.log('📚 [deleteBookmark] 컬렉션에 포함된 북마크 발견:', collectionBookmarks.length, '개');
          
          // 컬렉션에서 북마크 제거
          const { error: removeError } = await supabase
            .from('collection_bookmarks')
            .delete()
            .eq('bookmark_id', id);

          if (removeError) {
            console.error('❌ [deleteBookmark] 컬렉션에서 북마크 제거 실패:', removeError);
            throw new Error(`컬렉션에서 북마크 제거 실패: ${removeError.message}`);
          }
          console.log('✅ [deleteBookmark] 컬렉션에서 북마크 제거 완료');
        } else {
          console.log('📚 [deleteBookmark] 컬렉션에 포함되지 않은 북마크');
        }
      } catch (cbError) {
        console.error('❌ [deleteBookmark] 컬렉션-북마크 관계 처리 중 오류:', cbError);
        // 컬렉션 관계 처리 실패 시에도 북마크 삭제는 계속 시도
      }

      // 2. 북마크 삭제 시도 (상세한 에러 정보 포함)
      console.log('🗑️ [deleteBookmark] Supabase 클라이언트로 북마크 삭제 시도...');
      
      const { error, count } = await supabase
        .from('bookmarks')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('❌ [deleteBookmark] Supabase 클라이언트 삭제 실패:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // RLS 정책 관련 에러인지 확인
        if (error.code === 'PGRST301' || error.message?.includes('RLS')) {
          console.warn('🛡️ [deleteBookmark] RLS 정책 위반으로 판단, 직접 API 시도...');
        } else if (error.code === '23503') {
          console.error('🔗 [deleteBookmark] 외래키 제약조건 위반:', error.message);
          throw new Error('다른 데이터와 연결되어 있어 삭제할 수 없습니다.');
        } else {
          console.warn('⚠️ [deleteBookmark] 기타 오류로 직접 API 시도:', error.message);
        }

        // 직접 API 호출로 재시도
        console.log('🔄 [deleteBookmark] 직접 API 호출로 재시도...');
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;
        
        if (!token) {
          throw new Error('인증 토큰을 가져올 수 없습니다. 다시 로그인해 주세요.');
        }

        const directResult = await directBookmarkDelete(id, token);

        if (directResult.error) {
          console.error('❌ [deleteBookmark] 직접 API 호출도 실패:', directResult.error);
          
          // 사용자 친화적인 에러 메시지 사용
          const userMessage = directResult.error.userMessage || directResult.error.message || '알 수 없는 오류';
          throw new Error(userMessage);
        }
        
        console.log('✅ [deleteBookmark] 직접 API 호출로 삭제 성공');
      } else {
        console.log('✅ [deleteBookmark] Supabase 클라이언트로 삭제 성공, 삭제된 레코드 수:', count);
        
        // 실제로 삭제되었는지 확인
        if (count === 0) {
          console.warn('⚠️ [deleteBookmark] 삭제 요청은 성공했지만 삭제된 레코드가 없음');
          throw new Error('해당 북마크를 찾을 수 없거나 삭제 권한이 없습니다.');
        }
      }

      // 🔥 BUG FIX: 삭제가 성공한 후에만 로컬 상태 업데이트
      console.log('🔄 [deleteBookmark] 로컬 상태 업데이트...');
      
      // 3. 북마크 상태 업데이트
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
      
      // 4. 폴더 개수 실시간 업데이트
      if (deletedBookmarkFolderId) {
        console.log('📊 [deleteBookmark] 폴더 개수 업데이트:', deletedBookmarkFolderId);
        
        setFolders(prev => prev.map(folder => 
          folder.id === deletedBookmarkFolderId 
            ? { ...folder, bookmarkCount: Math.max(0, folder.bookmarkCount - 1) }
            : folder
        ));
        
        // 폴더 트리도 업데이트
        setFoldersTree(prev => updateFolderCountInTree(prev, deletedBookmarkFolderId, -1));
        
        console.log('✅ [deleteBookmark] 폴더 개수 업데이트 완료');
      }

      console.log('🎉 [deleteBookmark] 북마크 삭제 완료');
      toast.success('북마크가 삭제되었습니다');
      
    } catch (error) {
      console.error('💥 [deleteBookmark] 전체 프로세스 실패:', error);
      
      // 사용자 친화적인 에러 메시지
      const errorMessage = error instanceof Error ? error.message : '북마크 삭제에 실패했습니다';
      toast.error(errorMessage);
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
        coverImage: collectionBookmarks[0]?.image_url || collectionBookmarks[0]?.thumbnail
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

  const addFolder = async (name: string, iconName?: string, iconColor?: string, iconCategory?: string, parentId?: string) => {
    console.log('[addFolder] 폴더 생성 요청:', { name, iconName, iconColor, iconCategory, parentId });
    if (!user) {
      console.error('[addFolder] 로그인 필요');
      toast.error('로그인이 필요합니다');
      return;
    }
    // 중복 폴더명 체크 (같은 부모 폴더 내에서만)
    const actualParentId = parentId === '__root__' ? undefined : parentId;
    if (folders.some(f => f.name === name && f.parent_id === actualParentId)) {
      console.warn('[addFolder] 중복 폴더명:', name);
      toast.error('같은 위치에 중복된 폴더명이 존재합니다');
      return;
    }
    try {
      console.log('[addFolder] Supabase에 폴더 생성 요청:', name, user.id, actualParentId);
      const newFolder = await folderApi.create(name, user.id, actualParentId, iconName, iconColor, iconCategory);
      console.log('[addFolder] Supabase 폴더 생성 성공:', newFolder);
      
      // 새 폴더를 상태에 즉시 추가
      const formattedFolder: Folder = {
        id: newFolder.id,
        name: newFolder.name,
        icon_name: newFolder.icon_name || 'folder',
        icon_color: newFolder.icon_color || '#3B82F6',
        icon_category: newFolder.icon_category || 'default',
        parent_id: newFolder.parent_id,
        user_id: newFolder.user_id,
        bookmarkCount: 0,
        depth: 0,
        path: [],
        children: [],
        created_at: newFolder.created_at,
        updated_at: newFolder.updated_at
      };
      
      setFolders(prev => {
        const newFolders = [...prev, formattedFolder];
        setFoldersTree(buildFoldersTree(newFolders));
        return newFolders;
      });
      console.log('[addFolder] 폴더 상태 업데이트 완료');
      toast.success('폴더가 생성되었습니다');
    } catch (error) {
      console.error('[addFolder] 폴더 생성 에러:', error);
      toast.error('폴더 생성에 실패했습니다');
    }
  };

  const updateFolder = async (id: string, updates: { name?: string; icon_name?: string; icon_color?: string; icon_category?: string; parent_id?: string }) => {
    console.log('[updateFolder] 폴더 수정 요청:', { id, updates });
    if (!user) {
      console.error('[updateFolder] 로그인 필요');
      toast.error('로그인이 필요합니다');
      return;
    }
    
    // 중복 폴더명 체크 (이름이 변경되는 경우)
    if (updates.name) {
      const targetParentId = updates.parent_id !== undefined ? 
        (updates.parent_id === '__root__' ? undefined : updates.parent_id) : 
        folders.find(f => f.id === id)?.parent_id;
      
      if (folders.some(f => f.id !== id && f.name === updates.name && f.parent_id === targetParentId)) {
        console.warn('[updateFolder] 중복 폴더명:', updates.name);
        toast.error('같은 위치에 중복된 폴더명이 존재합니다');
        return;
      }
    }
    
    try {
      console.log('[updateFolder] Supabase에 폴더 수정 요청:', id, updates);
      const updatedFolder = await folderApi.update(id, updates);
      console.log('[updateFolder] Supabase 폴더 수정 성공:', updatedFolder);
      
      // 폴더 상태 업데이트
      setFolders(prev => {
        const updatedFolders = prev.map(folder => 
          folder.id === id 
            ? {
                ...folder,
                name: updates.name ?? folder.name,
                icon_name: updates.icon_name ?? folder.icon_name,
                icon_color: updates.icon_color ?? folder.icon_color,
                icon_category: updates.icon_category ?? folder.icon_category,
                parent_id: updates.parent_id !== undefined ? updates.parent_id : folder.parent_id
              }
            : folder
        );
        setFoldersTree(buildFoldersTree(updatedFolders));
        return updatedFolders;
      });
      
      console.log('[updateFolder] 폴더 상태 업데이트 완료');
      toast.success('폴더가 수정되었습니다');
    } catch (error) {
      console.error('[updateFolder] 폴더 수정 에러:', error);
      toast.error('폴더 수정에 실패했습니다');
    }
  };

  const deleteFolder = async (id: string) => {
    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }
    
    try {
      console.log('🗑️ [deleteFolder] 폴더 삭제 시작:', id);
      
      // 1. 먼저 해당 폴더에 속한 북마크들의 folder_id를 null로 업데이트
      console.log('📦 [deleteFolder] 폴더 내 북마크 이동 처리 중...');
      const { error: updateError } = await supabase
        .from('bookmarks')
        .update({ folder_id: null })
        .eq('folder_id', id)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('❌ [deleteFolder] 북마크 이동 실패:', updateError);
        throw new Error(`북마크 이동 실패: ${updateError.message}`);
      }
      
      console.log('✅ [deleteFolder] 폴더 내 북마크 이동 완료');

      // 2. 하위 폴더들의 parent_id를 null로 업데이트 (계층 구조 해제)
      console.log('📁 [deleteFolder] 하위 폴더 처리 중...');
      const { error: subFolderError } = await supabase
        .from('folders')
        .update({ parent_id: null })
        .eq('parent_id', id)
        .eq('user_id', user.id);

      if (subFolderError) {
        console.error('❌ [deleteFolder] 하위 폴더 처리 실패:', subFolderError);
        throw new Error(`하위 폴더 처리 실패: ${subFolderError.message}`);
      }
      
      console.log('✅ [deleteFolder] 하위 폴더 처리 완료');

      // 3. 폴더 삭제
      console.log('🗑️ [deleteFolder] 폴더 삭제 실행 중...');
      await folderApi.delete(id);
      console.log('✅ [deleteFolder] 폴더 삭제 완료');
      
      // 4. 클라이언트 상태 업데이트
      console.log('🔄 [deleteFolder] 클라이언트 상태 업데이트 중...');
      
      // 폴더 목록 업데이트 (삭제된 폴더 제거, 하위 폴더들 루트로 이동)
      setFolders(prev => {
        const updatedFolders = prev
          .filter(folder => folder.id !== id) // 삭제된 폴더 제거
          .map(folder => 
            folder.parent_id === id 
              ? { ...folder, parent_id: undefined } // 하위 폴더들을 루트로 이동
              : folder
          );
        setFoldersTree(buildFoldersTree(updatedFolders));
        return updatedFolders;
      });
      
      // 북마크 상태 업데이트 (폴더 참조 제거)
      setBookmarks(prev => prev.map(bookmark =>
        bookmark.folder_id === id
          ? { ...bookmark, folder_id: undefined }
          : bookmark
      ));
      
      console.log('✅ [deleteFolder] 클라이언트 상태 업데이트 완료');
      toast.success('폴더가 삭제되었고, 폴더 내 북마크는 "모든 북마크"로 이동되었습니다');
      
    } catch (error) {
      console.error('💥 [deleteFolder] 폴더 삭제 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
      toast.error(`폴더 삭제에 실패했습니다: ${errorMessage}`);
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

  // 취소 기능
  const cancelImport = useCallback(() => {
    importCancelRef.current.cancelled = true;
    setImportProgress(prev => prev ? {
      ...prev,
      cancelRequested: true,
      currentItem: '취소 중...'
    } : null);
  }, []);

  // 북마크 가져오기 기능 구현
  const importBookmarks = async (file: File, options: ImportOptions) => {
    if (!user) {
      toast.error('북마크를 가져오려면 로그인해야 합니다.');
      return;
    }

    // 취소 상태 초기화
    importCancelRef.current.cancelled = false;
    
    setIsImporting(true);
    const startTime = new Date();
    
    setImportProgress({
      currentStep: 'parsing',
      currentItem: '파일 검증 중...',
      processed: 0,
      total: 0,
      percentage: 0,
      duplicatesFound: [],
      errors: [],
      // 새로운 필드들 추가
      phase: 'validation',
      phaseProgress: 0,
      totalPhases: 5,
      currentPhase: 1,
      cancelRequested: false,
      canCancel: true,
      startTime,
      statistics: {
        foldersCreated: 0,
        bookmarksImported: 0,
        duplicatesSkipped: 0,
        errorsEncountered: 0
      }
    });

    // 변수들을 try 블록 밖에서 선언
    let parseResult: BookmarkParseResult | null = null;
    let mappingResult: MappingResult | null = null;
    let bookmarksImported = 0;
    let errorsEncountered = 0;
    let createdFolders: Map<string, string> = new Map();

    try {
      // 1. 파일 유효성 검증
      const validationResult = BookmarkFileValidator.validateFile(file);
      if (!validationResult.isValid) {
        throw new Error(validationResult.errors.join('\n'));
      }

      // 2. 파일 내용 읽기
      const fileContent = await file.text();
      
      // 파일 타입이 unknown인 경우 건너뛰기
      if (validationResult.fileType !== 'unknown') {
        const contentValidation = BookmarkFileValidator.validateFileContent(fileContent, validationResult.fileType);
        if (!contentValidation.isValid) {
          throw new Error(contentValidation.errors.join('\n'));
        }
      }

      // 3. 파일 파싱
      setImportProgress(prev => prev ? {
        ...prev,
        currentStep: 'parsing',
        currentItem: '북마크 파일 파싱 중...',
        percentage: 10,
        phase: 'parsing',
        phaseProgress: 20,
        currentPhase: 2,
        canCancel: true
      } : null);

      // 취소 체크
      if (importCancelRef.current.cancelled) {
        throw new Error('사용자가 취소했습니다.');
      }

      parseResult = BookmarkParserFactory.parseBookmarkFile(fileContent);
      if (!parseResult.success || !parseResult.data) {
        throw new Error(parseResult.error || '파일 파싱에 실패했습니다.');
      }

      // 4. 폴더 구조 매핑 및 북마크 처리
      setImportProgress(prev => prev ? {
        ...prev,
        currentStep: 'analyzing',
        currentItem: '폴더 구조 분석 중...',
        percentage: 30,
        total: parseResult.data.totalBookmarks,
        phase: 'folder-creation',
        phaseProgress: 40,
        currentPhase: 3,
        canCancel: true
      } : null);

      // 취소 체크
      if (importCancelRef.current.cancelled) {
        throw new Error('사용자가 취소했습니다.');
      }

      const mapper = new FolderStructureMapper(folders, options);
      mappingResult = await mapper.mapToApplicationStructure(parseResult.data);

      // 5. 데이터베이스에 저장
      setImportProgress(prev => prev ? {
        ...prev,
        currentStep: 'importing',
        currentItem: '폴더 생성 중...',
        percentage: 50,
        phase: 'folder-creation',
        phaseProgress: 60,
        currentPhase: 4,
        canCancel: false // 데이터베이스 작업 중에는 취소 불가
      } : null);

      // 1단계: 폴더들을 먼저 생성 (의존성 순서대로 - 이미 깊이 순으로 정렬됨)
      createdFolders = new Map<string, string>(); // 원본 경로 -> 새 폴더 ID
      
      console.log('📁 폴더 생성 시작:', mappingResult.folders.length, '개 폴더');
      
      for (const folderRequest of mappingResult.folders) {
        try {
          // 부모 폴더 ID 해결
          let parentId = folderRequest.parent_id;
          
          // 부모 폴더가 지정되지 않은 경우, 경로에서 부모 폴더 찾기
          if (!parentId && folderRequest.originalPath.includes('/')) {
            const parentPath = folderRequest.originalPath.split('/').slice(0, -1).join('/');
            parentId = createdFolders.get(parentPath);
            console.log('🔗 부모 폴더 ID 해결:', folderRequest.originalPath, '->', parentPath, '->', parentId);
          }

          const newFolder = await folderApi.create(
            folderRequest.name,
            user.id,
            parentId,
            folderRequest.icon_name,
            folderRequest.icon_color,
            folderRequest.icon_category
          );

          createdFolders.set(folderRequest.originalPath, newFolder.id);
          console.log('✅ 폴더 생성 완료:', folderRequest.name, '->', newFolder.id);
          
          // 폴더 상태 업데이트 (개선된 버전)
          setFolders(prev => {
            const newFolderData = {
              id: newFolder.id,
              name: newFolder.name,
              icon_name: newFolder.icon_name,
              icon_color: newFolder.icon_color,
              icon_category: newFolder.icon_category,
              parent_id: newFolder.parent_id,
              user_id: newFolder.user_id,
              bookmarkCount: 0,
              depth: 0,
              path: [],
              children: [],
              created_at: newFolder.created_at,
              updated_at: newFolder.updated_at
            };
            
            // 폴더 트리도 즉시 업데이트
            setFoldersTree(prevTree => buildFoldersTree([...prev, newFolderData]));
            
            return [...prev, newFolderData];
          });

        } catch (error) {
          console.error('폴더 생성 실패:', error);
          mappingResult.errors.push(`폴더 생성 실패: ${folderRequest.name}`);
        }
      }
      
      console.log('📁 폴더 생성 완료. 생성된 폴더 맵:', createdFolders);
      
      // 폴더 생성 완료 후 진행률 업데이트
      setImportProgress(prev => prev ? {
        ...prev,
        currentItem: '폴더 생성 완료. 북마크 가져오기 준비 중...',
        percentage: 60,
        phase: 'folder-creation',
        phaseProgress: 100,
        currentPhase: 4,
        canCancel: false
      } : null);

      // 북마크 배치 처리 - 성능 최적화 적용 (개선된 버전)
      const performanceMonitor = new PerformanceMonitor();
      const memoryInfo = getMemoryInfo();
      
      // 더 큰 배치 크기로 처리 시간 단축
      const adaptiveBatchSize = Math.max(
        calculateOptimalBatchSize(mappingResult.bookmarks.length, 'high'),
        20 // 최소 20개씩 처리
      );
      
      console.log('성능 최적화 정보:', {
        totalBookmarks: mappingResult.bookmarks.length,
        adaptiveBatchSize,
        memoryInfo: memoryInfo ? 
          `${(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB / ${(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(1)}MB` : 
          'N/A',
        memoryPressure: memoryInfo?.memoryPressure || 'unknown'
      });
      
      let batchSize = adaptiveBatchSize;
      const totalBatches = Math.ceil(mappingResult.bookmarks.length / batchSize);
      let processed = 0;
      // bookmarksImported와 errorsEncountered는 이미 위에서 선언됨
      
      setImportProgress(prev => prev ? {
        ...prev,
        currentItem: '북마크 가져오기 중...',
        percentage: 70,
        phase: 'bookmark-import',
        phaseProgress: 0,
        currentPhase: 5,
        canCancel: false,
        batchInfo: {
          currentBatch: 0,
          totalBatches,
          batchSize
        }
      } : null);

      for (let i = 0; i < mappingResult.bookmarks.length; i += batchSize) {
        // 취소 체크
        if (importCancelRef.current.cancelled) {
          throw new Error('사용자가 취소했습니다.');
        }

        const batch = mappingResult.bookmarks.slice(i, i + batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;
        
        // 배치 정보 업데이트
        setImportProgress(prev => prev ? {
          ...prev,
          currentItem: `북마크 가져오기 중... (${currentBatch}/${totalBatches} 배치)`,
          batchInfo: {
            currentBatch,
            totalBatches,
            batchSize
          }
        } : null);
        
        // 2단계: 북마크들을 폴더에 맞게 생성 (폴더 생성 완료 후)
        const batchPromises = batch.map(async (bookmarkRequest) => {
          const itemStartTime = performance.now();
          
          try {
            // 폴더 ID 해결 (개선된 버전)
            let folderId = bookmarkRequest.folder_id;
            
            // 1. 직접 지정된 폴더 ID가 있는 경우
            if (folderId) {
              console.log('📌 직접 폴더 ID 사용:', bookmarkRequest.title, '->', folderId);
            }
            // 2. 태그에서 폴더 정보 추출
            else if (bookmarkRequest.tags?.includes('folder:')) {
              const folderTag = bookmarkRequest.tags.find(t => t.startsWith('folder:'));
              if (folderTag) {
                const folderPath = folderTag.substring(7);
                folderId = createdFolders.get(folderPath);
                console.log('🏷️ 태그에서 폴더 ID 해결:', bookmarkRequest.title, '->', folderPath, '->', folderId);
              }
            }
            // 3. 북마크 요청에 폴더 경로가 있는 경우
            else if (bookmarkRequest.folderPath) {
              folderId = createdFolders.get(bookmarkRequest.folderPath);
              console.log('📂 경로에서 폴더 ID 해결:', bookmarkRequest.title, '->', bookmarkRequest.folderPath, '->', folderId);
            }
            
            // 폴더 ID가 해결되지 않은 경우 로그
            if (!folderId) {
              console.warn('⚠️ 폴더 ID를 찾을 수 없음:', bookmarkRequest.title, '태그:', bookmarkRequest.tags);
            }

            // 메타데이터 추출 최적화 - 병렬 처리로 시간 단축
            const imageUrl = bookmarkRequest.image_url;
            let extractedMetadata = null;
            
            // 메타데이터 추출을 백그라운드에서 실행 (비동기)
            const metadataPromise = (async () => {
              try {
                console.log('🔍 Edge Function으로 메타데이터 추출 시작:', bookmarkRequest.url);
                const metadata = await fetchMetadata(bookmarkRequest.url);
                return metadata;
              } catch (error) {
                console.warn('⚠️ 메타데이터 추출 실패, 기본 이미지 사용:', error);
                return null;
              }
            })();

            // 북마크 생성 데이터 준비 (즉시 실행)
            const bookmarkData = {
              user_id: user.id,
              url: bookmarkRequest.url,
              title: bookmarkRequest.title, // 기본값 사용
              description: bookmarkRequest.description || '',
              image_url: imageUrl, // 기본값 사용
              folder_id: folderId,
              tags: bookmarkRequest.tags || [],
            };

            // 북마크 저장 (즉시 실행)
            const newBookmark = await bookmarkApi.create(bookmarkData);
            
            // 메타데이터 추출 결과 대기 (있는 경우에만 업데이트)
            try {
              extractedMetadata = await metadataPromise;
              if (extractedMetadata) {
                // 메타데이터가 있으면 북마크 업데이트
                await bookmarkApi.update(newBookmark.id, {
                  title: extractedMetadata.title || bookmarkRequest.title,
                  description: extractedMetadata.description || bookmarkRequest.description || '',
                  image_url: extractedMetadata.image_url || imageUrl,
                });
              }
            } catch (updateError) {
              console.warn('⚠️ 메타데이터 업데이트 실패:', updateError);
            }
            
            // 북마크 상태 업데이트 후 폴더 개수 업데이트 (개선된 버전)
            setBookmarks(prev => {
              const updatedBookmark = {
                id: newBookmark.id,
                user_id: newBookmark.user_id,
                url: newBookmark.url,
                title: extractedMetadata?.title || newBookmark.title,
                description: extractedMetadata?.description || newBookmark.description || '',
                image_url: extractedMetadata?.image_url || newBookmark.image_url,
                thumbnail: extractedMetadata?.image_url || newBookmark.image_url,
                favicon: generateSafeFavicon(newBookmark.url.replace(/https?:\/\//, '').split('/')[0]),
                category: 'Other' as Category,
                tags: newBookmark.tags || [],
                folder_id: newBookmark.folder_id,
                created_at: newBookmark.created_at,
                updated_at: newBookmark.updated_at,
                saved_by: 1
              };

              const newBookmarks = [...prev, updatedBookmark];

              // 폴더별 북마크 개수 업데이트 (즉시 반영)
              if (newBookmark.folder_id) {
                console.log('📊 폴더 개수 업데이트:', newBookmark.title, '->', newBookmark.folder_id);
                setFolders(prevFolders => 
                  updateFolderCountInTree(prevFolders, newBookmark.folder_id!, 1)
                );
                
                // 폴더 트리도 즉시 업데이트
                setFoldersTree(prevTree => {
                  const updatedTree = updateFolderCountInTree(prevTree, newBookmark.folder_id!, 1);
                  return updatedTree;
                });
              }

              return newBookmarks;
            });

            processed++;
            bookmarksImported++;
            
            // 성능 메트릭 기록
            const itemProcessingTime = performance.now() - itemStartTime;
            performanceMonitor.recordItemProcessed(itemProcessingTime);
            
            // 진행률 업데이트 (시간 추정 포함)
            const currentTime = new Date();
            const elapsedTime = currentTime.getTime() - startTime.getTime();
            const processingSpeed = processed / (elapsedTime / 1000);
            const remainingItems = mappingResult.bookmarks.length - processed;
            const estimatedTimeRemaining = remainingItems / processingSpeed;
            
            setImportProgress(prev => prev ? {
              ...prev,
              processed,
              percentage: 70 + (processed / mappingResult.bookmarks.length) * 25,
              phaseProgress: (processed / mappingResult.bookmarks.length) * 100,
              processingSpeed,
              estimatedTimeRemaining,
              statistics: {
                ...prev.statistics!,
                bookmarksImported,
                errorsEncountered
              }
            } : null);

          } catch (error) {
            console.error('북마크 생성 실패:', error);
            mappingResult.errors.push(`북마크 생성 실패: ${bookmarkRequest.title}`);
            errorsEncountered++;
            performanceMonitor.recordError();
          }
        });

        // 배치 처리 실행
        await Promise.all(batchPromises);
        
        // 배치 완료 후 메모리 체크 및 최적화
        const currentMemoryInfo = getMemoryInfo();
        if (currentMemoryInfo?.memoryPressure === 'high') {
          console.warn('메모리 압박 감지, 배치 크기 조정 및 가비지 컬렉션 실행');
          batchSize = Math.max(3, Math.floor(batchSize * 0.7));
          await forceGarbageCollection();
          
          // 메모리 압박 상황 알림
          setImportProgress(prev => prev ? {
            ...prev,
            currentItem: `메모리 최적화 중... (배치 크기: ${batchSize})`
          } : null);
        }
      }

      // 폴더 트리 재구성 및 전체 펼침 상태 설정 (개선된 버전)
      const updatedFoldersTree = buildFoldersTree(folders);
      setFoldersTree(updatedFoldersTree);
      
      // 가져오기 완료 후 모든 폴더를 펼친 상태로 설정
      const allFolderIds = new Set<string>();
      const collectFolderIds = (folderList: Folder[]) => {
        folderList.forEach(folder => {
          allFolderIds.add(folder.id);
          if (folder.children && folder.children.length > 0) {
            collectFolderIds(folder.children);
          }
        });
      };
      collectFolderIds(updatedFoldersTree);
      
      console.log('📁 가져오기 완료. 펼칠 폴더 개수:', allFolderIds.size);
      
      // 사이드바의 폴더 펼침 상태를 업데이트하기 위한 이벤트 발생
      window.dispatchEvent(new CustomEvent('bookmarkImportCompleted', {
        detail: { 
          expandedFolders: Array.from(allFolderIds),
          totalBookmarks: bookmarksImported,
          totalFolders: createdFolders.size
        }
      }));

      // 북마크 개수 검증
      const expectedBookmarks = parseResult.data.totalBookmarks;
      const actualBookmarks = bookmarksImported;
      const skippedBookmarks = mappingResult.duplicates.filter(d => d.type === 'bookmark' && d.action === 'skip').length;
      
      console.log('북마크 개수 검증:', {
        expected: expectedBookmarks,
        imported: actualBookmarks,
        skipped: skippedBookmarks,
        errors: errorsEncountered,
        total: actualBookmarks + skippedBookmarks + errorsEncountered
      });

      // 불일치 시 상세 로깅
      if (expectedBookmarks !== actualBookmarks + skippedBookmarks + errorsEncountered) {
        const difference = expectedBookmarks - (actualBookmarks + skippedBookmarks + errorsEncountered);
        console.warn('북마크 개수 불일치 감지:', {
          expected: expectedBookmarks,
          actualImported: actualBookmarks,
          skipped: skippedBookmarks,
          errors: errorsEncountered,
          difference,
          possibleCauses: [
            '파싱 단계에서 중복된 북마크 카운트',
            '폴더 구조 내 누락된 북마크',
            '비동기 처리 중 일부 북마크 누락',
            '유효하지 않은 URL로 인한 스킵'
          ]
        });
        
        // 경고 메시지 추가
        mappingResult.errors.push(`북마크 개수 불일치: 예상 ${expectedBookmarks}개, 실제 처리 ${actualBookmarks + skippedBookmarks + errorsEncountered}개`);
      }

      // 완료
      setImportProgress(prev => prev ? {
        ...prev,
        currentStep: 'completed',
        currentItem: '가져오기 완료',
        percentage: 100,
        phase: 'completed',
        phaseProgress: 100,
        canCancel: false,
        statistics: {
          ...prev.statistics!,
          foldersCreated: createdFolders.size,
          bookmarksImported,
          errorsEncountered
        }
      } : null);

      // 성능 메트릭 완료 및 분석
      const finalMetrics = performanceMonitor.finish();
      const recommendations = generateOptimizationRecommendations(finalMetrics);
      
      console.log('성능 분석 결과:', {
        duration: finalMetrics.duration,
        itemsProcessed: finalMetrics.itemsProcessed,
        averageItemProcessingTime: finalMetrics.averageItemProcessingTime,
        errorCount: finalMetrics.errorCount,
        memoryUsage: {
          initial: finalMetrics.memoryUsage.initial ? 
            `${(finalMetrics.memoryUsage.initial.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB` : 'N/A',
          final: finalMetrics.memoryUsage.final ? 
            `${(finalMetrics.memoryUsage.final.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB` : 'N/A',
          peak: finalMetrics.memoryUsage.peak ? 
            `${(finalMetrics.memoryUsage.peak.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB` : 'N/A'
        },
        recommendations
      });
      
      const completionMessage = `북마크 가져오기 완료! ${bookmarksImported}개의 북마크와 ${createdFolders.size}개의 폴더가 추가되었습니다.`;
      const duration = finalMetrics.duration ? Math.round(finalMetrics.duration / 1000) : 0;
      const hasErrors = errorsEncountered > 0 || mappingResult.errors.length > 0;
      
      // 성공 메시지 표시 (개선된 버전)
      if (hasErrors) {
        toast.success(completionMessage, {
          description: `처리 시간: ${duration}초 (일부 오류 발생)`,
          duration: 8000
        });
      } else {
        toast.success(completionMessage, {
          description: `처리 시간: ${duration}초`,
          duration: 5000
        });
      }

      // 폴더 연결 상태 검증 (개선된 버전)
      const folderConnectionStats = folders.map(folder => ({
        folderName: folder.name,
        folderId: folder.id,
        bookmarkCount: bookmarks.filter(b => b.folder_id === folder.id).length,
        expectedCount: folder.bookmarkCount
      }));

      console.log('📊 폴더 연결 상태 검증:', folderConnectionStats);

      // 연결되지 않은 북마크 확인
      const unconnectedBookmarks = bookmarks.filter(b => !b.folder_id);
      if (unconnectedBookmarks.length > 0) {
        console.warn('⚠️ 폴더에 연결되지 않은 북마크:', unconnectedBookmarks.length);
        mappingResult.errors.push(`${unconnectedBookmarks.length}개의 북마크가 폴더에 연결되지 않았습니다.`);
      }

      // 폴더별 북마크 개수 불일치 확인
      const mismatchedFolders = folderConnectionStats.filter(stat => 
        stat.bookmarkCount !== stat.expectedCount
      );
      
      if (mismatchedFolders.length > 0) {
        console.warn('⚠️ 폴더별 북마크 개수 불일치:', mismatchedFolders);
        mappingResult.errors.push(`${mismatchedFolders.length}개 폴더의 북마크 개수가 일치하지 않습니다.`);
      }

      // 최종 검증 결과 로그
      console.log('🔍 최종 검증 결과:', {
        총북마크: bookmarks.length,
        총폴더: folders.length,
        연결된북마크: bookmarks.filter(b => b.folder_id).length,
        연결되지않은북마크: unconnectedBookmarks.length,
        개수불일치폴더: mismatchedFolders.length
      });
      
      if (hasErrors) {
        const errorSummary = `경고: ${errorsEncountered}개의 북마크 저장 실패, ${mappingResult.errors.length}개의 추가 오류 발생`;
        toast.warning(`${completionMessage}\n${errorSummary} (${duration}초 소요)`, {
          duration: 8000
        });
        
        // 에러 세부 정보 콘솔 출력
        console.error('가져오기 완료 (에러 포함):', {
          성공: { 북마크: bookmarksImported, 폴더: createdFolders.size },
          에러: { 북마크실패: errorsEncountered, 기타오류: mappingResult.errors },
          성능: { 소요시간: duration, 평균처리시간: finalMetrics.averageItemProcessingTime },
          메모리: finalMetrics.memoryUsage
        });
      } else {
        toast.success(`${completionMessage} (${duration}초 소요)`);
      }
      
      // 성능 개선 추천 사항이 있으면 추가 토스트 표시
      if (recommendations.length > 0) {
        setTimeout(() => {
          toast.info(`성능 개선 추천: ${recommendations[0]}`, {
            duration: 5000
          });
        }, 2000);
      }

    } catch (error) {
      console.error('북마크 가져오기 오류:', error);
      
      const isUserCancelled = error instanceof Error && error.message.includes('취소');
      
      setImportProgress(prev => prev ? {
        ...prev,
        currentStep: isUserCancelled ? 'cancelled' : 'error',
        currentItem: isUserCancelled ? '취소됨' : '오류 발생',
        errors: [...(prev.errors || []), error instanceof Error ? error.message : '알 수 없는 오류'],
        canCancel: false
      } : null);

      if (isUserCancelled) {
        toast.info('북마크 가져오기가 취소되었습니다.');
      } else {
        // 에러 상세 정보 제공
        const errorDetails = error instanceof Error ? error.message : '알 수 없는 오류';
        const errorStack = error instanceof Error ? error.stack : undefined;
        
        toast.error(`북마크 가져오기 실패: ${errorDetails}`, {
          duration: 8000
        });
        
        // 상세 에러 정보 콘솔 출력
        console.error('북마크 가져오기 상세 에러:', {
          message: errorDetails,
          stack: errorStack,
          파싱데이터: parseResult?.data ? {
            총북마크: parseResult.data.totalBookmarks,
            총폴더: parseResult.data.totalFolders,
            브라우저: parseResult.data.browser
          } : 'N/A',
          매핑결과: mappingResult ? {
            폴더요청: mappingResult.folders.length,
            북마크요청: mappingResult.bookmarks.length,
            중복: mappingResult.duplicates.length,
            에러: mappingResult.errors.length
          } : 'N/A',
          상태: {
            처리된북마크: bookmarksImported || 0,
            생성된폴더: createdFolders?.size || 0,
            에러발생: errorsEncountered || 0
          }
        });
      }
    } finally {
      setIsImporting(false);
      // 5초 후 진행률 초기화 (사용자가 결과를 확인할 시간 제공)
      setTimeout(() => {
        setImportProgress(null);
        importCancelRef.current.cancelled = false; // 취소 상태 초기화
      }, 5000);
    }
  };

  return (
    <BookmarkContext.Provider value={{
      bookmarks: isLoading ? [] : bookmarks,
      collections: isLoading ? [] : collections,
      folders: isLoading ? [] : folders,
      foldersTree: isLoading ? [] : foldersTree,
      tags,
      allTags,
      isLoading,
      addBookmark,
      updateBookmark,
      deleteBookmark,
      addCollection,
      updateCollection,
      deleteCollection,
      toggleCollectionPublic,
      addFolder,
      updateFolder,
      deleteFolder,
      getBookmarksByFolder,
      getCollection,
      getUserCollections,
      getFlatFolderList,
      refreshData,
      importBookmarks,
      importProgress,
      isImporting,
      cancelImport
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
