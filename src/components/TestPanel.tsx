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

export function TestPanel() {
  const [isTesting, setIsTesting] = useState(false);
  const { user } = useAuth();

  const runAllTests = async () => {
    setIsTesting(true);
    try {
      console.log('테스트 시작...');
      
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
      
      // 보안 테스트
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
      <Button
        onClick={runAllTests}
        disabled={isTesting}
        className="bg-red-500 hover:bg-red-600"
      >
        {isTesting ? '테스트 중...' : '모든 테스트 실행'}
      </Button>
    </div>
  );
} 