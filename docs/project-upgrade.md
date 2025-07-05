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

## 📝 참고 링크
- [Linktree Design Reference](https://linktr.ee/)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
