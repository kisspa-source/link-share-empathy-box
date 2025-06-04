import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 타입 정의
export interface Bookmark {
  id: string
  user_id: string
  url: string
  title: string
  description: string | null
  image_url: string | null
  created_at: string
  updated_at: string
  tags: string
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

// 직접 API 호출로 북마크 추가 (Supabase 클라이언트 우회)
export const directBookmarkInsert = async (bookmark: any, accessToken?: string) => {
  console.log('직접 API 호출로 북마크 추가 시도...');
  
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
      'Prefer': 'return=representation'
    };
    
    // 인증 토큰이 있으면 헤더에 추가 (RLS 정책 준수)
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(`${supabaseUrl}/rest/v1/bookmarks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(bookmark)
    });
    
    const data = await response.json();
    console.log('직접 API 응답:', response.status, data);
    
    if (!response.ok) {
      console.error('API 요청 실패:', response.status, data);
      return { data: null, error: data };
    }
    
    return { data: data[0], error: null };
  } catch (error) {
    console.error('직접 API 호출 오류:', error);
    return { data: null, error };
  }
};

// 북마크 관련 함수
export const bookmarkApi = {
  // 북마크 생성
  async create(bookmark: Omit<Bookmark, 'id' | 'created_at' | 'updated_at'>) {
    console.log('북마크 API 호출 - 전송 데이터:', bookmark);
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase 클라이언트 객체 확인:', !!supabase);
    
    // 직접 API 호출 방식 먼저 시도
    console.log('직접 API 호출 방식으로 먼저 시도합니다...');
    const directResult = await directBookmarkInsert(bookmark);
    
    if (directResult.data) {
      console.log('직접 API 호출 성공:', directResult.data);
      return directResult.data;
    }
    
    console.warn('직접 API 호출 실패, Supabase 클라이언트로 시도합니다...');
    console.log('북마크 API 호출 - 전송 데이터:', bookmark);
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase 클라이언트 객체 확인:', !!supabase);
    
        // 세션 새로고침 시도를 별도 함수로 분리하고 타임아웃 추가
    const tryRefreshSession = async () => {
      return new Promise<any>((resolve) => {
        // 3초 타임아웃 설정
        const timeout = setTimeout(() => {
          console.warn('세션 새로고침 타임아웃 발생');
          resolve({ error: '타임아웃' });
        }, 3000);
        
        supabase.auth.refreshSession()
          .then(result => {
            clearTimeout(timeout);
            console.log('세션 새로고침 성공:', result);
            resolve(result);
          })
          .catch(error => {
            clearTimeout(timeout);
            console.error('세션 새로고침 오류:', error);
            resolve({ error });
          });
      });
    };
    
    // 현재 인증 상태 확인 (오류 발생해도 계속 진행)
    let token;
    
    try {
      console.log('세션 새로고침 시도...');
      await tryRefreshSession();
      
      // 세션 가져오기 시도
      console.log('현재 세션 가져오기 시도...');
      const session = await supabase.auth.getSession();
      console.log('현재 세션 상태:', session);
      
      if (session?.data?.session) {
        token = session.data.session.access_token;
        console.log('유효한 토큰 있음:', !!token);
      } else {
        console.warn('세션이 없습니다. 익명 키만 사용합니다.');
      }
    } catch (sessionError) {
      console.error('세션 확인 중 오류 발생:', sessionError);
      console.warn('익명 키만 사용하여 진행합니다.');
    }
    
    try {
      console.log('북마크 삽입 시도 시작 (Supabase 클라이언트)...');
      const { data, error } = await supabase
        .from('bookmarks')
        .insert(bookmark)
        .select()
        .single();
      
      console.log('북마크 삽입 응답 (Supabase 클라이언트):', { data, error });
      
      if (error) {
        console.error('북마크 삽입 오류 (Supabase 클라이언트):', error);
        
        // Supabase 클라이언트에 문제가 있는 경우 직접 fetch API 사용 시도
        console.log('직접 fetch API로 시도합니다...');
        try {
          // 토큰이 없어도 요청 시도 (익명 키만으로)
          console.log('사용할 토큰:', token ? '토큰 있음' : '토큰 없음');
          
          // 헤더 구성
          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Prefer': 'return=representation'
          };
          
          // 토큰이 있는 경우에만 Authorization 헤더 추가
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          console.log('사용할 헤더:', Object.keys(headers));
          
          const response = await fetch(`${supabaseUrl}/rest/v1/bookmarks`, {
            method: 'POST',
            headers,
            body: JSON.stringify(bookmark)
          });
          
          const responseData = await response.json();
          console.log('직접 fetch 응답:', response.status, responseData);
          
          if (response.ok) {
            console.log('직접 fetch 성공!');
            return responseData[0]; // 반환된 배열의 첫 번째 항목
          } else {
            console.error('직접 fetch 실패:', responseData);
            throw new Error('직접 API 호출 실패: ' + JSON.stringify(responseData));
          }
        } catch (fetchError) {
          console.error('직접 fetch 예외:', fetchError);
          throw fetchError;
        }
      }
      
      console.log('북마크 삽입 성공:', data);
      return data;
    } catch (e) {
      console.error('북마크 삽입 예외 발생:', e);
      throw e;
    }
  },

  // 북마크 목록 조회
  async list(userId: string) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
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
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        bookmarks:collection_bookmarks(
          bookmark:bookmarks(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
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
  }
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
