import { NextRequest, NextResponse } from 'next/server'
import { searchGroundedParts } from '@/lib/fitment-ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicle, query } = body ?? {}

    if (!vehicle || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Expected JSON body: { vehicle: { year, make, model, trim? }, query: string }' },
        { status: 400 }
      )
    }

    const result = searchGroundedParts(vehicle, query)

    return NextResponse.json({
      ...result,
      meta: {
        mode: 'grounded-demo',
        description:
          'Natural language is used only to derive structured intent. Final results are constrained to explicit fitment matches in the local demo database, with stricter result-lane suppression for replacement vs upgrade vs accessory intent.',
        sourcePolicy: 'Each result may expose only the source URL stored on its DB row. No external lookup is performed at request time, and source exactness is reported from the DB row rather than guessed.',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Invalid request body',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 400 }
    )
  }
}
