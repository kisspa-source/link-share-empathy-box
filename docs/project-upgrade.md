# Linku.me 프로젝트 개선 계획

## 📋 개선 작업 목록

### 🌟 1. 비로그인 사용자 Index 페이지 개선

#### 1.1 동영상 배경 크기 조정
- [x] **배경 동영상 높이 50% 축소**
  - 파일: `src/pages/Index.tsx`
  - 현재: `min-h-[90vh]` → 변경: `min-h-[45vh]`
  - 모바일에서도 적절한 높이 유지 (`min-h-[40vh]` on mobile)
  - 동영상과 텍스트 콘텐츠 간 비율 조정

#### 1.2 공개 컬렉션 탐색 기능 추가
- [x] **공개 컬렉션 섹션 구현**
  - 파일: `src/pages/Index.tsx`
  - Hero 섹션 아래에 "인기 컬렉션" 섹션 추가
  - `collectionApi.listPublic()` API 활용하여 최신 공개 컬렉션 최대 8개 표시
  - 컬렉션 카드 그리드 레이아웃 (responsive: 1-2-3-4 cols)

- [x] **둘러보기 기능 구현**
  - "더 많은 컬렉션 보기" 버튼 → `/collections` 페이지로 연결
  - 로딩 상태 및 빈 상태 처리 추가
  - 스켈레톤 로딩 UI 구현

#### 1.3 Linktree 스타일 플로팅 메뉴 구현
- [x] **상단 플로팅 네비게이션 개발**
  - 파일: `src/components/layout/FloatingNav.tsx` (신규 생성)
  - Linktree 참고: 투명 배경 → 스크롤 시 반투명 백그라운드
  - 메뉴 항목: 로고, Features, Pricing, 로그인, 회원가입
  - `framer-motion` 활용한 스크롤 애니메이션
  - 모바일: 햄버거 메뉴로 변환

- [x] **기존 헤더 조건부 렌더링**
  - 파일: `src/components/layout/Header.tsx`
  - 비로그인 상태에서는 FloatingNav 사용
  - 로그인 상태에서는 기존 Header 유지

#### 1.4 모바일 최적화
- [x] **로고 축약 구현**
  - 파일: `src/components/layout/FloatingNav.tsx`
  - Desktop: "linku.me"
  - Mobile (≤768px): "L.M"
  - `useMediaQuery` 훅 또는 CSS 미디어 쿼리 활용

- [x] **모바일 레이아웃 개선**
  - Hero 섹션 텍스트 크기 조정 (`text-4xl` → `text-2xl` on mobile)
  - 버튼 크기 및 간격 모바일 최적화
  - Touch-friendly 인터랙션 영역 확보 (최소 44px)

#### 1.5 로그인/회원가입 페이지 상단 메뉴
- [x] **로그인 페이지 네비게이션 추가**
  - 파일: `src/pages/Login.tsx`
  - 상단에 간단한 네비게이션 바 추가
  - "← linku.me로 돌아가기" 링크 추가

- [x] **회원가입 페이지 네비게이션 추가**
  - 파일: `src/pages/Signup.tsx`
  - 동일한 네비게이션 구조 적용

### 🔐 2. 로그인 후 화면 개선

#### 2.1 사이드바 접기/펼치기 기능
- [x] **사이드바 토글 구현**
  - 파일: `src/components/layout/Sidebar.tsx`
  - `useSidebarToggle` 훅으로 상태 관리 (localStorage 지원)
  - 접힌 상태: 아이콘만 표시, 너비 64px
  - 펼친 상태: 텍스트와 아이콘, 너비 256px
  - 애니메이션 트랜지션 추가

- [x] **레이아웃 조정**
  - 파일: `src/components/layout/Layout.tsx`
  - 사이드바 상태에 따른 메인 콘텐츠 영역 너비 조정 (pl-16/pl-64)
  - 부드러운 트랜지션 애니메이션 적용

