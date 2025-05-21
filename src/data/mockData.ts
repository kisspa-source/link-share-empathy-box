
import { Bookmark, Collection, Folder, Tag, Category } from '../types/bookmark';

export const mockTags: Tag[] = [
  { id: 'tag-1', name: 'AI', color: '#9b87f5' },
  { id: 'tag-2', name: '개발', color: '#4285F4' },
  { id: 'tag-3', name: '뉴스', color: '#EA4335' },
  { id: 'tag-4', name: '디자인', color: '#FBBC05' },
  { id: 'tag-5', name: '교육', color: '#34A853' },
  { id: 'tag-6', name: '생산성', color: '#4CC9BE' },
  { id: 'tag-7', name: '쇼핑', color: '#7E69AB' },
  { id: 'tag-8', name: '기술블로그', color: '#EA4335' },
  { id: 'tag-9', name: '읽어볼 것', color: '#8E9196' }
];

export const mockFolders: Folder[] = [
  { id: 'folder-1', name: '개발', bookmarkCount: 5 },
  { id: 'folder-2', name: 'AI 관련', bookmarkCount: 3 },
  { id: 'folder-3', name: '읽어볼 것', bookmarkCount: 2 }
];

export const mockBookmarks: Bookmark[] = [
  {
    id: 'bk-1',
    url: 'https://github.com/vercel/next.js',
    title: 'Next.js - React 프레임워크',
    description: 'Next.js는 풀스택 웹 애플리케이션을 만들기 위한 React 프레임워크입니다.',
    thumbnail: 'https://picsum.photos/seed/nextjs/640/360',
    favicon: 'https://www.google.com/s2/favicons?domain=github.com&sz=32',
    category: 'IT',
    tags: [mockTags[1], mockTags[7]],
    createdAt: '2023-05-15T09:30:00Z',
    updatedAt: '2023-05-15T09:30:00Z',
    folderId: 'folder-1',
    savedBy: 42
  },
  {
    id: 'bk-2',
    url: 'https://openai.com/blog/chatgpt',
    title: 'ChatGPT: 대화형 AI 언어 모델',
    description: 'ChatGPT는 OpenAI가 개발한 대화형 AI 모델로, 다양한 주제에 대해 인간과 같은 대화가 가능합니다.',
    thumbnail: 'https://picsum.photos/seed/chatgpt/640/360',
    favicon: 'https://www.google.com/s2/favicons?domain=openai.com&sz=32',
    category: 'IT',
    tags: [mockTags[0], mockTags[8]],
    createdAt: '2023-05-14T15:20:00Z',
    updatedAt: '2023-05-14T15:20:00Z',
    folderId: 'folder-2',
    savedBy: 127
  },
  {
    id: 'bk-3',
    url: 'https://www.naver.com',
    title: '네이버',
    description: '국내 최대 포털 사이트',
    thumbnail: 'https://picsum.photos/seed/naver/640/360',
    favicon: 'https://www.google.com/s2/favicons?domain=naver.com&sz=32',
    category: 'News',
    tags: [mockTags[2]],
    createdAt: '2023-05-13T11:45:00Z',
    updatedAt: '2023-05-13T11:45:00Z',
    memo: '자주 방문하는 사이트',
    savedBy: 256
  },
  {
    id: 'bk-4',
    url: 'https://dribbble.com/shots/popular',
    title: '인기 디자인 - Dribbble',
    description: '전 세계 디자이너들의 작업물을 볼 수 있는 플랫폼',
    thumbnail: 'https://picsum.photos/seed/dribbble/640/360',
    favicon: 'https://www.google.com/s2/favicons?domain=dribbble.com&sz=32',
    category: 'Community',
    tags: [mockTags[3]],
    createdAt: '2023-05-12T08:15:00Z',
    updatedAt: '2023-05-12T08:15:00Z',
    folderId: 'folder-3',
    savedBy: 78
  },
  {
    id: 'bk-5',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up - Rick Astley',
    description: 'Rick Astley의 명곡',
    thumbnail: 'https://picsum.photos/seed/rickroll/640/360',
    favicon: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=32',
    category: 'Entertainment',
    tags: [],
    createdAt: '2023-05-11T19:30:00Z',
    updatedAt: '2023-05-11T19:30:00Z',
    savedBy: 999
  },
  {
    id: 'bk-6',
    url: 'https://www.notion.so',
    title: 'Notion - 올인원 생산성 도구',
    description: '노트, 문서, 프로젝트 관리까지 하나의 도구에서 모두 가능',
    thumbnail: 'https://picsum.photos/seed/notion/640/360',
    favicon: 'https://www.google.com/s2/favicons?domain=notion.so&sz=32',
    category: 'Education',
    tags: [mockTags[5]],
    createdAt: '2023-05-10T14:25:00Z',
    updatedAt: '2023-05-10T14:25:00Z',
    folderId: 'folder-1',
    savedBy: 156
  },
  {
    id: 'bk-7',
    url: 'https://www.coupang.com',
    title: '쿠팡 - 로켓배송',
    description: '로켓배송으로 빠르게 받는 온라인 쇼핑',
    thumbnail: 'https://picsum.photos/seed/coupang/640/360',
    favicon: 'https://www.google.com/s2/favicons?domain=coupang.com&sz=32',
    category: 'Shopping',
    tags: [mockTags[6]],
    createdAt: '2023-05-09T10:10:00Z',
    updatedAt: '2023-05-09T10:10:00Z',
    savedBy: 312
  },
  {
    id: 'bk-8',
    url: 'https://d2.naver.com',
    title: 'NAVER D2 - 네이버 기술 블로그',
    description: '네이버 개발자들이 작성한 기술 블로그',
    thumbnail: 'https://picsum.photos/seed/naverd2/640/360',
    favicon: 'https://www.google.com/s2/favicons?domain=d2.naver.com&sz=32',
    category: 'IT',
    tags: [mockTags[1], mockTags[7]],
    createdAt: '2023-05-08T16:45:00Z',
    updatedAt: '2023-05-08T16:45:00Z',
    folderId: 'folder-1',
    memo: '좋은 기술 아티클이 많음',
    savedBy: 87
  }
];

export const mockCollections: Collection[] = [
  {
    id: 'col-1',
    name: '개발 학습 자료',
    description: '웹 개발 학습에 유용한 링크 모음',
    isPublic: true,
    userId: '1',
    userNickname: '링크박스',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linkbox',
    createdAt: '2023-05-20T12:00:00Z',
    updatedAt: '2023-05-20T12:00:00Z',
    bookmarks: [mockBookmarks[0], mockBookmarks[7], mockBookmarks[5]],
    shareUrl: 'linkbox.co.kr/c/dev-resources',
    coverImage: mockBookmarks[0].thumbnail
  },
  {
    id: 'col-2',
    name: 'AI 관련 북마크',
    description: 'AI 뉴스, 도구, 연구 자료',
    isPublic: true,
    userId: '1',
    userNickname: '링크박스',
    userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linkbox',
    createdAt: '2023-05-19T14:30:00Z',
    updatedAt: '2023-05-19T14:30:00Z',
    bookmarks: [mockBookmarks[1]],
    shareUrl: 'linkbox.co.kr/c/ai-resources',
    coverImage: mockBookmarks[1].thumbnail
  }
];
