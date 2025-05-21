
import { createContext, useContext, useState, ReactNode } from 'react';

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
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for demo
const mockUser: User = {
  id: '1',
  email: 'demo@linkbox.co.kr',
  nickname: '링크박스',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linkbox'
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate checking for existing session
  useState(() => {
    const checkAuth = async () => {
      try {
        // In a real app, check for valid token/session
        const savedAuth = localStorage.getItem('auth');
        
        if (savedAuth) {
          setUser(JSON.parse(savedAuth));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  });

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API call with 500ms delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For MVP, allow any credentials and use mock user
      setUser(mockUser);
      localStorage.setItem('auth', JSON.stringify(mockUser));
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (email: string, password: string, nickname: string) => {
    setIsLoading(true);
    try {
      // Simulate API call with 500ms delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For MVP, create user based on provided info
      const newUser = {
        ...mockUser,
        email,
        nickname,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`
      };
      
      setUser(newUser);
      localStorage.setItem('auth', JSON.stringify(newUser));
    } catch (error) {
      console.error('Signup failed:', error);
      throw new Error('회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth');
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
