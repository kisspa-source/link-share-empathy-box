import { useState } from "react";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function CollectionCreate() {
  const { bookmarks, refreshData } = useBookmarks();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleToggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || selected.length === 0) {
      toast.error("제목과 북마크를 선택해주세요.");
      return;
    }
    if (!user?.id) {
      toast.error("로그인 정보가 없습니다. 다시 로그인 해주세요.");
      return;
    }
    setIsSubmitting(true);
    try {
      // 1. 컬렉션 생성
      const { data: collection, error } = await supabase
        .from("collections")
        .insert({ name, description, user_id: user.id, is_public: false })
        .select()
        .single();
      if (error) throw error;

      // 2. collection_bookmarks 연결
      const rows = selected.map(bookmark_id => ({
        collection_id: collection.id,
        bookmark_id,
      }));
      const { error: linkError } = await supabase
        .from("collection_bookmarks")
        .insert(rows);
      if (linkError) throw linkError;

      toast.success("컬렉션이 생성되었습니다!");
      refreshData && refreshData();
      navigate(`/collections/${collection.id}`);
    } catch (err: any) {
      toast.error(err.message || "컬렉션 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">새 컬렉션 만들기</h1>
      <div>
        <label className="block mb-1 font-medium">제목</label>
        <Input value={name} onChange={e => setName(e.target.value)} required />
      </div>
      <div>
        <label className="block mb-1 font-medium">설명</label>
        <Textarea value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <label className="block mb-2 font-medium">북마크 선택</label>
        <div className="max-h-64 overflow-y-auto border rounded p-2 space-y-2">
          {bookmarks.length === 0 && <div>북마크가 없습니다.</div>}
          {bookmarks.map(b => (
            <label key={b.id} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(b.id)}
                onChange={() => handleToggle(b.id)}
                className="accent-blue-500"
              />
              <span className="truncate">{b.title || b.url}</span>
            </label>
          ))}
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "생성 중..." : "컬렉션 생성"}
      </Button>
    </form>
  );
} 