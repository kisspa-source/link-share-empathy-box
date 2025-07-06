import { useState, useEffect } from 'react';
import { Folder, Save, X, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FolderIconDialog } from './FolderIconDialog';
import { ColorPicker } from './ColorPicker';
import { getSafeIconByName } from '@/lib/icons';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import type { Folder as FolderType } from '@/types/bookmark';

interface EditFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: FolderType;
  className?: string;
}

export function EditFolderDialog({ open, onOpenChange, folder, className }: EditFolderDialogProps) {
  const [isIconDialogOpen, setIsIconDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 폴더 정보 상태 - 기존 폴더 정보로 초기화
  const [folderName, setFolderName] = useState(folder.name);
  const [selectedIcon, setSelectedIcon] = useState(folder.icon_name || 'folder');
  const [selectedColor, setSelectedColor] = useState(folder.icon_color || '#3B82F6');
  const [selectedCategory, setSelectedCategory] = useState(folder.icon_category || 'default');
  const [selectedParentId, setSelectedParentId] = useState<string>(folder.parent_id || '__root__');
  
  const { updateFolder, getFlatFolderList } = useBookmarks();
  const { user } = useAuth();
  
  // 플랫한 폴더 목록 (부모 폴더 선택용) - 자기 자신과 하위 폴더들은 제외
  const flatFolders = getFlatFolderList().filter(f => 
    f.id !== folder.id && 
    !f.path?.includes(folder.name) // 현재 폴더의 하위 폴더 제외
  );

  // 폴더 정보가 변경되면 상태 업데이트
  useEffect(() => {
    setFolderName(folder.name);
    setSelectedIcon(folder.icon_name || 'folder');
    setSelectedColor(folder.icon_color || '#3B82F6');
    setSelectedCategory(folder.icon_category || 'default');
    setSelectedParentId(folder.parent_id || '__root__');
  }, [folder]);

  const resetForm = () => {
    setFolderName(folder.name);
    setSelectedIcon(folder.icon_name || 'folder');
    setSelectedColor(folder.icon_color || '#3B82F6');
    setSelectedCategory(folder.icon_category || 'default');
    setSelectedParentId(folder.parent_id || '__root__');
  };

  const handleIconSelect = (iconName: string, iconCategory: string) => {
    setSelectedIcon(iconName);
    setSelectedCategory(iconCategory);
  };

  const handleUpdateFolder = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (!folderName.trim()) {
      toast.error('폴더 이름을 입력해주세요.');
      return;
    }

    // 변경사항이 없으면 저장하지 않음
    const hasChanges = 
      folderName.trim() !== folder.name ||
      selectedIcon !== (folder.icon_name || 'folder') ||
      selectedColor !== (folder.icon_color || '#3B82F6') ||
      selectedCategory !== (folder.icon_category || 'default') ||
      selectedParentId !== (folder.parent_id || '__root__');

    if (!hasChanges) {
      toast.info('변경된 내용이 없습니다.');
      onOpenChange(false);
      return;
    }

    setIsLoading(true);
    try {
      await updateFolder(folder.id, {
        name: folderName.trim(),
        icon_name: selectedIcon,
        icon_color: selectedColor,
        icon_category: selectedCategory,
        parent_id: selectedParentId === '__root__' ? undefined : selectedParentId
      });
      
      toast.success(`"${folderName}" 폴더가 수정되었습니다.`);
      onOpenChange(false);
    } catch (error) {
      console.error('폴더 수정 오류:', error);
      toast.error('폴더 수정 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  // 선택된 아이콘 컴포넌트 가져오기
  const selectedIconInfo = getSafeIconByName(selectedIcon);
  const IconComponent = selectedIconInfo?.icon || Folder;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: `${selectedColor}20` }}
              >
                <IconComponent 
                  className="w-5 h-5 transition-colors" 
                  style={{ color: selectedColor }}
                />
              </div>
              <div>
                <div className="text-lg font-semibold">폴더 편집</div>
                <div className="text-sm text-muted-foreground font-normal">
                  폴더 정보를 수정하세요
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 폴더 이름 입력 */}
            <div className="space-y-2">
              <Label htmlFor="folder-name" className="text-sm font-medium">
                폴더 이름 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="folder-name"
                placeholder="예: 개발 도구, 디자인 영감, 학습 자료"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleUpdateFolder();
                  }
                }}
                className={cn(
                  "transition-colors",
                  folderName.trim() && "border-primary/50 focus:border-primary"
                )}
                autoFocus
              />
              {folderName.trim() && (
                <div className="text-xs text-green-600 flex items-center gap-1">
                  ✓ 폴더 이름이 입력되었습니다
                </div>
              )}
            </div>

            <Separator />
            
            {/* 부모 폴더 선택 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">위치 변경</Label>
              <Select value={selectedParentId} onValueChange={setSelectedParentId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="루트 폴더 (최상위)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__root__">
                    <div className="flex items-center">
                      <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                      루트 폴더 (최상위)
                    </div>
                  </SelectItem>
                  {flatFolders.map((parentFolder) => (
                    <SelectItem key={parentFolder.id} value={parentFolder.id}>
                      <div className="flex items-center">
                        <div style={{ marginLeft: `${(parentFolder.depth || 0) * 16}px` }}>
                          {parentFolder.depth && parentFolder.depth > 0 && (
                            <ChevronRight className="h-3 w-3 text-muted-foreground inline mr-1" />
                          )}
                          {(() => {
                            const folderIconInfo = getSafeIconByName(parentFolder.icon_name || 'folder');
                            const FolderIconComponent = folderIconInfo?.icon || Folder;
                            return (
                              <FolderIconComponent 
                                className="h-4 w-4 mr-2 inline" 
                                style={{ color: parentFolder.icon_color || '#3B82F6' }}
                              />
                            );
                          })()}
                          <span>{parentFolder.name}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-xs text-muted-foreground">
                폴더를 이동할 위치를 선택하세요. 현재 폴더의 하위 폴더로는 이동할 수 없습니다.
              </div>
            </div>

            <Separator />
            
            {/* 아이콘 및 색상 선택 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 아이콘 선택 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">아이콘 선택</Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-20 flex flex-col gap-2 hover:bg-accent/50 transition-colors"
                  onClick={() => setIsIconDialogOpen(true)}
                >
                  <IconComponent 
                    className="w-7 h-7 transition-all" 
                    style={{ color: selectedColor }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {selectedIconInfo?.label || selectedIcon}
                  </span>
                </Button>
              </div>
              
              {/* 색상 선택 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">색상 선택</Label>
                <div className="flex items-center">
                  <ColorPicker
                    selectedColor={selectedColor}
                    onColorSelect={setSelectedColor}
                    showTitle={false}
                  />
                </div>
              </div>
            </div>

            <Separator />
            
            {/* 미리보기 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">미리보기</Label>
              <div className="relative overflow-hidden rounded-lg border-2 border-dashed border-muted-foreground/20 p-4 bg-gradient-to-br from-background to-muted/20">
                <div className="flex items-center gap-4">
                  <div 
                    className="p-3 rounded-xl shadow-sm transition-all duration-300"
                    style={{ 
                      backgroundColor: `${selectedColor}15`,
                      border: `2px solid ${selectedColor}30`
                    }}
                  >
                    <IconComponent 
                      className="w-8 h-8 transition-all duration-300" 
                      style={{ color: selectedColor }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-base transition-colors">
                      {folderName || '새 폴더'}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="capitalize">{selectedCategory}</span> 카테고리 · {selectedIconInfo?.label || selectedIcon} 아이콘
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: selectedColor }}
                      />
                      {selectedColor}
                    </div>
                  </div>
                </div>
                
                {/* 배경 데코레이션 */}
                <div className="absolute top-2 right-2 opacity-10">
                  <IconComponent 
                    className="w-12 h-12" 
                    style={{ color: selectedColor }}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              취소
            </Button>
            <Button 
              onClick={handleUpdateFolder}
              disabled={isLoading || !folderName.trim()}
              className={cn(
                "flex-1 sm:flex-none min-w-32 gap-2",
                folderName.trim() ? "bg-primary hover:bg-primary/90" : ""
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  수정 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  폴더 수정
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 아이콘 선택 다이얼로그 */}
      <FolderIconDialog
        open={isIconDialogOpen}
        onOpenChange={setIsIconDialogOpen}
        selectedIcon={selectedIcon}
        onIconSelect={handleIconSelect}
      />
    </>
  );
} 