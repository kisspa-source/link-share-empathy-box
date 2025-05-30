import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 타입 정의
export type Bookmark = {
  id: string
  user_id: string
  url: string
  title: string
  description: string | null
  image_url: string | null
  created_at: string
  updated_at: string
  tags: string[]
}

export type Collection = {
  id: string
  user_id: string
  name: string
  description: string | null
  cover_image: string | null
  created_at: string
  updated_at: string
  bookmarks: Bookmark[]
}

// 북마크 관련 함수
export const bookmarkApi = {
  // 북마크 생성
  async create(bookmark: Omit<Bookmark, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert(bookmark)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 북마크 목록 조회
  async list(userId: string) {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 북마크 수정
  async update(id: string, updates: Partial<Bookmark>) {
    const { data, error } = await supabase
      .from('bookmarks')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 북마크 삭제
  async delete(id: string) {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// 컬렉션 관련 함수
export const collectionApi = {
  // 컬렉션 생성
  async create(collection: Omit<Collection, 'id' | 'created_at' | 'updated_at' | 'bookmarks'>) {
    const { data, error } = await supabase
      .from('collections')
      .insert(collection)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 컬렉션 목록 조회
  async list(userId: string) {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        *,
        bookmarks:collection_bookmarks(
          bookmark:bookmarks(*)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 컬렉션 수정
  async update(id: string, updates: Partial<Collection>) {
    const { data, error } = await supabase
      .from('collections')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 컬렉션 삭제
  async delete(id: string) {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // 북마크를 컬렉션에 추가
  async addBookmark(collectionId: string, bookmarkId: string) {
    const { error } = await supabase
      .from('collection_bookmarks')
      .insert({
        collection_id: collectionId,
        bookmark_id: bookmarkId
      })
    
    if (error) throw error
  },

  // 컬렉션에서 북마크 제거
  async removeBookmark(collectionId: string, bookmarkId: string) {
    const { error } = await supabase
      .from('collection_bookmarks')
      .delete()
      .eq('collection_id', collectionId)
      .eq('bookmark_id', bookmarkId)
    
    if (error) throw error
  }
} 