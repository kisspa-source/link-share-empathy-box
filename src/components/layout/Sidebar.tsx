
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useBookmarks } from "@/contexts/BookmarkContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  FolderOpen, 
  Tag, 
  Share2, 
  Plus,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { 
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Sidebar() {
  const { folders, addFolder } = useBookmarks();
  const location = useLocation();
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [foldersExpanded, setFoldersExpanded] = useState(true);
  
  // Function to determine if a link is active
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  // Responsive sidebar state
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      if (isMobileView && isOpen) {
        setIsOpen(false);
      } else if (!isMobileView && !isOpen) {
        setIsOpen(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName("");
      setIsCreateFolderOpen(false);
    } else {
      toast.error("폴더 이름을 입력해주세요");
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-30 md:hidden">
        <Button 
          size="icon" 
          variant="default" 
          className="rounded-full shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <FolderOpen className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <aside className={cn(
        "sidebar fixed inset-y-0 left-0 z-30 w-64 transform bg-background border-r transition-all duration-300",
        "flex flex-col h-screen pt-14",
        isMobile ? "w-full" : "hidden md:flex"
      )}>
        <div className="flex-1 overflow-auto py-3 px-3">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                isActive("/") && "bg-accent text-accent-foreground"
              )}
              asChild
            >
              <Link to="/">
                <Heart className="mr-2 h-5 w-5" />
                모든 북마크
              </Link>
            </Button>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between py-1 px-3">
              <button 
                onClick={() => setFoldersExpanded(!foldersExpanded)}
                className="flex items-center text-sm font-medium"
              >
                {foldersExpanded ? (
                  <ChevronDown className="h-4 w-4 mr-1" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1" />
                )}
                <span>폴더</span>
              </button>
              <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>새 폴더 만들기</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <Input
                      placeholder="폴더 이름"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCreateFolder();
                        }
                      }}
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={handleCreateFolder}>생성</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {foldersExpanded && (
              <div className="mt-1 space-y-1 px-1">
                {folders.map((folder) => (
                  <Button
                    key={folder.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start",
                      isActive(`/folder/${folder.id}`) && "bg-accent text-accent-foreground"
                    )}
                    asChild
                  >
                    <Link to={`/folder/${folder.id}`}>
                      <FolderOpen className="mr-2 h-4 w-4" />
                      <span className="flex-1 text-left truncate">{folder.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{folder.bookmarkCount}</span>
                    </Link>
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-2">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                isActive("/tags") && "bg-accent text-accent-foreground"
              )}
              asChild
            >
              <Link to="/tags">
                <Tag className="mr-2 h-5 w-5" />
                태그
              </Link>
            </Button>
            
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start",
                isActive("/collections") && "bg-accent text-accent-foreground"
              )}
              asChild
            >
              <Link to="/collections">
                <Share2 className="mr-2 h-5 w-5" />
                컬렉션
              </Link>
            </Button>
          </div>
        </div>
        
        {isMobile && (
          <div className="border-t p-3">
            <Button variant="outline" className="w-full" onClick={() => setIsOpen(false)}>
              닫기
            </Button>
          </div>
        )}
      </aside>
      
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
