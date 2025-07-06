import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchWithTimeout, handleError } from '@/lib/utils';
import { Session, User as SupabaseUser, AuthError } from '@supabase/supabase-js';
import { toast } from 'sonner';

// 사용자 인터페이스
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  provider?: string;
}

// 인증 컨텍스트 타입
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  login: (email: string, password: string, onSuccess?: () => void) => Promise<void>;
  signup: (email: string, password: string, nickname: string, onSuccess?: () => void) => Promise<{ user: User | null; session: any }>;
  logout: (onSuccess?: () => void) => Promise<void>;
  signInWithOAuth: (provider: 'google' | 'kakao' | 'github', onSuccess?: () => void) => Promise<void>;
  signInWithGoogle: (onSuccess?: () => void) => Promise<void>;
  signInWithGitHub: (onSuccess?: () => void) => Promise<void>;
  signInWithKakao: (onSuccess?: () => void) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [userState, setUserState] = useState<User | null>(null);
  const [sessionState, setSessionState] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // 중복 호출 방지를 위한 ref
  const isHandlingSession = useRef(false);
  const lastProcessedUserId = useRef<string | null>(null);
  
  // 사용자 정보 설정 함수
  const setUser = (user: User | null) => {
    console.log('사용자 정보 설정:', user);
    setUserState(user);
    setIsAuthenticated(!!user);
  };

  // 디바운스된 handleSession 함수
  const handleSession = useCallback(async (session: Session | null) => {
    console.log('handleSession 호출됨', { session: !!session });
    
    if (!session?.user) {
      console.log('세션에 사용자 정보가 없습니다. 사용자 정보를 초기화합니다.');
      setUser(null);
      setIsLoading(false);
      isHandlingSession.current = false;
      lastProcessedUserId.current = null;
      return;
    }

    // 중복 처리 방지 - 이미 처리 중이거나 같은 사용자인 경우
    if (isHandlingSession.current || lastProcessedUserId.current === session.user.id) {
      console.log('[handleSession] 중복 처리 방지: 이미 처리 중이거나 같은 사용자');
      return;
    }

    // 이미 같은 사용자 정보가 설정되어 있는 경우 조기 반환
    if (userState && userState.id === session.user.id) {
      console.log('[handleSession] 기존 사용자 상태가 존재합니다. 프로필 재요청을 생략합니다.');
      setIsAuthenticated(true);
      setIsLoading(false);
      lastProcessedUserId.current = session.user.id;
      return;
    }

    isHandlingSession.current = true;
    
    try {
      const userData = session.user;
      console.log('세션 처리 시작:', {
        userId: userData.id,
        email: userData.email,
        metadata: userData.user_metadata,
        appMetadata: userData.app_metadata
      });
      
      // 기본 사용자 정보 (user_metadata 기반)
      let newUser = {
        id: userData.id,
        email: userData.email || '',
        nickname: userData.user_metadata?.name ||
                 userData.user_metadata?.nickname ||
                 userData.user_metadata?.full_name ||
                 userData.user_metadata?.user_name ||
                 '사용자',
        avatarUrl: userData.user_metadata?.avatar_url ||
                 userData.user_metadata?.picture,
        provider: userData.app_metadata?.provider || 'email'
      };

      // profiles 테이블에서 사용자 설정 정보 조회 (닉네임 우선 적용)
      try {
        console.log('[handleSession] profiles 테이블에서 사용자 정보 조회 중...');
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('nickname, avatar_url')
          .eq('id', userData.id)
          .single();

        if (!profileError && profile) {
          console.log('[handleSession] 프로필 정보 조회 성공:', profile);
          // profiles 테이블의 닉네임이 있으면 우선 사용
          if (profile.nickname && profile.nickname.trim()) {
            newUser.nickname = profile.nickname;
          }
          // profiles 테이블의 아바타가 있으면 우선 사용
          if (profile.avatar_url) {
            newUser.avatarUrl = profile.avatar_url;
          }
        } else if (profileError && profileError.code === 'PGRST116') {
          // 프로필이 없는 경우 새로 생성
          console.log('[handleSession] 프로필이 없어 새로 생성합니다.');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: userData.id,
              nickname: newUser.nickname,
              avatar_url: newUser.avatarUrl,
            });
          
          if (insertError) {
            console.warn('[handleSession] 프로필 생성 실패:', insertError);
          } else {
            console.log('[handleSession] 프로필 생성 성공');
          }
        } else {
          console.warn('[handleSession] 프로필 조회 오류:', profileError);
        }
      } catch (profileFetchError) {
        console.warn('[handleSession] 프로필 조회 중 오류 발생:', profileFetchError);
        // 오류 발생 시 user_metadata 정보로 진행
      }
      
      console.log('[handleSession] 프로필 데이터 처리 완료. 최종 newUser:', newUser);

      setUser(newUser);
      setIsAuthenticated(true);
      lastProcessedUserId.current = userData.id;
    } catch (error) {
      console.error('세션 처리 중 치명적 오류 발생:', error);
      setUser(null);
      lastProcessedUserId.current = null;
    } finally {
      console.log('[AuthContext] handleSession: setIsLoading(false) 호출');
      setIsLoading(false);
      isHandlingSession.current = false;
    }
  }, [userState]);

  // 초기 세션 로드
  useEffect(() => {
    let isMounted = true;
    
    const checkAuth = async () => {
      if (!isMounted) return;
      
      try {
        console.log('세션 체크 시작');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('세션 조회 오류:', error);
          throw error;
        }
        
        console.log('세션 확인:', { hasSession: !!session, user: session?.user });
        
        if (session?.user) {
          setSessionState(session);
          await handleSession(session);
        } else if (isMounted) {
          setSessionState(null);
          setUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('인증 확인 중 오류 발생:', error);
        if (isMounted) {
          setSessionState(null);
          setUser(null);
          setIsLoading(false);
        }
      }
    };
    
    checkAuth();

    // 인증 상태 변경 감지 - 디바운싱 적용
    let authTimeout: NodeJS.Timeout;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('인증 상태 변경 감지:', event, { hasSession: !!session });
        
        // 디바운싱: 빠른 연속 이벤트를 방지
        clearTimeout(authTimeout);
        authTimeout = setTimeout(async () => {
          if (!isMounted) return;
          
          if (event === 'SIGNED_OUT' || !session) {
            setSessionState(null);
            setUser(null);
            isHandlingSession.current = false;
            lastProcessedUserId.current = null;
            return;
          }
          
          try {
            setSessionState(session);
            await handleSession(session);
          } catch (error) {
            console.error('세션 처리 중 오류 발생:', error);
            setSessionState(null);
            setUser(null);
          }
        }, 300); // 300ms 디바운싱
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, [handleSession]);

  // 이메일/비밀번호 로그인
  const login = async (email: string, password: string, onSuccess?: () => void) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('로그인 오류:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 회원가입
  const signup = async (email: string, password: string, nickname: string, onSuccess?: () => void): Promise<{ user: User | null; session: any }> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname,
          },
        },
      });
      
      if (error) throw error;
      if (onSuccess) onSuccess();
      
      // 반환 타입에 맞게 변환
      return {
        user: data.user ? {
          id: data.user.id,
          email: data.user.email || '',
          nickname: data.user.user_metadata?.nickname || '',
          avatarUrl: data.user.user_metadata?.avatar_url,
          provider: data.user.app_metadata?.provider
        } : null,
        session: data.session
      };
    } catch (error) {
      console.error('회원가입 오류:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃
  const logout = async (onSuccess?: () => void) => {
    try {
      console.log('로그아웃 시도...');
      setIsLoading(true);
      
      // 먼저 상태 초기화 (사용자 경험 개선을 위해)
      setIsAuthenticated(false);
      setUser(null);
      
      // auth-token 삭제
      localStorage.removeItem('auth-token');
      // Supabase 자동 토큰 삭제 (sb-hgnojljsxnxpwenaacra-auth-token)
      localStorage.removeItem('sb-hgnojljsxnxpwenaacra-auth-token');
      
      // Supabase 로그아웃 실행
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('로그아웃 API 오류:', error);
        toast.error('로그아웃 중 오류가 발생했습니다.');
        return;
      }
      
      console.log('로그아웃 성공 - 상태 초기화 완료');
      
      // 성공 콜백 실행
      if (onSuccess) {
        console.log('로그아웃 성공 콜백 실행');
        onSuccess();
      }
      
      // 상태 변경 확인을 위한 로그
      console.log('로그아웃 후 상태:', { 
        isAuthenticated, 
        user: null,
        isLoading: false 
      });
      
    } catch (error) {
      console.error('로그아웃 처리 오류:', error);
      toast.error('로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // OAuth 로그인 통합 함수
  const signInWithOAuth = async (provider: 'google' | 'kakao' | 'github', onSuccess?: () => void) => {
    try {
      setIsLoading(true);
      
      console.log('Current Redirect URL:', import.meta.env.VITE_AUTH_REDIRECT_TO);

      // 리다이렉트 후 돌아올 경로 저장
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: import.meta.env.VITE_AUTH_REDIRECT_TO,
        },
      });
      
      if (error) throw error;
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(`${provider} 로그인 오류:`, error);
      sessionStorage.removeItem('redirectAfterLogin');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 개별 OAuth 로그인 함수들
  const signInWithGoogle = useCallback((onSuccess?: () => void) => {
    return signInWithOAuth('google', onSuccess);
  }, []);

  const signInWithGitHub = useCallback((onSuccess?: () => void) => {
    return signInWithOAuth('github', onSuccess);
  }, []);

  const signInWithKakao = useCallback((onSuccess?: () => void) => {
    return signInWithOAuth('kakao', onSuccess);
  }, []);

  const value = {
    user: userState,
    session: sessionState,
    isAuthenticated,
    isLoading,
    setUser,
    login,
    signup,
    logout,
    signInWithOAuth,
    signInWithGoogle,
    signInWithGitHub,
    signInWithKakao,
  };

  useEffect(() => {
    console.log('[AuthProvider] isLoading:', isLoading, 'user:', userState);
  }, [isLoading, userState]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내에서 사용되어야 합니다.');
  }
  return context;
};
