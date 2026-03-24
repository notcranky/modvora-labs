export interface DuckDuckGoImageResult {
  image?: string
  thumbnail?: string
  url?: string
  title?: string
  source?: string
  width?: number | string
  height?: number | string
}

interface DuckDuckGoImageResponse {
  results?: DuckDuckGoImageResult[]
}

export interface VehiclePhotoContext {
  year?: string
  make?: string
  model?: string
  trim?: string
  bodyStyle?: string
  mode?: 'stock' | 'modified'
}

const BAD_HOST_PATTERNS = [
  /pinimg\.com$/i,
  /pinterest\./i,
  /facebook\./i,
  /instagram\./i,
  /tiktok\./i,
  /twitter\./i,
  /x\.com$/i,
  /reddit\./i,
]

const GOOD_HOST_PATTERNS = [
  /caranddriver\./i,
  /motor1\./i,
  /motortrend\./i,
  /roadandtrack\./i,
  /edmunds\./i,
  /autoblog\./i,
  /carscoops\./i,
  /topgear\./i,
  /netcarshow\./i,
  /carsized\./i,
  /media\.[a-z0-9-]+\.(com|net)$/i,
]

const PREMIUM_EDITORIAL_HOST_PATTERNS = [
  /caranddriver\./i,
  /motor1\./i,
  /motortrend\./i,
  /roadandtrack\./i,
  /topgear\./i,
  /carscoops\./i,
  /driving\./i,
  /whichcar\./i,
  /carwow\./i,
  /slashgear\./i,
  /jalopnik\./i,
  /autoevolution\./i,
  /edmunds\./i,
  /netcarshow\./i,
]

const REFERENCE_STYLE_HOST_PATTERNS = [
  /wikipedia\./i,
  /wikimedia\./i,
  /commons\.wikimedia\./i,
  /cars-data\./i,
  /veh-markets\./i,
]

const AUCTION_OR_LISTING_HOST_PATTERNS = [
  /bringatrailer\./i,
  /cars\.com$/i,
  /autotrader\./i,
  /carfax\./i,
  /copart\./i,
  /iaai\./i,
  /ebay\./i,
  /craigslist\./i,
  /facebook\./i,
]

const BODY_STYLE_GROUPS = [
  ['sedan', 'saloon'],
  ['coupe'],
  ['hatchback', 'hatch', 'sportback'],
  ['wagon', 'estate', 'avant', 'touring'],
  ['convertible', 'cabriolet', 'cabrio', 'roadster', 'spyder', 'soft top', 'drophead'],
  ['suv', 'crossover'],
  ['truck', 'pickup'],
  ['van', 'minivan'],
  ['crew cab', 'double cab', 'quad cab', 'supercrew'],
  ['extended cab', 'supercab'],
  ['regular cab', 'single cab'],
  ['fastback', 'liftback', 'shooting brake'],
]

const POSITIVE_STYLE_PATTERNS = [
  /\b(exterior|press photo|press image|media image|review|road test|first drive|hero|walkaround)\b/i,
  /\b(front\s*3\/?4|front three quarter|rear\s*3\/?4|rear three quarter|side\s*3\/?4|side three quarter|profile|side view)\b/i,
  /\b(full car|full vehicle|entire car|whole car)\b/i,
  /\b(daylight|sunlight|golden hour|sunset|sunrise|mountain road|scenic|coast|coastal|desert|forest|canyon|editorial)\b/i,
]