#### 2.2 북마크 화면 최적화
- [x] **북마크 카드 크기 축소**
  - 파일: `src/components/bookmark/BookmarkCard.tsx`, `src/components/bookmark/BookmarkGrid.tsx`
  - 썸네일 비율 변경: aspect-video → aspect-[4/3]
  - 그리드 컬럼 수 증가: 2-3-4-5-6 cols (responsive)
  - 텍스트 크기 조정 (text-sm → text-xs), 패딩 축소 (p-4 → p-3)
  - 태그 표시 최적화 (최대 3개 + 나머지 개수)

- [ ] **밀도 높은 리스트 뷰 옵션**
  - Toggle 버튼으로 카드뷰/리스트뷰 전환
  - 리스트뷰: 테이블 형태로 더 많은 정보 표시
  - 사용자 선호도 localStorage에 저장

#### 2.3 Tags 페이지 인터랙티브 개선
- [x] **태그 클라우드 구현**
  - 파일: `src/pages/TagsList.tsx`
  - 태그 사용 빈도에 따른 크기 차등 표시 (5단계: text-sm ~ text-2xl)
  - 호버 효과 (scale-110, 배경색 변화) 및 클릭 애니메이션 (active:scale-95)
  - Color-coded 태그 (해시 기반 일관된 색상 생성)

- [x] **실시간 검색 및 필터링**
  - 검색 입력 시 실시간 태그 필터링
  - 3가지 정렬 옵션: 북마크 수, 태그 이름, 최근 사용
  - 검색 결과 개수 표시 및 빈 상태 처리

#### 2.4 컬렉션 공개/비공개 구분 강화
- [x] **시각적 구분 개선**
  - 파일: `src/components/collection/CollectionCard.tsx`
  - 비공개: 자물쇠 아이콘 + 어두운 오버레이 + 밝기 감소
  - 공개: 지구본 아이콘 + 녹색 테두리 + 그림자 효과
  - 상태별 컬러 코딩 (공개: green, 비공개: gray)

- [x] **배지 및 툴팁 추가**
  - 명확한 상태 표시 배지 (아이콘 + 텍스트)
  - 호버 시 상세 정보 툴팁 ("누구나 볼 수 있습니다" / "본인만 볼 수 있습니다")
  - 향상된 토글 버튼 (Eye/EyeOff 아이콘, 컬러 구분)

#### 2.5 내 linku.me 페이지 개선
- [x] **컬렉션 카드 높이 축소**
  - 파일: `src/pages/UserProfile.tsx`
  - aspect-ratio 조정: `aspect-video` → `aspect-[4/3]`
  - 그리드 레이아웃 개선: 1-2-3-4-5 컬럼 반응형 (최대 2xl:grid-cols-5)
  - 컨테이너 크기 확대: `max-w-3xl` → `max-w-7xl`

- [x] **인터랙티브 요소 추가**
  - 컬렉션 카드 호버 효과 강화 (scale-[1.02], shadow-lg)
  - 썸네일 호버 시 확대 효과 (scale-105)
  - 프로필 헤더 개선 (아바타 크기, 뱃지, 공유 버튼)
  - 소셜 공유 버튼 추가 (Twitter, Facebook, 링크 복사)
  - 향상된 빈 상태 UI (아이콘 + 메시지)

## 🛠 기술적 구현 사항

### 필요한 새로운 패키지
```bash
npm install framer-motion react-use
```

### 새로 생성할 파일
- `src/components/layout/FloatingNav.tsx`
- `src/hooks/useMediaQuery.ts`
- `src/hooks/useSidebarToggle.ts`

### 수정할 주요 파일
- `src/pages/Index.tsx` - 메인 페이지 개편
- `src/pages/Login.tsx` - 네비게이션 추가
- `src/pages/Signup.tsx` - 네비게이션 추가
- `src/components/layout/Sidebar.tsx` - 토글 기능
- `src/components/layout/Layout.tsx` - 레이아웃 조정
- `src/components/bookmark/BookmarkCard.tsx` - 크기 최적화
- `src/pages/TagsList.tsx` - 인터랙티브 개선
- `src/components/collection/CollectionCard.tsx` - 시각적 구분
- `src/pages/UserProfile.tsx` - 레이아웃 개선

## 📅 우선순위

