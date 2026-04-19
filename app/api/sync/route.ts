import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_NAME, verifySession } from '@/lib/session'
import { promises as fs } from 'fs'
import path from 'path'

const SYNC_FILE = path.join(process.cwd(), 'data', 'build-sync.json')

async function readSyncFile(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(SYNC_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

async function writeSyncFile(data: Record<string, string>) {
  await fs.mkdir(path.dirname(SYNC_FILE), { recursive: true })
  await fs.writeFile(SYNC_FILE, JSON.stringify(data), 'utf-8')
}

async function getAuthedUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

export async function GET() {
  const user = await getAuthedUser()
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const data = await readSyncFile()
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const user = await getAuthedUser()
  if (!user || user.role !== 'owner') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  await writeSyncFile(body)
  return NextResponse.json({ ok: true })
}