const NEGATIVE_STYLE_PATTERNS = [
  /\b(dealer|dealership|inventory|listing|for sale|used car|classified|price|finance|mileage|stock #|vin)\b/i,
  /\b(auction|salvage|wrecked|damaged|copart|iaai|rebuilt)\b/i,
  /\b(forum|thread|build thread|avatar|signature|post image)\b/i,
  /\b(wallpaper|render|cgi|concept art|vector|logo|icon|brochure)\b/i,
  /\b(interior|engine bay|steering wheel|dashboard|taillight|headlight|wheel only|rim only|badge|emblem)\b/i,
  /\b(cropped|crop|close up|close-up|thumbnail|thumb)\b/i,
  /\b(parking lot|car lot|row of cars|lot full of cars|background cars)\b/i,
  /\b(text overlay|watermark|gallery|slideshow|walkaround video|youtube thumbnail)\b/i,
]

const HERO_STYLE_PATTERNS = [
  /\b(front\s*3\/?4|front three quarter)\b/i,
  /\b(side\s*3\/?4|side three quarter|rear\s*3\/?4|rear three quarter)\b/i,
  /\b(profile|side view)\b/i,
  /\b(hero|press photo|press image|media image|review|road test|first drive|editorial)\b/i,
  /\b(full car|full vehicle|entire car|whole car|exterior)\b/i,
  /\b(scenic|mountain|canyon|coast|coastal|ocean|desert|forest|road|highway|downtown|cityscape|sunset|sunrise|golden hour)\b/i,
  /\b(clean background|studio|location shoot|dynamic)\b/i,
]

const BORING_REFERENCE_PATTERNS = [
  /\b(wikipedia|wikimedia|commons)\b/i,
  /\b(brochure|spec sheet|dimensions|press kit pdf)\b/i,
  /\b(plain background|white background|transparent background|cutout|isolated)\b/i,
  /\b(dealer lot|parking lot|inventory photo|walkaround|listing photo)\b/i,
]

const COMPOSITION_NEGATIVE_PATTERNS = [
  /\b(close up|close-up|detail shot|badge|emblem|headlight|taillight|wheel only|rim only)\b/i,
  /\b(cropped|crop|partial|half car|front clip|rear clip)\b/i,
  /\b(collage|montage|comparison chart|spec graphic|text overlay|watermark)\b/i,
]

const PERFORMANCE_TRIM_TOKENS = new Set([
  'type', 'type-r', 'type s', 'si', 'ss', 'zl1', 'zl', 'z06', 'z71', 'zr1', 'gt', 'gti', 'gts', 'gt3', 'gt350',
  'gt500', 'mach', 'srt', 'rt', 'r/t', 'hellcat', 'scat', '392', 'm', 'm2', 'm3', 'm4', 'm5', 'amg', 'rs', 's-line',
  'st', 'sti', 'wrx', 'trd', 'gr', 'nismo', 'cupra', 'v', 'v-series', 'svr', 'quadrifoglio', 'turbo', 'sport',
  'sportback', 'trackhawk', 'raptor', 'trx', 'denali', 'platinum', 'limited', 'premier', 'signature'
])

export interface RankedImageCandidate {
  url: string
  score: number
}

function numberValue(value?: number | string): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
}

function uniqueTokens(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.flatMap((value) => tokenize(value ?? ''))))
}

function getHostname(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

function normalizeImageUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl)
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return rawUrl
  }
}

function extractYears(text: string): number[] {
  return Array.from(text.matchAll(/\b(19\d{2}|20\d{2}|21\d{2})\b/g), (match) => Number(match[1])).filter(
    (value) => value >= 1980 && value <= 2035
  )
}

function getBodyStyleSignals(text: string): string[] {
  const lower = text.toLowerCase()
  return BODY_STYLE_GROUPS.flatMap((group) => (group.some((term) => lower.includes(term)) ? [group[0]] : []))
}

function getTrimSignals(trim?: string): string[] {
  const tokens = uniqueTokens([trim]).filter((token) => token.length >= 2)
  return tokens.filter((token) => PERFORMANCE_TRIM_TOKENS.has(token) || /\d/.test(token) || token.length >= 4)
}

function hasAllTokens(text: string, tokens: string[]): boolean {
  return tokens.length > 0 && tokens.every((token) => text.includes(token))
}

function countMatches(text: string, tokens: string[]): number {
  return tokens.reduce((count, token) => count + (text.includes(token) ? 1 : 0), 0)
}

function likelyJunk(result: DuckDuckGoImageResult, desiredKeywords: string[], rejectKeywords: string[]): boolean {
  const imageUrl = result.image ?? result.thumbnail ?? ''
  const sourceUrl = result.url ?? ''
  const haystack = `${imageUrl} ${sourceUrl} ${result.title ?? ''} ${result.source ?? ''}`.toLowerCase()
  const host = getHostname(imageUrl || sourceUrl)

  if (!imageUrl) return true
  if (BAD_HOST_PATTERNS.some((pattern) => pattern.test(host))) return true
  if (NEGATIVE_STYLE_PATTERNS.some((pattern) => pattern.test(haystack))) return true
  if (/[_/-](thumb|thumbnail|small|tiny|icon)[_./-]/i.test(haystack)) return true

  const hasDesired = desiredKeywords.some((keyword) => haystack.includes(keyword))
  const hasRejected = rejectKeywords.some((keyword) => haystack.includes(keyword))

  if (!hasDesired) return true
  if (hasRejected && !hasDesired) return true

  return false
}

