import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface TagAutocompleteProps {
  tags: string[];
  allTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function TagAutocomplete({
  tags,
  allTags,
  onTagsChange,
  placeholder = "태그 입력 후 Enter 또는 콤마(,)",
  disabled = false,
  className
}: TagAutocompleteProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 입력값과 일치하는 태그들 필터링 (이미 추가된 태그는 제외)
  const filteredTags = allTags.filter(tag => 
    tag.toLowerCase().includes(inputValue.toLowerCase()) && 
    !tags.includes(tag) &&
    inputValue.trim() !== ""
  ).slice(0, 10); // 최대 10개까지만 표시

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // 키보드 이벤트 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isComposing) return;

    switch (e.key) {
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && filteredTags[highlightedIndex]) {
          addTag(filteredTags[highlightedIndex]);
        } else if (inputValue.trim()) {
          addTag(inputValue.trim());
        }
        break;
      case ",":
        e.preventDefault();
        if (inputValue.trim()) {
          addTag(inputValue.trim());
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (filteredTags.length > 0) {
          setHighlightedIndex(prev => 
            prev < filteredTags.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (filteredTags.length > 0) {
          setHighlightedIndex(prev => 
            prev > 0 ? prev - 1 : filteredTags.length - 1
          );
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const addTag = (tagToAdd: string) => {
    const trimmedTag = tagToAdd.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onTagsChange([...tags, trimmedTag]);
    }
    setInputValue("");
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove: string) => {
    onTagsChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsOpen(value.trim().length > 0);
    setHighlightedIndex(-1);
  };

  const handleTagClick = (tag: string) => {
    addTag(tag);
  };

  return (
    <div className={cn("space-y-2", className)} ref={containerRef}>
      {/* 선택된 태그들 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Badge key={tag} variant="secondary" className="text-sm px-2 py-1">
              #{tag}
              <button
                type="button"
                className="ml-1 text-muted-foreground hover:text-red-500 transition-colors"
                onClick={() => removeTag(tag)}
                disabled={disabled}
                tabIndex={-1}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* 입력 필드와 자동완성 */}
      <div className="relative">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onFocus={() => {
              if (inputValue.trim().length > 0) {
                setIsOpen(true);
              }
            }}
            disabled={disabled}
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => {
              if (inputValue.trim()) {
                addTag(inputValue.trim());
              }
            }}
            disabled={!inputValue.trim() || disabled}
            className="px-3"
          >
            추가
          </Button>
        </div>

        {/* 자동완성 드롭다운 */}
        {isOpen && filteredTags.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-md max-h-48 overflow-y-auto">
            {filteredTags.map((tag, index) => (
              <button
                key={tag}
                type="button"
                className={cn(
                  "w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors",
                  index === highlightedIndex && "bg-accent"
                )}
                onClick={() => handleTagClick(tag)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="text-muted-foreground">#</span>{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 도움말 텍스트 */}
      <div className="text-xs text-muted-foreground">
        Enter, 콤마(,) 또는 추가 버튼을 눌러 태그를 추가하세요. 
        {allTags.length > 0 && " 기존 태그 목록에서 자동완성됩니다."}
      </div>
    </div>
  );
} 