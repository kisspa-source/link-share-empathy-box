
export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export type Category = 
  | 'IT' 
  | 'News' 
  | 'Shopping' 
  | 'Community' 
  | 'Education' 
  | 'Entertainment' 
  | 'Finance' 
  | 'Health' 
  | 'Travel' 
  | 'Other';

export interface Bookmark {
  id: string;
  user_id: string;
  url: string;
  title: string;
  description: string;
  image_url?: string;
  thumbnail?: string;
  created_at: string;
  updated_at: string;
  favicon?: string;
  category?: Category;
  tags: string[]; // Supabase에서는 string[]로 저장됨
  folder_id?: string;
  saved_by?: number; // Number of users who saved this bookmark
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  isPublic: boolean;
  userId: string;
  userNickname: string;
  userAvatar?: string;
  createdAt: string;
  updatedAt: string;
  bookmarks: Bookmark[];
  coverImage?: string;
  shareUrl: string;
}

export interface Folder {
  id: string;
  name: string;
  bookmarkCount: number;
  // 아이콘 관련 필드 추가
  icon_name?: string;
  icon_color?: string;
  icon_category?: string;
  // 계층 구조 관련 필드 추가
  parent_id?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  // 계층 구조 헬퍼 필드 (런타임에 추가)
  children?: Folder[];
  depth?: number;
  path?: string[];
}
