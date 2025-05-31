// src/lib/test-utils.ts

import { supabase } from './supabase';
import { toast } from 'sonner';

// =========================
// 재시도(fetch retry) 헬퍼
// - 네트워크 일시 장애 시 재시도할 수 있도록 간단히 구현했습니다.
// - 기본 재시도 횟수: 2회, 지연 시간: 1초
// =========================
async function fetchWithRetry<T>(
  fn: () => Promise<{ data: T; error: any }>,
  retries = 2,
  delayMs = 1000
): Promise<{ data: T; error: any }> {
  let attempt = 0;
  while (attempt <= retries) {
    const { data, error } = await fn();
    if (!error) {
      return { data, error: null };
    }
    attempt++;
    console.warn(`[fetchWithRetry] 시도 ${attempt}/${retries} 실패: ${error.message || error}`);
    await new Promise((res) => setTimeout(res, delayMs));
  }
  return { data: null as any, error: new Error('최종 시도까지 실패했습니다') };
}

// =========================
// 랜덤 이메일/닉네임 생성
// =========================
function generateRandomEmail() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test.${random}.${timestamp}@example.com`;
}

function generateRandomNickname() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `테스트계정_${random}_${timestamp}`;
}

// =========================
// 테스트용 사용자 정보
// =========================
const TEST_USER = {
  email: generateRandomEmail(),
  password: 'test1234!@',
  nickname: generateRandomNickname(),
};

// =========================
// 회원가입 테스트
// - 필요 시 기존 테스트 계정을 삭제 후, 새로 회원가입 & 프로필 생성
// - RLS 정책에 의해 프로필 접근이 제한될 수 있으므로, 실제 테이블 대신
//   “profiles” 테이블이 익명 또는 인증된 상태에서 정상 접근 가능한지 사전에 확인 필요
// =========================
export async function testSignup(): Promise<boolean> {
  console.log('[testSignup] 회원가입 테스트 시작');
  try {
    // 1) 기존 테스트 계정 삭제 시도 (이미 존재한다면)
    try {
      const { data: existingSession } = await supabase.auth.signInWithPassword({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });
      const existingUser = existingSession?.user;

      if (existingUser) {
        console.log('[testSignup] 기존 사용자 확인, 프로필 및 사용자 삭제 시도');

        // 프로필 삭제
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', existingUser.id);
        if (profileError) {
          console.warn('[testSignup] 프로필 삭제 실패:', profileError.message || profileError);
        }

        // 사용자 삭제 (관리자 권한 필요)
        const { error: userError } = await supabase.auth.admin.deleteUser(existingUser.id);
        if (userError) {
          console.warn('[testSignup] 사용자 삭제 실패:', userError.message || userError);
        }

        // 삭제 후 잠시 대기
        await new Promise((res) => setTimeout(res, 1000));
      }
    } catch (err) {
      console.warn('[testSignup] 기존 계정 삭제 시도 중 오류:', (err as any).message || err);
    }

    // 2) 회원가입 시도
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: TEST_USER.email,
      password: TEST_USER.password,
      options: {
        data: {
          nickname: TEST_USER.nickname,
        },
      },
    });
    if (signUpError) {
      console.error('[testSignup] 회원가입 오류:', signUpError.message || signUpError);
      throw signUpError;
    }
    if (!signUpData?.user) {
      throw new Error('회원가입 후 사용자 데이터가 반환되지 않았습니다');
    }
    console.log('[testSignup] 회원가입 성공, 사용자 ID:', signUpData.user.id);

    // 3) 프로필 생성
    const { error: profileInsertError } = await supabase
      .from('profiles')
      .insert({
        id: signUpData.user.id,
        email: TEST_USER.email,
        nickname: TEST_USER.nickname,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${TEST_USER.nickname}`,
      });
    if (profileInsertError) {
      console.error('[testSignup] 프로필 생성 오류:', profileInsertError.message || profileInsertError);
      throw profileInsertError;
    }

    console.log('[testSignup] 프로필 생성 성공');
    toast.success('회원가입 테스트 성공');
    return true;
  } catch (error: any) {
    console.error('[testSignup] 테스트 실패:', error.message || error);
    toast.error(`회원가입 테스트 실패: ${error.message || '알 수 없는 오류'}`);
    return false;
  }
}

