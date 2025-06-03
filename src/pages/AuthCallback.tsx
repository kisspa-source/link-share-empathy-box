import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // URL에서 코드 추출 함수
  const extractCodeFromUrl = useCallback((url: string): string | null => {
    try {
      const parsedUrl = new URL(url);
      
      // 1. 쿼리 파라미터에서 코드 추출
      const codeFromQuery = parsedUrl.searchParams.get('code');
      if (codeFromQuery) return codeFromQuery;
      
      // 2. 해시 파라미터에서 코드 추출
      if (parsedUrl.hash) {
        const hashParams = new URLSearchParams(parsedUrl.hash.substring(1));
        const codeFromHash = hashParams.get('code');
        if (codeFromHash) return codeFromHash;
      }
      
      // 3. URL 전체에서 코드 추출 시도 (최후의 수단)
      const codeMatch = url.match(/[&?]code=([^&]+)/);
      if (codeMatch && codeMatch[1]) return codeMatch[1];
      
      return null;
    } catch (error) {
      console.error('URL에서 코드 추출 중 오류 발생:', error);
      return null;
    }
  }, []);

  // 인증 코드를 사용하여 세션 교환
  const exchangeCodeForSession = useCallback(async () => {
    try {
      console.log('=== OAuth 콜백 처리 시작 ===');
      console.log('현재 URL:', window.location.href);
      
      // URL에서 코드 추출
      const code = extractCodeFromUrl(window.location.href);
      console.log('추출된 코드:', code);
      
      if (!code) {
        throw new Error('인증 코드를 찾을 수 없습니다.');
      }
      
      // 코드를 사용하여 세션 교환
      console.log('인증 코드로 세션 교환 시도...');
      const { data: { session }, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('세션 교환 오류:', exchangeError);
        throw exchangeError;
      }
      
      if (session?.user) {
        console.log('OAuth 인증 성공 - 세션 저장 완료:', session.user);
        
        // User 타입에 맞게 변환
        const userData = {
          id: session.user.id,
          email: session.user.email || '',
          nickname: session.user.user_metadata?.name || 
                   session.user.user_metadata?.nickname || 
                   session.user.user_metadata?.full_name || 
                   '사용자',
          avatarUrl: session.user.user_metadata?.avatar_url ||
                    session.user.user_metadata?.picture,
          provider: session.user.app_metadata?.provider
        };
        
        console.log('변환된 사용자 정보:', userData);
        setUser(userData);
        
        // 리다이렉트 경로 결정
        let redirectPath = '/';
        const savedPath = sessionStorage.getItem('redirectAfterLogin');
        
        if (savedPath) {
          redirectPath = savedPath;
          console.log('세션 스토리지에서 리다이렉트 경로 복원:', redirectPath);
          sessionStorage.removeItem('redirectAfterLogin');
        } else if (location.state?.from?.pathname) {
          redirectPath = location.state.from.pathname;
          console.log('location.state에서 리다이렉트 경로 복원:', redirectPath);
        }
        
        // 유효한 경로인지 확인
        if (!redirectPath.startsWith('/')) {
          console.warn('잘못된 리다이렉트 경로입니다. 루트로 이동합니다.');
          redirectPath = '/';
        }
        
        // 메인 페이지로 리다이렉트
        console.log('리다이렉트 경로:', redirectPath);
        navigate(redirectPath, { replace: true });
      } else {
        throw new Error('세션 정보를 가져오지 못했습니다.');
      }
    } catch (err) {
      const error = err as Error;
      console.error('OAuth 인증 오류:', error);
      setError(error.message || '인증 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, location.state, setUser, extractCodeFromUrl]);
  
  // 컴포넌트 마운트 시 인증 처리 시작
  useEffect(() => {
    exchangeCodeForSession();
  }, [exchangeCodeForSession]);
  
  // 15초 후에도 처리가 완료되지 않으면 오류 표시
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.error('인증 처리 시간 초과');
        setError('인증 처리 시간이 초과되었습니다. 다시 시도해주세요.');
        setIsLoading(false);
      }
    }, 15000);
    
    return () => clearTimeout(timeout);
  }, [isLoading]);
  
  // 로딩 상태일 때
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md w-full mx-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인 처리 중</h2>
          <p className="text-gray-600 mb-1">계정 정보를 확인하고 있습니다.</p>
          <p className="text-sm text-gray-500">잠시만 기다려주세요...</p>
        </div>
      </div>
    );
  }
  
  // 에러 상태일 때
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center p-6 max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인 실패</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              로그인 페이지로 돌아가기
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              <div className="flex items-center justify-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                다시 시도하기
              </div>
            </button>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">문제가 지속되면 관리자에게 문의해주세요.</p>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default AuthCallback;
