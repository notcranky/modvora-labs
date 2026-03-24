import { NextRequest, NextResponse } from 'next/server'
import { searchRankedDDGImages } from '@/lib/car-photo-search'

const modKeywords: Record<string, string> = {
  lowered: 'lowered stance',
  wheels: 'aftermarket wheels',
  tint: 'tinted windows',
  lip: 'front lip',
  exhaust: 'exhaust tips',
  spoiler: 'spoiler wing',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year') || ''
  const make = searchParams.get('make') || ''
  const model = searchParams.get('model') || ''
  const trim = searchParams.get('trim') || ''
  const mods = (searchParams.get('mods') || '').split(',').filter(Boolean)

  if (!mods.length) return NextResponse.json({ photos: [] })

  const carIdentity = [year, make, model, trim].filter(Boolean).join(' ')
  const selectedKeywords = mods.map((mod) => modKeywords[mod] ?? mod)
  const desiredKeywords = [year, make, model, ...mods, ...selectedKeywords].filter(Boolean)
  const rejectKeywords = ['interior', 'engine bay', 'dyno graph', 'logo', 'wallpaper', 'render', 'for sale', 'salvage']

  const queries = [
    `${carIdentity} ${selectedKeywords.join(' ')}`,
    `${year} ${make} ${model} ${selectedKeywords.join(' ')}`,
    `${make} ${model} ${selectedKeywords.join(' ')}`,
    `${make} ${model} modified ${selectedKeywords.join(' ')}`,
  ]

  const photos: string[] = []
  const seen = new Set<string>()

  for (const query of queries) {
    if (photos.length >= 6) break

    const preferredKeywords = ['modified', 'build', 'stance', 'aftermarket', ...selectedKeywords]
    const ranked = await searchRankedDDGImages({
      query,
      desiredKeywords,
      preferredKeywords,
      rejectKeywords,
      vehicle: {
        year,
        make,
        model,
        trim,
        mode: 'modified',
      },
      limit: 8,
    })

    for (const photo of ranked) {
      if (seen.has(photo)) continue
      seen.add(photo)
      photos.push(photo)
      if (photos.length >= 6) break
    }
  }

  return NextResponse.json({ photos })
}
