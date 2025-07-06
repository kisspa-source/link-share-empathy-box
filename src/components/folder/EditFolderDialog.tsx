import { useState, useEffect } from 'react';
import { Folder, Save, X } from 'lucide-react';
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
import { toast } from 'sonner';
import { FolderIconDialog } from './FolderIconDialog';
import { ColorPicker } from './ColorPicker';
import { getIconByName } from '@/lib/icons';
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
  
  const { updateFolder } = useBookmarks();
  const { user } = useAuth();

  // 폴더 정보가 변경되면 상태 업데이트
  useEffect(() => {
    setFolderName(folder.name);
    setSelectedIcon(folder.icon_name || 'folder');
    setSelectedColor(folder.icon_color || '#3B82F6');
    setSelectedCategory(folder.icon_category || 'default');
  }, [folder]);

  const resetForm = () => {
    setFolderName(folder.name);
    setSelectedIcon(folder.icon_name || 'folder');
    setSelectedColor(folder.icon_color || '#3B82F6');
    setSelectedCategory(folder.icon_category || 'default');
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
      selectedCategory !== (folder.icon_category || 'default');

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
        icon_category: selectedCategory
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
  const selectedIconInfo = getIconByName(selectedIcon);
  const IconComponent = selectedIconInfo?.icon || Folder;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconComponent 
                className="w-5 h-5" 
                style={{ color: folder.icon_color || '#3B82F6' }}
              />
              폴더 편집
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* 폴더 이름 입력 */}
            <div className="space-y-2">
              <Label htmlFor="folder-name">폴더 이름</Label>
              <Input
                id="folder-name"
                placeholder="폴더 이름을 입력하세요"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleUpdateFolder();
                  }
                }}
                autoFocus
              />
            </div>

            <Separator />
            
            {/* 아이콘 선택 */}
            <div className="space-y-3">
              <Label>아이콘 선택</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full h-16 flex flex-col gap-2"
                onClick={() => setIsIconDialogOpen(true)}
              >
                <IconComponent 
                  className="w-6 h-6" 
                  style={{ color: selectedColor }}
                />
                <span className="text-sm">{selectedIcon}</span>
              </Button>
            </div>

            <Separator />
            
            {/* 색상 선택 */}
            <ColorPicker
              selectedColor={selectedColor}
              onColorSelect={setSelectedColor}
            />

            <Separator />
            
            {/* 미리보기 */}
            <div className="space-y-3">
              <Label>미리보기</Label>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <div 
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${selectedColor}20` }}
                >
                  <IconComponent 
                    className="w-6 h-6" 
                    style={{ color: selectedColor }}
                  />
                </div>
                <div>
                  <div className="font-medium">
                    {folderName || '새 폴더'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedCategory} · {selectedIcon}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              <X className="w-4 h-4 mr-2" />
              취소
            </Button>
            <Button 
              onClick={handleUpdateFolder}
              disabled={isLoading || !folderName.trim()}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  수정 중...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
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