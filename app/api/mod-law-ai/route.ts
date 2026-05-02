import { NextRequest, NextResponse } from 'next/server'
import { parseLawQuery, answerLawQuery } from '@/lib/mod-law-ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body ?? {}

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Expected JSON body: { query: string }' },
        { status: 400 }
      )
    }

    const parsed = parseLawQuery(query)
    const answer = answerLawQuery(parsed)

    return NextResponse.json({
      parsed,
      ...answer,
      meta: {
        mode: 'grounded',
        description: 'Natural language queries are parsed to extract intent and states, then matched against the static mod law database. No external AI service is used.',
        totalStates: 50,
        lastUpdated: '2024'
      }
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to process query',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Also support GET for simple health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    description: 'Mod Law AI endpoint. POST with { query: string } to ask questions.',
    examples: [
      'Is underglow legal in Texas?',
      'What are the tint laws in California?',
      'Which states are most lenient?',
      'Compare Texas vs California emissions laws'
    ]
  })
}
