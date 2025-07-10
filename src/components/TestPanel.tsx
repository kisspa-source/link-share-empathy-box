import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  testSignup,
  testBookmarkCreation,
  testCollectionCreation,
  testSecurity,
  testRealtimeUpdates,
  testSupabaseConnection
} from '@/lib/test-utils';
import { useAuth } from '@/contexts/AuthContext';
import { shouldShowTestPanel, getEnvironmentInfo } from '@/lib/utils/environment';
import { FlaskConical } from 'lucide-react';

export function TestPanel() {
  const [isTesting, setIsTesting] = useState(false);
  const { user } = useAuth();

  // 로컬 개발 환경이 아닌 경우 아무것도 렌더링하지 않음
  if (!shouldShowTestPanel()) {
    return null;
  }

  const runAllTests = async () => {
    setIsTesting(true);
    try {
      console.log('테스트 시작...');
      
      // 환경 정보 로깅
      const envInfo = getEnvironmentInfo();
      console.log('환경 정보:', envInfo);
      
      // Supabase 연결 테스트
      console.log('1. Supabase 연결 테스트');
      await testSupabaseConnection();
      
      // 회원가입 테스트
      console.log('2. 회원가입 테스트');
      await testSignup();
      
      // 북마크 생성 테스트
      if (user) {
        console.log('3. 북마크 생성 테스트');
        await testBookmarkCreation(user.id);
        
        // 컬렉션 생성 테스트
        console.log('4. 컬렉션 생성 테스트');
        await testCollectionCreation(user.id);
        
        // 실시간 업데이트 테스트
        console.log('5. 실시간 업데이트 테스트');
        await testRealtimeUpdates(user.id);
      }
      
      // 보안 테스트 (마지막으로 이동)
      console.log('6. 보안 테스트');
      await testSecurity();
      
      console.log('모든 테스트 완료');
    } catch (error) {
      console.error('테스트 실패:', error);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 모바일용 작은 아이콘 버튼 */}
      <Button
        onClick={runAllTests}
        disabled={isTesting}
        size="icon"
        className="bg-red-500 hover:bg-red-600 text-white shadow-lg
                   w-8 h-8 rounded-full
                   sm:hidden
                   border border-red-600/50"
        title={isTesting ? '테스트 중...' : '테스트 실행'}
      >
        <FlaskConical className="h-4 w-4" />
      </Button>
      
      {/* 데스크톱용 텍스트 버튼 */}
      <Button
        onClick={runAllTests}
        disabled={isTesting}
        size="sm"
        className="bg-red-500 hover:bg-red-600 text-white shadow-lg
                   text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2
                   min-w-[80px] sm:min-w-[120px] h-8 sm:h-9
                   hidden sm:flex
                   border border-red-600/50"
      >
        {isTesting ? '테스트 중...' : '테스트 실행'}
      </Button>
    </div>
  );
} 