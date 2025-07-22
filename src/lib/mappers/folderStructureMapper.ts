import { ImportedFolder, ImportedBookmark, ParsedBookmarkFile, ImportOptions } from '@/types/importedBookmark';
import { Folder } from '@/types/bookmark';

// 매핑 결과 타입
export interface MappingResult {
  folders: CreateFolderRequest[];
  bookmarks: CreateBookmarkRequest[];
  duplicates: DuplicateInfo[];
  errors: string[];
  statistics: MappingStatistics;
}

export interface CreateFolderRequest {
  name: string;
  icon_name?: string;
  icon_color?: string;
  icon_category?: string;
  parent_id?: string;
  originalPath: string; // 원본 경로 추적용
}

export interface CreateBookmarkRequest {
  title: string;
  url: string;
  description?: string;
  tags?: string[];
  folder_id?: string;
  folderPath?: string; // 폴더 경로 정보 추가
  image_url?: string;
  favicon?: string;
  addDate?: Date;
}

export interface DuplicateInfo {
  type: 'folder' | 'bookmark';
  imported: ImportedFolder | ImportedBookmark;
  existing: Folder | any; // 기존 북마크 타입
  action: 'skip' | 'merge' | 'rename';
}

export interface MappingStatistics {
  totalFolders: number;
  totalBookmarks: number;
  duplicateFolders: number;
  duplicateBookmarks: number;
  skippedItems: number;
  processedItems: number;
}

export class FolderStructureMapper {
  private existingFolders: Folder[];
  private options: ImportOptions;
  private folderNameMap: Map<string, string> = new Map(); // 원본 경로 -> 폴더 ID
  private duplicates: DuplicateInfo[] = [];
  private errors: string[] = [];

  constructor(existingFolders: Folder[], options: ImportOptions) {
    this.existingFolders = existingFolders;
    this.options = options;
  }

