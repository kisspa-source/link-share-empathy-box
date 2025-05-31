import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = "회원가입 | linku.me";
    
    // Redirect if already logged in
    if (isAuthenticated) {
      navigate("/");
    }

    // 북마크 실시간 구독은 로그인한 사용자에게만 적용
    if (user) {
      const subscription = supabase
        .channel('bookmarks')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'bookmarks',
            filter: `user_id=eq.${user.id}`
          }, 
          (payload) => {
            console.log('Change received!', payload)
          }
        )
        .subscribe()

      // Cleanup subscription on unmount
      return () => {
        subscription.unsubscribe()
      }
    }
  }, [isAuthenticated, navigate, user]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("회원가입 시도:", { email, nickname, password });

    // 입력값 검증
    if (!email.trim() || !password.trim() || !nickname.trim()) {
      toast.error("모든 필드를 입력해주세요");
      return;
    }
    
    if (password !== passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다");
      return;
    }
    
    if (password.length < 8) {
      toast.error("비밀번호는 8자 이상이어야 합니다");
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("올바른 이메일 형식이 아닙니다");
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log("회원가입 요청 중...");
      
      // 이메일 중복 확인
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email)
        .single();

      if (existingUser) {
        toast.error("이미 사용 중인 이메일입니다");
        return;
      }
      console.log("이메일 중복 확인 완료");
      // 닉네임 중복 확인
      const { data: existingNickname, error: nicknameError } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('nickname', nickname)
        .single();

      if (existingNickname) {
        toast.error("이미 사용 중인 닉네임입니다");
        return;
      }
      console.log("닉네임 중복 확인 완료");
      // 회원가입 시도
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname
          }
        }
      });
      console.log("회원가입 시도 완료");
      if (signupError) {
        console.error("회원가입 에러:", signupError);
        throw signupError;
      }
      console.log("회원가입 에러 처리 완료");
      if (!data.user) {
        console.error("사용자 생성 실패");
        throw new Error('사용자 생성에 실패했습니다');
      }
      console.log("사용자 생성 완료");
      // 프로필 생성
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email: email,
          nickname: nickname,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`
        });
      console.log("프로필 생성 완료");
      if (profileError) {
        console.error("프로필 생성 에러:", profileError);
        // 프로필 생성 실패 시 사용자 삭제
        await supabase.auth.admin.deleteUser(data.user.id);
        throw profileError;
      }

      console.log("회원가입 및 프로필 생성 성공");
      toast.success("회원가입이 완료되었습니다!");
      navigate("/login");
    } catch (error: any) {
      console.error('회원가입 실패:', error);
      
      // 구체적인 에러 메시지 표시
      if (error.message.includes('User already registered')) {
        toast.error("이미 등록된 이메일입니다");
      } else if (error.message.includes('Password should be at least')) {
        toast.error("비밀번호는 8자 이상이어야 합니다");
      } else if (error.message.includes('Invalid email')) {
        toast.error("올바른 이메일 형식이 아닙니다");
      } else {
        toast.error("회원가입에 실패했습니다. 다시 시도해주세요");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-2">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-linkbox-purple to-linkbox-blue text-transparent bg-clip-text">
            linku.me
          </h1>
          <p className="text-sm text-muted-foreground">
            회원가입하여 북마크를 저장하고 공유하세요
          </p>
        </div>

        <div className="grid gap-6">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  placeholder="example@example.com"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="nickname">닉네임</Label>
                <Input
                  id="nickname"
                  placeholder="닉네임"
                  type="text"
                  autoComplete="nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
                <Input
                  id="passwordConfirm"
                  placeholder="••••••••"
                  type="password"
                  autoComplete="new-password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  disabled={isSubmitting}
                  required
                />
              </div>
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "가입 중..." : "가입하기"}
              </Button>
              
              <p className="text-center text-sm text-muted-foreground">
                이미 계정이 있으신가요?{" "}
                <Link 
                  to="/login"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  로그인
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
