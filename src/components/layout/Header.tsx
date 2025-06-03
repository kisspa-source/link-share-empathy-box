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
import { Search, Plus, Moon, Sun, User, LogOut } from 'lucide-react';
import AddBookmarkDialog from '@/components/bookmark/AddBookmarkDialog';

export default function Header() {
  const { user, logout, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isAddBookmarkOpen, setIsAddBookmarkOpen] = useState(false);
  const navigate = useNavigate();
  
  // 로그아웃 핸들러 - 디버그 로그 추가 및 개선
  const handleLogout = async () => {
    console.log('헤더에서 로그아웃 시도 - 디버그 버전');
    
    try {
      // 1. 상태 초기화 먼저 실행
      setIsAddBookmarkOpen(false); // 다이얼로그 닫기
      
      // 2. Supabase 로그아웃 API 호출 전 상태 확인
      const session = await supabase.auth.getSession();
      console.log('로그아웃 전 세션 상태:', session);
      
      // 3. Supabase 로그아웃 API 호출
      console.log('Supabase signOut API 호출 시작...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('로그아웃 API 오류:', error);
        return;
      }
      
      // 4. 로그아웃 후 세션 확인
      const afterSession = await supabase.auth.getSession();
      console.log('로그아웃 후 세션 상태:', afterSession);
      
      // 5. 상태 강제 초기화
      console.log('상태 강제 초기화 및 홈페이지로 리다이렉트');
      
      // 6. 직접 새로고침 방식으로 홈페이지로 이동
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
      
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
      alert('로그아웃 처리 중 오류가 발생했습니다. 페이지를 새로고침해 주세요.');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4">
        <Link to="/" className="mr-4 flex items-center space-x-2">
          <div className="flex flex-col items-start">
            <span className="hidden sm:flex text-xl font-bold tracking-tight bg-gradient-to-r from-linkbox-purple to-linkbox-blue text-transparent bg-clip-text">
              linku.me
            </span>
            <span className="sm:hidden text-xl font-bold tracking-tight bg-gradient-to-r from-linkbox-purple to-linkbox-blue text-transparent bg-clip-text">
              LP
            </span>
          </div>
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
                      onClick={(e) => {
                        e.preventDefault();
                        console.log('로그아웃 버튼 클릭됨');
                        // 로컬 스토리지 및 쿠키 초기화
                        localStorage.removeItem('supabase.auth.token');
                        // 페이지 새로고침
                        window.location.href = '/';
                      }}
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
