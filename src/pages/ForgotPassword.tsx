import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("이메일을 입력해주세요");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Simulate API call with 500ms delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, this would call a password reset API
      // For MVP, we'll just simulate success
      setIsSubmitted(true);
      toast.success("비밀번호 재설정 링크가 이메일로 전송되었습니다");
    } catch (error) {
      console.error("Password reset failed:", error);
      toast.error("비밀번호 재설정 요청에 실패했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen py-2">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-linkbox-purple to-linkbox-blue text-transparent bg-clip-text">
              linku.me
            </h1>
            <p className="text-sm text-muted-foreground">
              이메일을 확인해주세요
            </p>
          </div>

          <div className="grid gap-6">
            <div className="flex flex-col text-center space-y-4">
              <p>
                {email} 주소로 비밀번호 재설정 링크를 보냈습니다. 이메일을 확인하고 링크를 클릭하여 비밀번호를 재설정해주세요.
              </p>
              <p className="text-sm text-muted-foreground">
                이메일을 받지 못하셨나요?{" "}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  다시 시도
                </button>
              </p>
            </div>
            <div className="text-center">
              <Link to="/login" className="text-primary underline-offset-4 hover:underline">
                로그인 페이지로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-2">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-linkbox-purple to-linkbox-blue text-transparent bg-clip-text">
            linku.me
          </h1>
          <p className="text-sm text-muted-foreground">
            비밀번호 재설정
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
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "처리 중..." : "비밀번호 재설정 링크 보내기"}
              </Button>
              
              <p className="text-center text-sm text-muted-foreground">
                로그인 페이지로{" "}
                <Link 
                  to="/login"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  돌아가기
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