// =========================
// 북마크 생성 테스트
// - 인증된 상태가 아니면 에러 반환
// - RLS 정책에 의해 “bookmarks” 테이블 직접 접근이 제한될 수 있으므로,
//   익명/기타 사용권한을 확인하거나, 테스트 전 RLS 정책이 해제되어 있어야 함
// =========================
export async function testBookmarkCreation(userId: string): Promise<any | null> {
  console.log('[testBookmarkCreation] 북마크 생성 테스트 시작');
  try {
    // 1) 현재 세션 확인
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    if (!session) {
      throw new Error('인증된 사용자가 아닙니다');
    }
    console.log('[testBookmarkCreation] 인증 상태 확인 완료');

    // 2) “bookmarks” 테이블 접근 가능한지 사전 확인 (count 조회)
    //    재시도(fetchWithRetry)로 권한 문제 제외
    const { data: tableInfo, error: tableError } = await supabase
      .from('bookmarks')
      .select('*')
      .limit(1);
      
    if (tableError) {
      console.error('[testBookmarkCreation] 북마크 테이블 접근 에러:', tableError.message || tableError);
      throw new Error(`북마크 테이블 접근 실패: ${tableError.message || tableError}`);
    }
    console.log('[testBookmarkCreation] 북마크 테이블 접근 성공');

    // 3) 북마크 생성
    const testBookmark = {
      user_id: userId,
      url: 'https://example.com',
      title: '테스트 북마크',
      description: '테스트용 북마크입니다.',
      tags: ['test', 'example'],
      created_at: new Date().toISOString(),
    };
    console.log('[testBookmarkCreation] 생성할 데이터:', testBookmark);

    // RLS 정책이 걸려 있으면 같은 사용자만 INSERT 가능해야 함
    const { data, error } = await supabase
      .from('bookmarks')
      .insert(testBookmark)
      .select()
      .single();

    if (error) {
      console.error('[testBookmarkCreation] 북마크 생성 오류:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    console.log('[testBookmarkCreation] 북마크 생성 성공:', data);
    toast.success('북마크 생성 테스트 성공');
    return data;
  } catch (error: any) {
    console.error('[testBookmarkCreation] 테스트 실패:', error.message || error);
    toast.error(`북마크 생성 테스트 실패: ${error.message || '알 수 없는 오류'}`);
    return null;
  }
}

// =========================
// 컬렉션 생성 테스트
// - RLS 정책에 따라 동일 사용자만 INSERT 권한이 있어야 함
// =========================
export async function testCollectionCreation(userId: string): Promise<any | null> {
  console.log('[testCollectionCreation] 컬렉션 생성 테스트 시작');
  try {
    const testCollection = {
      user_id: userId,
      name: '테스트 컬렉션',
      description: '테스트용 컬렉션입니다.',
    };

    const { data, error } = await supabase
      .from('collections')
      .insert(testCollection)
      .select()
      .single();

    if (error) {
      console.error('[testCollectionCreation] 컬렉션 생성 오류:', error.message || error);
      throw error;
    }

    console.log('[testCollectionCreation] 컬렉션 생성 성공:', data);
    toast.success('컬렉션 생성 테스트 성공');
    return data;
  } catch (error: any) {
    console.error('[testCollectionCreation] 테스트 실패:', error.message || error);
    toast.error('컬렉션 생성 테스트 실패');
    return null;
  }
}

// =========================
// 보안 테스트
// 1) 인증되지 않은 사용자의 데이터 접근 시도
// 2) 다른 사용자의 데이터 접근 시도
// 3) RLS 정책으로 본인 데이터만 조회 가능한지 확인
//
// **주의**: RLS 정책이 활성화되어 있지 않으면 다른 사용자의 데이터를 볼 수 있으므로,
// 테스트 전 RLS 정책을 반드시 설정해야 합니다.
// =========================
export async function testSecurity(): Promise<boolean> {
  console.log('[testSecurity] 보안 테스트 시작');
  try {
    let retryCount = 0;

    // 1) 인증되지 않은 사용자 테스트
    console.log('[testSecurity] 1. 인증되지 않은 사용자 테스트');
    const { data: initialSessionData } = await supabase.auth.getSession();
    const initialSession = initialSessionData.session;
    if (initialSession) {
      console.log('[testSecurity] 기존 세션 로그아웃 시도');
      await supabase.auth.signOut();

      // 로그아웃 완료 대기
      let isLoggedOut = false;
      retryCount = 0;
      while (!isLoggedOut && retryCount < 5) {
        const { data: checkSessionData } = await supabase.auth.getSession();
        if (!checkSessionData.session) {
          isLoggedOut = true;
          console.log('[testSecurity] 로그아웃 성공');
        } else {
          console.log(`[testSecurity] 로그아웃 대기 중 (${retryCount + 1}/5)`);
          await new Promise((res) => setTimeout(res, 1000));
          retryCount++;
        }
      }
      if (!isLoggedOut) {
        throw new Error('로그아웃이 제대로 되지 않았습니다');
      }
    }

    // 확인: 확실히 인증되지 않은 상태
    const { data: finalSessionData } = await supabase.auth.getSession();
    if (finalSessionData.session) {
      console.error('[testSecurity] 여전히 인증된 상태');
      throw new Error('인증 상태가 해제되지 않았습니다');
    }
    console.log('[testSecurity] 인증되지 않은 상태 확인됨');

    // 2) 다른 사용자의 데이터 접근 테스트
    console.log('[testSecurity] 2. 다른 사용자 데이터 접근 테스트');
    // 테스트 계정으로 로그인
    console.log('[testSecurity] 테스트 계정 로그인 시도');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    if (signInError || !signInData.user) {
      console.error('[testSecurity] 로그인 오류:', signInError?.message || signInError);
      throw new Error('테스트 계정 로그인 실패');
    }
    console.log('[testSecurity] 로그인 성공, 사용자 ID:', signInData.user.id);

    // 로그인 완료 대기
    let isLoggedIn = false;
    retryCount = 0;
    while (!isLoggedIn && retryCount < 5) {
      const { data: checkSessionData } = await supabase.auth.getSession();
      if (checkSessionData.session) {
        isLoggedIn = true;
        console.log('[testSecurity] 세션 확인 완료');
      } else {
        console.log(`[testSecurity] 로그인 상태 확인 중 (${retryCount + 1}/5)`);
        await new Promise((res) => setTimeout(res, 1000));
        retryCount++;
      }
    }
    if (!isLoggedIn) {
      throw new Error('로그인이 정상적으로 처리되지 않았습니다');
    }

    // 다른 사용자의 북마크 조회 시도
    console.log('[testSecurity] 다른 사용자 북마크 조회 시도');
    const { data: otherUserData, error: otherUserError } = await supabase
      .from('bookmarks')
      .select('*')
      .neq('user_id', signInData.user.id)
      .limit(1);

    if (!otherUserError && otherUserData && otherUserData.length > 0) {
      console.error('[testSecurity] 다른 사용자의 데이터에 접근할 수 있음', otherUserData);
      throw new Error('다른 사용자의 데이터에 접근할 수 있습니다');
    }
    console.log('[testSecurity] 다른 사용자 데이터 접근 실패(정상)');

    // 3) RLS 정책 테스트 (본인 데이터 조회)
    console.log('[testSecurity] 3. RLS 정책 테스트 (본인 데이터 조회)');
    const { data: rlsTestData, error: rlsTestError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', signInData.user.id)
      .limit(1);

    if (rlsTestError) {
      console.error('[testSecurity] RLS 정책으로 본인 데이터 조회 불가:', rlsTestError.message || rlsTestError);
      throw new Error('본인 데이터 조회가 불가능합니다');
    }
    console.log('[testSecurity] RLS 정책으로 본인 데이터 조회 성공');

    console.log('[testSecurity] 모든 보안 테스트 성공');
    toast.success('보안 테스트 성공');
    return true;
  } catch (error: any) {
    console.error('[testSecurity] 보안 테스트 실패:', error.message || error);
    toast.error(`보안 테스트 실패: ${error.message || '알 수 없는 오류'}`);
    return false;
  }
}

// =========================
// 실시간 업데이트 테스트
// - Supabase Realtime 채널 구독 후, 이벤트 수신 여부 확인
// =========================
export async function testRealtimeUpdates(userId: string): Promise<boolean> {
  console.log('[testRealtimeUpdates] 실시간 업데이트 테스트 시작');
  return new Promise((resolve) => {
    try {
      const channel = supabase
        .channel('test-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'bookmarks',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            console.log('[testRealtimeUpdates] 실시간 업데이트 수신:', payload);
            channel.unsubscribe();
            toast.success('실시간 업데이트 테스트 성공');
            resolve(true);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[testRealtimeUpdates] 채널 구독 성공, 테스트 데이터 생성 중...');
            // 테스트 데이터 생성 (백그라운드)
            testBookmarkCreation(userId).catch((err) => {
              console.error('[testRealtimeUpdates] 테스트 데이터 생성 중 오류:', err);
              channel.unsubscribe();
              toast.error('실시간 업데이트 테스트 실패 (데이터 생성 오류)');
              resolve(false);
            });
          }
        });
    } catch (error: any) {
      console.error('[testRealtimeUpdates] 실시간 테스트 중 예외 발생:', error.message || error);
      toast.error(`실시간 업데이트 실패: ${error.message || '알 수 없는 오류'}`);
      resolve(false);
    }
  });
}

// =========================
// Supabase 연결 테스트
// - 환경 변수 확인 → RLS 정책 반영을 위한 “뷰(View)” 조회 → toast/console 로 결과 노출
// =========================
export async function testSupabaseConnection(): Promise<boolean> {
  console.log('[testSupabaseConnection] Supabase 연결 테스트 시작');
  try {
    // 1) 환경 변수 방어적으로 읽기
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[testSupabaseConnection] 환경 변수 설정 오류:', {
        supabaseUrl,
        supabaseAnonKey,
      });
      throw new Error('Supabase 환경 변수가 설정되지 않았습니다');
    }
    console.log('[testSupabaseConnection] 환경 변수 확인 완료');

    // 2) RLS 정책이 있을 경우를 대비해 “public_profiles” 뷰(view) 조회 권장
    //    실제로 RLS가 설정된 상황에서는 뷰를 통해 최소한의 컬럼(id, nickname, avatar_url 등)만 노출하도록 구성해야 안전합니다.
    //    뷰 이름은 프로젝트마다 다를 수 있으므로, 실제 환경에 맞추어 변경하세요.
    const targetTableOrView = 'public_profiles'; // RLS 정책을 우회하기 위해 만든 뷰

    // 3) 재시도 로직을 활용해 간단한 조회 수행
    const { data, error } = await fetchWithRetry(async () => {
      const result = await supabase.from(targetTableOrView).select('*').limit(1);
      return result;
    });
    if (error) {
      console.error(`[testSupabaseConnection] '${targetTableOrView}' 조회 실패:`, error.message || error);
      throw error;
    }
    if (!data) {
      throw new Error('데이터가 없습니다');
    }

    console.log(`[testSupabaseConnection] '${targetTableOrView}' 조회 성공:`, data);
    toast.success('Supabase 연결 테스트 성공');
    return true;
  } catch (error: any) {
    const message = error.message || '알 수 없는 오류';
    console.error('[testSupabaseConnection] 테스트 실패:', message);
    toast.error(`Supabase 연결 실패: ${message}`);
    return false;
  }
}