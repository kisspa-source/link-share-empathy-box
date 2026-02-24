import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type SeoConfig = {
  title: string;
  description: string;
  noindex?: boolean;
};

const SITE_NAME = "linku.me";
const DEFAULT_IMAGE = "https://lovable.dev/opengraph-image-p98pqg.png";

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let element = document.head.querySelector(selector) as HTMLMetaElement | null;

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attrs).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
};

const upsertLink = (selector: string, attrs: Record<string, string>) => {
  let element = document.head.querySelector(selector) as HTMLLinkElement | null;

  if (!element) {
    element = document.createElement("link");
    document.head.appendChild(element);
  }

  Object.entries(attrs).forEach(([key, value]) => {
    element?.setAttribute(key, value);
  });
};

const getSeoConfig = (pathname: string): SeoConfig => {
  if (pathname === "/") {
    return {
      title: "linku.me | 북마크 공유와 큐레이션 플랫폼",
      description: "북마크를 저장·정리·공유하고, 트렌딩 컬렉션을 발견할 수 있는 linku.me 플랫폼입니다.",
    };
  }

  if (pathname === "/features") {
    return {
      title: "기능 소개 | linku.me",
      description: "AI 자동 분류, 모바일 최적화, 브라우저 북마크 가져오기 등 linku.me의 핵심 기능을 확인하세요.",
    };
  }

  if (pathname === "/collections") {
    return {
      title: "공개 컬렉션 탐색 | linku.me",
      description: "다양한 주제의 공개 북마크 컬렉션을 탐색하고 필요한 링크를 빠르게 찾아보세요.",
    };
  }

  if (pathname.startsWith("/c/") || pathname.startsWith("/collections/")) {
    return {
      title: "컬렉션 상세 | linku.me",
      description: "선별된 링크 컬렉션을 열람하고 유용한 리소스를 한 곳에서 확인해보세요.",
    };
  }

  if (pathname === "/tags" || pathname.startsWith("/tags/")) {
    return {
      title: "태그별 북마크 탐색 | linku.me",
      description: "태그 기반으로 북마크를 분류해 관심 주제의 링크를 더 빠르고 정확하게 찾을 수 있습니다.",
    };
  }

  if (["/login", "/signup", "/forgot-password", "/auth/callback"].includes(pathname)) {
    return {
      title: "계정 인증 | linku.me",
      description: "linku.me 로그인, 회원가입 및 계정 복구를 안전하게 진행하세요.",
      noindex: true,
    };
  }

  return {
    title: `${SITE_NAME} | 북마크 관리 플랫폼`,
    description: "링크를 저장하고 공유하는 북마크 플랫폼 linku.me",
  };
};

export default function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const { pathname } = location;
    const seo = getSeoConfig(pathname);
    const canonicalUrl = `${window.location.origin}${pathname}`;

    document.title = seo.title;

    upsertMeta('meta[name="description"]', {
      name: "description",
      content: seo.description,
    });

    upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: seo.noindex ? "noindex, nofollow" : "index, follow",
    });

    upsertMeta('meta[property="og:title"]', {
      property: "og:title",
      content: seo.title,
    });

    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: seo.description,
    });

    upsertMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonicalUrl,
    });

    upsertMeta('meta[property="og:image"]', {
      property: "og:image",
      content: DEFAULT_IMAGE,
    });

    upsertMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: seo.title,
    });

    upsertMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: seo.description,
    });

    upsertMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: DEFAULT_IMAGE,
    });

    upsertLink('link[rel="canonical"]', {
      rel: "canonical",
      href: canonicalUrl,
    });
  }, [location]);

  return null;
}
