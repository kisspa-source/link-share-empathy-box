import { createClient } from '@supabase/supabase-js'
import { Bookmark } from '../types/bookmark'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('[supabase.ts] 환경 변수 확인: SUPABASE_URL = ', supabaseUrl ? 'Loaded' : 'Not Loaded');
console.log('[supabase.ts] 환경 변수 확인: SUPABASE_ANON_KEY = ', supabaseAnonKey ? 'Loaded' : 'Not Loaded');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[supabase.ts] Supabase URL 또는 ANON Key가 설정되지 않았습니다.');
  // 개발 환경에서만 alert를 띄워 사용자에게 문제 인지시킴
  if (import.meta.env.DEV) {
    alert('Supabase 환경 변수가 설정되지 않았습니다! .env 파일을 확인해주세요.');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('[supabase.ts] Supabase 클라이언트 초기화 완료. 클라이언트 객체 유효성: ', !!supabase);

// 데이터베이스 스키마에 맞는 타입 정의
export interface BookmarkDB {
  id: string
  user_id: string
  url: string
  title: string
  description: string | null
  image_url: string | null
  created_at: string
  updated_at: string
  tags: string[]
  folder_id?: string
}

export type Collection = {
  id: string
  user_id: string
  name: string
  description: string | null
  cover_image: string | null
  created_at: string
  updated_at: string
  bookmarks: Bookmark[]
}

// 직접 API 호출로 북마크 추가 (최적화된 버전)
export const directBookmarkInsert = async (bookmark: Omit<BookmarkDB, 'id' | 'created_at' | 'updated_at'>, accessToken?: string) => {
  console.log('🚀 빠른 북마크 저장 시작...');
  
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Prefer': 'return=representation'
    };
    
    // 인증 토큰이 있으면 헤더에 추가
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${supabaseUrl}/rest/v1/bookmarks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(bookmark)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ 북마크 저장 실패:', response.status, errorData);
      return { data: null, error: errorData };
    }
    
    const data = await response.json();
    console.log('✅ 북마크 저장 성공:', data[0]?.id);
    
    return { data: data[0], error: null };
  } catch (error) {
    console.error('❌ 북마크 저장 예외:', error);
    return { data: null, error };
  }
};

