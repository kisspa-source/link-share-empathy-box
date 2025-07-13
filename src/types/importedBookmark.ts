// 브라우저에서 가져온 원본 북마크 데이터 타입
export interface ImportedBookmark {
  title: string;
  url: string;
  addDate?: number; // Unix timestamp
  description?: string;
  icon?: string; // Base64 encoded favicon
  tags?: string[];
  folder?: string; // 폴더 경로 (예: "Development/Frontend")
}

// 폴더 구조를 나타내는 타입
export interface ImportedFolder {
  name: string;
  path: string; // 전체 경로 (예: "Development/Frontend")
  depth: number; // 폴더 깊이 (0부터 시작)
  parent?: string; // 부모 폴더 경로
  children: ImportedFolder[];
  bookmarks: ImportedBookmark[];
}

// 폴더 통계 정보
export interface FolderStatistics {
  name: string;
  path: string;
  depth: number;
  bookmarkCount: number;
  subfolderCount: number;
  totalBookmarks: number; // 하위 폴더 포함 총 북마크 수
  totalSubfolders: number; // 하위 폴더 포함 총 폴더 수
  isEmpty: boolean;
  hasSubfolders: boolean;
}

// 트리 구조 노드
export interface BookmarkTreeNode {
  id: string;
  name: string;
  type: 'folder' | 'bookmark';
  path: string;
  depth: number;
  parent?: string;
  children: BookmarkTreeNode[];
  bookmarkCount?: number;
  url?: string; // 북마크인 경우
  icon?: string; // 북마크인 경우
  isExpanded?: boolean;
}

// 북마크 분석 결과
export interface BookmarkAnalysis {
  totalBookmarks: number;
  totalFolders: number;
  maxDepth: number;
  folderStatistics: FolderStatistics[];
  treeStructure: BookmarkTreeNode[];
  summary: {
    largestFolder: FolderStatistics;
    deepestFolder: FolderStatistics;
    averageBookmarksPerFolder: number;
    emptyFolders: number;
    topLevelItems: number;
    duplicateUrls: number;
    totalSize: string; // 예: "2.5MB"
  };
  warnings: string[];
  processingTime: number; // 밀리초 단위
}

// 파싱된 북마크 파일의 전체 구조 (개선된 버전)
export interface ParsedBookmarkFile {
  title?: string; // 북마크 파일 제목
  folders: ImportedFolder[];
  bookmarks: ImportedBookmark[]; // 루트 레벨 북마크
  totalBookmarks: number;
  totalFolders: number;
  parseDate: Date;
  browser?: 'chrome' | 'firefox' | 'edge' | 'safari' | 'opera' | 'brave' | 'unknown';
  analysis?: BookmarkAnalysis; // 상세 분석 결과
}

// 파싱 결과와 에러 정보 (개선된 버전)
export interface BookmarkParseResult {
  success: boolean;
  data?: ParsedBookmarkFile;
  error?: string;
  warnings?: string[];
  analysis?: BookmarkAnalysis; // 분석 결과 직접 포함
}

// 중복 북마크 감지 결과
export interface DuplicateBookmark {
  imported: ImportedBookmark;
  existing: ImportedBookmark;
  similarity: number; // 0-1 사이의 유사도
  duplicateType: 'url' | 'title' | 'both';
}

// 가져오기 옵션
export interface ImportOptions {
  skipDuplicates: boolean;
  mergeFolders: boolean;
  preserveFolderStructure: boolean;
  autoGenerateTags: boolean;
  defaultFolder?: string; // 기본 폴더 ID
  performAnalysis?: boolean; // 상세 분석 수행 여부
  showProgress?: boolean; // 진행률 표시 여부
}

// 가져오기 진행 상태 (개선된 버전)
export interface ImportProgress {
  currentStep: 'parsing' | 'analyzing' | 'importing' | 'completed' | 'error' | 'cancelled';
  currentItem: string;
  processed: number;
  total: number;
  percentage: number;
  duplicatesFound: DuplicateBookmark[];
  errors: string[];
  // 추가 상세 정보
  estimatedTimeRemaining?: number; // 초 단위
  processingSpeed?: number; // 초당 처리 개수
  phase: 'validation' | 'parsing' | 'folder-creation' | 'bookmark-import' | 'finalization' | 'completed';
  phaseProgress: number; // 현재 단계의 진행률 (0-100)
  totalPhases: number; // 총 단계 수
  currentPhase: number; // 현재 단계 번호
  cancelRequested: boolean; // 취소 요청 여부
  canCancel: boolean; // 취소 가능 여부
  startTime: Date; // 시작 시간
  batchInfo?: {
    currentBatch: number;
    totalBatches: number;
    batchSize: number;
  };
  statistics?: {
    foldersCreated: number;
    bookmarksImported: number;
    duplicatesSkipped: number;
    errorsEncountered: number;
  };
} 