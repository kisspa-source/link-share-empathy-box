
import { useState } from "react";
import { useBookmarks } from "@/contexts/BookmarkContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "lucide-react";

interface AddBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddBookmarkDialog({ open, onOpenChange }: AddBookmarkDialogProps) {
  const { folders, addBookmark, isLoading } = useBookmarks();
  const [url, setUrl] = useState("");
  const [memo, setMemo] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);

  const handleSubmit = async () => {
    if (!url.trim()) return;
    
    setIsAdding(true);
    try {
      await addBookmark(url, memo, folderId || undefined);
      setUrl("");
      setMemo("");
      setFolderId("");
      onOpenChange(false);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 북마크 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Link className="h-5 w-5 shrink-0 text-muted-foreground" />
            <Input
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isAdding}
            />
          </div>
          
          <div>
            <Select
              value={folderId}
              onValueChange={(value) => setFolderId(value)}
              disabled={isAdding}
            >
              <SelectTrigger>
                <SelectValue placeholder="폴더 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Textarea
              placeholder="메모 (선택사항)"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="min-h-[80px]"
              disabled={isAdding}
            />
          </div>
          
          <div className="text-sm text-muted-foreground">
            추가하면 AI가 자동으로 태그와 카테고리를 생성합니다.
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAdding}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!url.trim() || isAdding || isLoading}>
            {isAdding ? "저장 중..." : "저장"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
