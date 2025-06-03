
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
  memo?: string;
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
}
