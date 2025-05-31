import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

// Mock user data for MVP
export interface User {
  id: string;
  email: string;
  nickname: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for demo
const mockUser: User = {
  id: '1',
  email: 'demo@linku.me',
  nickname: '링쿠미',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linkuplum'
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 세션 체크 및 사용자 정보 로드
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 현재 세션 확인
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // 프로필 정보 가져오기
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('프로필 로드 실패:', profileError);
            return;
          }

          setUser({
            id: session.user.id,
            email: session.user.email!,
            nickname: profile.nickname,
            avatarUrl: profile.avatar_url
          });
        }
      } catch (error) {
        console.error('인증 체크 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();

    // 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // 프로필 정보 가져오기
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error('프로필 로드 실패:', profileError);
          return;
        }

        setUser({
          id: session.user.id,
          email: session.user.email!,
          nickname: profile.nickname,
          avatarUrl: profile.avatar_url
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('사용자 정보를 찾을 수 없습니다.');
      }

      // 프로필 정보 가져오기
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      setUser({
        id: data.user.id,
        email: data.user.email!,
        nickname: profile.nickname,
        avatarUrl: profile.avatar_url
      });
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

  const signup = async (email: string, password: string, nickname: string) => {
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

      // 프로필 생성
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          nickname,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`
        });

      if (profileError) {
        throw profileError;
      }

      setUser({
        id: data.user.id,
        email: data.user.email!,
        nickname,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`
      });
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

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
    } catch (error) {
      console.error('로그아웃 실패:', error);
      throw new Error('로그아웃에 실패했습니다.');
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      signup,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