function relevanceScore(text: string, desiredKeywords: string[], preferredKeywords: string[], rejectKeywords: string[]): number {
  let score = 0

  for (const keyword of desiredKeywords) {
    if (text.includes(keyword)) score += 16
  }

  for (const keyword of preferredKeywords) {
    if (text.includes(keyword)) score += 9
  }

  for (const keyword of rejectKeywords) {
    if (text.includes(keyword)) score -= 18
  }

  for (const pattern of POSITIVE_STYLE_PATTERNS) {
    if (pattern.test(text)) score += 10
  }

  for (const pattern of NEGATIVE_STYLE_PATTERNS) {
    if (pattern.test(text)) score -= 24
  }

  return score
}

function vehicleIdentityScore(text: string, vehicle: VehiclePhotoContext): number {
  const lower = text.toLowerCase()
  const year = vehicle.year?.trim() ?? ''
  const makeTokens = uniqueTokens([vehicle.make])
  const modelTokens = uniqueTokens([vehicle.model])
  const trimSignals = getTrimSignals(vehicle.trim)
  const requestedBodyStyles = getBodyStyleSignals([vehicle.model, vehicle.trim, vehicle.bodyStyle].filter(Boolean).join(' '))
  const resultBodyStyles = getBodyStyleSignals(lower)

  let score = 0

  if (year) {
    const years = extractYears(lower)
    if (years.includes(Number(year))) score += 42
    else if (years.length > 0) score -= 54
    else score -= 10
  }

  if (hasAllTokens(lower, makeTokens)) score += 28
  else score -= 55

  if (hasAllTokens(lower, modelTokens)) score += 34
  else score -= 75

  const makeModelTokens = [...makeTokens, ...modelTokens]
  const makeModelMatches = countMatches(lower, makeModelTokens)
  if (makeModelMatches === makeModelTokens.length && makeModelTokens.length > 1) score += 18
  else if (makeModelMatches > 0) score -= 10

  if (trimSignals.length) {
    const trimMatches = countMatches(lower, trimSignals)
    score += trimMatches * 16

    const hasConflictingPerformanceTrim = Array.from(PERFORMANCE_TRIM_TOKENS).some(
      (token) => lower.includes(token) && !trimSignals.includes(token)
    )

    if (trimMatches === 0 && hasConflictingPerformanceTrim) score -= 26
  }

  if (requestedBodyStyles.length) {
    const matchesRequestedBodyStyle = requestedBodyStyles.some((style) => resultBodyStyles.includes(style))
    if (matchesRequestedBodyStyle) score += 20
    else if (resultBodyStyles.length > 0) score -= 34
  }

  if (vehicle.mode === 'stock') {
    if (hasAllTokens(lower, [...makeTokens, ...modelTokens]) && year && lower.includes(year)) score += 28
    if (/\b(concept|prototype|test mule|camouflaged)\b/i.test(lower)) score -= 45
  }

  return score
}

function beautyScore(text: string, host: string, width: number, height: number): number {
  const lower = text.toLowerCase()
  const pixels = width * height
  const aspect = width > 0 && height > 0 ? width / height : 0
  let score = 0

  for (const pattern of HERO_STYLE_PATTERNS) {
    if (pattern.test(lower)) score += 12
  }

  for (const pattern of BORING_REFERENCE_PATTERNS) {
    if (pattern.test(lower)) score -= 18
  }

  for (const pattern of COMPOSITION_NEGATIVE_PATTERNS) {
    if (pattern.test(lower)) score -= 24
  }

  if (PREMIUM_EDITORIAL_HOST_PATTERNS.some((pattern) => pattern.test(host))) score += 20
  if (GOOD_HOST_PATTERNS.some((pattern) => pattern.test(host))) score += 8
  if (REFERENCE_STYLE_HOST_PATTERNS.some((pattern) => pattern.test(host))) score -= 24
  if (AUCTION_OR_LISTING_HOST_PATTERNS.some((pattern) => pattern.test(host))) score -= 32

  if (pixels >= 4_000_000) score += 26
  else if (pixels >= 2_500_000) score += 18
  else if (pixels >= 1_500_000) score += 10
  else if (pixels > 0 && pixels < 700_000) score -= 28

  if (width > 0 && height > 0) {
    if (width < 900 || height < 550) score -= 28
    if (aspect >= 1.35 && aspect <= 1.95) score += 14
    else if (aspect >= 1.15 && aspect <= 2.2) score += 6
    else if (aspect < 0.95 || aspect > 2.5) score -= 18
  }

  if (/\b(front\s*3\/?4|front three quarter)\b/i.test(lower)) score += 16
  if (/\b(side\s*3\/?4|side three quarter|rear\s*3\/?4|rear three quarter)\b/i.test(lower)) score += 12
  if (/\b(profile|side view)\b/i.test(lower)) score += 8
  if (/\b(full car|full vehicle|entire car|whole car)\b/i.test(lower)) score += 12
  if (/\b(editorial|review|road test|first drive|press photo|press image|media image|hero)\b/i.test(lower)) score += 14
  if (/\b(sunset|sunrise|golden hour|mountain|canyon|coast|coastal|scenic|forest|desert|cityscape|downtown)\b/i.test(lower)) score += 12

  if (/\b(white background|plain background|transparent background|isolated)\b/i.test(lower)) score -= 14
  if (/\b(parking lot|dealer lot|inventory|for sale|classified|auction|salvage)\b/i.test(lower)) score -= 30
  if (/\b(collage|watermark|text overlay|comparison chart|spec sheet)\b/i.test(lower)) score -= 32
  if (/\b(interior|engine bay|dashboard|steering wheel|wheel only|rim only|badge|emblem|close up|close-up|detail shot)\b/i.test(lower)) score -= 32

  return score
}

