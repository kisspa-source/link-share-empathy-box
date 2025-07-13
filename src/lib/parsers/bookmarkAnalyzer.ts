import { 
  ParsedBookmarkFile, 
  ImportedFolder, 
  ImportedBookmark, 
  BookmarkAnalysis, 
  FolderStatistics, 
  BookmarkTreeNode 
} from '@/types/importedBookmark';

export class BookmarkAnalyzer {
  private startTime: number = 0;

  /**
   * 북마크 파일을 상세 분석합니다.
   * @param parsedFile 파싱된 북마크 파일
   * @returns 상세 분석 결과
   */
  analyze(parsedFile: ParsedBookmarkFile): BookmarkAnalysis {
    this.startTime = Date.now();
    
    try {
      // 1. 폴더 통계 수집
      const folderStatistics = this.generateFolderStatistics(parsedFile);
      
      // 2. 트리 구조 생성
      const treeStructure = this.buildTreeStructure(parsedFile);
      
      // 3. 최대 깊이 계산
      const maxDepth = this.calculateMaxDepth(parsedFile);
      
      // 4. 중복 URL 검사
      const duplicateUrls = this.findDuplicateUrls(parsedFile);
      
      // 5. 요약 정보 생성
      const summary = this.generateSummary(folderStatistics, duplicateUrls, parsedFile);
      
      // 6. 경고사항 체크
      const warnings = this.generateWarnings(parsedFile, folderStatistics);
      
      const processingTime = Date.now() - this.startTime;
      
      return {
        totalBookmarks: parsedFile.totalBookmarks,
        totalFolders: parsedFile.totalFolders,
        maxDepth,
        folderStatistics,
        treeStructure,
        summary,
        warnings,
        processingTime
      };
      
    } catch (error) {
      console.error('북마크 분석 중 오류 발생:', error);
      throw new Error(`분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 폴더별 상세 통계를 생성합니다.
   */
  private generateFolderStatistics(parsedFile: ParsedBookmarkFile): FolderStatistics[] {
    const statistics: FolderStatistics[] = [];
    
    // 루트 레벨 통계 (전체)
    const rootStats: FolderStatistics = {
      name: '전체',
      path: '',
      depth: -1,
      bookmarkCount: parsedFile.bookmarks.length,
      subfolderCount: parsedFile.folders.length,
      totalBookmarks: parsedFile.totalBookmarks,
      totalSubfolders: parsedFile.totalFolders,
      isEmpty: parsedFile.totalBookmarks === 0,
      hasSubfolders: parsedFile.folders.length > 0
    };
    statistics.push(rootStats);
    
    // 각 폴더별 통계 생성
    this.processFolder(parsedFile.folders, statistics);
    
    return statistics;
  }

  /**
   * 재귀적으로 폴더를 처리하여 통계를 생성합니다.
   */
  private processFolder(folders: ImportedFolder[], statistics: FolderStatistics[]): void {
    for (const folder of folders) {
      const totalBookmarks = this.countTotalBookmarks(folder);
      const totalSubfolders = this.countTotalSubfolders(folder);
      
      const folderStats: FolderStatistics = {
        name: folder.name,
        path: folder.path,
        depth: folder.depth,
        bookmarkCount: folder.bookmarks.length,
        subfolderCount: folder.children.length,
        totalBookmarks,
        totalSubfolders,
        isEmpty: totalBookmarks === 0,
        hasSubfolders: folder.children.length > 0
      };
      
      statistics.push(folderStats);
      
      // 하위 폴더 처리
      if (folder.children.length > 0) {
        this.processFolder(folder.children, statistics);
      }
    }
  }

  /**
   * 폴더 및 하위 폴더의 총 북마크 수를 계산합니다.
   */
  private countTotalBookmarks(folder: ImportedFolder): number {
    let count = folder.bookmarks.length;
    
    for (const child of folder.children) {
      count += this.countTotalBookmarks(child);
    }
    
    return count;
  }

  /**
   * 폴더 및 하위 폴더의 총 폴더 수를 계산합니다.
   */
  private countTotalSubfolders(folder: ImportedFolder): number {
    let count = folder.children.length;
    
    for (const child of folder.children) {
      count += this.countTotalSubfolders(child);
    }
    
    return count;
  }

  /**
   * 트리 구조를 생성합니다.
   */
  private buildTreeStructure(parsedFile: ParsedBookmarkFile): BookmarkTreeNode[] {
    const treeNodes: BookmarkTreeNode[] = [];
    let nodeIdCounter = 1;
    
    // 루트 레벨 북마크 추가
    for (const bookmark of parsedFile.bookmarks) {
      const node: BookmarkTreeNode = {
        id: `bookmark-${nodeIdCounter++}`,
        name: bookmark.title,
        type: 'bookmark',
        path: bookmark.title,
        depth: 0,
        parent: undefined,
        children: [],
        url: bookmark.url,
        icon: bookmark.icon,
        isExpanded: false
      };
      treeNodes.push(node);
    }
    
    // 루트 레벨 폴더 추가
    for (const folder of parsedFile.folders) {
      const node = this.buildFolderNode(folder, nodeIdCounter, undefined);
      nodeIdCounter += this.countNodesInFolder(folder) + 1;
      treeNodes.push(node);
    }
    
    return treeNodes;
  }

  /**
   * 폴더를 트리 노드로 변환합니다.
   */
  private buildFolderNode(folder: ImportedFolder, startId: number, parentPath?: string): BookmarkTreeNode {
    let nodeIdCounter = startId;
    
    const folderNode: BookmarkTreeNode = {
      id: `folder-${nodeIdCounter++}`,
      name: folder.name,
      type: 'folder',
      path: folder.path,
      depth: folder.depth,
      parent: parentPath,
      children: [],
      bookmarkCount: this.countTotalBookmarks(folder),
      isExpanded: folder.depth < 2 // 기본적으로 깊이 2까지만 펼침
    };
    
    // 폴더 내 북마크 추가
    for (const bookmark of folder.bookmarks) {
      const bookmarkNode: BookmarkTreeNode = {
        id: `bookmark-${nodeIdCounter++}`,
        name: bookmark.title,
        type: 'bookmark',
        path: `${folder.path}/${bookmark.title}`,
        depth: folder.depth + 1,
        parent: folder.path,
        children: [],
        url: bookmark.url,
        icon: bookmark.icon,
        isExpanded: false
      };
      folderNode.children.push(bookmarkNode);
    }
    
    // 하위 폴더 추가
    for (const childFolder of folder.children) {
      const childNode = this.buildFolderNode(childFolder, nodeIdCounter, folder.path);
      nodeIdCounter += this.countNodesInFolder(childFolder) + 1;
      folderNode.children.push(childNode);
    }
    
    return folderNode;
  }

  /**
   * 폴더 내 총 노드 수를 계산합니다.
   */
  private countNodesInFolder(folder: ImportedFolder): number {
    let count = folder.bookmarks.length; // 북마크 수
    
    for (const child of folder.children) {
      count += 1; // 폴더 자체
      count += this.countNodesInFolder(child); // 하위 노드들
    }
    
    return count;
  }

  /**
   * 최대 폴더 깊이를 계산합니다.
   */
  private calculateMaxDepth(parsedFile: ParsedBookmarkFile): number {
    let maxDepth = 0;
    
    const checkDepth = (folders: ImportedFolder[]): void => {
      for (const folder of folders) {
        if (folder.depth > maxDepth) {
          maxDepth = folder.depth;
        }
        
        if (folder.children.length > 0) {
          checkDepth(folder.children);
        }
      }
    };
    
    checkDepth(parsedFile.folders);
    
    return maxDepth;
  }

  /**
   * 중복 URL을 찾습니다.
   */
  private findDuplicateUrls(parsedFile: ParsedBookmarkFile): number {
    const urlSet = new Set<string>();
    const duplicates = new Set<string>();
    
    const checkBookmarks = (bookmarks: ImportedBookmark[]): void => {
      for (const bookmark of bookmarks) {
        const url = bookmark.url.toLowerCase().trim();
        if (url && urlSet.has(url)) {
          duplicates.add(url);
        }
        urlSet.add(url);
      }
    };
    
    const checkFolders = (folders: ImportedFolder[]): void => {
      for (const folder of folders) {
        checkBookmarks(folder.bookmarks);
        checkFolders(folder.children);
      }
    };
    
    // 루트 레벨 북마크 체크
    checkBookmarks(parsedFile.bookmarks);
    
    // 폴더 내 북마크 체크
    checkFolders(parsedFile.folders);
    
    return duplicates.size;
  }

  /**
   * 요약 정보를 생성합니다.
   */
  private generateSummary(
    folderStatistics: FolderStatistics[], 
    duplicateUrls: number, 
    parsedFile: ParsedBookmarkFile
  ) {
    // 가장 큰 폴더 찾기
    const largestFolder = folderStatistics
      .filter(stat => stat.depth >= 0) // 루트 제외
      .reduce((max, current) => 
        current.totalBookmarks > max.totalBookmarks ? current : max, 
        folderStatistics.find(stat => stat.depth >= 0) || folderStatistics[0]
      );
    
    // 가장 깊은 폴더 찾기
    const deepestFolder = folderStatistics
      .filter(stat => stat.depth >= 0) // 루트 제외
      .reduce((deepest, current) => 
        current.depth > deepest.depth ? current : deepest, 
        folderStatistics.find(stat => stat.depth >= 0) || folderStatistics[0]
      );
    
    // 평균 북마크 수 계산
    const foldersWithBookmarks = folderStatistics.filter(stat => stat.depth >= 0 && stat.bookmarkCount > 0);
    const averageBookmarksPerFolder = foldersWithBookmarks.length > 0 
      ? foldersWithBookmarks.reduce((sum, stat) => sum + stat.bookmarkCount, 0) / foldersWithBookmarks.length 
      : 0;
    
    // 빈 폴더 수
    const emptyFolders = folderStatistics.filter(stat => stat.depth >= 0 && stat.isEmpty).length;
    
    // 최상위 항목 수
    const topLevelItems = parsedFile.bookmarks.length + parsedFile.folders.length;
    
    // 파일 크기 추정 (대략적)
    const estimatedSize = this.estimateFileSize(parsedFile);
    
    return {
      largestFolder,
      deepestFolder,
      averageBookmarksPerFolder: Math.round(averageBookmarksPerFolder * 10) / 10,
      emptyFolders,
      topLevelItems,
      duplicateUrls,
      totalSize: estimatedSize
    };
  }

  /**
   * 파일 크기를 추정합니다.
   */
  private estimateFileSize(parsedFile: ParsedBookmarkFile): string {
    let size = 0;
    
    // 북마크 크기 추정 (URL + 제목 + 기타 데이터)
    const estimateBookmarkSize = (bookmark: ImportedBookmark): number => {
      let bookmarkSize = 0;
      bookmarkSize += (bookmark.title?.length || 0) * 2; // 유니코드 문자
      bookmarkSize += (bookmark.url?.length || 0);
      bookmarkSize += (bookmark.description?.length || 0) * 2;
      bookmarkSize += (bookmark.icon?.length || 0);
      bookmarkSize += 100; // HTML 태그 및 속성 오버헤드
      return bookmarkSize;
    };
    
    const estimateFolderSize = (folders: ImportedFolder[]): number => {
      let folderSize = 0;
      for (const folder of folders) {
        folderSize += (folder.name.length * 2) + 50; // 폴더 HTML 오버헤드
        
        for (const bookmark of folder.bookmarks) {
          folderSize += estimateBookmarkSize(bookmark);
        }
        
        folderSize += estimateFolderSize(folder.children);
      }
      return folderSize;
    };
    
    // 루트 레벨 북마크
    for (const bookmark of parsedFile.bookmarks) {
      size += estimateBookmarkSize(bookmark);
    }
    
    // 폴더들
    size += estimateFolderSize(parsedFile.folders);
    
    // 기본 HTML 구조 오버헤드
    size += 1000;
    
    // 사람이 읽기 쉬운 형태로 변환
    if (size < 1024) {
      return `${size} B`;
    } else if (size < 1024 * 1024) {
      return `${Math.round(size / 1024 * 10) / 10} KB`;
    } else {
      return `${Math.round(size / (1024 * 1024) * 10) / 10} MB`;
    }
  }

  /**
   * 경고사항을 생성합니다.
   */
  private generateWarnings(parsedFile: ParsedBookmarkFile, folderStatistics: FolderStatistics[]): string[] {
    const warnings: string[] = [];
    
    // 빈 북마크 파일
    if (parsedFile.totalBookmarks === 0) {
      warnings.push('북마크가 발견되지 않았습니다.');
    }
    
    // 너무 많은 북마크
    if (parsedFile.totalBookmarks > 5000) {
      warnings.push('북마크가 매우 많습니다. 성능에 영향을 줄 수 있습니다.');
    }
    
    // 너무 깊은 폴더 구조
    const maxDepth = this.calculateMaxDepth(parsedFile);
    if (maxDepth > 10) {
      warnings.push('폴더 구조가 너무 깊습니다. 일부 기능이 제한될 수 있습니다.');
    }
    
    // 너무 많은 빈 폴더
    const emptyFolders = folderStatistics.filter(stat => stat.depth >= 0 && stat.isEmpty).length;
    if (emptyFolders > 10) {
      warnings.push(`빈 폴더가 ${emptyFolders}개 발견되었습니다. 정리를 권장합니다.`);
    }
    
    // 중복 URL 경고
    const duplicateUrls = this.findDuplicateUrls(parsedFile);
    if (duplicateUrls > 0) {
      warnings.push(`중복된 URL이 ${duplicateUrls}개 발견되었습니다.`);
    }
    
    // 처리 시간 경고
    const processingTime = Date.now() - this.startTime;
    if (processingTime > 5000) {
      warnings.push('분석 시간이 오래 걸렸습니다. 파일이 매우 큽니다.');
    }
    
    return warnings;
  }

  /**
   * 트리 구조를 텍스트로 시각화합니다.
   */
  static visualizeTree(analysis: BookmarkAnalysis, maxDepth: number = 3): string {
    const lines: string[] = [];
    
    const addTreeLine = (node: BookmarkTreeNode, prefix: string, isLast: boolean, depth: number): void => {
      if (depth > maxDepth) return;
      
      const connector = isLast ? '└─ ' : '├─ ';
      const icon = node.type === 'folder' ? '📁' : '🔗';
      const name = node.type === 'folder' 
        ? `${node.name} (${node.bookmarkCount || 0}개)`
        : node.name;
      
      lines.push(`${prefix}${connector}${icon} ${name}`);
      
      if (node.children.length > 0 && depth < maxDepth) {
        const newPrefix = prefix + (isLast ? '   ' : '│  ');
        
        for (let i = 0; i < node.children.length; i++) {
          const isChildLast = i === node.children.length - 1;
          addTreeLine(node.children[i], newPrefix, isChildLast, depth + 1);
        }
      }
    };
    
    lines.push('📚 북마크 트리 구조');
    lines.push('');
    
    for (let i = 0; i < analysis.treeStructure.length; i++) {
      const isLast = i === analysis.treeStructure.length - 1;
      addTreeLine(analysis.treeStructure[i], '', isLast, 0);
    }
    
    return lines.join('\n');
  }
} 