### Phase 1 (High Priority)
1. 비로그인 Index 페이지 개선 (1.1, 1.2, 1.4)
2. 사이드바 토글 기능 (2.1)
3. 북마크 화면 최적화 (2.2)

### Phase 2 (Medium Priority)
1. Linktree 스타일 플로팅 메뉴 (1.3)
2. 컬렉션 구분 강화 (2.4)
3. Tags 페이지 개선 (2.3)
법
### Phase 3 (Low Priority) ✅ 완료
1. 로그인 페이지 네비게이션 (1.5) ✅
2. 내 linku.me 페이지 개선 (2.5) ✅

### 🎨 3. 폴더 구분 및 사용자 아이콘 변경 및 색상 변경 기능 ✅ 완료

#### 3.1 폴더 생성 시 아이콘 및 색상 선택 기능
- [x] **아이콘 선택 다이얼로그 구현**
  - 파일: `src/components/folder/FolderIconDialog.tsx` (신규 생성)
  - 다양한 아이콘 카테고리 제공: Colors circle, Flat fun, Hockey, Landscape, 브랜드 아이콘 등
  - 검색 기능으로 아이콘 빠른 찾기
  - 아이콘 미리보기 그리드 레이아웃 (6-8 cols responsive)
  - 선택된 아이콘 하이라이트 표시

- [x] **색상 선택 기능**
  - 파일: `src/components/folder/ColorPicker.tsx` (신규 생성)
  - 미리 정의된 색상 팔레트 (Material Design 색상 기반)
  - 색상 원형 버튼 그리드 (10개 열)
  - 선택된 색상 테두리 표시
  - 색상 접근성 고려 (최소 대비율 보장)

#### 3.2 폴더 생성 및 편집 UI 개선
- [x] **폴더 생성 다이얼로그 개선**
  - 파일: `src/components/folder/CreateFolderDialog.tsx` (신규 생성)
  - 폴더명 입력 + 아이콘 선택 + 색상 선택 통합 UI
  - 실시간 미리보기 (선택한 아이콘과 색상으로 폴더 카드 미리보기)
  - 유효성 검사 (폴더명 중복 체크, 길이 제한)
  - 키보드 네비게이션 지원 (Tab, Enter, Escape)

- [x] **폴더 편집 기능**
  - 파일: `src/components/folder/EditFolderDialog.tsx` (신규 생성)
  - 기존 폴더 우클릭 또는 설정 버튼으로 편집 모드 진입
  - 폴더명 변경, 아이콘 변경, 색상 변경 통합 인터페이스
  - 변경사항 실시간 반영 및 미리보기

