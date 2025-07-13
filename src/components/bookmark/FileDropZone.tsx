import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BookmarkFileValidator, FileValidationResult } from '@/utils/bookmarkValidator';

interface FileDropZoneProps {
  onFileSelect: (file: File, validation: FileValidationResult) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

interface SelectedFileInfo {
  file: File;
  validation: FileValidationResult;
}

export function FileDropZone({ onFileSelect, onError, disabled = false, className }: FileDropZoneProps) {
  const [selectedFile, setSelectedFile] = useState<SelectedFileInfo | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setIsDragActive(false);

    // 거부된 파일 처리
    if (rejectedFiles.length > 0) {
      const firstRejected = rejectedFiles[0];
      const errors = firstRejected.errors.map((e: any) => e.message).join(', ');
      onError(`파일 업로드 실패: ${errors}`);
      return;
    }

    // 파일이 선택되지 않은 경우
    if (acceptedFiles.length === 0) {
      onError('올바른 파일을 선택해주세요.');
      return;
    }

    // 첫 번째 파일만 처리 (여러 파일 업로드 방지)
    const file = acceptedFiles[0];
    
    // 파일 유효성 검증
    const validation = BookmarkFileValidator.validateFile(file);
    
    if (!validation.isValid) {
      onError(validation.errors.join('\n'));
      return;
    }

    // 파일 정보 저장 및 부모 컴포넌트에 전달
    const fileInfo: SelectedFileInfo = { file, validation };
    setSelectedFile(fileInfo);
    onFileSelect(file, validation);

  }, [onFileSelect, onError]);

  const { getRootProps, getInputProps, isDragActive: dropzoneActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      'text/html': ['.html', '.htm'],
      'application/json': ['.json']
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
    disabled,
    multiple: false
  });

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'html':
        return '🌐';
      case 'json':
        return '📋';
      default:
        return '📄';
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 드롭존 영역 */}
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
          'hover:border-primary/50 hover:bg-accent/20',
          isDragActive || dropzoneActive
            ? 'border-primary bg-primary/10 scale-105'
            : 'border-muted-foreground/30',
          disabled && 'opacity-50 cursor-not-allowed',
          selectedFile && 'border-green-500 bg-green-50 dark:bg-green-950/20'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          {isDragActive || dropzoneActive ? (
            <>
              <Upload className="h-12 w-12 text-primary animate-bounce" />
              <div>
                <p className="text-lg font-medium text-primary">파일을 여기에 놓으세요</p>
                <p className="text-sm text-muted-foreground">HTML 또는 JSON 북마크 파일</p>
              </div>
            </>
          ) : selectedFile ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-500" />
              <div>
                <p className="text-lg font-medium text-green-700 dark:text-green-400">파일이 선택되었습니다</p>
                <p className="text-sm text-muted-foreground">아래에서 파일 정보를 확인하세요</p>
              </div>
            </>
          ) : (
            <>
              <div className="relative">
                <Upload className="h-12 w-12 text-muted-foreground" />
                <File className="h-6 w-6 absolute -bottom-1 -right-1 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium">파일을 드래그하거나 클릭하여 선택</p>
                <p className="text-sm text-muted-foreground mt-1">
                  HTML (.html, .htm) 또는 JSON (.json) 파일만 지원됩니다
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  최대 파일 크기: 50MB
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 선택된 파일 정보 */}
      {selectedFile && (
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <div className="text-2xl flex-shrink-0">
                {getFileIcon(selectedFile.validation.fileType)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <p className="font-medium truncate">{selectedFile.file.name}</p>
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                    {selectedFile.validation.fileType.toUpperCase()}
                  </span>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>크기: {formatFileSize(selectedFile.file.size)}</p>
                  <p>수정일: {new Date(selectedFile.file.lastModified).toLocaleString()}</p>
                </div>

                {/* 경고 메시지 */}
                {selectedFile.validation.warnings.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {selectedFile.validation.warnings.map((warning, index) => (
                      <div key={index} className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 파일 제거 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              disabled={disabled}
              className="flex-shrink-0 ml-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 도움말 */}
      {!selectedFile && (
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>지원되는 브라우저:</strong></p>
          <ul className="space-y-0.5 ml-4">
            <li>• Chrome: 북마크 관리자 → 북마크 내보내기</li>
            <li>• Firefox: 북마크 관리 → HTML로 북마크 내보내기</li>
            <li>• Edge: 즐겨찾기 관리 → 즐겨찾기 내보내기</li>
            <li>• Safari: 파일 → 북마크 내보내기</li>
          </ul>
        </div>
      )}
    </div>
  );
} 