import { BookmarkParseResult } from '@/types/importedBookmark';

// 파일 유효성 검증 결과
export interface FileValidationResult {
  isValid: boolean;
  fileType: 'html' | 'json' | 'unknown';
  errors: string[];
  warnings: string[];
  fileSize: number;
  fileName: string;
}

// 북마크 파일 검증기
export class BookmarkFileValidator {
  // 최대 파일 크기 (50MB)
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024;
  
  // 지원하는 파일 확장자
  private static readonly SUPPORTED_EXTENSIONS = ['.html', '.htm', '.json'];

  /**
   * 파일 객체를 검증합니다
   */
  static validateFile(file: File): FileValidationResult {
    const result: FileValidationResult = {
      isValid: true,
      fileType: 'unknown',
      errors: [],
      warnings: [],
      fileSize: file.size,
      fileName: file.name
    };

    // 파일 크기 검증
    if (file.size === 0) {
      result.isValid = false;
      result.errors.push('빈 파일입니다. 올바른 북마크 파일을 선택해주세요.');
      return result;
    }

    if (file.size > this.MAX_FILE_SIZE) {
      result.isValid = false;
      result.errors.push(`파일 크기가 너무 큽니다. 최대 ${this.MAX_FILE_SIZE / (1024 * 1024)}MB까지 지원됩니다.`);
      return result;
    }

    // 파일 확장자 검증
    const extension = this.getFileExtension(file.name);
    if (!this.SUPPORTED_EXTENSIONS.includes(extension)) {
      result.isValid = false;
      result.errors.push(`지원하지 않는 파일 형식입니다. ${this.SUPPORTED_EXTENSIONS.join(', ')} 파일만 지원됩니다.`);
      return result;
    }

    // 파일 타입 결정
    if (extension === '.json') {
      result.fileType = 'json';
    } else if (extension === '.html' || extension === '.htm') {
      result.fileType = 'html';
    }

    // 파일 크기 경고
    if (file.size > 10 * 1024 * 1024) {
      result.warnings.push('파일 크기가 큽니다. 처리 시간이 오래 걸릴 수 있습니다.');
    }

    return result;
  }

  /**
   * 파일 내용을 검증합니다
   */
  static validateFileContent(content: string, fileType: 'html' | 'json'): FileValidationResult {
    const result: FileValidationResult = {
      isValid: true,
      fileType,
      errors: [],
      warnings: [],
      fileSize: content.length,
      fileName: ''
    };

    if (!content || content.trim().length === 0) {
      result.isValid = false;
      result.errors.push('파일 내용이 비어있습니다.');
      return result;
    }

    if (fileType === 'html') {
      return this.validateHTMLContent(content, result);
    } else if (fileType === 'json') {
      return this.validateJSONContent(content, result);
    }

    return result;
  }

  /**
   * HTML 북마크 파일 내용 검증
   */
  private static validateHTMLContent(content: string, result: FileValidationResult): FileValidationResult {
    // 기본 HTML 구조 검증
    const requiredPatterns = [
      { pattern: /<!DOCTYPE/i, name: 'DOCTYPE 선언' },
      { pattern: /<dl>/i, name: 'DL 태그' }
    ];

    for (const { pattern, name } of requiredPatterns) {
      if (!pattern.test(content)) {
        result.warnings.push(`${name}을 찾을 수 없습니다. 올바른 북마크 파일인지 확인해주세요.`);
      }
    }

    // 북마크 파일 특징 검증
    const bookmarkPatterns = [
      /<!DOCTYPE NETSCAPE-Bookmark-file-1>/i,
      /<title>bookmarks<\/title>/i,
      /<h1>bookmarks<\/h1>/i
    ];

    const hasBookmarkPattern = bookmarkPatterns.some(pattern => pattern.test(content));
    if (!hasBookmarkPattern) {
      result.warnings.push('표준 북마크 파일 형식과 다를 수 있습니다.');
    }

    // 북마크 링크 존재 여부 확인
    const linkPattern = /<a href=/i;
    if (!linkPattern.test(content)) {
      result.warnings.push('북마크 링크를 찾을 수 없습니다.');
    }

    // 폴더 구조 존재 여부 확인
    const folderPattern = /<h3/i;
    if (!folderPattern.test(content)) {
      result.warnings.push('폴더 구조를 찾을 수 없습니다. 모든 북마크가 루트 레벨에 추가됩니다.');
    }

    return result;
  }