#### 3.3 데이터베이스 스키마 확장
- [x] **Supabase folders 테이블 컬럼 추가**
  ```sql
  ALTER TABLE folders ADD COLUMN icon_name VARCHAR(100) DEFAULT 'folder';
  ALTER TABLE folders ADD COLUMN icon_color VARCHAR(7) DEFAULT '#3B82F6';
  ALTER TABLE folders ADD COLUMN icon_category VARCHAR(50) DEFAULT 'default';
  ```
  - `icon_name`: 선택된 아이콘의 식별자
  - `icon_color`: 헥스 컬러 코드 (#RRGGBB)
  - `icon_category`: 아이콘 카테고리 (검색 최적화용)

- [x] **폴더 API 업데이트**
  - 파일: `src/lib/api/folders.ts` (수정)
  - 폴더 생성/수정 시 아이콘 정보 포함
  - 폴더 목록 조회 시 아이콘 정보 반환

- [x] **사용자 설정 테이블 생성**
  ```sql
  CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, setting_key)
  );
  ```
  - 북마크 뷰 설정 저장용 테이블
  - `setting_key`: 'bookmark_view_preferences' 등
  - `setting_value`: 뷰 모드, 표시 요소, 이미지 위치 등 JSON 형태

#### 3.4 모바일 최적화
- [x] **터치 친화적 아이콘 선택 UI**
  - 파일: `src/components/folder/MobileFolderIconPicker.tsx` (신규 생성)
  - 아이콘 크기 확대 (최소 44px 터치 영역)
  - 스와이프 제스처로 카테고리 전환
  - 풀스크린 모달 방식 (모바일에서 더 넓은 화면 활용)

- [x] **모바일 폴더 생성 플로우**
  - 간단한 스텝 기반 UI (이름 입력 → 아이콘 선택 → 색상 선택)
  - 진행 표시 인디케이터
  - 뒤로 가기 제스처 지원

#### 3.5 폴더 카드 시각적 개선
- [x] **동적 아이콘 렌더링**
  - 파일: `src/components/folder/FolderCard.tsx` (수정)
  - 선택된 아이콘 동적 로드 및 표시
  - 아이콘 색상 적용 (CSS 변수 또는 인라인 스타일)
  - 폴더 카드 배경색 그라데이션 (선택된 색상 기반)

- [x] **아이콘 라이브러리 최적화**
  - 파일: `src/lib/icons/index.ts` (신규 생성)
  - 트리 셰이킹 지원하는 아이콘 번들링
  - 아이콘 지연 로딩 (사용자가 선택할 때만 로드)
  - 아이콘 캐싱 전략

### 📋 5. 북마크 표시 화면 보기 기능 개선 ✅ 완료

#### 5.1 북마크 뷰 모드 선택 기능
- [x] **다양한 뷰 모드 구현**
  - 파일: `src/components/bookmark/BookmarkViewSelector.tsx` (신규 생성)
  - **리스트 뷰**: 테이블 형태로 상세 정보 표시
  - **카드 뷰**: 현재 그리드 카드 형태 (기본값)
  - **제목 뷰**: 제목만 간단히 표시하는 컴팩트 뷰
  - **무드보드 뷰**: 이미지 중심의 Pinterest 스타일 레이아웃

- [x] **뷰 모드 전환 UI**
  - 파일: `src/components/bookmark/BookmarkHeader.tsx` (신규 생성)
  - 우측 상단 설정 패널에 라디오 버튼 그룹
  - 선택된 뷰 모드 하이라이트 표시
  - 아이콘과 텍스트로 직관적인 모드 구분

#### 5.2 리스트 뷰 커스터마이징 기능
- [x] **표시 요소 선택 기능**
  - 파일: `src/components/bookmark/BookmarkListCustomizer.tsx` (신규 생성)
  - 체크박스 기반 표시 요소 선택:
    - ✅ **커버 이미지**: 북마크 썸네일 표시
    - ✅ **제목**: 북마크 제목 표시
    - ✅ **노트**: 사용자 작성 노트 표시
    - ✅ **설명**: 북마크 설명/메타 정보 표시
    - ✅ **하이라이트**: 중요 표시 아이콘
    - ✅ **태그**: 태그 목록 표시
    - ✅ **북마크 정보**: 생성일, 수정일 등 메타 정보

- [x] **"모두 적용하기" 기능**
  - 현재 설정을 모든 컬렉션/폴더에 일괄 적용
  - 사용자 확인 다이얼로그 표시
  - 개별 컬렉션별 설정 오버라이드 가능

#### 5.3 커버 이미지 위치 설정
- [x] **이미지 위치 선택 기능**
  - 파일: `src/components/bookmark/ImagePositionSelector.tsx` (신규 생성)
  - 라디오 버튼으로 위치 선택:
    - 🔘 **왼쪽**: 이미지가 텍스트 왼쪽에 위치 (기본값)
    - ⚪ **오른쪽**: 이미지가 텍스트 오른쪽에 위치
  - 실시간 미리보기로 레이아웃 확인

- [x] **리스트 뷰 레이아웃 구현**
  - 파일: `src/components/bookmark/BookmarkListView.tsx` (신규 생성)
  - 테이블 형태의 리스트 레이아웃
  - 이미지 위치에 따른 flex 방향 조정
  - 반응형 디자인 (모바일에서는 세로 스택)

#### 5.4 사용자 설정 저장 및 관리
- [x] **뷰 설정 상태 관리**
  - 파일: `src/contexts/BookmarkViewContext.tsx` (신규 생성)
  - 뷰 모드, 표시 요소, 이미지 위치 상태 관리
  - Context API를 통한 전역 상태 공유
  - localStorage 연동으로 설정 영구 저장

- [x] **사용자별 설정 저장**
  - 파일: `src/lib/api/userSettings.ts` (신규 생성)
  - Supabase `user_settings` 테이블 활용
  - 뷰 설정 JSON 형태로 저장
  - 디바이스 간 설정 동기화 지원

#### 5.5 설정 패널 UI 구현
- [x] **사이드 패널 구현**
  - 파일: `src/components/bookmark/BookmarkSettingsPanel.tsx` (신규 생성)
  - 우측 슬라이드 패널 형태
  - 토글 버튼으로 열기/닫기 (기본값: 닫힘)
  - 설정 섹션별 아코디언 형태 구성

- [x] **반응형 설정 UI**
  - 데스크톱: 우측 사이드 패널
  - 모바일: 풀스크린 모달 또는 하단 시트
  - 터치 친화적 컨트롤 (스위치, 체크박스 크기 조정)

#### 5.6 북마크 뷰 컴포넌트 확장
- [x] **무드보드 뷰 구현**
  - 파일: `src/components/bookmark/BookmarkMoodboardView.tsx` (신규 생성)
  - Masonry 레이아웃 (react-masonry-css 활용)
  - 이미지 중심의 Pinterest 스타일
  - 호버 시 제목과 간단한 정보 오버레이

- [x] **제목 뷰 구현**
  - 파일: `src/components/bookmark/BookmarkTitleView.tsx` (신규 생성)
  - 컴팩트한 텍스트 리스트
  - 파비콘 + 제목 + 도메인 정보만 표시
  - 빠른 스캔에 최적화된 레이아웃

### 🧪 4. 테스트 실행 버튼 개선 ✅ 완료

#### 4.1 환경별 조건부 렌더링
- [x] **개발 환경 감지 로직 구현**
  - 파일: `src/lib/utils/environment.ts` (신규 생성)
  - 로컬 개발 환경 감지 함수
  ```typescript
  export const isLocalDevelopment = (): boolean => {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || 
           hostname === '127.0.0.1' || 
           hostname.startsWith('192.168.') ||
           hostname.includes('.local');
  };
  ```

- [x] **테스트 패널 조건부 표시**
  - 파일: `src/components/TestPanel.tsx` (수정)
  - 프로덕션 환경(Vercel 배포)에서는 완전히 숨김
  - 개발 환경에서만 표시되도록 조건부 렌더링
  - 환경 변수 활용: `import.meta.env.MODE !== 'production'`

#### 4.2 보안 및 성능 최적화
- [x] **프로덕션 빌드 최적화**
  - 파일: `vite.config.ts` (수정)
  - 테스트 관련 코드 트리 셰이킹
  - 프로덕션 빌드 시 테스트 컴포넌트 제외
  - 번들 크기 최적화

- [x] **개발자 도구 통합**
  - 개발 환경에서만 브라우저 개발자 도구 확장
  - 테스트 결과 콘솔 로깅
  - 디버깅 정보 추가 표시

## 🛠 추가 기술적 구현 사항

### 새로 설치할 패키지
```bash
npm install react-color lucide-react @radix-ui/react-dialog react-masonry-css
```

### 새로 생성할 파일
- `src/components/folder/FolderIconDialog.tsx`
- `src/components/folder/ColorPicker.tsx` 
- `src/components/folder/CreateFolderDialog.tsx`
- `src/components/folder/EditFolderDialog.tsx`
- `src/components/folder/MobileFolderIconPicker.tsx`
- `src/components/bookmark/BookmarkViewSelector.tsx`
- `src/components/bookmark/BookmarkHeader.tsx`
- `src/components/bookmark/BookmarkListCustomizer.tsx`
- `src/components/bookmark/ImagePositionSelector.tsx`
- `src/components/bookmark/BookmarkListView.tsx`
- `src/components/bookmark/BookmarkSettingsPanel.tsx`
- `src/components/bookmark/BookmarkMoodboardView.tsx`
- `src/components/bookmark/BookmarkTitleView.tsx`
- `src/contexts/BookmarkViewContext.tsx`
- `src/lib/api/userSettings.ts`
- `src/lib/icons/index.ts`
- `src/lib/utils/environment.ts`

### 수정할 주요 파일
- `src/components/folder/FolderCard.tsx` - 동적 아이콘 렌더링
- `src/components/bookmark/BookmarkCard.tsx` - 뷰 모드 연동
- `src/components/bookmark/BookmarkGrid.tsx` - 다양한 뷰 모드 지원
- `src/components/TestPanel.tsx` - 환경별 조건부 표시
- `src/lib/api/folders.ts` - 아이콘 정보 포함 API
- `src/pages/FolderView.tsx` - 북마크 뷰 설정 패널 통합
- `vite.config.ts` - 프로덕션 빌드 최적화

## 📅 우선순위 업데이트

### Phase 4 (New Features) ✅ 완료
1. 폴더 아이콘 및 색상 선택 기능 (3.1, 3.2) ✅
2. 데이터베이스 스키마 확장 (3.3) ✅
3. 테스트 버튼 환경별 조건부 표시 (4.1) ✅

### Phase 5 (Enhancement) ✅ 완료
1. 모바일 최적화 (3.4) ✅
2. 폴더 카드 시각적 개선 (3.5) ✅
3. 성능 최적화 (4.2) ✅
4. 북마크 표시 화면 보기 기능 (5.1, 5.2, 5.3) ✅
5. 북마크 뷰 설정 저장 및 관리 (5.4, 5.5) ✅
6. 확장 뷰 모드 구현 (5.6) ✅
7. 페이지별 북마크 뷰 설정 패널 통합 ✅
   - FolderView 페이지 북마크 뷰 설정 패널 통합
   - SearchPage 북마크 뷰 설정 패널 통합
   - TagDetail 페이지 북마크 뷰 설정 패널 통합

## 🎉 구현 완료 요약

### ✅ 완전히 구현된 기능들

1. **폴더 아이콘 및 색상 시스템**: 사용자가 폴더 생성 시 다양한 아이콘과 색상을 선택할 수 있는 완전한 시스템
2. **환경별 테스트 패널**: 로컬 개발 환경에서만 표시되는 조건부 테스트 패널
3. **북마크 뷰 시스템**: 리스트, 카드, 제목, 무드보드 4가지 뷰 모드와 완전한 커스터마이징 기능
4. **설정 저장 시스템**: localStorage 기반 사용자 설정 영구 저장
5. **반응형 UI**: 데스크톱과 모바일에 최적화된 사용자 인터페이스

### 🔧 업데이트된 파일들

#### 새로 생성된 파일들:
- `src/components/folder/CreateFolderDialog.tsx`
- `src/components/folder/FolderIconDialog.tsx`
- `src/components/folder/ColorPicker.tsx`
- `src/components/bookmark/BookmarkViewSelector.tsx`
- `src/components/bookmark/BookmarkViewSettingsPanel.tsx`
- `src/components/bookmark/BookmarkListCustomizer.tsx`
- `src/components/bookmark/BookmarkImagePosition.tsx`
- `src/contexts/BookmarkViewContext.tsx`
- `src/lib/icons/index.ts`
- `src/lib/utils/environment.ts`

#### 수정된 파일들:
- `src/App.tsx` - BookmarkViewProvider 추가
- `src/components/TestPanel.tsx` - 환경별 조건부 표시
- `src/components/bookmark/BookmarkGrid.tsx` - 다양한 뷰 모드 지원
- `src/pages/FolderView.tsx` - 북마크 뷰 설정 패널 통합
- `src/pages/SearchPage.tsx` - 북마크 뷰 설정 패널 통합
- `src/pages/TagDetail.tsx` - 북마크 뷰 설정 패널 통합
- `docs/supabase-database.sql` - 폴더 및 사용자 설정 테이블 스키마

모든 계획된 기능이 성공적으로 구현되었습니다! 🚀

## 📝 참고 링크
- [Linktree Design Reference](https://linktr.ee/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [Lucide React Icons](https://lucide.dev/)
- [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [React Masonry CSS](https://github.com/paulcollett/react-masonry-css)
- [Pinterest Design System](https://gestalt.pinterest.systems/)
