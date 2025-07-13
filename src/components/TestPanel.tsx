import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HTMLBookmarkParser } from '@/lib/parsers/htmlBookmarkParser';
import { BookmarkParseResult } from '@/types/importedBookmark';

const TestPanel = () => {
  const [testResult, setTestResult] = useState<BookmarkParseResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 테스트용 북마크 HTML 데이터
  const testBookmarkHtml = `
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1737726475" LAST_MODIFIED="1746412043" PERSONAL_TOOLBAR_FOLDER="true">북마크바</H3>
    <DL><p>
        <DT><A HREF="https://www.google.com" ADD_DATE="1431674984">Google</A>
        <DT><H3 ADD_DATE="1622912990" LAST_MODIFIED="1704094529">개발도구</H3>
        <DL><p>
            <DT><A HREF="https://github.com" ADD_DATE="1489723211">GitHub</A>
            <DT><A HREF="https://stackoverflow.com" ADD_DATE="1697953495">Stack Overflow</A>
            <DT><H3 ADD_DATE="1622912990" LAST_MODIFIED="1698811644">프론트엔드</H3>
            <DL><p>
                <DT><A HREF="https://reactjs.org" ADD_DATE="1489723211">React</A>
                <DT><A HREF="https://nextjs.org" ADD_DATE="1697953495">Next.js</A>
            </DL><p>
        </DL><p>
    </DL><p>
</DL><p>
`;

  const runTest = async () => {
    setIsLoading(true);
    
    try {
      const parser = new HTMLBookmarkParser();
      const result = parser.parse(testBookmarkHtml, true);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : '테스트 중 오류 발생'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>HTML 북마크 파서 테스트</CardTitle>
        <CardDescription>
          개선된 북마크 파서의 기능을 테스트합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4">
          <Button 
            onClick={runTest} 
            disabled={isLoading}
            className="flex-shrink-0"
          >
            {isLoading ? '테스트 중...' : '북마크 파서 테스트 실행'}
          </Button>
        </div>

        {testResult && (
          <div className="space-y-4">
            <div className="p-4 bg-secondary/20 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">테스트 결과</h3>
              
              {testResult.success ? (
                <div className="space-y-3">
                  <div className="text-green-600 font-medium">
                    ✅ 파싱 성공
                  </div>
                  
                  {testResult.data && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>총 북마크:</strong> {testResult.data.totalBookmarks}개
                        </div>
                        <div>
                          <strong>총 폴더:</strong> {testResult.data.totalFolders}개
                        </div>
                        <div>
                          <strong>브라우저:</strong> {testResult.data.browser}
                        </div>
                        <div>
                          <strong>파싱 시간:</strong> {new Date(testResult.data.parseDate).toLocaleString()}
                        </div>
                      </div>
                      
                      {/* 폴더 구조 표시 */}
                      {testResult.data.folders.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">폴더 구조:</h4>
                          <div className="space-y-1 text-sm">
                            {testResult.data.folders.map((folder, index) => (
                              <div key={index} className="pl-4 border-l-2 border-primary/30">
                                <div className="font-medium">{folder.name}</div>
                                <div className="text-muted-foreground text-xs">
                                  경로: {folder.path} | 깊이: {folder.depth} | 
                                  북마크: {folder.bookmarks.length}개 | 
                                  하위폴더: {folder.children.length}개
                                </div>
                                {folder.bookmarks.length > 0 && (
                                  <div className="mt-1 ml-4 space-y-1">
                                    {folder.bookmarks.map((bookmark, bmIndex) => (
                                      <div key={bmIndex} className="text-xs text-muted-foreground">
                                        • {bookmark.title} - {bookmark.url}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {folder.children.length > 0 && (
                                  <div className="mt-1 ml-4 space-y-1">
                                    {folder.children.map((child, childIndex) => (
                                      <div key={childIndex} className="text-xs">
                                        📁 {child.name} ({child.bookmarks.length}개 북마크)
                                        {child.bookmarks.length > 0 && (
                                          <div className="ml-4 space-y-1">
                                            {child.bookmarks.map((bookmark, bmIndex) => (
                                              <div key={bmIndex} className="text-xs text-muted-foreground">
                                                • {bookmark.title} - {bookmark.url}
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 루트 레벨 북마크 */}
                      {testResult.data.bookmarks.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium mb-2">루트 레벨 북마크:</h4>
                          <div className="space-y-1 text-sm">
                            {testResult.data.bookmarks.map((bookmark, index) => (
                              <div key={index} className="text-muted-foreground">
                                • {bookmark.title} - {bookmark.url}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 분석 결과 */}
                      {testResult.analysis && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <h4 className="font-medium mb-2">분석 결과:</h4>
                          <div className="text-sm space-y-1">
                            <div>최대 깊이: {testResult.analysis.maxDepth}</div>
                            <div>처리 시간: {testResult.analysis.processingTime}ms</div>
                            {testResult.analysis.warnings.length > 0 && (
                              <div>
                                <div className="font-medium text-amber-600">경고:</div>
                                <ul className="ml-4 space-y-1">
                                  {testResult.analysis.warnings.map((warning, index) => (
                                    <li key={index} className="text-amber-600">• {warning}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 경고 메시지 */}
                  {testResult.warnings && testResult.warnings.length > 0 && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <h4 className="font-medium mb-2 text-yellow-800 dark:text-yellow-200">경고:</h4>
                      <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                        {testResult.warnings.map((warning, index) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-600 font-medium">
                  ❌ 파싱 실패: {testResult.error}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestPanel; 