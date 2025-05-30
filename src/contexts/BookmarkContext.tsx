import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Bookmark, Collection, Folder, Tag, Category } from '../types/bookmark';
import { toast } from "sonner";
import { useAuth } from './AuthContext';

// Mock data
import { mockBookmarks, mockCollections, mockFolders, mockTags } from '../data/mockData';

interface BookmarkContextType {
  bookmarks: Bookmark[];
  collections: Collection[];
  folders: Folder[];
  tags: Tag[];
  isLoading: boolean;
  addBookmark: (url: string, memo?: string, folderId?: string) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  addCollection: (name: string, description: string, isPublic: boolean, bookmarkIds: string[]) => Promise<void>;
  updateCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  toggleCollectionPublic: (id: string) => Promise<void>;
  addFolder: (name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  getBookmarksByFolder: (folderId?: string) => Bookmark[];
  getCollection: (id: string) => Collection | undefined;
  getUserCollections: (userId: string) => Collection[];
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

export const BookmarkProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = () => {
      // In a real app, these would be API calls
      setBookmarks(mockBookmarks);
      setCollections(mockCollections);
      setFolders(mockFolders);
      setTags(mockTags);
      setIsLoading(false);
    };

    // Simulate API delay
    setTimeout(loadData, 500);
  }, []);

  // AI tagging simulation function
  const simulateAITagging = (url: string): { tags: Tag[], category: Category } => {
    // This would be an API call to your AI service in production
    const domains = ['github.com', 'medium.com', 'naver.com', 'youtube.com', 'coupang.com'];
    const domain = domains[Math.floor(Math.random() * domains.length)];
    
    const allTags = [...tags];
    const selectedTags = allTags
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 1);
    
    let category: Category;
    if (url.includes('github') || url.includes('stackoverflow')) {
      category = 'IT';
    } else if (url.includes('news') || url.includes('blog')) {
      category = 'News';
    } else if (url.includes('shop') || url.includes('store')) {
      category = 'Shopping';
    } else if (url.includes('community') || url.includes('forum')) {
      category = 'Community';
    } else {
      // Random category
      const categories: Category[] = ['IT', 'News', 'Shopping', 'Community', 'Education', 'Entertainment', 'Finance', 'Health', 'Travel', 'Other'];
      category = categories[Math.floor(Math.random() * categories.length)];
    }
    
    return { tags: selectedTags, category };
  };

  // Fetch metadata simulation
  const fetchMetadata = async (url: string) => {
    // This would be a real API call to fetch metadata
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate a mock title based on URL
    const domain = url.replace(/https?:\/\//, '').split('/')[0];
    const pathSegments = url.split('/').filter(Boolean).slice(1);
    const lastSegment = pathSegments.length > 0 ? pathSegments[pathSegments.length - 1].replace(/-/g, ' ') : '';
    
    const randomTitles = [
      'How to Build Modern Web Applications',
      '10 Tips for Better Productivity',
      'Getting Started with React and TypeScript',
      'Machine Learning for Beginners',
      'The Ultimate Guide to Korean Cooking',
      'Best Practices for UI/UX Design',
      'Understanding Blockchain Technology'
    ];
    
    const title = lastSegment 
      ? `${lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)}`
      : randomTitles[Math.floor(Math.random() * randomTitles.length)];
    
    const descriptions = [
      'A comprehensive guide to building modern applications using the latest technologies.',
      'Learn how to improve your workflow and get more done in less time.',
      'This article covers the fundamentals of getting started with development.',
      'An in-depth look at design principles and best practices.',
      'Discover new techniques and tools to enhance your skills.'
    ];
    
    return {
      title: title,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
      thumbnail: `https://picsum.photos/seed/${encodeURIComponent(url)}/640/360`
    };
  };

  const addBookmark = async (url: string, memo?: string, folderId?: string) => {
    setIsLoading(true);
    try {
      // Validate URL
      try {
        new URL(url);
      } catch {
        // Prepend protocol if missing
        if (!/^https?:\/\//i.test(url)) {
          url = 'https://' + url;
        }
      }

      // Simulate fetching metadata
      const metadata = await fetchMetadata(url);
      
      // Simulate AI tagging
      const { tags: aiTags, category } = simulateAITagging(url);
      
      // Create new bookmark
      const newBookmark: Bookmark = {
        id: `bk-${Date.now()}`,
        url,
        title: metadata.title,
        description: metadata.description,
        thumbnail: metadata.thumbnail,
        favicon: metadata.favicon,
        category,
        tags: aiTags,
        memo: memo || '',
        folderId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        savedBy: Math.floor(Math.random() * 5) // Random number of users who saved this
      };
      
      setBookmarks(prev => [newBookmark, ...prev]);
      toast.success('북마크가 저장되었습니다');
    } catch (error) {
      console.error('Error adding bookmark:', error);
      toast.error('북마크 저장에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBookmark = async (id: string) => {
    try {
      setBookmarks(prev => prev.filter(bookmark => bookmark.id !== id));
      toast.success('북마크가 삭제되었습니다');
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast.error('북마크 삭제에 실패했습니다');
    }
  };

  const addCollection = async (name: string, description: string, isPublic: boolean, bookmarkIds: string[]) => {
    try {
      const collectionBookmarks = bookmarks.filter(bookmark => 
        bookmarkIds.includes(bookmark.id)
      );
      
      if (!user) return;

      const newCollection: Collection = {
        id: `col-${Date.now()}`,
        name,
        description,
        isPublic,
        userId: user.id,
        userNickname: user.nickname,
        userAvatar: user.avatarUrl,
        bookmarks: collectionBookmarks,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        shareUrl: `linku.me/c/${Date.now().toString(36)}`,
        coverImage: collectionBookmarks[0]?.thumbnail
      };
      
      setCollections(prev => [newCollection, ...prev]);
      toast.success('컬렉션이 생성되었습니다');
    } catch (error) {
      console.error('Error adding collection:', error);
      toast.error('컬렉션 생성에 실패했습니다');
    }
  };
  
  const updateCollection = async (id: string, updates: Partial<Collection>) => {
    try {
      setCollections(prev => prev.map(collection => 
        collection.id === id ? { ...collection, ...updates } : collection
      ));
      toast.success('컬렉션이 업데이트되었습니다');
    } catch (error) {
      console.error('Error updating collection:', error);
      toast.error('컬렉션 업데이트에 실패했습니다');
    }
  };
  
  const deleteCollection = async (id: string) => {
    try {
      setCollections(prev => prev.filter(collection => collection.id !== id));
      toast.success('컬렉션이 삭제되었습니다');
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('컬렉션 삭제에 실패했습니다');
    }
  };

  const toggleCollectionPublic = async (id: string) => {
    try {
      setCollections(prev => prev.map(collection => 
        collection.id === id 
          ? { ...collection, isPublic: !collection.isPublic } 
          : collection
      ));
      
      const collection = collections.find(c => c.id === id);
      if (collection) {
        toast.success(
          collection.isPublic 
            ? '컬렉션이 비공개로 설정되었습니다' 
            : '컬렉션이 공개로 설정되었습니다'
        );
      }
    } catch (error) {
      console.error('Error toggling collection visibility:', error);
      toast.error('컬렉션 공개 설정 변경에 실패했습니다');
    }
  };

  const addFolder = async (name: string) => {
    try {
      const newFolder: Folder = {
        id: `folder-${Date.now()}`,
        name,
        bookmarkCount: 0
      };
      
      setFolders(prev => [...prev, newFolder]);
      toast.success('폴더가 생성되었습니다');
    } catch (error) {
      console.error('Error adding folder:', error);
      toast.error('폴더 생성에 실패했습니다');
    }
  };

  const deleteFolder = async (id: string) => {
    try {
      setFolders(prev => prev.filter(folder => folder.id !== id));
      
      // Update bookmarks to remove folder reference
      setBookmarks(prev => prev.map(bookmark => 
        bookmark.folderId === id 
          ? { ...bookmark, folderId: undefined } 
          : bookmark
      ));
      
      toast.success('폴더가 삭제되었습니다');
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error('폴더 삭제에 실패했습니다');
    }
  };

  const getBookmarksByFolder = useCallback((folderId?: string) => {
    if (folderId) {
      return bookmarks.filter(bookmark => bookmark.folderId === folderId);
    }
    return bookmarks.filter(bookmark => !bookmark.folderId);
  }, [bookmarks]);

  const getCollection = useCallback((id: string) => {
    return collections.find(collection => collection.id === id);
  }, [collections]);

  const getUserCollections = useCallback((userId: string) => {
    return collections.filter(collection => 
      collection.userId === userId && collection.isPublic
    );
  }, [collections]);

  return (
    <BookmarkContext.Provider value={{
      bookmarks,
      collections,
      folders,
      tags,
      isLoading,
      addBookmark,
      deleteBookmark,
      addCollection,
      updateCollection,
      deleteCollection,
      toggleCollectionPublic,
      addFolder,
      deleteFolder,
      getBookmarksByFolder,
      getCollection,
      getUserCollections
    }}>
      {children}
    </BookmarkContext.Provider>
  );
};

export const useBookmarks = () => {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
};
