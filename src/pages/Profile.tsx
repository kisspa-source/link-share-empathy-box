import { useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Profile() {
  const { user, logout } = useAuth();
  
  useEffect(() => {
    document.title = "프로필 | linku.me";
  }, []);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("프로필이 업데이트되었습니다.");
  };
  
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("비밀번호가 변경되었습니다.");
  };
  
  const handleDeleteAccount = () => {
    if (window.confirm("정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      toast.success("계정이 삭제되었습니다.");
      logout();
    }
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
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile}>
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={user.avatarUrl} alt={user.nickname} />
                      <AvatarFallback>{user.nickname[0]}</AvatarFallback>
                    </Avatar>
                    <Button type="button" variant="outline">
                      이미지 변경
                    </Button>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="email">이메일</Label>
                    <Input id="email" defaultValue={user.email} disabled />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="nickname">닉네임</Label>
                    <Input id="nickname" defaultValue={user.nickname} />
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button type="submit">저장</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
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
                    <Input id="current-password" type="password" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="new-password">새 비밀번호</Label>
                    <Input id="new-password" type="password" />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="confirm-password">비밀번호 확인</Label>
                    <Input id="confirm-password" type="password" />
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <Button type="submit">비밀번호 변경</Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
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
