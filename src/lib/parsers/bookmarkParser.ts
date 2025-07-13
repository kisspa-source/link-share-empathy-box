import { BookmarkParseResult, ParsedBookmarkFile, ImportedBookmark, ImportedFolder, ImportOptions } from '@/types/importedBookmark';
import { HTMLBookmarkParser } from './htmlBookmarkParser';
import { BookmarkAnalyzer } from './bookmarkAnalyzer';

// 파서 인터페이스 정의
export interface BookmarkParser {
  parse(fileContent: string, performAnalysis?: boolean): BookmarkParseResult;
  validate(fileContent: string): boolean;
  getBrowserType(fileContent: string): string;
  quickParse?(fileContent: string): BookmarkParseResult;
}

// HTML 북마크 파서 (Chrome, Firefox, Edge, Safari 공통) - 레거시 호환성 유지
export class HTMLBookmarkParserLegacy implements BookmarkParser {
  parse(fileContent: string): BookmarkParseResult {
    try {
      // HTML 파싱을 위한 DOMParser 사용
      const parser = new DOMParser();
      const doc = parser.parseFromString(fileContent, 'text/html');
      
      // 파싱 에러 체크
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        return {
          success: false,
          error: '북마크 파일 형식이 올바르지 않습니다.'
        };
      }

      const result: ParsedBookmarkFile = {
        title: this.extractTitle(doc),
        folders: [],
        bookmarks: [],
        totalBookmarks: 0,
        totalFolders: 0,
        parseDate: new Date(),
        browser: this.detectBrowser(fileContent)
      };

      // DL 요소부터 파싱 시작
      const rootDL = doc.querySelector('dl');
      if (!rootDL) {
        return {
          success: false,
          error: '북마크 데이터를 찾을 수 없습니다.'
        };
      }

      this.parseDL(rootDL, result, '');
      
      // 통계 계산
      result.totalBookmarks = this.countBookmarks(result);
      result.totalFolders = this.countFolders(result);

      return {
        success: true,
        data: result,
        warnings: this.getWarnings(result)
      };

    } catch (error) {
      return {
        success: false,
        error: `파싱 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  validate(fileContent: string): boolean {
    // 기본적인 HTML 북마크 파일 검증
    const htmlPatterns = [
      /<!DOCTYPE NETSCAPE-Bookmark-file-1>/i,
      /<title>bookmarks<\/title>/i,
      /<h1>bookmarks<\/h1>/i,
      /<dl>/i
    ];

    return htmlPatterns.some(pattern => pattern.test(fileContent));
  }

  getBrowserType(fileContent: string): string {
    return this.detectBrowser(fileContent);
  }

  private extractTitle(doc: Document): string {
    const titleElement = doc.querySelector('title');
    return titleElement?.textContent || '가져온 북마크';
  }

  private detectBrowser(fileContent: string): 'chrome' | 'firefox' | 'edge' | 'safari' | 'unknown' {
    const content = fileContent.toLowerCase();
    
    if (content.includes('chrome')) return 'chrome';
    if (content.includes('firefox') || content.includes('mozilla')) return 'firefox';
    if (content.includes('edge') || content.includes('microsoft')) return 'edge';
    if (content.includes('safari')) return 'safari';
    
    return 'unknown';
  }

  private parseDL(dlElement: Element, result: ParsedBookmarkFile, currentPath: string): void {
    const children = Array.from(dlElement.children);
    
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      
      if (child.tagName === 'DT') {
        const dtContent = child.firstElementChild;
        
        if (dtContent?.tagName === 'H3') {
          // 폴더 처리
          const folderName = dtContent.textContent || '이름 없는 폴더';
          const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;
          
          const folder: ImportedFolder = {
            name: folderName,
            path: folderPath,
            depth: currentPath.split('/').filter(p => p).length,
            parent: currentPath || undefined,
            children: [],
            bookmarks: []
          };

          // 다음 DL 요소에서 하위 항목들 파싱
          const nextSibling = children[i + 1];
          if (nextSibling?.tagName === 'DL') {
            // 하위 폴더와 북마크들을 파싱하여 현재 폴더에 추가
            const subResult: ParsedBookmarkFile = {
              title: result.title,
              folders: [],
              bookmarks: [],
              totalBookmarks: 0,
              totalFolders: 0,
              parseDate: result.parseDate,
              browser: result.browser
            };
            
            this.parseDL(nextSibling, subResult, folderPath);
            
            // 파싱된 결과를 현재 폴더에 병합
            folder.children = subResult.folders;
            folder.bookmarks = subResult.bookmarks;
            
            // 루트 레벨에 추가된 폴더들도 현재 폴더의 children에 포함
            for (const subFolder of subResult.folders) {
              subFolder.parent = folderPath;
            }
            
            // 루트 레벨에 추가된 북마크들을 현재 폴더로 이동
            for (const subBookmark of subResult.bookmarks) {
              subBookmark.folder = folderPath;
            }
            
            // 다음 DL 요소 건너뛰기 (이미 처리했으므로)
            i++;
          }

          // 현재 폴더를 적절한 위치에 추가
          if (currentPath === '') {
            result.folders.push(folder);
          } else {
            // 현재 경로가 있으면 상위 폴더를 찾아서 추가
            // 이 경우는 재귀 호출에서 처리됨
            result.folders.push(folder);
          }
          
        } else if (dtContent?.tagName === 'A') {
          // 북마크 처리
          const link = dtContent as HTMLAnchorElement;
          const bookmark: ImportedBookmark = {
            title: link.textContent || '제목 없음',
            url: link.href || '',
            addDate: this.parseAddDate(link.getAttribute('add_date')),
            description: link.getAttribute('description') || undefined,
            icon: link.getAttribute('icon') || undefined,
            folder: currentPath || undefined
          };

          result.bookmarks.push(bookmark);
        }
      }
    }
  }

  private parseAddDate(addDateStr: string | null): number | undefined {
    if (!addDateStr) return undefined;
    
    const timestamp = parseInt(addDateStr, 10);
    return isNaN(timestamp) ? undefined : timestamp;
  }

  private countBookmarks(result: ParsedBookmarkFile): number {
    let count = result.bookmarks.length;
    
    const countInFolders = (folders: ImportedFolder[]): number => {
      return folders.reduce((acc, folder) => {
        return acc + folder.bookmarks.length + countInFolders(folder.children);
      }, 0);
    };

    return count + countInFolders(result.folders);
  }

  private countFolders(result: ParsedBookmarkFile): number {
    const countFolders = (folders: ImportedFolder[]): number => {
      return folders.reduce((acc, folder) => {
        return acc + 1 + countFolders(folder.children);
      }, 0);
    };

    return countFolders(result.folders);
  }

  private getWarnings(result: ParsedBookmarkFile): string[] {
    const warnings: string[] = [];
    
    if (result.totalBookmarks === 0) {
      warnings.push('북마크가 발견되지 않았습니다.');
    }
    
    if (result.totalBookmarks > 1000) {
      warnings.push('북마크가 매우 많습니다. 가져오기에 시간이 걸릴 수 있습니다.');
    }

    return warnings;
  }
}

// JSON 북마크 파서 (Chrome의 내부 북마크 파일용)
export class JSONBookmarkParser implements BookmarkParser {
  parse(fileContent: string): BookmarkParseResult {
    try {
      const data = JSON.parse(fileContent);
      
      // Chrome 북마크 JSON 구조 검증
      if (!data.roots || !data.roots.bookmark_bar) {
        return {
          success: false,
          error: 'Chrome 북마크 파일 형식이 아닙니다.'
        };
      }

      const result: ParsedBookmarkFile = {
        title: '가져온 북마크',
        folders: [],
        bookmarks: [],
        totalBookmarks: 0,
        totalFolders: 0,
        parseDate: new Date(),
        browser: 'chrome'
      };

      // 북마크 바와 기타 북마크 처리
      this.parseJSONNode(data.roots.bookmark_bar, result, '');
      if (data.roots.other) {
        this.parseJSONNode(data.roots.other, result, '기타 북마크');
      }

      result.totalBookmarks = this.countBookmarks(result);
      result.totalFolders = this.countFolders(result);

      return {
        success: true,
        data: result
      };

    } catch (error) {
      return {
        success: false,
        error: `JSON 파싱 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  validate(fileContent: string): boolean {
    try {
      const data = JSON.parse(fileContent);
      return !!(data.roots && (data.roots.bookmark_bar || data.roots.other));
    } catch {
      return false;
    }
  }

  getBrowserType(): string {
    return 'chrome';
  }

  private parseJSONNode(node: any, result: ParsedBookmarkFile, currentPath: string): void {
    if (node.children) {
      // 폴더 노드
      for (const child of node.children) {
        if (child.type === 'folder') {
          const folderPath = currentPath ? `${currentPath}/${child.name}` : child.name;
          const folder: ImportedFolder = {
            name: child.name,
            path: folderPath,
            depth: currentPath.split('/').filter(p => p).length,
            parent: currentPath || undefined,
            children: [],
            bookmarks: []
          };

          // 하위 폴더와 북마크들을 파싱하여 현재 폴더에 추가
          const subResult: ParsedBookmarkFile = {
            title: result.title,
            folders: [],
            bookmarks: [],
            totalBookmarks: 0,
            totalFolders: 0,
            parseDate: result.parseDate,
            browser: result.browser
          };
          
          this.parseJSONNode(child, subResult, folderPath);
          
          // 파싱된 결과를 현재 폴더에 병합
          folder.children = subResult.folders;
          folder.bookmarks = subResult.bookmarks;
          
          // 루트 레벨에 추가된 폴더들도 현재 폴더의 children에 포함
          for (const subFolder of subResult.folders) {
            subFolder.parent = folderPath;
          }
          
          // 루트 레벨에 추가된 북마크들을 현재 폴더로 이동
          for (const subBookmark of subResult.bookmarks) {
            subBookmark.folder = folderPath;
          }
          
          result.folders.push(folder);
          
        } else if (child.type === 'url') {
          const bookmark: ImportedBookmark = {
            title: child.name,
            url: child.url,
            addDate: Math.floor(child.date_added / 1000), // Chrome은 마이크로초 단위
            folder: currentPath || undefined
          };

          result.bookmarks.push(bookmark);
        }
      }
    }
  }

  private countBookmarks(result: ParsedBookmarkFile): number {
    // HTMLBookmarkParser와 동일한 로직
    let count = result.bookmarks.length;
    
    const countInFolders = (folders: ImportedFolder[]): number => {
      return folders.reduce((acc, folder) => {
        return acc + folder.bookmarks.length + countInFolders(folder.children);
      }, 0);
    };

    return count + countInFolders(result.folders);
  }

  private countFolders(result: ParsedBookmarkFile): number {
    const countFolders = (folders: ImportedFolder[]): number => {
      return folders.reduce((acc, folder) => {
        return acc + 1 + countFolders(folder.children);
      }, 0);
    };

    return countFolders(result.folders);
  }
}

// 통합 북마크 파서 팩토리 (개선된 버전)
export class BookmarkParserFactory {
  private static analyzer = new BookmarkAnalyzer();

  /**
   * 파일 내용을 기반으로 적절한 파서를 생성합니다.
   */
  static createParser(fileContent: string): BookmarkParser {
    // JSON 형식 체크
    if (fileContent.trim().startsWith('{')) {
      const jsonParser = new JSONBookmarkParser();
      if (jsonParser.validate(fileContent)) {
        return jsonParser;
      }
    }

    // HTML 형식 체크 - 개선된 파서 사용
    const htmlParser = new HTMLBookmarkParser();
    if (htmlParser.validate(fileContent)) {
      return htmlParser;
    }

    // 기본값으로 개선된 HTML 파서 반환
    return htmlParser;
  }

  /**
   * 북마크 파일을 파싱합니다 (기본 - 분석 포함).
   */
  static parseBookmarkFile(fileContent: string, options?: ImportOptions): BookmarkParseResult {
    const parser = this.createParser(fileContent);
    const performAnalysis = options?.performAnalysis !== false;
    
    if (parser instanceof HTMLBookmarkParser) {
      return parser.parse(fileContent, performAnalysis);
    }
    
    // 레거시 파서들의 경우 기본 파싱만 수행
    return parser.parse(fileContent);
  }

  /**
   * 빠른 파싱 모드 - 분석 없이 기본 파싱만 수행
   */
  static quickParseBookmarkFile(fileContent: string): BookmarkParseResult {
    const parser = this.createParser(fileContent);
    
    if (parser instanceof HTMLBookmarkParser) {
      return parser.quickParse(fileContent);
    }
    
    return parser.parse(fileContent);
  }

  /**
   * 기존 파싱 결과에 분석을 추가합니다.
   */
  static analyzeBookmarkFile(parsedFile: ParsedBookmarkFile): BookmarkParseResult {
    try {
      const analysis = this.analyzer.analyze(parsedFile);
      parsedFile.analysis = analysis;
      
      return {
        success: true,
        data: parsedFile,
        analysis
      };
    } catch (error) {
      return {
        success: false,
        error: `분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  /**
   * 파일 형식을 검증합니다.
   */
  static validateBookmarkFile(fileContent: string): { isValid: boolean; format: string; browser?: string } {
    // JSON 형식 체크
    if (fileContent.trim().startsWith('{')) {
      const jsonParser = new JSONBookmarkParser();
      if (jsonParser.validate(fileContent)) {
        return {
          isValid: true,
          format: 'json',
          browser: 'chrome'
        };
      }
    }

    // HTML 형식 체크
    const htmlParser = new HTMLBookmarkParser();
    if (htmlParser.validate(fileContent)) {
      const browser = htmlParser.getBrowserType(fileContent);
      return {
        isValid: true,
        format: 'html',
        browser
      };
    }

    return {
      isValid: false,
      format: 'unknown'
    };
  }
} 