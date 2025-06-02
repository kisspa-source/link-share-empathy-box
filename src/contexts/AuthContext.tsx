import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser, AuthError } from '@supabase/supabase-js';
import { toast } from 'sonner';

// 사용자 인터페이스
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
  provider?: string; // 선택적 속성으로 변경
}

// 인증 컨텍스트 타입
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, onSuccess?: () => void) => Promise<void>;
  signup: (email: string, password: string, nickname: string, onSuccess?: () => void) => Promise<void>;
  logout: (onSuccess?: () => void) => Promise<void>;
  signInWithGoogle: (onSuccess?: () => void) => Promise<void>;
  signInWithGitHub: (onSuccess?: () => void) => Promise<void>;
  signInWithKakao: (onSuccess?: () => void) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 인증 상태/프로필 관리
  useEffect(() => {
    // 최초 mount 시 세션 체크
    const checkAuth = async () => {
      try {
        console.log('세션 체크 시작');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('세션 조회 오류:', error);
          throw error;
        }
        
        if (session) {
          console.log('세션 발견 - 사용자:', session.user.email);
          // 프로필 정보 가져오기 (email은 auth.users에서 가져옴)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('nickname, avatar_url')
            .eq('id', session.user.id)
            .maybeSingle(); // single() 대신 maybeSingle() 사용
            
          // 프로필이 있으면 user 세팅, 없어도 기본 정보로 계속 진행
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            nickname: profile?.nickname || session.user.user_metadata?.name || '사용자',
            avatarUrl: profile?.avatar_url || 
                      session.user.user_metadata?.avatar_url || 
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
            provider: session.user.app_metadata?.provider || 'email'
          };
          
          console.log('사용자 데이터 설정:', userData);
          setUser(userData);
          
          // 프로필이 없으면 생성 시도
          if (!profile && !profileError) {
            console.log('프로필이 없어 새로 생성합니다.');
            try {
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: session.user.id,
                  nickname: userData.nickname,
                  avatar_url: userData.avatarUrl
                });
                
              if (insertError) {
                console.error('프로필 생성 실패:', insertError);
              }
            } catch (e) {
              console.error('프로필 생성 중 오류:', e);
            }
          }
        } else {
          console.log('활성 세션 없음');
          setUser(null);
        }
      } catch (error) {
        console.error('인증 체크 실패:', error);
        setUser(null);
      } finally {
        console.log('인증 체크 완료, 로딩 종료');
        setIsLoading(false);
      }
    };
    
    // 세션 체크 실행
    checkAuth();
    
    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('인증 상태 변경 감지:', event);
      
      if (event === 'SIGNED_IN' && session) {
        try {
          // 프로필 정보 가져오기 (email은 auth.users에서 가져옴)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('nickname, avatar_url')
            .eq('id', session.user.id)
            .maybeSingle(); // single() 대신 maybeSingle() 사용
            
          // 사용자 데이터 설정 (프로필이 없어도 기본값으로 진행)
          const userData = {
            id: session.user.id,
            email: session.user.email!,
            nickname: profile?.nickname || session.user.user_metadata?.name || '사용자',
            avatarUrl: profile?.avatar_url || 
                      session.user.user_metadata?.avatar_url || 
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.user.email}`,
            provider: session.user.app_metadata?.provider || 'email'
          };
          
          setUser(userData);
          
          // 프로필이 없으면 생성 시도
          if (!profile && !profileError) {
            console.log('프로필이 없어 새로 생성합니다.');
            try {
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  id: session.user.id,
                  nickname: userData.nickname,
                  avatar_url: userData.avatarUrl
                });
                
              if (insertError) {
                console.error('프로필 생성 실패:', insertError);
              }
            } catch (e) {
              console.error('프로필 생성 중 오류:', e);
            }
          }
          
        } catch (e) {
          console.error('인증 상태 변경 처리 중 오류:', e);
        } finally {
          setIsLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsLoading(false);
      } else {
        setIsLoading(false);
      }
    });

    // 컴포넌트 unmount 시 구독 해제
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // 일반 로그인
  const login = async (email: string, password: string, onSuccess?: () => void) => {
    setIsLoading(true);
    try {
      // 1. 이메일/비밀번호로 로그인 시도
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('로그인 오류:', error);
        throw error;
      }
      
      if (!data.user) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }
      
      // 프로필 정보 가져오기 (email은 auth.users에서 가져옴)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('id', data.user.id)
        .maybeSingle(); // single() 대신 maybeSingle() 사용
        
      // 프로필이 있으면 user 세팅, 없어도 기본 정보로 계속 진행
      const userData = {
        id: data.user.id,
        email: data.user.email!,
        nickname: profile?.nickname || data.user.user_metadata?.name || '사용자',
        avatarUrl: profile?.avatar_url || 
                  data.user.user_metadata?.avatar_url || 
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.email}`,
        provider: data.user.app_metadata?.provider || 'email'
      };
      
      setUser(userData);
      console.log('로그인 성공:', userData);
      
      // 5. 성공 콜백 호출
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('로그인 실패:', error);
      if (error.message === 'Invalid login credentials') {
        throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
      }
      throw new Error('로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 일반 회원가입
  const signup = async (email: string, password: string, nickname: string, onSuccess?: () => void) => {
    setIsLoading(true);
    try {
      // 회원가입
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname
          }
        }
      });

      if (error) {
        throw error;
      }
      if (!data.user) {
        throw new Error('사용자 생성에 실패했습니다.');
      }
      // 프로필 생성 (email은 저장하지 않음)
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          nickname,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`,
          provider: data.user.user_metadata?.provider
        });
      if (profileError) {
        throw profileError;
      }
      setUser({
        id: data.user.id,
        email: data.user.email!,
        nickname,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`,
        provider: data.user.user_metadata?.provider
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      if (error.message.includes('User already registered')) {
        throw new Error('이미 등록된 이메일입니다.');
      }
      throw new Error('회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃
  const logout = async (onSuccess?: () => void) => {
    setIsLoading(true); // 로그아웃 시작 시 로딩 시작!
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      onSuccess?.();
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw new Error('로그아웃에 실패했습니다.');
    } finally {
      setIsLoading(false); // 로그아웃 종료 시 무조건 로딩 종료!
    }
  };

  // 소셜 로그인 - 실제로는 바로 리다이렉트로 빠지므로 이후 코드는 실행 안 됨
  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'kakao', onSuccess?: () => void) => {
    try {
      setIsLoading(true);
      
      // 현재 경로를 세션 스토리지에 저장 (로그인 후 리다이렉트용)
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/login' && currentPath !== '/signup') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      
      // OAuth 로그인 시도 (리다이렉트 방식)
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      
      // 리다이렉트 후에는 AuthCallback 컴포넌트에서 처리
      
    } catch (error) {
      console.error(`${provider} 로그인 오류:`, error);
      sessionStorage.removeItem('redirectAfterLogin'); // 오류 발생 시 저장된 경로 제거
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // provider 별 소셜 로그인 함수
  const signInWithGoogle = (onSuccess?: () => void) => handleOAuthSignIn('google', onSuccess);
  const signInWithGitHub = (onSuccess?: () => void) => handleOAuthSignIn('github', onSuccess);
  const signInWithKakao = (onSuccess?: () => void) => handleOAuthSignIn('kakao', onSuccess);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    signInWithGoogle,
    signInWithGitHub,
    signInWithKakao,
  };

  // AuthContext.Provider로 children 감싸서 context 전달
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth는 AuthProvider 내에서 사용해야 합니다.');
  }
  return context;
};