import { useState, useEffect } from "react";
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
import { Link, Folder, ChevronRight } from "lucide-react";
import TagAutocomplete from "./TagAutocomplete";
import { getSafeIconByName } from "@/lib/icons";

interface AddBookmarkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFolderId?: string; // 기본 폴더 ID 추가
}

export default function AddBookmarkDialog({ open, onOpenChange, defaultFolderId }: AddBookmarkDialogProps) {
  const { folders, addBookmark, isLoading, allTags, getFlatFolderList } = useBookmarks();
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [folderId, setFolderId] = useState<string>("__no_folder__");
  const [isAdding, setIsAdding] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  // 🔥 BUG FIX: 다이얼로그가 열릴 때만 기본 폴더 설정 (사용자 선택 덮어쓰기 방지)
  useEffect(() => {
    if (open) {
      // 다이얼로그가 열릴 때만 기본 폴더 설정
      if (defaultFolderId) {
        setFolderId(defaultFolderId);
      } else {
        setFolderId("__no_folder__");
      }
    }
  }, [open, defaultFolderId]);

  const handleSubmit = async () => {
    if (!url.trim()) return;
    
    setIsAdding(true);
    try {
      await addBookmark(url, description, folderId === "__no_folder__" ? undefined : folderId, tags);
      
      // 성공 후 폼 초기화
      setUrl("");
      setDescription("");
      setFolderId("__no_folder__");
      setTags([]);
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
            <label className="text-sm font-medium mb-2 block">폴더 선택</label>
            <Select
              value={folderId}
              onValueChange={(value) => setFolderId(value)}
              disabled={isAdding}
            >
              <SelectTrigger>
                <SelectValue placeholder="폴더 선택 (선택사항)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__no_folder__">
                  <div className="flex items-center">
                    <Folder className="h-4 w-4 mr-2 text-muted-foreground" />
                    폴더 없음
                  </div>
                </SelectItem>
                {getFlatFolderList().map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center">
                      <div style={{ marginLeft: `${(folder.depth || 0) * 16}px` }}>
                        {folder.depth && folder.depth > 0 && (
                          <ChevronRight className="h-3 w-3 text-muted-foreground inline mr-1" />
                        )}
                        {(() => {
                          const folderIconInfo = getSafeIconByName(folder.icon_name || 'folder');
                          const FolderIconComponent = folderIconInfo?.icon || Folder;
                          return (
                            <FolderIconComponent 
                              className="h-4 w-4 mr-2 inline" 
                              style={{ color: folder.icon_color || '#3B82F6' }}
                            />
                          );
                        })()}
                        <span>{folder.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({folder.bookmarkCount}개)
                        </span>
                      </div>
                    </div>
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
          
          <div>
            <TagAutocomplete 
              tags={tags}
              allTags={allTags}
              onTagsChange={setTags}
              disabled={isAdding}
            />
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
              "저장"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
