import { useState } from 'react';
import { Folder, Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

interface CreateFolderDialogProps {
  trigger?: React.ReactNode;
  className?: string;
}

export function CreateFolderDialog({ trigger, className }: CreateFolderDialogProps) {
  const [open, setOpen] = useState(false);
  const [isIconDialogOpen, setIsIconDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 폴더 정보 상태
  const [folderName, setFolderName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [selectedCategory, setSelectedCategory] = useState('default');
  
  const { addFolder } = useBookmarks();
  const { user } = useAuth();

  const resetForm = () => {
    setFolderName('');
    setSelectedIcon('folder');
    setSelectedColor('#3B82F6');
    setSelectedCategory('default');
  };

  const handleIconSelect = (iconName: string, iconCategory: string) => {
    setSelectedIcon(iconName);
    setSelectedCategory(iconCategory);
  };

  const handleCreateFolder = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (!folderName.trim()) {
      toast.error('폴더 이름을 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await addFolder(folderName.trim(), selectedIcon, selectedColor, selectedCategory);
      
      toast.success(`"${folderName}" 폴더가 생성되었습니다.`);
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('폴더 생성 오류:', error);
      toast.error('폴더 생성 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
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
        <DialogTrigger asChild>
          {trigger || (
            <Button className={className}>
              <Plus className="w-4 h-4 mr-2" />
              새 폴더
            </Button>
          )}
        </DialogTrigger>
        
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>새 폴더 만들기</DialogTitle>
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
                    handleCreateFolder();
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
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              취소
            </Button>
            <Button 
              onClick={handleCreateFolder}
              disabled={isLoading || !folderName.trim()}
            >
              {isLoading ? '생성 중...' : '폴더 만들기'}
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