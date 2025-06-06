import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // 사용자 정보 설정 함수
  const setUser = (user: User | null) => {
    console.log('사용자 정보 설정:', user);
    setUserState(user);
    // 사용자 정보가 있으면 인증됨 상태로 설정
    setIsAuthenticated(!!user);
  };

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
          await handleSession(session);
        } else if (isMounted) {
          // 세션이 없는 경우 명시적으로 사용자 상태 초기화
          setUser(null);
        }
      } catch (error) {
        console.error('인증 확인 중 오류 발생:', error);
        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    checkAuth();

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        console.log('인증 상태 변경 감지:', event, { hasSession: !!session });
        
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          return;
        }
        
        try {
          await handleSession(session);
        } catch (error) {
          console.error('세션 처리 중 오류 발생:', error);
          setUser(null);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // 세션 처리 함수
  const handleSession = async (session: Session | null) => {
    console.log('handleSession 호출됨', { session });
    
    if (!session?.user) {
      console.log('세션에 사용자 정보가 없습니다. 사용자 정보를 초기화합니다.');
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const userData = session.user;
      console.log('세션 처리 시작:', { 
        userId: userData.id, 
        email: userData.email,
        metadata: userData.user_metadata,
        appMetadata: userData.app_metadata
      });
      
      // 사용자 정보 객체 미리 생성
      const newUser = {
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
      
      console.log('기본 사용자 정보 생성:', newUser);
      
      // 사용자 정보 설정 - 프로필 정보 가져오기 전에 먼저 설정
      setUser(newUser);
      
      // 인증 상태를 먼저 설정
      setIsAuthenticated(true);
      
      // 로딩 상태 해제
      setIsLoading(false);
      
      // 프로필 정보 가져오기 (배경에서 실행)
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.id)
          .single();
          
        if (!error && profile) {
          console.log('프로필 정보 가져오기 성공:', profile);
          
          // 프로필 정보로 사용자 정보 업데이트
          const updatedUser = {
            ...newUser,
            nickname: profile.nickname || newUser.nickname,
            avatarUrl: profile.avatar_url || newUser.avatarUrl
          };
          
          console.log('프로필 정보로 업데이트된 사용자 정보:', updatedUser);
          setUser(updatedUser);
        } else {
          console.warn('프로필 조회 중 오류 발생 (계속 진행):', error);
        }
      } catch (error) {
        console.warn('프로필 요청 중 예외 발생 (계속 진행):', error);
      }
      
    } catch (error) {
      console.error('세션 처리 중 치명적 오류 발생:', error);
      // 치명적 오류 시에도 사용자 정보 초기화
      setUser(null);
      setIsLoading(false);
    }
  };

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
      
      // 리다이렉트 후 돌아올 경로 저장
      sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
