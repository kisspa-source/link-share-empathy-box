
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
  url: string;
  title: string;
  description: string;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
  favicon?: string;
  category: Category;
  tags: Tag[];
  memo?: string;
  folderId?: string;
  savedBy: number; // Number of users who saved this bookmark
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
