import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { GitHubLogoIcon } from "@radix-ui/react-icons";
import { FcGoogle } from "react-icons/fc";
import { SiKakaotalk } from "react-icons/si";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState<
    "google" | "github" | "kakao" | null
  >(null);
  const {
    signup,
    signInWithGoogle,
    signInWithGitHub,
    signInWithKakao,
    isAuthenticated,
    user,
  } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "회원가입 | linku.me";

    // Redirect if already logged in
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== passwordConfirm) {
      toast.error("비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      setIsSubmitting(true);
      await signup(email, password, nickname, () => {
        toast.success("회원가입이 완료되었습니다!");
        navigate("/", { replace: true });
      });
    } catch (error: any) {
      toast.error(error.message || "회원가입 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialSignIn = async (
    provider: "google" | "github" | "kakao",
  ) => {
    try {
      setIsSocialLoading(provider);
      const signInFunction =
        provider === "google"
          ? signInWithGoogle
          : provider === "github"
            ? signInWithGitHub
            : signInWithKakao;

      await signInFunction(() => {
        toast.success(
          `${
            provider === "kakao"
              ? "카카오"
              : provider === "github"
                ? "GitHub"
                : "Google"
          } 로그인 성공!`,
        );
        navigate("/", { replace: true });
      });
    } catch (error: any) {
      toast.error(
        error.message || `${provider} 로그인 중 오류가 발생했습니다.`,
      );
    } finally {
      setIsSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Simple Navigation */}
      <div className="container mx-auto px-4 py-4">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← linku.me로 돌아가기
        </Link>
      </div>
      
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
              회원가입
            </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{" "}
            <Link
              to="/login"
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              로그인
            </Link>
          </p>
        </div>

        {/* Social Login Buttons */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div>
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-white"
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
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-white"
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
              className="w-full flex items-center justify-center gap-2 bg-[#FEE500] text-black hover:bg-[#FEE500]/90 hover:text-black dark:bg-[#FEE500]"
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
              <span className="px-2 bg-white dark:bg-white text-gray-500">
                또는
              </span>
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
                className="mt-1 bg-white dark:bg-white"
              />
            </div>

            <div>
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                type="text"
                autoComplete="nickname"
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="mt-1 bg-white dark:bg-white"
              />
            </div>

            <div>
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 bg-white dark:bg-white"
              />
            </div>

            <div>
              <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
              <Input
                id="passwordConfirm"
                type="password"
                autoComplete="new-password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="mt-1 bg-white dark:bg-white"
              />
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                "회원가입"
              )}
            </Button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}
