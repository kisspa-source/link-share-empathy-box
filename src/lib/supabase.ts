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
  try {
    const headers: HeadersInit = {
      'apikey': supabaseAnonKey
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/bookmarks?id=eq.${id}`,
      {
        method: 'DELETE',
        headers
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('직접 북마크 삭제 실패:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('직접 북마크 삭제 오류:', error);
    return { error };
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
      console.log('[folderApi.list] supabase.from 호출 직전');
      const { data, error } = await supabase
        .from('folders')
        .select('id, name')
        .eq('user_id', userId)
        .order('name');
      console.log('[folderApi.list] supabase.from 호출 결과:', { data, error });
      if (error) {
        console.error('[folderApi.list] Supabase 쿼리 에러:', error);
        throw error;
      }
      return data;
    } catch (e) {
      console.error('[folderApi.list] 함수 에러:', e);
      throw e;
    }
  },

  async create(name: string, userId: string, parentId?: string) {
    // 인증 토큰 가져오기
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    const folder = { name, user_id: userId, parent_folder_id: parentId ?? null };
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

  async update(id: string, updates: { name?: string; parent_folder_id?: string | null }) {
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
