import { NextRequest, NextResponse } from 'next/server'
import { searchRankedDDGImageCandidates } from '@/lib/car-photo-search'

async function proxyThumbnail(url: string): Promise<NextResponse | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const buf = await res.arrayBuffer()
    const ct = res.headers.get('content-type') || 'image/jpeg'
    if (!ct.startsWith('image/')) return null
    return new NextResponse(buf, {
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year') || ''
  const make = searchParams.get('make') || ''
  const model = searchParams.get('model') || ''
  const trim = searchParams.get('trim') || ''
  const bodyStyle = searchParams.get('bodyStyle') || ''

  const identity = [year, make, model, trim].filter(Boolean).join(' ')
  const desiredKeywords = [year, make, model, trim, bodyStyle].filter(Boolean)

  const queries = [
    `${identity} stock exterior press photo`,
    `${identity} exterior review`,
    `${identity} front 3/4 review`,
    `${identity} scenic exterior`,
    `${identity} first drive exterior`,
    `${year} ${make} ${model} stock side profile`,
    `${make} ${model} ${year} factory exterior`,
  ]

  const preferredKeywords = [
    'stock',
    'oem',
    'factory',
    'review',
    'editorial',
    'exterior',
    'press photo',
    'press image',
    'media image',
    'first drive',
    'road test',
    'hero',
    'front 3/4',
    'front three quarter',
    'side 3/4',
    'side profile',
    'full car',
    'scenic',
    'sunset',
    'mountain road',
  ]
  const rejectKeywords = [
    'modified',
    'lowered',
    'stance',
    'widebody',
    'render',
    'wallpaper',
    'interior',
    'engine',
    'for sale',
    'dealer',
    'auction',
    'salvage',
    'forum',
    'copart',
    'iaai',
    'wikipedia',
    'wikimedia',
  ]

  const allCandidates = new Map<string, number>()

  for (const query of queries) {
    const candidates = await searchRankedDDGImageCandidates({
      query,
      desiredKeywords,
      preferredKeywords,
      rejectKeywords,
      vehicle: {
        year,
        make,
        model,
        trim,
        bodyStyle,
        mode: 'stock',
      },
      limit: 8,
    })

    for (const candidate of candidates) {
      const previous = allCandidates.get(candidate.url)
      if (previous == null || candidate.score > previous) {
        allCandidates.set(candidate.url, candidate.score)
      }
    }
  }

  const ranked = Array.from(allCandidates.entries())
    .map(([url, score]) => ({ url, score }))
    .sort((a, b) => b.score - a.score)

  for (const candidate of ranked) {
    const proxied = await proxyThumbnail(candidate.url)
    if (proxied) return proxied
  }

  return new NextResponse(null, { status: 404 })
}
