import { supabase } from './supabase';
import { toast } from 'sonner';

// 랜덤 이메일 생성 함수
function generateRandomEmail() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test.${random}.${timestamp}@example.com`;
}

// 랜덤 닉네임 생성 함수
function generateRandomNickname() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `테스트계정_${random}_${timestamp}`;
}

// 테스트용 사용자 계정
const TEST_USER = {
  email: generateRandomEmail(),
  password: 'test1234!@',
  nickname: generateRandomNickname()
};

// 회원가입 테스트
export async function testSignup() {
  try {
    console.log('회원가입 테스트 시작:', TEST_USER.email);

    // 기존 테스트 계정 삭제 시도
    console.log('기존 테스트 계정 확인 중...');
    const { data: existingUser } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });

    if (existingUser?.user) {
      console.log('기존 테스트 계정 삭제 중...');
      // 먼저 프로필 삭제
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', existingUser.user.id);

      if (profileError) {
        console.error('프로필 삭제 실패:', profileError);
      }

      // 그 다음 사용자 삭제
      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        existingUser.user.id
      );

      if (deleteError) {
        console.error('사용자 삭제 실패:', deleteError);
      }

      // 삭제 후 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 회원가입 시도
    console.log('새로운 계정 생성 중...');
    const { data, error } = await supabase.auth.signUp({
      email: TEST_USER.email,
      password: TEST_USER.password,
      options: {
        data: {
          nickname: TEST_USER.nickname
        }
      }
    });

    if (error) {
      console.error('회원가입 에러:', error.message);
      throw error;
    }

    if (!data.user) {
      throw new Error('사용자 데이터가 생성되지 않았습니다.');
    }

    console.log('회원가입 성공, 프로필 생성 중...');

    // 프로필 생성
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        nickname: TEST_USER.nickname
      });

    if (profileError) {
      console.error('프로필 생성 에러:', profileError.message);
      throw profileError;
    }

    console.log('프로필 생성 성공');
    toast.success('회원가입 테스트 성공');
    return true;
  } catch (error) {
    console.error('회원가입 테스트 실패:', error);
    toast.error(`회원가입 테스트 실패: ${error.message}`);
    return false;
  }
}

// 북마크 생성 테스트
export async function testBookmarkCreation(userId: string) {
  try {
    console.log('북마크 생성 테스트 시작...');
    console.log('사용자 ID:', userId);

    // 사용자 인증 상태 확인
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('인증된 사용자가 아닙니다');
    }
    console.log('인증 상태 확인 완료');

    // 북마크 테이블 존재 여부 확인
    const { data: tableInfo, error: tableError } = await supabase
      .from('bookmarks')
      .select('count')
      .limit(1);

    if (tableError) {
      console.error('북마크 테이블 접근 에러:', tableError);
      throw new Error(`북마크 테이블 접근 실패: ${tableError.message}`);
    }
    console.log('북마크 테이블 접근 성공');

    const testBookmark = {
      user_id: userId,
      url: 'https://example.com',
      title: '테스트 북마크',
      description: '테스트용 북마크입니다.',
      tags: ['test', 'example'],
      created_at: new Date().toISOString()
    };

    console.log('북마크 생성 시도:', testBookmark);

    // RLS 정책 확인
    const { data: rlsInfo, error: rlsError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .limit(1);

    if (rlsError) {
      console.error('RLS 정책 확인 에러:', rlsError);
      throw new Error(`RLS 정책 확인 실패: ${rlsError.message}`);
    }
    console.log('RLS 정책 확인 완료');

    // 북마크 생성
    const { data, error } = await supabase
      .from('bookmarks')
      .insert(testBookmark)
      .select()
      .single();

    if (error) {
      console.error('북마크 생성 에러:', error);
      console.error('에러 코드:', error.code);
      console.error('에러 상세:', error.details);
      console.error('에러 힌트:', error.hint);
      throw error;
    }

    if (!data) {
      throw new Error('북마크가 생성되었지만 데이터가 반환되지 않았습니다');
    }

    console.log('북마크 생성 성공:', data);
    toast.success('북마크 생성 테스트 성공');
    return data;
  } catch (error) {
    console.error('북마크 생성 테스트 실패:', error);
    toast.error(`북마크 생성 테스트 실패: ${error.message}`);
    return null;
  }
}

// 컬렉션 생성 테스트
export async function testCollectionCreation(userId: string) {
  try {
    const testCollection = {
      user_id: userId,
      name: '테스트 컬렉션',
      description: '테스트용 컬렉션입니다.'
    };

    const { data, error } = await supabase
      .from('collections')
      .insert(testCollection)
      .select()
      .single();

    if (error) throw error;

    toast.success('컬렉션 생성 테스트 성공');
    return data;
  } catch (error) {
    console.error('컬렉션 생성 테스트 실패:', error);
    toast.error('컬렉션 생성 테스트 실패');
    return null;
  }
}

// 보안 테스트
export async function testSecurity() {
  try {
    console.log('보안 테스트 시작...');

    // 1. 인증되지 않은 사용자의 데이터 접근 시도
    console.log('1. 인증되지 않은 사용자 테스트...');
    
    // 현재 세션 확인 및 로그아웃
    const { data: { session } } = await supabase.auth.getSession();
    console.log('현재 세션 상태:', session ? '로그인됨' : '로그인되지 않음');
    
    if (session) {
      console.log('기존 세션 로그아웃 중...');
      await supabase.auth.signOut();
      
      // 로그아웃 완료 확인
      let isLoggedOut = false;
      let retryCount = 0;
      
      while (!isLoggedOut && retryCount < 5) {
        const { data: { session: checkSession } } = await supabase.auth.getSession();
        if (!checkSession) {
          isLoggedOut = true;
          console.log('로그아웃 성공');
        } else {
          console.log('로그아웃 대기 중... (시도:', retryCount + 1, ')');
          await new Promise(resolve => setTimeout(resolve, 1000));
          retryCount++;
        }
      }

      if (!isLoggedOut) {
        throw new Error('로그아웃이 제대로 되지 않았습니다');
      }
    }

    // 인증되지 않은 상태 확인
    const { data: { session: finalCheck } } = await supabase.auth.getSession();
    if (finalCheck) {
      console.error('세션 정보:', finalCheck);
      throw new Error('여전히 인증된 상태입니다');
    }

    console.log('인증되지 않은 상태 확인됨');

    // 인증되지 않은 상태에서 데이터 접근 시도
    console.log('인증되지 않은 상태에서 북마크 데이터 접근 시도...');
    const { data: unauthenticatedAccess, error: unauthenticatedError } = await supabase
      .from('bookmarks')
      .select('*')
      .limit(1);

    console.log('접근 시도 결과:', {
      data: unauthenticatedAccess,
      error: unauthenticatedError
    });

    // 에러가 발생하거나 데이터가 없어야 정상
    if (!unauthenticatedError) {
      console.error('인증되지 않은 사용자가 데이터에 접근할 수 있음');
      console.error('접근된 데이터:', unauthenticatedAccess);
      throw new Error('인증되지 않은 사용자가 데이터에 접근할 수 있음');
    }

    console.log('인증되지 않은 사용자 테스트 성공');

    // 2. 다른 사용자의 데이터 접근 시도
    console.log('2. 다른 사용자 데이터 접근 테스트...');
    
    // 테스트 계정으로 다시 로그인
    console.log('테스트 계정 로그인 시도...');
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    
    if (signInError || !user) {
      console.error('로그인 에러:', signInError);
      throw new Error('테스트 계정 로그인 실패');
    }

    console.log('로그인 성공, 사용자 ID:', user.id);

    // 로그인 완료 확인
    let isLoggedIn = false;
    retryCount = 0;
    
    while (!isLoggedIn && retryCount < 5) {
      const { data: { session: checkSession } } = await supabase.auth.getSession();
      if (checkSession) {
        isLoggedIn = true;
        console.log('세션 확인 완료');
      } else {
        console.log('로그인 상태 확인 중... (시도:', retryCount + 1, ')');
        await new Promise(resolve => setTimeout(resolve, 1000));
        retryCount++;
      }
    }

    if (!isLoggedIn) {
      throw new Error('로그인이 제대로 되지 않았습니다');
    }

    // 다른 사용자의 북마크 접근 시도
    console.log('다른 사용자의 북마크 접근 시도...');
    const { data: otherUserData, error: otherUserError } = await supabase
      .from('bookmarks')
      .select('*')
      .neq('user_id', user.id)
      .limit(1);

    console.log('다른 사용자 데이터 접근 결과:', {
      data: otherUserData,
      error: otherUserError
    });

    if (!otherUserError && otherUserData?.length > 0) {
      console.error('다른 사용자의 데이터에 접근할 수 있음');
      console.error('접근된 데이터:', otherUserData);
      throw new Error('다른 사용자의 데이터에 접근할 수 있음');
    }
    console.log('다른 사용자 데이터 접근 테스트 성공');

    // 3. RLS 정책 테스트
    console.log('3. RLS 정책 테스트...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .limit(1);

    console.log('RLS 정책 테스트 결과:', {
      data: rlsTest,
      error: rlsError
    });

    if (rlsError) {
      console.error('자신의 데이터에 접근할 수 없음');
      throw new Error('자신의 데이터에 접근할 수 없음');
    }
    console.log('RLS 정책 테스트 성공');

    console.log('모든 보안 테스트 성공');
    toast.success('보안 테스트 성공');
    return true;
  } catch (error) {
    console.error('보안 테스트 실패:', error);
    toast.error(`보안 테스트 실패: ${error.message}`);
    return false;
  }
}

// 실시간 업데이트 테스트
export async function testRealtimeUpdates(userId: string) {
  return new Promise((resolve) => {
    const channel = supabase
      .channel('test-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('실시간 업데이트 수신:', payload);
          channel.unsubscribe();
          resolve(true);
        }
      )
      .subscribe();

    // 테스트 데이터 생성
    testBookmarkCreation(userId);
  });
}

// Supabase 연결 테스트
export async function testSupabaseConnection() {
  try {
    console.log('Supabase 연결 테스트 시작...');
    
    // 환경 변수 확인
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('Supabase URL:', supabaseUrl ? '설정됨' : '설정되지 않음');
    console.log('Supabase Anon Key:', supabaseAnonKey ? '설정됨' : '설정되지 않음');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase 환경 변수가 설정되지 않았습니다');
    }

    // 간단한 쿼리 테스트
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase 쿼리 에러:', error);
      throw error;
    }

    console.log('Supabase 연결 성공');
    toast.success('Supabase 연결 테스트 성공');
    return true;
  } catch (error) {
    console.error('Supabase 연결 테스트 실패:', error);
    toast.error(`Supabase 연결 테스트 실패: ${error.message}`);
    return false;
  }
} 