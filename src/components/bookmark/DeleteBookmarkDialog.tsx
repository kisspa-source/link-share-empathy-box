import { useState } from "react";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { Bookmark } from "@/types/bookmark";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface DeleteBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmark: Bookmark | null;
}

export default function DeleteBookmarkDialog({ open, onOpenChange, bookmark }: DeleteBookmarkDialogProps) {
  const { deleteBookmark } = useBookmarks();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!bookmark) return;
    
    setIsDeleting(true);
    try {
      await deleteBookmark(bookmark.id);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <DialogTitle>북마크 삭제</DialogTitle>
          </div>
          <DialogDescription>
            이 북마크를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
          </DialogDescription>
        </DialogHeader>
        
        {bookmark && (
          <div className="py-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium truncate">{bookmark.title}</div>
              <div className="text-xs text-muted-foreground truncate">{bookmark.url}</div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            취소
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting}
          >
            {isDeleting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                삭제 중...
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