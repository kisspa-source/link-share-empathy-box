import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { FcGoogle } from "react-icons/fc";
import { SiKakaotalk } from "react-icons/si";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<"google" | "github" | "kakao" | null>(null);
  const { 
    login, 
    signInWithGoogle, 
    signInWithGitHub, 
    signInWithKakao, 
    isAuthenticated, 
    isLoading: isAuthLoading 
  } = useAuth();
  
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";
  
  // 이미 로그인된 상태인지 확인하고 리다이렉트
  useEffect(() => {
    document.title = "로그인 | linku.me";
    
    // 인증 상태가 로딩 중이면 아무것도 하지 않음
    if (isAuthLoading) return;
    
    // 인증된 사용자인 경우 리다이렉트
    if (isAuthenticated) {
      console.log('로그인 페이지 - 이미 인증된 사용자입니다. 리다이렉트 중...', { from });
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isAuthLoading, navigate, from]);
  
  // 인증 로딩 중이면 로딩 스피너 표시
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  const handleSocialSignIn = async (provider: "google" | "github" | "kakao") => {
    try {
      setIsSocialLoading(provider);
      const signInFunction = 
        provider === "google" ? signInWithGoogle :
        provider === "github" ? signInWithGitHub : signInWithKakao;
      
      await signInFunction(() => {
        const from = location.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      });
    } catch (error: any) {
      console.error(`${provider} 로그인 실패:`, error);
      toast.error(error.message || `${provider} 로그인에 실패했습니다.`);
    } finally {
      setIsSocialLoading(null);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      toast.error("이메일과 비밀번호를 입력해주세요");
      return;
    }
    
    setIsSubmitting(true);
    console.log('로그인 시도:', email);
    
    try {
      // 로그인 시도 (리다이렉트는 onAuthStateChange에서 처리)
      await login(email, password);
      
      // 로그인 성공 시 토스트 메시지만 표시
      // 실제 리다이렉트는 onAuthStateChange에서 isAuthenticated가 변경될 때 처리됨
      toast.success("로그인 성공!");
      console.log('로그인 성공 - 리다이렉트 대기 중...');
      
      // 2초 후에도 리다이렉트가 안 되면 강제로 홈으로 이동
      const redirectTimer = setTimeout(() => {
        if (isAuthenticated) {
          console.log('자동 리다이렉트 실행');
          const from = location.state?.from?.pathname || "/";
          navigate(from, { replace: true });
        }
      }, 2000);
      
      return () => clearTimeout(redirectTimer);
      
    } catch (error: any) {
      console.error("로그인 오류:", error);
      
      // 오류 메시지에 따라 다른 피드백 제공
      if (error.message?.includes("Invalid login credentials")) {
        toast.error("이메일 또는 비밀번호가 올바르지 않습니다.");
      } else if (error.message?.includes("Email not confirmed")) {
        toast.error("이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.");
      } else if (error.message) {
        toast.error(`로그인 실패: ${error.message}`);
      } else {
        toast.error("로그인 중 문제가 발생했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            로그인
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            계정이 없으신가요?{" "}
            <Link
              to="/signup"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              회원가입
            </Link>
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div>
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => handleSocialSignIn("google")}
              disabled={!!isSocialLoading}
            >
              {isSocialLoading === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FcGoogle className="h-5 w-5" />
              )}
              <span className="sr-only">Google</span>
            </Button>
          </div>

          <div>
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => handleSocialSignIn("github")}
              disabled={!!isSocialLoading}
            >
              {isSocialLoading === "github" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <GitHubLogoIcon className="h-5 w-5" />
              )}
              <span className="sr-only">GitHub</span>
            </Button>
          </div>

          <div>
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 bg-[#FEE500] text-black hover:bg-[#FEE500]/90 hover:text-black"
              onClick={() => handleSocialSignIn("kakao")}
              disabled={!!isSocialLoading}
            >
              {isSocialLoading === "kakao" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SiKakaotalk className="h-5 w-5" />
              )}
              <span className="sr-only">Kakao</span>
            </Button>
          </div>
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">또는</span>
            </div>
          </div>
        </div>

        <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">비밀번호</Label>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                disabled={isSubmitting}
              />
            </div>
            <Link 
                  to="/forgot-password" 
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  비밀번호 찾기
                </Link>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                "이메일로 로그인"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
