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
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isComposing, setIsComposing] = useState(false);

  const addTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput("");
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing) return;
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    if (!url.trim()) return;
    
    setIsAdding(true);
    try {
      await addBookmark(url, description, folderId || undefined, tags);
      setUrl("");
      setDescription("");
      setFolderId("");
      setTags([]);
      setTagInput("");
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
              placeholder="설명 (선택사항)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
              disabled={isAdding}
            />
          </div>
          
          <div className="text-sm text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="font-medium">빠른 저장</span>
            </div>
            <p className="mt-1 text-xs">
              북마크가 즉시 저장됩니다. 메타데이터는 백그라운드에서 자동으로 업데이트됩니다.
            </p>
          </div>
          
          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center px-2 py-1 bg-accent rounded text-sm">
                  #{tag}
                  <button
                    type="button"
                    className="ml-1 text-muted-foreground hover:text-red-500"
                    onClick={() => removeTag(tag)}
                    tabIndex={-1}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="태그 입력 후 Enter 또는 콤마(,)"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                disabled={isAdding}
                className="flex-1"
              />
              <Button type="button" variant="secondary" onClick={addTag} disabled={!tagInput.trim() || isAdding}>
                추가
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-1">입력한 태그는 콤마(,)로 구분되어 저장됩니다.</div>
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
            {isAdding ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                저장 중...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                빠른 저장
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
