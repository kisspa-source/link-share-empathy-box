import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Folder, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Settings,
  Download,
  Chrome,
  Globe,
  Activity,
  BarChart3
} from 'lucide-react';
import { FileDropZone } from './FileDropZone';
import { BookmarkAnalysisPanel } from './BookmarkAnalysisPanel';
import { BookmarkParserFactory } from '@/lib/parsers/bookmarkParser';
import { BookmarkFileValidator, FileValidationResult } from '@/utils/bookmarkValidator';
import { ParsedBookmarkFile, ImportOptions } from '@/types/importedBookmark';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { getSafeIconByName } from '@/lib/icons';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BookmarkUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'upload' | 'preview' | 'options' | 'importing' | 'completed';

export default function BookmarkUploadDialog({ open, onOpenChange }: BookmarkUploadDialogProps) {
  const { folders, getFlatFolderList, importBookmarks, importProgress, isImporting, cancelImport } = useBookmarks();
  
  // 상태 관리
  const [step, setStep] = useState<Step>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileValidation, setFileValidation] = useState<FileValidationResult | null>(null);
  const [parsedData, setParsedData] = useState<ParsedBookmarkFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 가져오기 옵션
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    mergeFolders: true,
    preserveFolderStructure: true,
    autoGenerateTags: false,
    defaultFolder: undefined,
    performAnalysis: true,
    showProgress: true
  });

  // 다이얼로그가 닫힐 때 상태 초기화
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('upload');
        setSelectedFile(null);
        setFileValidation(null);
        setParsedData(null);
        setError(null);
        setIsProcessing(false);
      }, 300);
    }
  }, [open]);

  // 파일 선택 핸들러
  const handleFileSelect = async (file: File, validation: FileValidationResult) => {
    setSelectedFile(file);
    setFileValidation(validation);
    setError(null);

    if (validation.isValid) {
      await parseFile(file, validation.fileType);
    }
  };

  // 파일 파싱 (분석 포함)
  const parseFile = async (file: File, fileType: 'html' | 'json') => {
    setIsProcessing(true);
    
    try {
      const content = await readFileContent(file);
      
      // 파일 내용 유효성 검증
      const contentValidation = BookmarkFileValidator.validateFileContent(content, fileType);
      if (!contentValidation.isValid) {
        setError(contentValidation.errors.join('\n'));
        setIsProcessing(false);
        return;
      }

      // 북마크 파일 파싱 (분석 포함)
      const parseResult = BookmarkParserFactory.parseBookmarkFile(content, {
        ...importOptions,
        performAnalysis: true
      });
      
      if (!parseResult.success) {
        setError(parseResult.error || '파싱에 실패했습니다.');
        setIsProcessing(false);
        return;
      }

      setParsedData(parseResult.data!);
      setStep('preview');
      
      // 분석 결과가 있으면 토스트로 알림
      if (parseResult.analysis) {
        toast.success(
          `분석 완료: ${parseResult.analysis.totalBookmarks}개 북마크, ${parseResult.analysis.totalFolders}개 폴더 발견`,
          {
            description: `처리 시간: ${parseResult.analysis.processingTime}ms`
          }
        );
      }
      
    } catch (err) {
      setError(`파일 읽기 오류: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 파일 내용 읽기
  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsText(file, 'utf-8');
    });
  };

  // 가져오기 실행
  const handleImport = async () => {
    if (!parsedData || !selectedFile) return;

    setIsProcessing(true);
    setStep('importing');

    try {
      // 실제 가져오기 로직 실행
      await importBookmarks(selectedFile, importOptions);
      
      setStep('completed');
      
    } catch (err) {
      setError(`가져오기 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`);
      setStep('options');
    } finally {
      setIsProcessing(false);
    }
  };

  // 에러 핸들러
  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // 단계별 제목과 설명
  const getStepInfo = () => {
    switch (step) {
      case 'upload':
        return {
          title: '북마크 파일 업로드',
          description: '브라우저에서 내보낸 북마크 파일을 선택해주세요.'
        };
      case 'preview':
        return {
          title: '북마크 미리보기 및 분석',
          description: '가져올 북마크 정보를 확인하고 상세 분석 결과를 확인하세요.'
        };
      case 'options':
        return {
          title: '가져오기 옵션',
          description: '북마크 가져오기 방식을 설정하세요.'
        };
      case 'importing':
        return {
          title: '북마크 가져오는 중',
          description: '북마크를 가져오고 있습니다. 잠시만 기다려주세요.'
        };
      case 'completed':
        return {
          title: '가져오기 완료',
          description: '북마크 가져오기가 완료되었습니다.'
        };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            {stepInfo.title}
          </DialogTitle>
          <DialogDescription>
            {stepInfo.description}
          </DialogDescription>
        </DialogHeader>

        {/* 에러 메시지 */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex-1 overflow-auto">
          {/* Step 1: 파일 업로드 */}
          {step === 'upload' && (
            <div className="space-y-6">
              <FileDropZone
                onFileSelect={handleFileSelect}
                onError={handleError}
                disabled={isProcessing}
              />
              
              {isProcessing && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>파일을 분석하는 중...</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: 미리보기 및 분석 */}
          {step === 'preview' && parsedData && (
            <div className="space-y-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    기본 정보
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    상세 분석
                    {parsedData.analysis && (
                      <Badge variant="secondary" className="text-xs ml-1">
                        {parsedData.analysis.processingTime}ms
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* 기본 정보 탭 */}
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-card border rounded-lg p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <div className="text-2xl font-bold">{parsedData.totalBookmarks}</div>
                      <div className="text-sm text-muted-foreground">북마크</div>
                    </div>
                    <div className="bg-card border rounded-lg p-4 text-center">
                      <Folder className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                      <div className="text-2xl font-bold">{parsedData.totalFolders}</div>
                      <div className="text-sm text-muted-foreground">폴더</div>
                    </div>
                    <div className="bg-card border rounded-lg p-4 text-center">
                      <Chrome className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <div className="text-2xl font-bold capitalize">{parsedData.browser || 'Unknown'}</div>
                      <div className="text-sm text-muted-foreground">브라우저</div>
                    </div>
                  </div>

                  {/* 폴더 구조 미리보기 */}
                  {parsedData.folders.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        폴더 구조 미리보기
                      </h4>
                      <div className="bg-muted/30 rounded-lg p-3 max-h-48 overflow-auto">
                        {parsedData.folders.slice(0, 5).map((folder, index) => (
                          <div key={index} className="flex items-center gap-2 py-1">
                            <Folder className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{folder.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {folder.bookmarks.length}개
                            </Badge>
                          </div>
                        ))}
                        {parsedData.folders.length > 5 && (
                          <div className="text-xs text-muted-foreground mt-2">
                            ... 그 외 {parsedData.folders.length - 5}개 폴더
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 샘플 북마크 */}
                  {parsedData.bookmarks.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        북마크 샘플
                      </h4>
                      <div className="bg-muted/30 rounded-lg p-3 max-h-48 overflow-auto">
                        {parsedData.bookmarks.slice(0, 3).map((bookmark, index) => (
                          <div key={index} className="flex items-start gap-2 py-2 border-b border-border/50 last:border-0">
                            <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate">{bookmark.title}</div>
                              <div className="text-xs text-muted-foreground truncate">{bookmark.url}</div>
                            </div>
                          </div>
                        ))}
                        {parsedData.bookmarks.length > 3 && (
                          <div className="text-xs text-muted-foreground mt-2">
                            ... 그 외 {parsedData.bookmarks.length - 3}개 북마크
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* 상세 분석 탭 */}
                <TabsContent value="analysis" className="space-y-6">
                  {parsedData.analysis ? (
                    <BookmarkAnalysisPanel analysis={parsedData.analysis} />
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <Activity className="h-12 w-12 text-muted-foreground" />
                      <div className="text-center">
                        <h3 className="font-medium mb-2">분석 결과를 사용할 수 없습니다</h3>
                        <p className="text-sm text-muted-foreground">
                          파일 파싱 중 분석이 실행되지 않았습니다.
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {/* Step 3: 옵션 설정 */}
          {step === 'options' && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skipDuplicates"
                    checked={importOptions.skipDuplicates}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, skipDuplicates: checked as boolean }))
                    }
                  />
                  <Label htmlFor="skipDuplicates" className="text-sm font-medium">
                    중복 북마크 건너뛰기
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  동일한 URL의 북마크가 이미 존재하는 경우 건너뜁니다.
                </p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mergeFolders"
                    checked={importOptions.mergeFolders}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, mergeFolders: checked as boolean }))
                    }
                  />
                  <Label htmlFor="mergeFolders" className="text-sm font-medium">
                    동일한 이름의 폴더 병합
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  같은 이름의 폴더가 있으면 북마크를 해당 폴더에 추가합니다.
                </p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="preserveFolderStructure"
                    checked={importOptions.preserveFolderStructure}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, preserveFolderStructure: checked as boolean }))
                    }
                  />
                  <Label htmlFor="preserveFolderStructure" className="text-sm font-medium">
                    폴더 구조 유지
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  원본 북마크 파일의 폴더 계층 구조를 그대로 유지합니다.
                </p>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoGenerateTags"
                    checked={importOptions.autoGenerateTags}
                    onCheckedChange={(checked) => 
                      setImportOptions(prev => ({ ...prev, autoGenerateTags: checked as boolean }))
                    }
                  />
                  <Label htmlFor="autoGenerateTags" className="text-sm font-medium">
                    자동 태그 생성
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  북마크 URL을 분석하여 자동으로 태그를 생성합니다.
                </p>

                <Separator />

                <div className="space-y-3">
                  <Label className="text-sm font-medium">기본 폴더 (선택사항)</Label>
                  <Select
                    value={importOptions.defaultFolder || '__root__'}
                    onValueChange={(value) => 
                      setImportOptions(prev => ({ 
                        ...prev, 
                        defaultFolder: value === '__root__' ? undefined : value 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="기본 폴더 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__root__">
                        <div className="flex items-center">
                          <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                          루트 폴더 (최상위)
                        </div>
                      </SelectItem>
                      {getFlatFolderList().map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <div className="flex items-center">
                            <div style={{ marginLeft: `${(folder.depth || 0) * 16}px` }}>
                              {(() => {
                                const folderIconInfo = getSafeIconByName(folder.icon_name || 'folder');
                                const FolderIconComponent = folderIconInfo?.icon || Folder;
                                return (
                                  <FolderIconComponent 
                                    className="h-4 w-4 mr-2 inline" 
                                    style={{ color: folder.icon_color || '#3B82F6' }}
                                  />
                                );
                              })()}
                              <span>{folder.name}</span>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    폴더가 없는 북마크들이 추가될 기본 폴더를 선택하세요.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: 가져오는 중 - 기존 코드 유지 */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              {/* 애니메이션 스피너 */}
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              
              <div className="text-center space-y-4 w-full max-w-lg">
                <h3 className="text-lg font-medium">북마크를 가져오는 중입니다</h3>
                
                {importProgress && (
                  <div className="space-y-4">
                    {/* 전체 진행률 바 */}
                    <div className="space-y-2">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-primary h-3 rounded-full transition-all duration-300"
                          style={{ width: `${importProgress.percentage}%` }}
                        />
                      </div>
                      
                      {/* 진행률 텍스트 */}
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{Math.round(importProgress.percentage)}% 완료</span>
                        {importProgress.estimatedTimeRemaining && (
                          <span className="text-muted-foreground">
                            예상 남은 시간: {Math.ceil(importProgress.estimatedTimeRemaining)}초
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* 현재 단계 정보 */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">
                          단계 {importProgress.currentPhase} / {importProgress.totalPhases}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {importProgress.phase === 'validation' && '검증 중'}
                          {importProgress.phase === 'parsing' && '파싱 중'}
                          {importProgress.phase === 'folder-creation' && '폴더 생성 중'}
                          {importProgress.phase === 'bookmark-import' && '북마크 가져오기 중'}
                          {importProgress.phase === 'finalization' && '마무리 중'}
                          {importProgress.phase === 'completed' && '완료'}
                        </span>
                      </div>
                      
                      {/* 단계별 진행률 바 */}
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${importProgress.phaseProgress}%` }}
                        />
                      </div>
                      
                      {/* 현재 작업 */}
                      <div className="text-sm text-muted-foreground text-center">
                        {importProgress.currentItem}
                      </div>
                    </div>
                    
                    {/* 배치 정보 */}
                    {importProgress.batchInfo && (
                      <div className="text-xs text-gray-600 text-center">
                        배치 {importProgress.batchInfo.currentBatch} / {importProgress.batchInfo.totalBatches}
                        (배치 크기: {importProgress.batchInfo.batchSize})
                      </div>
                    )}
                    
                    {/* 통계 정보 */}
                    {importProgress.statistics && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-medium text-blue-700">폴더 생성</div>
                            <div className="text-lg font-bold text-blue-600">
                              {importProgress.statistics.foldersCreated}
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-blue-700">북마크 가져오기</div>
                            <div className="text-lg font-bold text-blue-600">
                              {importProgress.statistics.bookmarksImported}
                            </div>
                          </div>
                        </div>
                        
                        {(importProgress.statistics.duplicatesSkipped > 0 || importProgress.statistics.errorsEncountered > 0) && (
                          <div className="grid grid-cols-2 gap-2 text-xs mt-2 pt-2 border-t border-blue-200">
                            <div className="text-center">
                              <div className="font-medium text-orange-700">중복 건너뜀</div>
                              <div className="text-sm font-bold text-orange-600">
                                {importProgress.statistics.duplicatesSkipped}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-red-700">오류 발생</div>
                              <div className="text-sm font-bold text-red-600">
                                {importProgress.statistics.errorsEncountered}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {importProgress.cancelRequested && (
                      <div className="text-sm text-orange-600 text-center">
                        취소 요청 중...
                      </div>
                    )}
                  </div>
                )}
                
                {!importProgress && parsedData && (
                  <p className="text-sm text-muted-foreground">
                    {parsedData.totalBookmarks}개의 북마크와 {parsedData.totalFolders}개의 폴더를 처리하고 있습니다...
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 5: 완료 - 기존 코드 유지 */}
          {step === 'completed' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              {importProgress?.currentStep === 'cancelled' ? (
                <AlertTriangle className="w-16 h-16 text-orange-500" />
              ) : importProgress?.currentStep === 'error' ? (
                <AlertTriangle className="w-16 h-16 text-red-500" />
              ) : (
                <CheckCircle className="w-16 h-16 text-green-500" />
              )}
              
              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium">
                  {importProgress?.currentStep === 'cancelled' && '가져오기 취소됨'}
                  {importProgress?.currentStep === 'error' && '가져오기 실패'}
                  {importProgress?.currentStep === 'completed' && '가져오기 완료!'}
                </h3>
                
                {importProgress?.currentStep === 'completed' && importProgress.statistics && (
                  <div className="bg-green-50 p-4 rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-green-700">폴더 생성</div>
                        <div className="text-xl font-bold text-green-600">
                          {importProgress.statistics.foldersCreated}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-green-700">북마크 가져오기</div>
                        <div className="text-xl font-bold text-green-600">
                          {importProgress.statistics.bookmarksImported}
                        </div>
                      </div>
                    </div>
                    
                    {(importProgress.statistics.duplicatesSkipped > 0 || importProgress.statistics.errorsEncountered > 0) && (
                      <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-green-200">
                        <div className="text-center">
                          <div className="font-medium text-yellow-700">중복 건너뜀</div>
                          <div className="text-lg font-bold text-yellow-600">
                            {importProgress.statistics.duplicatesSkipped}
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-red-700">오류 발생</div>
                          <div className="text-lg font-bold text-red-600">
                            {importProgress.statistics.errorsEncountered}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {importProgress?.currentStep === 'error' && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-700">
                      가져오기 중 오류가 발생했습니다:
                    </p>
                    {importProgress.errors.length > 0 && (
                      <ul className="mt-2 text-xs text-red-600 space-y-1">
                        {importProgress.errors.slice(0, 3).map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                        {importProgress.errors.length > 3 && (
                          <li>• ... 그 외 {importProgress.errors.length - 3}개 오류</li>
                        )}
                      </ul>
                    )}
                  </div>
                )}
                
                {importProgress?.currentStep === 'completed' && (
                  <p className="text-sm text-muted-foreground">
                    북마크가 성공적으로 가져왔습니다. 이제 북마크 목록에서 확인할 수 있습니다.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 버튼 영역 */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            {step === 'completed' ? '닫기' : '취소'}
          </Button>

          <div className="flex gap-2">
            {step === 'preview' && (
              <Button onClick={() => setStep('options')}>
                <Settings className="h-4 w-4 mr-2" />
                옵션 설정
              </Button>
            )}
            
            {step === 'options' && (
              <>
                <Button variant="outline" onClick={() => setStep('preview')}>
                  이전
                </Button>
                <Button onClick={handleImport} disabled={isProcessing}>
                  <Download className="h-4 w-4 mr-2" />
                  가져오기 시작
                </Button>
              </>
            )}
            
            {step === 'importing' && importProgress?.canCancel && !importProgress.cancelRequested && (
              <Button variant="outline" onClick={cancelImport}>
                가져오기 취소
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 