export async function getDDGToken(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        next: { revalidate: 86400 },
      }
    )

    if (!res.ok) return null

    const html = await res.text()
    const patterns = [
      /vqd=['"]([^'"]+)['"]/, 
      /"vqd"\s*:\s*"([^"]+)"/,
      /vqd=([0-9][^&\s'"<]+)/,
      /initialVqd['"]\s*:\s*['"]([^'"]+)['"]/
    ]

    for (const pattern of patterns) {
      const match = html.match(pattern)
      if (match?.[1]) return match[1]
    }

    return null
  } catch {
    return null
  }
}

export async function searchRankedDDGImageCandidates({
  query,
  desiredKeywords,
  preferredKeywords = [],
  rejectKeywords = [],
  vehicle = {},
  limit = 8,
}: {
  query: string
  desiredKeywords: string[]
  preferredKeywords?: string[]
  rejectKeywords?: string[]
  vehicle?: VehiclePhotoContext
  limit?: number
}): Promise<RankedImageCandidate[]> {
  try {
    const vqd = await getDDGToken(query)
    if (!vqd) return []

    const params = new URLSearchParams({ q: query, vqd, o: 'json', f: ',,,,,', p: '-1' })
    const res = await fetch(`https://duckduckgo.com/i.js?${params}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: 'https://duckduckgo.com/',
        Accept: 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.5',
        'X-Requested-With': 'XMLHttpRequest',
      },
      next: { revalidate: 86400 },
    })

    if (!res.ok) return []

    const data: DuckDuckGoImageResponse = await res.json()
    const seen = new Set<string>()
    const desiredTokens = Array.from(new Set(desiredKeywords.flatMap(tokenize)))
    const normalizedPreferred = preferredKeywords.map((item) => item.toLowerCase())
    const normalizedRejected = rejectKeywords.map((item) => item.toLowerCase())

    return (data.results ?? [])
      .map((result) => {
        const imageUrl = result.image ?? result.thumbnail ?? ''
        const sourceUrl = result.url ?? ''
        const normalized = normalizeImageUrl(imageUrl)
        const width = numberValue(result.width)
        const height = numberValue(result.height)
        const host = getHostname(imageUrl || sourceUrl)
        const text = `${imageUrl} ${sourceUrl} ${result.title ?? ''} ${result.source ?? ''}`
        const lower = text.toLowerCase()

        if (!imageUrl || seen.has(normalized)) return null
        seen.add(normalized)

        if (likelyJunk(result, desiredTokens, normalizedRejected)) return null

        let score = 0
        score += relevanceScore(lower, desiredTokens, normalizedPreferred, normalizedRejected)
        score += vehicleIdentityScore(lower, vehicle)
        score += beautyScore(lower, host, width, height)

        if (/\.(webp|jpg|jpeg|png)(?:$|\?)/i.test(imageUrl)) score += 3

        return { url: imageUrl, score }
      })
      .filter((item): item is RankedImageCandidate => Boolean(item))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  } catch {
    return []
  }
}

export async function searchRankedDDGImages(options: {
  query: string
  desiredKeywords: string[]
  preferredKeywords?: string[]
  rejectKeywords?: string[]
  vehicle?: VehiclePhotoContext
  limit?: number
}): Promise<string[]> {
  const ranked = await searchRankedDDGImageCandidates(options)
  return ranked.map((item) => item.url)
}
