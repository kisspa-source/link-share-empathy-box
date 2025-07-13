import { BookmarkParseResult, ParsedBookmarkFile, ImportedBookmark, ImportedFolder } from '@/types/importedBookmark';
import { BookmarkAnalyzer } from './bookmarkAnalyzer';

export class HTMLBookmarkParser {
  private analyzer: BookmarkAnalyzer;

  constructor() {
    this.analyzer = new BookmarkAnalyzer();
  }

  parse(fileContent: string, performAnalysis: boolean = true): BookmarkParseResult {
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

      // 메인 DL 요소 찾기
      const rootDL = doc.querySelector('dl');
      if (!rootDL) {
        return {
          success: false,
          error: '북마크 데이터를 찾을 수 없습니다.'
        };
      }

      // 루트 레벨부터 파싱 시작
      this.parseNode(rootDL, result, '', 0);
      
      // 통계 계산
      result.totalBookmarks = this.countBookmarks(result);
      result.totalFolders = this.countFolders(result);

      // 상세 분석 수행 (선택적)
      let analysis = undefined;
      if (performAnalysis) {
        try {
          analysis = this.analyzer.analyze(result);
          result.analysis = analysis;
        } catch (analysisError) {
          console.warn('분석 중 오류 발생:', analysisError);
          // 분석 실패해도 파싱 결과는 반환
        }
      }

      return {
        success: true,
        data: result,
        warnings: this.getWarnings(result),
        analysis
      };

    } catch (error) {
      return {
        success: false,
        error: `파싱 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  validate(fileContent: string): boolean {
    // HTML 북마크 파일의 특징적인 패턴들 검사
    const htmlPatterns = [
      /<!DOCTYPE NETSCAPE-Bookmark-file-1>/i,
      /<title>bookmarks<\/title>/i,
      /<h1>bookmarks<\/h1>/i,
      /<dl>/i,
      /<dt><h3/i,
      /<dt><a href/i
    ];

    return htmlPatterns.some(pattern => pattern.test(fileContent));
  }

  /**
   * 빠른 파싱 모드 - 분석 없이 기본 파싱만 수행
   */
  quickParse(fileContent: string): BookmarkParseResult {
    return this.parse(fileContent, false);
  }

  /**
   * 브라우저 타입을 반환합니다
   */
  getBrowserType(fileContent: string): string {
    return this.detectBrowser(fileContent);
  }

  private extractTitle(doc: Document): string {
    const titleElement = doc.querySelector('title');
    const h1Element = doc.querySelector('h1');
    
    return titleElement?.textContent || h1Element?.textContent || '가져온 북마크';
  }

  private detectBrowser(fileContent: string): 'chrome' | 'firefox' | 'edge' | 'safari' | 'unknown' {
    const content = fileContent.toLowerCase();
    
    // 브라우저별 특징적인 문자열로 판단
    if (content.includes('chrome') || content.includes('chromium')) return 'chrome';
    if (content.includes('firefox') || content.includes('mozilla')) return 'firefox';
    if (content.includes('edge') || content.includes('microsoft')) return 'edge';
    if (content.includes('safari') || content.includes('webkit')) return 'safari';
    
    return 'unknown';
  }

  /**
   * 개선된 노드 파싱 메서드
   * Netscape Bookmark File Format의 구조를 정확히 처리
   */
  private parseNode(dlElement: Element, container: { folders?: ImportedFolder[], children?: ImportedFolder[], bookmarks: ImportedBookmark[] }, currentPath: string, depth: number): void {
    // DL 요소 내의 모든 DT 요소들을 순회
    const dtElements = dlElement.querySelectorAll(':scope > dt');
    
    for (const dtElement of dtElements) {
      this.parseDTElement(dtElement, container, currentPath, depth);
    }
  }

  /**
   * DT 요소 파싱
   */
  private parseDTElement(dtElement: Element, container: { folders?: ImportedFolder[], children?: ImportedFolder[], bookmarks: ImportedBookmark[] }, currentPath: string, depth: number): void {
    const firstChild = dtElement.firstElementChild;
    
    if (!firstChild) return;
    
    if (firstChild.tagName === 'H3') {
      // 폴더 처리
      this.parseFolder(dtElement, firstChild as HTMLElement, container, currentPath, depth);
    } else if (firstChild.tagName === 'A') {
      // 북마크 처리
      this.parseBookmark(firstChild as HTMLAnchorElement, container, currentPath);
    }
  }

  /**
   * 폴더 파싱
   */
  private parseFolder(dtElement: Element, h3Element: HTMLElement, container: { folders?: ImportedFolder[], children?: ImportedFolder[], bookmarks: ImportedBookmark[] }, currentPath: string, depth: number): void {
    const folderName = this.cleanText(h3Element.textContent || '이름 없는 폴더');
    const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;
    
    const folder: ImportedFolder = {
      name: folderName,
      path: folderPath,
      depth: depth,
      parent: currentPath || undefined,
      children: [],
      bookmarks: []
    };
    
    // 컨테이너에 폴더 추가
    if (container.folders) {
      container.folders.push(folder);
    } else if (container.children) {
      container.children.push(folder);
    }
    
    // 하위 DL 요소 찾기 (DT 요소의 다음 형제나 부모의 다음 형제)
    const nextSibling = dtElement.nextElementSibling;
    if (nextSibling && nextSibling.tagName === 'DL') {
      this.parseNode(nextSibling, folder, folderPath, depth + 1);
    } else {
      // DT 요소 내부에 DL이 있을 수도 있음
      const nestedDL = dtElement.querySelector('dl');
      if (nestedDL) {
        this.parseNode(nestedDL, folder, folderPath, depth + 1);
      }
    }
  }

  /**
   * 북마크 파싱
   */
  private parseBookmark(linkElement: HTMLAnchorElement, container: { folders?: ImportedFolder[], children?: ImportedFolder[], bookmarks: ImportedBookmark[] }, currentPath: string): void {
    const url = this.cleanUrl(linkElement.href);
    
    if (!url) return; // 유효하지 않은 URL은 건너뜀
    
    const bookmark: ImportedBookmark = {
      title: this.cleanText(linkElement.textContent || linkElement.title || '제목 없음'),
      url: url,
      addDate: this.parseAddDate(linkElement.getAttribute('add_date')),
      description: this.cleanText(linkElement.getAttribute('description') || ''),
      icon: this.parseIcon(linkElement.getAttribute('icon')),
      folder: currentPath || undefined,
      tags: this.extractTags(linkElement)
    };

    container.bookmarks.push(bookmark);
  }

  private cleanText(text: string): string {
    return text.trim().replace(/\s+/g, ' ');
  }

  private cleanUrl(url: string): string {
    try {
      // 유효한 HTTP/HTTPS URL만 허용
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      // chrome:// 등의 브라우저 내부 URL도 허용
      if (url.includes('://') && !url.startsWith('file://')) {
        return url;
      }
      
      return '';
    } catch {
      return '';
    }
  }

  private parseAddDate(addDateStr: string | null): number | undefined {
    if (!addDateStr) return undefined;
    
    const timestamp = parseInt(addDateStr, 10);
    if (isNaN(timestamp) || timestamp <= 0) return undefined;
    
    // Unix timestamp를 현재 시간과 비교하여 유효성 검사
    const now = Math.floor(Date.now() / 1000);
    if (timestamp > now) return undefined; // 미래 시간은 무효
    
    return timestamp;
  }

  private parseIcon(iconStr: string | null): string | undefined {
    if (!iconStr || iconStr.length === 0) return undefined;
    
    // Base64 favicon 데이터인지 확인
    if (iconStr.startsWith('data:image/')) {
      return iconStr;
    }
    
    return undefined;
  }

  private extractTags(linkElement: HTMLAnchorElement): string[] {
    const tags: string[] = [];
    
    // 일부 브라우저는 태그 정보를 속성으로 저장
    const tagsAttr = linkElement.getAttribute('tags');
    if (tagsAttr) {
      const parsedTags = tagsAttr.split(',').map(tag => tag.trim()).filter(tag => tag);
      tags.push(...parsedTags);
    }
    
    // Firefox는 키워드 정보를 shortcuturl에 저장하기도 함
    const shortcut = linkElement.getAttribute('shortcuturl');
    if (shortcut) {
      tags.push(shortcut);
    }
    
    return tags;
  }

  private countBookmarks(result: ParsedBookmarkFile): number {
    const countInContainer = (container: { folders?: ImportedFolder[], children?: ImportedFolder[], bookmarks: ImportedBookmark[] }): number => {
      let count = container.bookmarks.length;
      
      // folders 또는 children 속성에서 폴더 목록 가져오기
      const folders = container.folders || container.children || [];
      
      for (const folder of folders) {
        count += countInContainer(folder);
      }
      
      return count;
    };

    return countInContainer(result);
  }

  private countFolders(result: ParsedBookmarkFile): number {
    const countInContainer = (container: { folders?: ImportedFolder[], children?: ImportedFolder[] }): number => {
      // folders 또는 children 속성에서 폴더 목록 가져오기
      const folders = container.folders || container.children || [];
      let count = folders.length;
      
      for (const folder of folders) {
        count += countInContainer(folder);
      }
      
      return count;
    };

    return countInContainer(result);
  }

  private getWarnings(result: ParsedBookmarkFile): string[] {
    const warnings: string[] = [];
    
    if (result.totalBookmarks === 0) {
      warnings.push('북마크가 발견되지 않았습니다.');
    }
    
    if (result.totalFolders === 0) {
      warnings.push('폴더가 발견되지 않았습니다. 모든 북마크가 루트 레벨에 추가됩니다.');
    }
    
    if (result.totalBookmarks > 1000) {
      warnings.push('북마크가 매우 많습니다. 가져오기에 시간이 걸릴 수 있습니다.');
    }

    if (result.totalFolders > 100) {
      warnings.push('폴더가 매우 많습니다. 폴더 구조 생성에 시간이 걸릴 수 있습니다.');
    }

    return warnings;
  }
} 