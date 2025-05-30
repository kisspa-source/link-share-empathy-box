import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    document.title = "회원가입 | linku.me";
    
    // Redirect if already logged in
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    setIsSubmitting(true);
    try {
      await signup(email, password, nickname);
      toast.success("회원가입 성공!");
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error("회원가입에 실패했습니다");
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