  /**
   * 파싱된 북마크 파일을 애플리케이션 구조로 매핑
   */
  async mapToApplicationStructure(parsedData: ParsedBookmarkFile): Promise<MappingResult> {
    const result: MappingResult = {
      folders: [],
      bookmarks: [],
      duplicates: [],
      errors: [],
      statistics: {
        totalFolders: parsedData.totalFolders,
        totalBookmarks: parsedData.totalBookmarks,
        duplicateFolders: 0,
        duplicateBookmarks: 0,
        skippedItems: 0,
        processedItems: 0
      }
    };

    try {
      // 1. 폴더 구조 매핑
      if (this.options.preserveFolderStructure) {
        await this.mapFolderStructure(parsedData.folders, result);
      }

      // 2. 모든 북마크 매핑 (루트 레벨 + 모든 폴더 내 북마크)
      await this.mapAllBookmarks(parsedData, result);

      // 3. 통계 업데이트
      this.updateStatistics(result);

    } catch (error) {
      this.errors.push(`매핑 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    result.duplicates = this.duplicates;
    result.errors = this.errors;

    return result;
  }

  /**
   * 폴더 구조 매핑
   */
  private async mapFolderStructure(folders: ImportedFolder[], result: MappingResult, parentPath: string = ''): Promise<void> {
    // 모든 폴더를 평면화하고 깊이 순으로 정렬
    const allFolders = this.flattenFolders(folders);
    allFolders.sort((a, b) => a.depth - b.depth);
    
    // 깊이 순으로 폴더 처리 (부모 폴더가 먼저 생성됨)
    for (const folder of allFolders) {
      const folderRequest = await this.createFolderRequest(folder, folder.parent || '');
      
      if (folderRequest) {
        result.folders.push(folderRequest);
      }
    }
  }

  /**
   * 폴더 구조를 평면화하여 모든 폴더를 하나의 배열로 만듭니다
   */
  private flattenFolders(folders: ImportedFolder[]): ImportedFolder[] {
    const result: ImportedFolder[] = [];
    
    for (const folder of folders) {
      result.push(folder);
      
      if (folder.children.length > 0) {
        result.push(...this.flattenFolders(folder.children));
      }
    }
    
    return result;
  }

  /**
   * 폴더 생성 요청 객체 생성
   */
  private async createFolderRequest(folder: ImportedFolder, parentPath: string): Promise<CreateFolderRequest | null> {
    // 중복 폴더 체크
    const existingFolder = this.findExistingFolder(folder.name, parentPath);
    
    if (existingFolder) {
      if (this.options.mergeFolders) {
        // 기존 폴더에 병합
        this.folderNameMap.set(folder.path, existingFolder.id);
        this.duplicates.push({
          type: 'folder',
          imported: folder,
          existing: existingFolder,
          action: 'merge'
        });
        return null; // 새로 생성하지 않음
      } else {
        // 이름 변경
        const newName = this.generateUniqueFolderName(folder.name, parentPath);
        const folderRequest: CreateFolderRequest = {
          name: newName,
          icon_name: this.selectFolderIcon(folder),
          icon_color: this.selectFolderColor(folder),
          icon_category: 'default',
          parent_id: this.getParentFolderId(parentPath),
          originalPath: folder.path
        };
        
        this.duplicates.push({
          type: 'folder',
          imported: folder,
          existing: existingFolder,
          action: 'rename'
        });
        
        return folderRequest;
      }
    }

    // 새 폴더 생성
    return {
      name: folder.name,
      icon_name: this.selectFolderIcon(folder),
      icon_color: this.selectFolderColor(folder),
      icon_category: 'default',
      parent_id: this.getParentFolderId(parentPath),
      originalPath: folder.path
    };
  }

  /**
   * 북마크 매핑
   */
  private async mapBookmarks(bookmarks: ImportedBookmark[], result: MappingResult, folderPath: string): Promise<void> {
    for (const bookmark of bookmarks) {
      const bookmarkRequest = await this.createBookmarkRequest(bookmark, folderPath);
      
      if (bookmarkRequest) {
        result.bookmarks.push(bookmarkRequest);
      }
    }
  }

  /**
   * 모든 북마크를 매핑합니다 (루트 레벨 + 모든 폴더 내 북마크)
   */
  private async mapAllBookmarks(parsedData: ParsedBookmarkFile, result: MappingResult): Promise<void> {
    // 루트 레벨 북마크 처리
    await this.mapBookmarks(parsedData.bookmarks, result, '');
    
    // 모든 폴더 내 북마크 처리
    const allFolders = this.flattenFolders(parsedData.folders);
    for (const folder of allFolders) {
      await this.mapBookmarks(folder.bookmarks, result, folder.path);
    }
  }

  /**
   * 북마크 생성 요청 객체 생성 (개선된 버전)
   */
  private async createBookmarkRequest(bookmark: ImportedBookmark, folderPath: string): Promise<CreateBookmarkRequest | null> {
    // 중복 북마크 체크
    if (this.options.skipDuplicates && await this.isDuplicateBookmark(bookmark)) {
      this.duplicates.push({
        type: 'bookmark',
        imported: bookmark,
        existing: null, // TODO: 기존 북마크 정보
        action: 'skip'
      });
      return null;
    }

    const folderId = this.resolveFolderId(folderPath);
    
    // 기본 이미지 URL 생성 (Edge Function 호출 대신 즉시 생성)
    const defaultImageUrl = `https://image.thum.io/get/width/1200/crop/800/${encodeURIComponent(bookmark.url)}`;
    
    return {
      title: bookmark.title || this.extractTitleFromUrl(bookmark.url),
      url: bookmark.url,
      description: bookmark.description || '',
      tags: await this.processTags(bookmark),
      folder_id: folderId,
      folderPath: folderPath, // 폴더 경로 정보 추가
      image_url: defaultImageUrl, // 즉시 이미지 URL 생성
      favicon: bookmark.icon,
      addDate: bookmark.addDate ? new Date(bookmark.addDate * 1000) : new Date()
    };
  }

  /**
   * 폴더 ID 해결 (개선된 버전)
   */
  private resolveFolderId(folderPath: string): string | undefined {
    if (!folderPath) {
      return this.options.defaultFolder;
    }

    // 매핑된 폴더 ID 찾기
    const mappedFolderId = this.folderNameMap.get(folderPath);
    if (mappedFolderId) {
      return mappedFolderId;
    }

    // 폴더 경로에서 부모 폴더 찾기
    if (folderPath.includes('/')) {
      const parentPath = folderPath.split('/').slice(0, -1).join('/');
      const parentId = this.folderNameMap.get(parentPath);
      if (parentId) {
        // 부모 폴더가 있으면 기본 폴더 대신 부모 폴더 사용
        return parentId;
      }
    }

    // 기본 폴더 사용
    return this.options.defaultFolder;
  }

  /**
   * 부모 폴더 ID 찾기
   */
  private getParentFolderId(parentPath: string): string | undefined {
    if (!parentPath) {
      return this.options.defaultFolder;
    }

    return this.folderNameMap.get(parentPath) || this.options.defaultFolder;
  }

  /**
   * 기존 폴더 찾기
   */
  private findExistingFolder(name: string, parentPath: string): Folder | null {
    const parentId = this.getParentFolderId(parentPath);
    
    return this.existingFolders.find(folder => 
      folder.name === name && folder.parent_id === parentId
    ) || null;
  }

  /**
   * 중복 북마크 확인
   */
  private async isDuplicateBookmark(bookmark: ImportedBookmark): Promise<boolean> {
    // TODO: 실제 북마크 DB 조회 로직 구현
    // 현재는 간단한 URL 비교만 수행
    return false;
  }

  /**
   * 고유한 폴더 이름 생성
   */
  private generateUniqueFolderName(baseName: string, parentPath: string): string {
    let counter = 1;
    let newName = `${baseName} (${counter})`;
    
    while (this.findExistingFolder(newName, parentPath)) {
      counter++;
      newName = `${baseName} (${counter})`;
    }
    
    return newName;
  }

  /**
   * 폴더 아이콘 선택
   */
  private selectFolderIcon(folder: ImportedFolder): string {
    // 폴더 이름 기반 아이콘 추천
    const name = folder.name.toLowerCase();
    
    if (name.includes('work') || name.includes('job') || name.includes('업무')) return 'briefcase';
    if (name.includes('dev') || name.includes('개발') || name.includes('code')) return 'code';
    if (name.includes('design') || name.includes('디자인')) return 'palette';
    if (name.includes('photo') || name.includes('image') || name.includes('사진')) return 'camera';
    if (name.includes('music') || name.includes('음악')) return 'music';
    if (name.includes('video') || name.includes('movie') || name.includes('영상')) return 'video';
    if (name.includes('book') || name.includes('read') || name.includes('책')) return 'book';
    if (name.includes('travel') || name.includes('여행')) return 'plane';
    if (name.includes('food') || name.includes('recipe') || name.includes('음식')) return 'utensils';
    if (name.includes('news') || name.includes('뉴스')) return 'newspaper';
    if (name.includes('tool') || name.includes('도구') || name.includes('utility')) return 'wrench';
    if (name.includes('game') || name.includes('게임')) return 'gamepad2';
    if (name.includes('shopping') || name.includes('쇼핑')) return 'shopping-cart';
    if (name.includes('finance') || name.includes('money') || name.includes('금융')) return 'credit-card';
    if (name.includes('health') || name.includes('medical') || name.includes('건강')) return 'heart';
    
    return 'folder';
  }

  /**
   * 폴더 색상 선택
   */
  private selectFolderColor(folder: ImportedFolder): string {
    // 폴더 이름 기반 색상 추천
    const colors = [
      '#3B82F6', // blue
      '#10B981', // green  
      '#F59E0B', // yellow
      '#EF4444', // red
      '#8B5CF6', // purple
      '#06B6D4', // cyan
      '#84CC16', // lime
      '#F97316', // orange
      '#EC4899', // pink
      '#6B7280'  // gray
    ];
    
    // 폴더 이름의 해시값 기반으로 색상 선택
    let hash = 0;
    for (let i = 0; i < folder.name.length; i++) {
      hash = ((hash << 5) - hash + folder.name.charCodeAt(i)) & 0xffffffff;
    }
    
    const selectedColor = colors[Math.abs(hash) % colors.length];
    
    // VARCHAR(7) 제한 검증 - 헥스 색상 코드는 정확히 7자여야 함
    if (selectedColor.length !== 7 || !selectedColor.startsWith('#')) {
      console.warn(`Invalid color format: ${selectedColor}, using default`);
      return '#3B82F6'; // 기본 색상
    }
    
    return selectedColor;
  }

  /**
   * URL에서 제목 추출
   */
  private extractTitleFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return 'Untitled';
    }
  }

