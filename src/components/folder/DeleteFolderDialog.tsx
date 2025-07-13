import { useState } from "react";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { Folder as FolderType } from "@/types/bookmark";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Folder } from "lucide-react";
import { getSafeIconByName } from "@/lib/icons";

interface DeleteFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folder: FolderType | null;
}

export default function DeleteFolderDialog({ open, onOpenChange, folder }: DeleteFolderDialogProps) {
  const { deleteFolder } = useBookmarks();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!folder) return;
    
    setIsDeleting(true);
    try {
      await deleteFolder(folder.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!folder) return null;

  // 폴더 아이콘 가져오기
  const folderIconInfo = getSafeIconByName(folder.icon_name || 'folder');
  const FolderIconComponent = folderIconInfo?.icon || Folder;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full mx-4">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <DialogTitle className="text-left">폴더 삭제</DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {folder.bookmarkCount > 0 
              ? `폴더를 삭제하시겠습니까? 폴더 내 ${folder.bookmarkCount}개의 북마크는 "모든 북마크"로 이동됩니다.`
              : '폴더를 삭제하시겠습니까?'
            }
            {folder.children && folder.children.length > 0 && (
              <span className="block mt-1">
                하위 폴더가 있다면 최상위 폴더로 이동됩니다.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <div 
                className="p-2 rounded-lg flex-shrink-0"
                style={{ backgroundColor: `${folder.icon_color || '#3B82F6'}20` }}
              >
                <FolderIconComponent 
                  className="w-5 h-5" 
                  style={{ color: folder.icon_color || '#3B82F6' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium break-words mb-1" 
                     style={{ 
                       display: '-webkit-box', 
                       WebkitLineClamp: 2, 
                       WebkitBoxOrient: 'vertical', 
                       overflow: 'hidden' 
                     }}>
                  {folder.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {folder.bookmarkCount > 0 && (
                    <span className="mr-2">📚 {folder.bookmarkCount}개 북마크</span>
                  )}
                  {folder.children && folder.children.length > 0 && (
                    <span>📁 {folder.children.length}개 하위 폴더</span>
                  )}
                  {folder.bookmarkCount === 0 && (!folder.children || folder.children.length === 0) && (
                    <span>빈 폴더</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="min-w-[60px]"
          >
            취소
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting}
            className="min-w-[80px]"
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                <span className="whitespace-nowrap">삭제 중...</span>
              </div>
            ) : (
              "삭제"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 