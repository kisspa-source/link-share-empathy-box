import { useEffect, useState, useRef } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { profileApi, supabase, uploadAvatar } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Github, Mail, Globe } from "lucide-react";

// 로그인 제공자별 설정
const providerConfig = {
  email: {
    icon: Mail,
    label: "이메일로 로그인",
    color: "text-blue-500"
  },
  google: {
    icon: Globe,
    label: "Google 계정으로 로그인",
    color: "text-red-500"
  },
  github: {
    icon: Github,
    label: "GitHub 계정으로 로그인",
    color: "text-gray-700 dark:text-gray-300"
  },
  kakao: {
    icon: Globe,
    label: "카카오 계정으로 로그인",
    color: "text-yellow-500"
  }
} as const;

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const [nickname, setNickname] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);
  
  // 비밀번호 변경 관련 상태
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPwLoading, setIsPwLoading] = useState(false);
  
  // 프로필 로드 함수
  const loadProfile = async () => {
    if (!user || isLoading) return;
    
    // 마지막 로드 시간으로부터 1분이 지나지 않았다면 스킵
    const now = Date.now();
    if (now - lastLoadTime < 60000) {
      console.log('최근에 이미 프로필을 로드했습니다. 스킵합니다.');
      return;
    }
    
    setIsLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        setNickname(profile.nickname || user.nickname || "");
        setUser({
          ...user,
          nickname: profile.nickname || user.nickname,
          avatarUrl: profile.avatar_url || user.avatarUrl
        });
      } else {
        // 프로필이 없는 경우 user 객체의 nickname 사용
        setNickname(user.nickname || "");
      }
      setLastLoadTime(now);
    } catch (error) {
      console.error('프로필 로드 중 오류:', error);
      toast.error('프로필 정보를 불러오는데 실패했습니다.');
      // 에러 시에도 user 객체의 nickname 사용
      setNickname(user.nickname || "");
    } finally {
      setIsLoading(false);
    }
  };

  // user가 변경될 때마다 프로필 로드
  useEffect(() => {
    document.title = "프로필 | linku.me";
    if (user) {
      loadProfile();
    }
  }, [user]); // user를 의존성 배열에 추가

  // user 객체가 변경될 때 nickname 업데이트
  useEffect(() => {
    if (user) {
      setNickname(prev => prev || user.nickname || "");
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      // 1. profiles 테이블 업데이트
      const updated = await profileApi.update(user.id, { nickname });
      
      // 2. auth.updateUser로 사용자 메타데이터 업데이트
      await supabase.auth.updateUser({ 
        data: { 
          nickname,
          avatar_url: user.avatarUrl 
        } 
      });

      // 3. Context의 user 상태 업데이트
      setUser({ 
        ...user, 
        nickname: updated.nickname,
        avatarUrl: updated.avatar_url || user.avatarUrl
      });
      // 4. 마지막 로드 시간 업데이트
      setLastLoadTime(Date.now());

      toast.success("프로필이 업데이트되었습니다.");
    } catch (error) {
      console.error(error);
      toast.error("프로필 업데이트 중 오류가 발생했습니다.");
    }
  };

  const handleAvatarButton = () => {
    fileRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const url = await uploadAvatar(user.id, file);
      await profileApi.update(user.id, { avatar_url: url });
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      setUser({ ...user, avatarUrl: url });
      toast.success('프로필 이미지가 업데이트되었습니다.');
    } catch (error) {
      console.error(error);
      toast.error('이미지 업로드 중 오류가 발생했습니다.');
    }
  };
  
  // 비밀번호 변경 핸들러
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("모든 비밀번호 입력란을 채워주세요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("새 비밀번호는 6자리 이상이어야 합니다.");
      return;
    }
    setIsPwLoading(true);
    try {
      // 1. 현재 비밀번호로 재인증
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) {
        toast.error("현재 비밀번호가 올바르지 않습니다.");
        setIsPwLoading(false);
        return;
      }
      // 2. 비밀번호 변경
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        toast.error("비밀번호 변경 중 오류가 발생했습니다.");
        setIsPwLoading(false);
        return;
      }
      toast.success("비밀번호가 성공적으로 변경되었습니다.");
      // 입력값 초기화
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("비밀번호 변경 중 알 수 없는 오류가 발생했습니다.");
    } finally {
      setIsPwLoading(false);
    }
  };
  
  const handleDeleteAccount = () => {
    if (window.confirm("정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      toast.success("계정이 삭제되었습니다.");
      logout();
    }
  };

  // 수동 새로고침 핸들러 추가
  const handleRefresh = () => {
    loadProfile();
  };

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">프로필 관리</h1>
          <p className="text-muted-foreground">
            계정 정보를 관리하고 프로필을 업데이트하세요
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>프로필</CardTitle>
              <CardDescription>
                프로필 정보를 변경할 수 있습니다.
                {isLoading && " (로딩 중...)"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile}>
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage 
                        src={user.avatarUrl} 
                        alt={`${user.nickname}님의 프로필 이미지`} 
                      />
                      <AvatarFallback>
                        {user.nickname ? user.nickname[0].toUpperCase() : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Button type="button" variant="outline" onClick={handleAvatarButton}>
                        이미지 변경
                      </Button>
                      {/* 로그인 방식 표시 */}
                      {user.provider && (
                        <div className="flex items-center gap-1 mt-2">
                          {(() => {
                            const config = providerConfig[user.provider as keyof typeof providerConfig] || {
                              icon: Globe,
                              label: `${user.provider} 계정으로 로그인`,
                              color: "text-gray-500"
                            };
                            const Icon = config.icon;
                            return (
                              <>
                                <Icon className={`h-4 w-4 ${config.color}`} />
                                <span className="text-sm text-muted-foreground">
                                  {config.label}
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileRef}
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input id="email" defaultValue={user.email} disabled />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="nickname">닉네임</Label>
                    <Input
                      id="nickname"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button type="submit">저장</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* 이메일 로그인 사용자에게만 비밀번호 변경 UI 표시 */}
          {user.provider === 'email' && (
            <Card>
              <CardHeader>
                <CardTitle>비밀번호 변경</CardTitle>
                <CardDescription>
                  계정의 비밀번호를 변경합니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdatePassword}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="current-password">현재 비밀번호</Label>
                      <Input id="current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-password">새 비밀번호</Label>
                      <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">비밀번호 확인</Label>
                      <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button type="submit" disabled={isPwLoading}>{isPwLoading ? "변경 중..." : "비밀번호 변경"}</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">계정 삭제</CardTitle>
              <CardDescription>
                계정과 관련된 모든 데이터가 영구적으로 삭제됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                계정을 삭제하면 모든 북마크, 컬렉션, 설정이 영구적으로 삭제되며 복구할 수 없습니다.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
              >
                계정 삭제
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