  /**
   * 태그 처리
   */
  private async processTags(bookmark: ImportedBookmark): Promise<string[]> {
    const tags = bookmark.tags || [];
    
    if (this.options.autoGenerateTags) {
      // URL 기반 자동 태그 생성
      const autoTags = await this.generateAutoTags(bookmark.url);
      tags.push(...autoTags);
    }
    
    // 중복 제거 및 정리
    return [...new Set(tags.map(tag => tag.trim()).filter(tag => tag))];
  }

  /**
   * 자동 태그 생성
   */
  private async generateAutoTags(url: string): Promise<string[]> {
    const tags: string[] = [];
    
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');
      
      // 도메인 기반 태그
      const domainTags: { [key: string]: string[] } = {
        'github.com': ['개발', 'github', 'repository'],
        'stackoverflow.com': ['개발', 'programming', 'qa'],
        'youtube.com': ['video', '영상', 'entertainment'],
        'netflix.com': ['영화', 'streaming', 'entertainment'],
        'amazon.com': ['shopping', '쇼핑', 'ecommerce'],
        'google.com': ['검색', 'search', 'google'],
        'facebook.com': ['social', 'sns', 'facebook'],
        'twitter.com': ['social', 'sns', 'twitter'],
        'instagram.com': ['social', 'sns', 'photo'],
        'linkedin.com': ['business', 'career', 'professional'],
        'medium.com': ['blog', '글', 'article'],
        'notion.so': ['productivity', '생산성', 'note'],
        'figma.com': ['design', '디자인', 'ui/ux'],
        'dribbble.com': ['design', '디자인', 'inspiration']
      };
      
      if (domainTags[domain]) {
        tags.push(...domainTags[domain]);
      }
      
      // 경로 기반 태그
      const path = urlObj.pathname.toLowerCase();
      if (path.includes('api')) tags.push('api');
      if (path.includes('doc')) tags.push('documentation');
      if (path.includes('tutorial')) tags.push('tutorial');
      if (path.includes('guide')) tags.push('guide');
      
    } catch {
      // URL 파싱 실패 시 무시
    }
    
    return tags;
  }

  /**
   * 통계 업데이트
   */
  private updateStatistics(result: MappingResult): void {
    result.statistics.duplicateFolders = this.duplicates.filter(d => d.type === 'folder').length;
    result.statistics.duplicateBookmarks = this.duplicates.filter(d => d.type === 'bookmark').length;
    result.statistics.skippedItems = this.duplicates.filter(d => d.action === 'skip').length;
    result.statistics.processedItems = result.folders.length + result.bookmarks.length;
  }
} 