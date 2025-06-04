import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser, isAuthenticated } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProcessed, setHasProcessed] = useState(false);
  
  // URL에서 코드와 에러 추출 함수
  const extractParamsFromUrl = useCallback((url: string) => {
    try {
      const parsedUrl = new URL(url);
      
      // 에러 체크 먼저
      const errorParam = parsedUrl.searchParams.get('error');
      const errorDescription = parsedUrl.searchParams.get('error_description');
      
      if (errorParam) {
        return { 
          error: errorDescription || errorParam,
          code: null 
        };
      }
      
      // 코드 추출
      let code = parsedUrl.searchParams.get('code');
      
      // 해시에서도 확인
      if (!code && parsedUrl.hash) {
        const hashParams = new URLSearchParams(parsedUrl.hash.substring(1));
        code = hashParams.get('code');
      }
      
      return { code, error: null };
    } catch (error) {
      console.error('URL 파라미터 추출 중 오류:', error);
      return { code: null, error: 'URL 파싱 오류' };
    }
  }, []);

  // 인증 코드를 사용하여 세션 교환
  const exchangeCodeForSession = useCallback(async () => {
    if (hasProcessed) return;
    
    try {
      console.log('=== OAuth 콜백 처리 시작 ===');
      console.log('현재 URL:', window.location.href);
      
      setHasProcessed(true);
      
      // URL에서 파라미터 추출
      const { code, error: urlError } = extractParamsFromUrl(window.location.href);
      
      if (urlError) {
        throw new Error(`OAuth 인증 오류: ${urlError}`);
      }
      
      if (!code) {
        // 코드가 없는 경우 현재 세션 확인
        console.log('코드가 없습니다. 현재 세션을 확인합니다.');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error('세션 확인 중 오류가 발생했습니다.');
        }
        
        if (session?.user) {
          console.log('기존 세션이 존재합니다:', session.user.email);
          await handleSuccessfulAuth(session);
          return;
        }
        
        throw new Error('인증 코드를 찾을 수 없습니다.');
      }
      
      console.log('인증 코드로 세션 교환 시도...');
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('세션 교환 오류:', exchangeError);
        throw new Error(`세션 교환 실패: ${exchangeError.message}`);
      }
      
      if (data.session?.user) {
        console.log('OAuth 인증 성공:', data.session.user.email);
        await handleSuccessfulAuth(data.session);
      } else {
        throw new Error('세션 정보를 가져오지 못했습니다.');
      }
      
    } catch (err) {
      const error = err as Error;
      console.error('OAuth 인증 오류:', error);
      setError(error.message || '인증 처리 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  }, [hasProcessed, extractParamsFromUrl]);

  // 성공적인 인증 처리
  const handleSuccessfulAuth = useCallback(async (session: any) => {
    try {
      // User 타입에 맞게 변환
      const userData = {
        id: session.user.id,
        email: session.user.email || '',
        nickname: session.user.user_metadata?.name || 
                 session.user.user_metadata?.nickname || 
                 session.user.user_metadata?.full_name || 
                 session.user.user_metadata?.user_name ||
                 '사용자',
        avatarUrl: session.user.user_metadata?.avatar_url ||
                  session.user.user_metadata?.picture,
        provider: session.user.app_metadata?.provider
      };
      
      console.log('사용자 정보 설정:', userData);
      setUser(userData);
      
      // 약간의 지연을 두어 상태 업데이트 완료 대기
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // 리다이렉트 경로 결정
      const redirectPath = determineRedirectPath();
      
      console.log('리다이렉트 경로:', redirectPath);
      
      // URL 정리 후 리다이렉트
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // 리다이렉트 실행
      navigate(redirectPath, { replace: true });
      
    } catch (error) {
      console.error('인증 후 처리 오류:', error);
      setError('로그인 후 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [setUser, navigate]);

  // 리다이렉트 경로 결정
  const determineRedirectPath = useCallback(() => {
    // 1. 세션 스토리지에서 저장된 경로 확인
    const savedPath = sessionStorage.getItem('redirectAfterLogin');
    if (savedPath) {
      sessionStorage.removeItem('redirectAfterLogin');
      console.log('저장된 리다이렉트 경로 사용:', savedPath);
      return savedPath;
    }
    
    // 2. location.state에서 이전 경로 확인
    if (location.state?.from?.pathname) {
      console.log('이전 경로로 리다이렉트:', location.state.from.pathname);
      return location.state.from.pathname;
    }
    
    // 3. URL 파라미터에서 next 확인
    const urlParams = new URLSearchParams(window.location.search);
    const nextParam = urlParams.get('next');
    if (nextParam && nextParam.startsWith('/')) {
      console.log('next 파라미터로 리다이렉트:', nextParam);
      return nextParam;
    }
    
    // 4. 기본 경로
    console.log('기본 경로로 리다이렉트: /');
    return '/';
  }, [location.state]);
  
  // 컴포넌트 마운트 시 인증 처리 시작
  useEffect(() => {
    // 이미 인증된 상태라면 바로 리다이렉트
    if (isAuthenticated && !hasProcessed) {
      console.log('이미 인증된 상태입니다. 리다이렉트합니다.');
      const redirectPath = determineRedirectPath();
      navigate(redirectPath, { replace: true });
      return;
    }
    
    // 인증 처리 시작
    const timer = setTimeout(() => {
      exchangeCodeForSession();
    }, 100); // 약간의 지연으로 상태 안정화
    
    return () => clearTimeout(timer);
  }, [isAuthenticated, hasProcessed, exchangeCodeForSession, navigate, determineRedirectPath]);
  
  // 타임아웃 처리
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading && !hasProcessed) {
        console.error('인증 처리 시간 초과');
        setError('인증 처리 시간이 초과되었습니다. 다시 시도해주세요.');
        setIsLoading(false);
      }
    }, 15000);
    
    return () => clearTimeout(timeout);
  }, [isLoading, hasProcessed]);

  // 에러 발생 시 자동 리다이렉트 (5초 후)
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        console.log('에러 발생으로 로그인 페이지로 리다이렉트');
        navigate('/login', { replace: true });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, navigate]);
  
  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md w-full mx-4 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인 처리 중</h2>
          <p className="text-gray-600 mb-1">Google 계정 정보를 확인하고 있습니다.</p>
          <p className="text-sm text-gray-500">잠시만 기다려주세요...</p>
          
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
          </div>
        </div>
      </div>
    );
  }
  
  // 에러 상태
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="text-center p-6 max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">로그인 실패</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">5초 후 자동으로 로그인 페이지로 이동합니다.</p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login', { replace: true })}
              className="w-full px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              로그인 페이지로 돌아가기
            </button>
            <button
              onClick={() => {
                setError(null);
                setIsLoading(true);
                setHasProcessed(false);
                exchangeCodeForSession();
              }}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              다시 시도하기
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default AuthCallback;