// 북마크 관련 함수
export const bookmarkApi = {
  // 북마크 생성 (최적화된 버전)
  async create(bookmark: Omit<BookmarkDB, 'id' | 'created_at' | 'updated_at'>) {
    console.log('📝 북마크 API 호출 시작');
    
    // 세션 확인 (단순화)
    let token;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    } catch (sessionError) {
      console.warn('⚠️ 세션 확인 실패, 익명 키로 진행:', sessionError);
    }
    
    // 직접 API 호출 (가장 빠른 방법)
    const result = await directBookmarkInsert(bookmark, token);
    
    if (result.data) {
      return result.data;
    }
    
    // 백업: Supabase 클라이언트 사용
    console.log('🔄 백업 방법으로 시도...');
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert(bookmark)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('❌ 백업 방법도 실패:', e);
      throw e;
    }
  },

  // 북마크 목록 조회 (캐싱 최적화)
  async list(userId: string) {
    console.log('📋 북마크 목록 조회:', userId);
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    } catch (e) {
      console.error('❌ 북마크 목록 조회 실패:', e);
      throw e;
    }
  },

  // 북마크 수정
  async update(id: string, updates: Partial<Bookmark>) {
    const { data, error } = await supabase
      .from('bookmarks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 북마크 삭제
  async delete(id: string) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// 북마크 직접 삭제 (Supabase 클라이언트 우회)
export const directBookmarkDelete = async (id: string, accessToken?: string) => {
  console.log('🔧 [directBookmarkDelete] 직접 API 호출로 북마크 삭제 시작:', id);
  
  try {
    const headers: HeadersInit = {
      'apikey': supabaseAnonKey,
      'Content-Type': 'application/json'
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('🔑 [directBookmarkDelete] 인증 토큰 사용');
    } else {
      console.warn('⚠️ [directBookmarkDelete] 인증 토큰이 없어 익명 키만 사용');
    }

    const url = `${supabaseUrl}/rest/v1/bookmarks?id=eq.${id}`;
    console.log('🌐 [directBookmarkDelete] 요청 URL:', url);
    console.log('📋 [directBookmarkDelete] 요청 헤더:', {
      'apikey': supabaseAnonKey.substring(0, 20) + '...',
      'Authorization': accessToken ? 'Bearer ' + accessToken.substring(0, 20) + '...' : 'None',
      'Content-Type': 'application/json'
    });

    const response = await fetch(url, {
      method: 'DELETE',
      headers
    });

    console.log('📊 [directBookmarkDelete] 응답 상태:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error('❌ [directBookmarkDelete] 응답 에러 데이터:', errorData);
      } catch (parseError) {
        console.error('❌ [directBookmarkDelete] 에러 응답 파싱 실패:', parseError);
        errorData = { 
          message: `HTTP ${response.status}: ${response.statusText}`,
          code: response.status.toString()
        };
      }

      // 구체적인 에러 분류
      if (response.status === 401) {
        errorData.userMessage = '인증이 필요합니다. 다시 로그인해 주세요.';
      } else if (response.status === 403) {
        errorData.userMessage = '삭제 권한이 없습니다.';
      } else if (response.status === 404) {
        errorData.userMessage = '삭제할 북마크를 찾을 수 없습니다.';
      } else if (response.status === 409) {
        errorData.userMessage = '다른 데이터와 연결되어 있어 삭제할 수 없습니다.';
      } else {
        errorData.userMessage = `서버 오류가 발생했습니다. (${response.status})`;
      }

      return { error: errorData };
    }

    // 성공적인 응답 처리
    let responseData = null;
    try {
      const text = await response.text();
      if (text) {
        responseData = JSON.parse(text);
        console.log('📄 [directBookmarkDelete] 응답 데이터:', responseData);
      } else {
        console.log('✅ [directBookmarkDelete] 빈 응답 (정상 삭제)');
      }
    } catch (parseError) {
      console.warn('⚠️ [directBookmarkDelete] 응답 파싱 실패 (정상일 수 있음):', parseError);
    }

    console.log('🎉 [directBookmarkDelete] 삭제 성공');
    return { error: null, data: responseData };
    
  } catch (error) {
    console.error('💥 [directBookmarkDelete] 네트워크 오류:', error);
    
    const errorResponse = {
      message: error instanceof Error ? error.message : '네트워크 오류가 발생했습니다.',
      userMessage: '네트워크 연결을 확인하고 다시 시도해 주세요.',
      originalError: error
    };
    
    return { error: errorResponse };
  }
};

// 컬렉션 관련 함수
export const collectionApi = {
  // 컬렉션 생성
  async create(collection: Omit<Collection, 'id' | 'created_at' | 'updated_at' | 'bookmarks'>) {
    const { data, error } = await supabase
      .from('collections')
      .insert(collection)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 컬렉션 목록 조회
  async list(userId: string) {
    console.log('[collectionApi.list] 요청 시작:', { userId });
    try {
      console.log('[collectionApi.list] supabase.from 호출 직전');
      const { data, error } = await supabase
        .from('collections')
        .select('*, bookmarks(*), profiles!user_id(nickname,avatar_url)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      console.log('[collectionApi.list] supabase.from 호출 결과:', { data, error });
      if (error) {
        console.error('[collectionApi.list] Supabase 쿼리 에러:', error);
        throw error;
      }
      return data;
    } catch (e) {
      console.error('[collectionApi.list] 함수 에러:', e);
      throw e;
    }
  },

  // 컬렉션 수정
  async update(id: string, updates: Partial<Collection>) {
    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 컬렉션 삭제
  async delete(id: string) {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // 북마크를 컬렉션에 추가
  async addBookmark(collectionId: string, bookmarkId: string) {
    const { error } = await supabase
      .from('collection_bookmarks')
      .insert({
        collection_id: collectionId,
        bookmark_id: bookmarkId
      })
    
    if (error) throw error
  },

  // 컬렉션에서 북마크 제거
  async removeBookmark(collectionId: string, bookmarkId: string) {
    const { error } = await supabase
      .from('collection_bookmarks')
      .delete()
      .eq('collection_id', collectionId)
      .eq('bookmark_id', bookmarkId)
    
    if (error) throw error
  },

  // 단일 컬렉션 조회
  async get(id: string) {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*, bookmarks(*), profiles!user_id(nickname,avatar_url)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[collectionApi.get] 컬렉션 조회 오류:', e);
      throw e;
    }
  },

  // 공개 컬렉션 목록 조회
  async listPublic() {
    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*, bookmarks(*), profiles!user_id(nickname,avatar_url)')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (e) {
      console.error('[collectionApi.listPublic] 공개 컬렉션 조회 오류:', e);
      throw e;
    }
  },
}

export const profileApi = {
  async update(id: string, updates: { nickname?: string; avatar_url?: string }) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id, ...updates })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

// 프로필 조회
export const fetchProfile = async (id: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// 특정 사용자의 공개 컬렉션 조회
export const fetchPublicCollections = async (userId: string) => {
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const directFolderInsert = async (folder: any, accessToken?: string) => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Prefer': 'return=representation'
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    const response = await fetch(`${supabaseUrl}/rest/v1/folders`, {
      method: 'POST',
      headers,
      body: JSON.stringify(folder)
    });
    const data = await response.json();
    if (!response.ok) {
      return { data: null, error: data };
    }
    return { data: data[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
};

export const folderApi = {
  async list(userId: string) {
    console.log('[folderApi.list] 요청 시작:', { userId });
    try {
      console.log('[folderApi.list] 북마크 개수와 함께 폴더 조회');
      
      // 폴더 기본 정보와 북마크 개수를 함께 조회
      const { data, error } = await supabase
        .from('folders')
        .select(`
          id, 
          name, 
          icon_name, 
          icon_color, 
          icon_category, 
          parent_id, 
          user_id, 
          created_at, 
          updated_at,
          bookmarks:bookmarks!folder_id(count)
        `)
        .eq('user_id', userId)
        .order('name');

      console.log('[folderApi.list] supabase.from 호출 결과:', { data, error });
      
      if (error) {
        console.error('[folderApi.list] Supabase 쿼리 에러:', error);
        throw error;
      }

      // 데이터 변환: bookmarks.count를 bookmarkCount로 변환
      const foldersWithCount = data?.map(folder => ({
        ...folder,
        bookmarkCount: folder.bookmarks?.[0]?.count || 0
      })) || [];

      console.log('[folderApi.list] 변환된 데이터:', foldersWithCount);
      return foldersWithCount;
      
    } catch (e) {
      console.error('[folderApi.list] 함수 에러:', e);
      // 에러 발생 시 기존 방식으로 폴백
      console.log('[folderApi.list] 폴백: 기존 방식으로 폴더만 조회');
      try {
        const { data, error } = await supabase
          .from('folders')
          .select('id, name, icon_name, icon_color, icon_category, parent_id, user_id, created_at, updated_at')
          .eq('user_id', userId)
          .order('name');
        
        if (error) throw error;
        
        // bookmarkCount는 0으로 초기화 (프론트엔드에서 계산)
        return data?.map(folder => ({ ...folder, bookmarkCount: 0 })) || [];
      } catch (fallbackError) {
        console.error('[folderApi.list] 폴백도 실패:', fallbackError);
        throw fallbackError;
      }
    }
  },

  async create(name: string, userId: string, parentId?: string, iconName?: string, iconColor?: string, iconCategory?: string) {
    // 인증 토큰 가져오기
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    const folder = { 
      name, 
      user_id: userId, 
      parent_id: parentId ?? null,
      icon_name: iconName ?? 'folder',
      icon_color: iconColor ?? '#3B82F6',
      icon_category: iconCategory ?? 'default'
    };
    // 1. 직접 fetch로 시도
    const directResult = await directFolderInsert(folder, accessToken);
    if (directResult.data) return directResult.data;
    // 2. 실패 시 SDK로 fallback
    const { data, error } = await supabase
      .from('folders')
      .insert(folder)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: { name?: string; parent_id?: string | null; icon_name?: string; icon_color?: string; icon_category?: string }) {
    const { data, error } = await supabase
      .from('folders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string) {
    const { error } = await supabase.from('folders').delete().eq('id', id)
    if (error) throw error
  }
}

export const uploadAvatar = async (userId: string, file: File) => {
  const filePath = `${userId}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
  return data.publicUrl
}
