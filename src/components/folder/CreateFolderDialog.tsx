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
import { getSafeIconByName } from '@/lib/icons';
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
  const selectedIconInfo = getSafeIconByName(selectedIcon);
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
                <div className="text-lg font-semibold">새 폴더 만들기</div>
                <div className="text-sm text-muted-foreground font-normal">
                  폴더를 사용해 북마크를 정리하세요
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
                    handleCreateFolder();
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
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              취소
            </Button>
            <Button 
              onClick={handleCreateFolder}
              disabled={isLoading || !folderName.trim()}
              className={cn(
                "flex-1 sm:flex-none min-w-32 gap-2",
                folderName.trim() ? "bg-primary hover:bg-primary/90" : ""
              )}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  생성 중...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  폴더 만들기
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