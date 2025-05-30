import { useEffect } from 'react';
import { realtimeManager } from '@/lib/realtime';
import { useAuth } from '@/contexts/AuthContext';

export function useRealtime() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // 북마크 변경 구독
    const bookmarkChannel = realtimeManager.subscribeToBookmarks(
      user.id,
      (payload) => {
        console.log('북마크 변경:', payload);
        // 여기에 북마크 변경 처리 로직 추가
      }
    );

    // 컬렉션 변경 구독
    const collectionChannel = realtimeManager.subscribeToCollections(
      user.id,
      (payload) => {
        console.log('컬렉션 변경:', payload);
        // 여기에 컬렉션 변경 처리 로직 추가
      }
    );

    // 컬렉션-북마크 관계 변경 구독
    const collectionBookmarkChannel = realtimeManager.subscribeToCollectionBookmarks(
      user.id,
      (payload) => {
        console.log('컬렉션-북마크 관계 변경:', payload);
        // 여기에 관계 변경 처리 로직 추가
      }
    );

    // 컴포넌트 언마운트 시 구독 해제
    return () => {
      realtimeManager.unsubscribeAll();
    };
  }, [user]);
} 