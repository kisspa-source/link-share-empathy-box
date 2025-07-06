import { useState, useEffect } from "react";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { Bookmark } from "@/types/bookmark";
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
import TagAutocomplete from "./TagAutocomplete";

interface EditBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmark: Bookmark | null;
}

export default function EditBookmarkDialog({ open, onOpenChange, bookmark }: EditBookmarkDialogProps) {
  const { folders, updateBookmark, isLoading, allTags } = useBookmarks();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  // 북마크 데이터로 폼 초기화
  useEffect(() => {
    if (bookmark) {
      setTitle(bookmark.title || "");
      setDescription(bookmark.description || "");
      setFolderId(bookmark.folder_id || "__no_folder__");
      setTags(Array.isArray(bookmark.tags) ? bookmark.tags : []);
    }
  }, [bookmark]);

  // 다이얼로그가 닫힐 때 폼 초기화
  useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setFolderId("__no_folder__");
      setTags([]);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!bookmark) return;
    
    setIsUpdating(true);
    try {
      await updateBookmark(bookmark.id, {
        title,
        description,
        tags,
        folder_id: folderId === "__no_folder__" ? undefined : folderId
      });
      onOpenChange(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>북마크 수정</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Link className="h-5 w-5 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm text-muted-foreground mb-1">URL</div>
              <div className="text-sm truncate p-2 bg-muted rounded border">
                {bookmark?.url}
              </div>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">제목</label>
            <Input
              placeholder="북마크 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isUpdating}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">폴더</label>
            <Select
              value={folderId}
              onValueChange={(value) => setFolderId(value)}
              disabled={isUpdating}
            >
              <SelectTrigger>
                <SelectValue placeholder="폴더 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__no_folder__">폴더 없음</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">설명/메모</label>
            <Textarea
              placeholder="북마크 설명이나 개인 메모를 입력하세요"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
              disabled={isUpdating}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">태그</label>
            <TagAutocomplete 
              tags={tags}
              allTags={allTags}
              onTagsChange={setTags}
              disabled={isUpdating}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isUpdating}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isUpdating || isLoading}>
            {isUpdating ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                수정 중...
              </div>
            ) : (
              "수정 완료"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 