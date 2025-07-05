// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Deno 전역 선언
declare const Deno: {
  serve: (handler: (request: Request) => Promise<Response>) => void
}

// 메타데이터 추출 타입
interface BookmarkMetadata {
  title: string
  description: string
  image_url?: string
  favicon?: string
  tags?: string[]
}

// 허용된 도메인 목록 (보안 강화)
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:8080',
  'http://localhost:8081',
  'http://localhost:8082',
  'http://localhost:8083',
  'https://linku-plum.vercel.app',
  'https://linku.me',
  'https://www.linku.me'
]

// 사용자 에이전트 목록 (다양한 웹사이트 호환성 향상)
const USER_AGENTS = [
  'Mozilla/5.0 (compatible; LinkShare-Bot/1.0; +https://linku.me/bot)',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
]

// HTML에서 메타데이터 추출
const extractMetadata = (html: string, url: string): BookmarkMetadata => {
  const domain = new URL(url).hostname

  // 기본값 설정
  const metadata: BookmarkMetadata = {
    title: url,
    description: '',
    image_url: '',
    favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
    tags: []
  }

  try {
    // HTML 정리 (불필요한 공백 제거)
    const cleanHtml = html.replace(/\s+/g, ' ').trim()
    
    // Title 추출 (여러 패턴 시도)
    const titlePatterns = [
      /<title[^>]*>([^<]+)<\/title>/i,
      /<meta[^>]*property=['"](og:title)['"]*[^>]*content=['"](.*?)['"]/i,
      /<meta[^>]*name=['"](title)['"]*[^>]*content=['"](.*?)['"]/i
    ]

    for (const pattern of titlePatterns) {
      const match = cleanHtml.match(pattern)
      if (match && match[match.length - 1]) {
        metadata.title = match[match.length - 1].trim()
        break
      }
    }

    // Description 추출 (여러 패턴 시도)
    const descPatterns = [
      /<meta[^>]*property=['"](og:description)['"]*[^>]*content=['"](.*?)['"]/i,
      /<meta[^>]*name=['"](description|Description)['"]*[^>]*content=['"](.*?)['"]/i,
      /<meta[^>]*name=['"](twitter:description)['"]*[^>]*content=['"](.*?)['"]/i
    ]

    for (const pattern of descPatterns) {
      const match = cleanHtml.match(pattern)
      if (match && match[2]) {
        metadata.description = match[2].trim()
        break
      }
    }

    // Image URL 추출 (여러 패턴 시도)
    const imagePatterns = [
      /<meta[^>]*property=['"](og:image)['"]*[^>]*content=['"](.*?)['"]/i,
      /<meta[^>]*name=['"](twitter:image)['"]*[^>]*content=['"](.*?)['"]/i,
      /<meta[^>]*property=['"](twitter:image:src)['"]*[^>]*content=['"](.*?)['"]/i
    ]

    for (const pattern of imagePatterns) {
      const match = cleanHtml.match(pattern)
      if (match && match[2]) {
        let imageUrl = match[2].trim()
        
        // 상대경로를 절대경로로 변환
        if (imageUrl.startsWith('//')) {
          imageUrl = `https:${imageUrl}`
        } else if (imageUrl.startsWith('/')) {
          imageUrl = `https://${domain}${imageUrl}`
        }
        
        // 유효한 이미지 URL인지 확인
        if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
          metadata.image_url = imageUrl
          break
        }
      }
    }

    // 키워드 추출
    const keywordsMatch = cleanHtml.match(/<meta[^>]*name=['"](keywords|Keywords)['"]*[^>]*content=['"](.*?)['"]/i)
    if (keywordsMatch && keywordsMatch[2]) {
      metadata.tags = keywordsMatch[2]
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && tag.length < 30) // 길이 제한
        .slice(0, 10) // 최대 10개만
    }

    // HTML 엔티티 디코딩
    metadata.title = metadata.title.replace(/&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});/gi, (match, entity) => {
      const entities: { [key: string]: string } = {
        'amp': '&',
        'lt': '<',
        'gt': '>',
        'quot': '"',
        'apos': "'",
        'nbsp': ' ',
        '#39': "'"
      }
      return entities[entity] || match
    })

    metadata.description = metadata.description.replace(/&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-f]{1,6});/gi, (match, entity) => {
      const entities: { [key: string]: string } = {
        'amp': '&',
        'lt': '<',
        'gt': '>',
        'quot': '"',
        'apos': "'",
        'nbsp': ' ',
        '#39': "'"
      }
      return entities[entity] || match
    })

  } catch (error) {
    console.error('메타데이터 추출 중 오류:', error)
  }

  return metadata
}

// 서버리스 함수 정의
Deno.serve(async (req) => {
  const origin = req.headers.get('Origin')
  
  // CORS 헤더 설정 (보안 강화)
  const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin || '') ? origin || '*' : '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': '86400' // 24시간 캐싱
  }

  // CORS preflight 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200
    })
  }

  // 요청 시작 시간 기록
  const startTime = Date.now()

  try {
    const { url } = await req.json()
    
    if (!url) {
      return new Response(
        JSON.stringify({ 
          error: 'URL이 필요합니다',
          code: 'MISSING_URL'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🔍 메타데이터 추출 시작: ${url}`)

    // URL 유효성 검증
    let validUrl: URL
    try {
      validUrl = new URL(url)
      
      // 특정 프로토콜만 허용
      if (!['http:', 'https:'].includes(validUrl.protocol)) {
        throw new Error('HTTP/HTTPS 프로토콜만 지원됩니다')
      }
      
      // 로컬 네트워크 차단 (보안)
      if (validUrl.hostname === 'localhost' || validUrl.hostname.startsWith('127.') || validUrl.hostname.startsWith('192.168.')) {
        throw new Error('로컬 네트워크 URL은 허용되지 않습니다')
      }
      
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: '유효하지 않은 URL입니다',
          code: 'INVALID_URL',
          details: error.message
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 웹페이지 HTML 가져오기 (개선된 버전)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15초 타임아웃

    const randomUserAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': randomUserAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      redirect: 'follow' // 리다이렉트 자동 처리
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    // Content-Type 확인
    const contentType = response.headers.get('Content-Type') || ''
    if (!contentType.includes('text/html')) {
      throw new Error('HTML 문서가 아닙니다')
    }

    const html = await response.text()
    const metadata = extractMetadata(html, url)

    // 썸네일 생성 (이미지가 없는 경우)
    if (!metadata.image_url) {
      const encodedUrl = encodeURIComponent(url)
      // 여러 썸네일 서비스 대안 제공
      const thumbnailServices = [
        `https://image.thum.io/get/width/1200/crop/800/${encodedUrl}`,
        `https://s0.wp.com/mshots/v1/${encodedUrl}?w=1200&h=800`,
        `https://mini.s-shot.ru/1200x800/PNG/?${encodedUrl}`
      ]
      metadata.image_url = thumbnailServices[0]
    }

    // 처리 시간 계산
    const processingTime = Date.now() - startTime

    console.log(`✅ 메타데이터 추출 완료: ${url} (${processingTime}ms)`)

    return new Response(
      JSON.stringify({
        success: true,
        metadata: metadata,
        processing_time: processingTime,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`❌ 메타데이터 추출 오류: ${error.message} (${processingTime}ms)`)
    
    return new Response(
      JSON.stringify({ 
        error: '메타데이터 추출에 실패했습니다',
        code: 'EXTRACTION_FAILED',
        details: error.message,
        processing_time: processingTime,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

/* 사용 예시:

curl -i --location --request POST 'https://hgnojljsxnxpwenaacra.supabase.co/functions/v1/save-bookmark' \
  --header 'Authorization: Bearer [YOUR_ANON_KEY]' \
  --header 'Content-Type: application/json' \
  --data '{"url":"https://example.com"}'

*/
