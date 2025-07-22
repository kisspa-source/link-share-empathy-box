# 📁 사이드바 내 Prezi 스타일 탐색 UI 설계 문서

북마크 관리 웹사이트의 사이드바를 트리(Tree) 방식 대신, 
Prezi 스타일의 **줌(Zoom-In) 방식 탐색**으로 구성하여 사용자 경험(UX)을 향상시킨다.

---

## 🎯 목표

- 깊은 폴더 구조를 **직관적이고 간결하게 탐색**
- 복잡한 트리 UI 대신 **슬라이드 기반의 폴더 전환 UX 제공**
- **모바일 친화적**이며 현대적인 사용자 경험 구현

---

## 🧭 사용자 흐름 (UX Flow)

```
[Bookmarks] 
  └─ 📁 개발
        └─ 📁 백엔드
              └─ 🔗 SpringBoot Docs
```

### ▶ 탐색 흐름 (예시)

1. 사용자 초기 화면: `루트 폴더 리스트` (`Bookmarks`)
2. `개발` 폴더 클릭 → 사이드바 내부가 오른쪽으로 **슬라이드 전환**
3. `백엔드` 폴더 클릭 → 다시 슬라이드하여 하위 북마크 표시
4. `←` 버튼 또는 breadcrumb 클릭으로 **이전 단계 복귀**

---

## 🖥️ 화면 구성 (Frames)

### Frame 1: 루트 폴더

| 요소 | 설명 |
|------|------|
| 타이틀 | Bookmarks |
| 리스트 | 📁 개발<br>📁 디자인<br>📁 일상 |
| 인터랙션 | 폴더 클릭 → 다음 Frame으로 슬라이드 |

---

### Frame 2: 폴더 하위 탐색 (예: "개발")

| 요소 | 설명 |
|------|------|
| 타이틀 | ← 개발 |
| 리스트 | 📁 백엔드<br>📁 프론트엔드<br>📁 문서정리 |
| 인터랙션 | 뒤로가기(←) 클릭 → 이전 Frame 복귀<br>폴더 클릭 → Frame 3 전환 |

---

### Frame 3: 북마크 리스트 (예: "개발 > 백엔드")

| 요소 | 설명 |
|------|------|
| 타이틀 | ← 백엔드 |
| 리스트 | 🔗 SpringBoot Docs<br>🔗 GitHub - jbro/project-a<br>🔗 PostgreSQL 튜닝 가이드 |
| 인터랙션 | 링크 클릭 시 새 창 또는 미리보기 |
| 부가 기능 | 북마크 편집/삭제 기능 아이콘 표시 가능 |

---

## 🧱 컴포넌트 구조

### SidebarContainer
```tsx
<SidebarContainer>
  <SidebarFrame> ... </SidebarFrame>
</SidebarContainer>
```

| 컴포넌트 | 설명 |
|----------|------|
| `SidebarContainer` | 고정 너비(예: 300px), 좌측 고정 |
| `SidebarFrame` | 각 단계의 화면 (Frame 1~3) 표시. 슬라이드 전환됨 |

---

### FolderItem
```tsx
<FolderItem icon="📁" label="개발" />
```

| Props | 설명 |
|-------|------|
| `icon` | 폴더 아이콘 |
| `label` | 폴더 이름 |
| `onClick` | 하위로 슬라이드 이동 |

---

### BookmarkItem
```tsx
<BookmarkItem icon="🔗" label="SpringBoot Docs" url="https://..." />
```

| Props | 설명 |
|-------|------|
| `icon` | 링크 아이콘 |
| `label` | 북마크 이름 |
| `url` | 이동할 링크 주소 |
| `onClick` | 새 창으로 열기 또는 프리뷰 기능 |

---

### NavigationTitle (Breadcrumb 또는 Back 버튼)
```tsx
<NavigationTitle label="← 백엔드" onBack={handleBack} />
```

---

## 🧩 전환 애니메이션

| 효과 | 설명 |
|------|------|
| 슬라이드 (좌 → 우) | 폴더 클릭 시 다음 단계로 전환 |
| 슬라이드 (우 → 좌) | `←` 클릭 시 이전 폴더로 복귀 |
| 전환 속도 | 200~300ms, easing 적용 (`ease-in-out`) |

---

## 🧪 기술 스택 예시 (React 기준)

- React + TypeScript
- Zustand 또는 Redux (폴더 상태 관리)
- TailwindCSS 또는 styled-components
- React Router (optional): URL path에 따라 탐색 상태 반영 가능
- Framer Motion (전환 애니메이션)

---

## 📱 모바일 대응

| 요소 | 설명 |
|------|------|
| 반응형 너비 조절 | 모바일 시 사이드바가 화면 전체를 덮는 형식 |
| 제스처 지원 | 좌/우 스와이프로 폴더 탐색 |
| 하단 고정 버튼 | "뒤로 가기", "홈으로 이동" 버튼 제공 가능 |

---

## ✅ 장점 & 단점

| 👍 장점 | 👎 단점 |
|--------|--------|
| 복잡한 트리를 제거해 깔끔한 UI | 초기 UX가 약간 낯설 수 있음 |
| 모바일 UX에 최적화 | 깊은 폴더일 경우 반복 클릭 필요 |
| 애니메이션으로 몰입감 있는 탐색 | 빠른 탐색에는 검색기능 필요 |

---

## 📌 참고 디자인 패턴

- Apple Finder iOS의 폴더 진입 구조
- Notion의 페이지 이동 방식
- Prezi의 줌 인터페이스 철학