  /**
   * JSON 북마크 파일 내용 검증
   */
  private static validateJSONContent(content: string, result: FileValidationResult): FileValidationResult {
    try {
      const data = JSON.parse(content);

      // Chrome 북마크 JSON 구조 검증
      if (!data.roots) {
        result.isValid = false;
        result.errors.push('Chrome 북마크 파일 형식이 아닙니다. roots 속성을 찾을 수 없습니다.');
        return result;
      }

      if (!data.roots.bookmark_bar && !data.roots.other) {
        result.warnings.push('북마크 데이터를 찾을 수 없습니다.');
      }

      // 버전 정보 확인
      if (data.version) {
        result.warnings.push(`Chrome 북마크 파일 버전: ${data.version}`);
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`JSON 파싱 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }

    return result;
  }

  /**
   * 파싱 결과를 검증합니다
   */
  static validateParseResult(parseResult: BookmarkParseResult): string[] {
    const issues: string[] = [];

    if (!parseResult.success) {
      issues.push(parseResult.error || '파싱에 실패했습니다.');
      return issues;
    }

    const data = parseResult.data;
    if (!data) {
      issues.push('파싱된 데이터가 없습니다.');
      return issues;
    }

    // 북마크 수 검증
    if (data.totalBookmarks === 0) {
      issues.push('가져올 북마크가 없습니다.');
    }

    // 폴더 수 검증
    if (data.totalFolders > 500) {
      issues.push('폴더가 너무 많습니다. 성능에 영향을 줄 수 있습니다.');
    }

    // URL 유효성 간단 체크
    let invalidUrlCount = 0;
    const checkUrls = (bookmarks: any[]) => {
      for (const bookmark of bookmarks) {
        if (!this.isValidUrl(bookmark.url)) {
          invalidUrlCount++;
        }
      }
    };

    checkUrls(data.bookmarks);
    // 폴더 내 북마크도 체크 (재귀적으로)
    // TODO: 폴더 구조 순회 로직 추가

    if (invalidUrlCount > 0) {
      issues.push(`${invalidUrlCount}개의 유효하지 않은 URL이 발견되었습니다.`);
    }

    return issues;
  }

  /**
   * URL 유효성 검사
   */
  private static isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * 파일 확장자 추출
   */
  private static getFileExtension(fileName: string): string {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex === -1 ? '' : fileName.substring(lastDotIndex).toLowerCase();
  }

  /**
   * 파일 읽기 안전성 체크
   */
  static isSafeToRead(file: File): boolean {
    // 파일 크기 체크
    if (file.size > this.MAX_FILE_SIZE) {
      return false;
    }

    // 파일 타입 체크
    const extension = this.getFileExtension(file.name);
    if (!this.SUPPORTED_EXTENSIONS.includes(extension)) {
      return false;
    }

    return true;
  }

  /**
   * 에러 메시지를 사용자 친화적으로 변환
   */
  static formatErrorMessage(error: string): string {
    const errorMap: { [key: string]: string } = {
      'SyntaxError': 'JSON 파일 형식이 올바르지 않습니다.',
      'TypeError': '파일 읽기 중 오류가 발생했습니다.',
      'NetworkError': '파일 읽기 중 네트워크 오류가 발생했습니다.',
    };

    for (const [key, message] of Object.entries(errorMap)) {
      if (error.includes(key)) {
        return message;
      }
    }

    return error;
  }
} 