export async function analyzeSite(url: string): Promise<{ tags: string[] }> {
  try {
    // Use r.jina.ai to bypass CORS and fetch site HTML
    const res = await fetch(`https://r.jina.ai/${url}`)
    const html = await res.text()
    const doc = new DOMParser().parseFromString(html, 'text/html')

    // Try to extract keywords meta tag
    const keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || ''
    const tags = keywords.split(',').map(k => k.trim()).filter(Boolean)

    return { tags }
  } catch (e) {
    console.warn('Failed to analyze site', e)
    return { tags: [] }
  }
}
