import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

// 실시간 구독 채널 관리를 위한 클래스
export class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map();

  // 북마크 변경 구독
  subscribeToBookmarks(userId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel('bookmarks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    this.channels.set('bookmarks', channel);
    return channel;
  }

  // 컬렉션 변경 구독
  subscribeToCollections(userId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel('collections')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collections',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    this.channels.set('collections', channel);
    return channel;
  }

  // 컬렉션-북마크 관계 변경 구독
  subscribeToCollectionBookmarks(userId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel('collection_bookmarks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'collection_bookmarks',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();

    this.channels.set('collection_bookmarks', channel);
    return channel;
  }

  // 모든 구독 해제
  unsubscribeAll() {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
  }
}

// 싱글톤 인스턴스 생성
export const realtimeManager = new RealtimeManager(); 