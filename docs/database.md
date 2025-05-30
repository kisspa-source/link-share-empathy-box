# Supabase 데이터베이스 설정 가이드

## 1. 프로젝트 초기 설정

### Task 1.1: Supabase 프로젝트 생성
- [x] Supabase 웹사이트(https://supabase.com) 접속
- [x] GitHub 계정으로 로그인
- [x] "New Project" 버튼 클릭
- [x] 프로젝트 이름 입력: `linku.me`
- [x] 데이터베이스 비밀번호 설정
- [x] 리전 선택: `Seoul (ap-northeast-3)`
- [x] 프로젝트 생성 완료 대기

### Task 1.2: 환경 변수 설정
- [x] 프로젝트 설정에서 API 키 확인
  - Project URL
  - anon/public key
- [x] 프로젝트 루트에 `.env` 파일 생성
- [x] 다음 환경 변수 추가:
  ```
  VITE_SUPABASE_URL=your_project_url
  VITE_SUPABASE_ANON_KEY=your_anon_key
  ```

## 2. 데이터베이스 스키마 설정

### Task 2.1: 사용자 프로필 테이블 생성
- [x] SQL 에디터에서 다음 쿼리 실행:
  ```sql
  create table profiles (
    id uuid references auth.users on delete cascade primary key,
    nickname text unique,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  -- RLS 정책 설정
  alter table profiles enable row level security;

  create policy "Public profiles are viewable by everyone."
    on profiles for select
    using ( true );

  create policy "Users can insert their own profile."
    on profiles for insert
    with check ( auth.uid() = id );

  create policy "Users can update own profile."
    on profiles for update
    using ( auth.uid() = id );
  ```

### Task 2.2: 북마크 테이블 생성
- [x] SQL 에디터에서 다음 쿼리 실행:
  ```sql
  create table bookmarks (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    url text not null,
    title text not null,
    description text,
    image_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    tags text[] default '{}'::text[]
  );

  -- RLS 정책 설정
  alter table bookmarks enable row level security;

  create policy "Users can view their own bookmarks"
    on bookmarks for select
    using (auth.uid() = user_id);

  create policy "Users can insert their own bookmarks"
    on bookmarks for insert
    with check (auth.uid() = user_id);

  create policy "Users can update their own bookmarks"
    on bookmarks for update
    using (auth.uid() = user_id);

  create policy "Users can delete their own bookmarks"
    on bookmarks for delete
    using (auth.uid() = user_id);
  ```

### Task 2.3: 컬렉션 테이블 생성
- [x] SQL 에디터에서 다음 쿼리 실행:
  ```sql
  create table collections (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users not null,
    name text not null,
    description text,
    cover_image text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
  );

  -- RLS 정책 설정
  alter table collections enable row level security;

  create policy "Users can view their own collections"
    on collections for select
    using (auth.uid() = user_id);

  create policy "Users can insert their own collections"
    on collections for insert
    with check (auth.uid() = user_id);

  create policy "Users can update their own collections"
    on collections for update
    using (auth.uid() = user_id);

  create policy "Users can delete their own collections"
    on collections for delete
    using (auth.uid() = user_id);
  ```

### Task 2.4: 컬렉션-북마크 관계 테이블 생성
- [x] SQL 에디터에서 다음 쿼리 실행:
  ```sql
  create table collection_bookmarks (
    collection_id uuid references collections not null,
    bookmark_id uuid references bookmarks not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (collection_id, bookmark_id)
  );

  -- RLS 정책 설정
  alter table collection_bookmarks enable row level security;

  create policy "Users can view their own collection bookmarks"
    on collection_bookmarks for select
    using (exists (
      select 1 from collections
      where collections.id = collection_bookmarks.collection_id
      and collections.user_id = auth.uid()
    ));

  create policy "Users can insert their own collection bookmarks"
    on collection_bookmarks for insert
    with check (exists (
      select 1 from collections
      where collections.id = collection_bookmarks.collection_id
      and collections.user_id = auth.uid()
    ));

  create policy "Users can delete their own collection bookmarks"
    on collection_bookmarks for delete
    using (exists (
      select 1 from collections
      where collections.id = collection_bookmarks.collection_id
      and collections.user_id = auth.uid()
    ));
  ```

## 3. 인증 설정

### Task 3.1: 이메일 인증 설정
- [x] Authentication > Providers > Email 설정
- [x] "Enable Email Signup" 활성화
- [x] "Confirm email" 설정 (선택사항)
- [x] 이메일 템플릿 커스터마이징 (선택사항)

### Task 3.2: 소셜 로그인 설정
#### Google 로그인
- [ ] Google Cloud Console 설정
  - [ ] https://console.cloud.google.com 접속
  - [ ] 새 프로젝트 생성 또는 기존 프로젝트 선택
  - [ ] "APIs & Services" → "Credentials"로 이동
  - [ ] "Create Credentials" → "OAuth client ID" 선택
  - [ ] 애플리케이션 유형: "Web application" 선택
  - [ ] 승인된 리디렉션 URI 추가:
    ```
    https://[your-project-id].supabase.co/auth/v1/callback
    ```
  - [ ] Client ID와 Client Secret 복사
- [ ] Supabase 설정
  - [ ] Authentication > Providers > Google
  - [ ] "Enable Google Sign In" 토글 ON
  - [ ] Client ID와 Client Secret 입력
  - [ ] "Save" 클릭

#### GitHub 로그인
- [ ] GitHub OAuth App 설정
  - [ ] GitHub.com → Settings → Developer settings → OAuth Apps
  - [ ] "New OAuth App" 클릭
  - [ ] 다음 정보 입력:
    - Application name: `linku.me`
    - Homepage URL: `https://linku.me`
    - Authorization callback URL:
      ```
      https://[your-project-id].supabase.co/auth/v1/callback
      ```
  - [ ] "Register application" 클릭
  - [ ] Client ID와 Client Secret 복사
- [ ] Supabase 설정
  - [ ] Authentication > Providers > GitHub
  - [ ] "Enable GitHub Sign In" 토글 ON
  - [ ] Client ID와 Client Secret 입력
  - [ ] "Save" 클릭

#### Kakao 로그인
- [ ] Kakao Developers 설정
  - [ ] https://developers.kakao.com 접속
  - [ ] 애플리케이션 추가
  - [ ] 플랫폼 등록: Web
  - [ ] 사이트 도메인 등록: `https://linku.me`
  - [ ] Redirect URI 등록:
    ```
    https://[your-project-id].supabase.co/auth/v1/callback
    ```
  - [ ] "카카오 로그인" 활성화
  - [ ] "보안" 설정에서 Client Secret 생성
  - [ ] REST API 키와 Client Secret 복사
- [ ] Supabase 설정
  - [ ] Authentication > Providers > Kakao
  - [ ] "Enable Kakao Sign In" 토글 ON
  - [ ] REST API 키와 Client Secret 입력
  - [ ] "Save" 클릭

### Task 3.3: 소셜 로그인 테스트
- [ ] 각 소셜 로그인 버튼 클릭 테스트
- [ ] 인증 창이 정상적으로 열리는지 확인
- [ ] 로그인 후 리디렉션이 정상적으로 되는지 확인
- [ ] 사용자 정보가 정상적으로 저장되는지 확인
- [ ] 에러 처리 확인:
  - [ ] 이메일 중복 체크
  - [ ] 소셜 계정 연동 시 기존 계정과의 충돌 처리
  - [ ] 네트워크 오류 처리

## 4. 스토리지 설정

### Task 4.1: 스토리지 버킷 생성
- [x] Storage > New Bucket
- [x] 버킷 이름: `avatars`
- [x] Public bucket 체크
- [x] RLS 정책 설정:
  ```sql
  CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

  CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
  );
  ```

## 5. 실시간 기능 설정

### Task 5.1: 실시간 구독 설정 (무료버전으로 Replication 설정 향후 예정)
- [ ] Database > Replication 설정
- [ ] 실시간 구독이 필요한 테이블 선택:
  - [ ] bookmarks
  - [ ] collections
  - [ ] collection_bookmarks

## 6. 테스트

### Task 6.1: 데이터베이스 연결 테스트
- [ ] 프로젝트 실행
- [ ] 회원가입 테스트
- [ ] 북마크 생성 테스트
- [ ] 컬렉션 생성 테스트
- [ ] 실시간 업데이트 테스트

### Task 6.2: 보안 테스트
- [ ] 다른 사용자의 데이터 접근 시도
- [ ] RLS 정책이 제대로 작동하는지 확인
- [ ] 인증되지 않은 사용자의 접근 제한 확인

## 7. 모니터링 설정

### Task 7.1: 로깅 설정
- [ ] Database > Logs 설정
- [ ] 중요한 이벤트 로깅 활성화
- [ ] 알림 설정 (선택사항)

### Task 7.2: 성능 모니터링
- [ ] Database > Performance 설정
- [ ] 쿼리 성능 모니터링 활성화
- [ ] 리소스 사용량 모니터링 설정

## 8. 백업 설정

### Task 8.1: 자동 백업 설정
- [ ] Database > Backups 설정
- [ ] 자동 백업 일정 설정
- [ ] 백업 보관 기간 설정

## 주의사항

1. 프로덕션 환경에서는 반드시 강력한 비밀번호를 사용하세요.
2. 환경 변수는 절대 버전 관리 시스템에 커밋하지 마세요.
3. RLS 정책을 주기적으로 검토하고 업데이트하세요.
4. 데이터베이스 백업을 정기적으로 확인하세요.
5. API 키는 안전하게 보관하고, 필요한 경우에만 공유하세요. 

// 아바타 업로드 함수
const uploadAvatar = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `avatar.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      upsert: true // 기존 파일이 있으면 덮어쓰기
    });

  if (error) {
    throw error;
  }

  // 업로드된 파일의 공개 URL 가져오기
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

try {
  const avatarUrl = await uploadAvatar(file);
  // 성공 처리
} catch (error) {
  if (error.message.includes('File size exceeds limit')) {
    toast.error('파일 크기는 5MB를 초과할 수 없습니다.');
  } else if (error.message.includes('Invalid file type')) {
    toast.error('지원되지 않는 파일 형식입니다.');
  } else {
    toast.error('파일 업로드에 실패했습니다.');
  }
} 