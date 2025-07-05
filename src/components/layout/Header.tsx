import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Plus, Moon, Sun, User, LogOut, Heart, Bookmark, Menu } from 'lucide-react';
import AddBookmarkDialog from '@/components/bookmark/AddBookmarkDialog';

interface HeaderProps {
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export default function Header({ isMobileMenuOpen, setIsMobileMenuOpen }: HeaderProps) {
  const { user, logout, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);
  const navigate = useNavigate();
  
  // 간단한 로그아웃 핸들러
  const handleLogout = async () => {
    setIsAddBookmarkOpen(false);
    try {
      await logout(() => navigate('/'));
    } catch (e) {
      console.error('로그아웃 처리 중 오류:', e);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        {/* 모바일 사이드바 토글 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          className="mr-2 md:hidden"
          onClick={() => setIsMobileMenuOpen && setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <Link to="/" className="mr-4 flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-linkbox-blue to-purple-600 rounded-lg flex items-center justify-center">
            <Bookmark className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg">
            linku.me
          </span>
        </Link>
        
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="outline" size="icon" className="mr-2" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {user ? (
            <>
              <Button 
                variant="ghost" 
                size="icon"
                className="mr-2"
                asChild
              >
                <Link to="/search">
                  <Search className="h-5 w-5" />
                </Link>
              </Button>

              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setIsAddBookmarkOpen(true)}
                className="mr-2 hidden sm:flex"
              >
                <Plus className="h-4 w-4 mr-2" />
                북마크 추가
              </Button>
              
              <Button 
                variant="default" 
                size="icon" 
                onClick={() => setIsAddBookmarkOpen(true)}
                className="mr-2 sm:hidden"
              >
                <Plus className="h-5 w-5" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer">
                    <AvatarImage src={user.avatarUrl} alt={user.nickname} />
                    <AvatarFallback>{user.nickname[0]}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.nickname}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="w-full cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>프로필</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={`/u/${user.id}`} className="w-full cursor-pointer">
                      <span>내 linku.me 페이지</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center text-red-500 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>로그아웃</span>
                    </button>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="outline" asChild>
                <Link to="/login">로그인</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">회원가입</Link>
              </Button>
            </>
          )}
        </div>
      </div>
      <AddBookmarkDialog open={isAddBookmarkOpen} onOpenChange={setIsAddBookmarkOpen} />
    </header>
  );
}
