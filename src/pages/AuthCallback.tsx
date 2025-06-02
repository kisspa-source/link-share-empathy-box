import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasExchangedCode, setHasExchangedCode] = useState(false);
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  // 코드를 세션으로 교환하는 함수
  const exchangeCodeForSession = useCallback(async () => {
    // 이미 코드를 교환했거나 인증된 상태면 무시
    if (hasExchangedCode) return;
    
    // 이미 인증된 사용자라면 리다이렉트만 처리
    if (isAuthenticated) {
      console.log('이미 인증된 사용자입니다. 리다이렉트를 진행합니다.');
      setHasExchangedCode(true);
      return;
    }
    
    try {
      console.log('OAuth 콜백 처리 시작 ====================');
      console.log('현재 URL:', window.location.href);
      
      setIsLoading(true);
      setError(null);
      
      // URL에서 코드 추출 (해시와 쿼리 파라미터 모두 확인)
      let code: string | null = null;
      
      // 1. URL 전체에서 코드 추출 (가장 먼저 시도)
      const url = new URL(window.location.href);
      code = url.searchParams.get('code');
      
      // 2. 해시에서 코드 추출 (OAuth 리다이렉트에 따라 다를 수 있음)
      if (!code && url.hash) {
        const hashParams = new URLSearchParams(url.hash.substring(1));
        code = hashParams.get('code');
      }
      
      console.log('추출된 코드:', code);
      
      // 코드가 없으면 더 이상 진행하지 않음
      if (!code) {
        console.log('인증 코드가 없습니다. 현재 URL:', window.location.href);
        // 이미 인증된 상태라면 그냥 진행
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('세션이 이미 존재합니다. 리다이렉트를 진행합니다.');
          setHasExchangedCode(true);
          return;
        }
        throw new Error('인증 코드를 찾을 수 없습니다. URL을 확인해주세요.');
      }
      
      console.log('인증 코드 발견, 세션으로 교환 시도...');
      
      try {
        // 코드를 세션으로 교환
        console.log('exchangeCodeForSession 호출 전');
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        console.log('exchangeCodeForSession 호출 후', { data, error: exchangeError });
        
        if (exchangeError) {
          // 이미 처리된 코드인 경우 무시하고 진행
          if (exchangeError.message.includes('already been used')) {
            console.log('이미 처리된 인증 코드입니다. 계속 진행합니다.');
            setHasExchangedCode(true);
            return;
          }
          console.error('세션 교환 오류:', exchangeError);
          throw exchangeError;
        }
        
        // 코드 교환 성공
        console.log('OAuth 인증 성공 - 세션 교환 완료');
        setHasExchangedCode(true);
        
      } catch (exchangeErr) {
        console.error('세션 교환 중 예외 발생:', exchangeErr);
        // 이미 인증된 상태라면 오류를 무시하고 계속 진행
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('오류 발생했지만 세션이 존재하여 계속 진행합니다.');
          setHasExchangedCode(true);
          return;
        }
        throw exchangeErr;
      }
      
    } catch (err) {
      const error = err as Error;
      console.error('OAuth 인증 오류:', error);
      setError(error.message || '인증 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [location.search, location.hash, hasExchangedCode, isAuthenticated]);
  
  // 컴포넌트 마운트 시 코드 교환 시도
  useEffect(() => {
    exchangeCodeForSession();
  }, [exchangeCodeForSession]);
  
  // 인증이 완료되면 대시보드로 리다이렉트
  useEffect(() => {
    // 코드 교환이 완료되었고, 인증된 상태이며, 아직 리다이렉트를 시도하지 않은 경우
    if (hasExchangedCode && isAuthenticated && !redirectAttempted) {
      console.log('인증 완료 - 대시보드로 리다이렉트 시도');
      console.log('현재 location.state:', location.state);
      
      setRedirectAttempted(true);
      
      // 리다이렉트 전에 짧은 지연 추가 (UI 업데이트를 위해)
      const timer = setTimeout(() => {
        // 1. 세션 스토리지에서 이전 경로 확인
        // 2. location.state에서 이전 경로 확인
        // 3. 둘 다 없으면 루트('/')로 이동
        const from = sessionStorage.getItem('redirectAfterLogin') || 
                    location.state?.from?.pathname || 
                    '/';
                    
        console.log('리다이렉트 경로:', from);
        
        // 세션 스토리지에서 삭제
        sessionStorage.removeItem('redirectAfterLogin');
        
        // 리다이렉트 (replace: true로 히스토리에 남기지 않음)
        navigate(from, { replace: true });
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, hasExchangedCode, navigate, location.state, redirectAttempted]);
  
  // 10초 후에도 리다이렉트가 안 되면 오류 표시
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isAuthenticated && isLoading) {
        console.error('리다이렉트 시간 초과');
        setError('인증 처리 시간이 초과되었습니다. 다시 시도해주세요.');
        setIsLoading(false);
      }
    }, 10000);
    
    return () => clearTimeout(timeout);
  }, [isAuthenticated, isLoading]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">로그인 처리 중입니다...</p>
          <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요.</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">로그인 실패</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/login')}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              로그인 페이지로 돌아가기
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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