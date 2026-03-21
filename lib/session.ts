// Session management using Web Crypto API (works in Edge + Node.js + Browser)

export const COOKIE_NAME = 'modvora_session'
const SECRET = process.env.AUTH_SECRET ?? 'modvora-dev-secret-change-in-production'

export interface SessionUser {
  email: string
  name: string
  role: 'owner' | 'admin' | 'customer'
}

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function toBase64url(buf: ArrayBuffer): string {
  let str = ''
  new Uint8Array(buf).forEach(b => (str += String.fromCharCode(b)))
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function fromBase64url(str: string): ArrayBuffer {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=')
  const bin = atob(padded)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf.buffer
}

export async function createSession(user: SessionUser): Promise<string> {
  const enc = new TextEncoder()
  const payload = { ...user, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 }
  const data = toBase64url(enc.encode(JSON.stringify(payload)).buffer as ArrayBuffer)
  const key = await getKey()
  const sig = toBase64url(await crypto.subtle.sign('HMAC', key, enc.encode(data)))
  return `${data}.${sig}`
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const [data, sig] = token.split('.')
    if (!data || !sig) return null
    const enc = new TextEncoder()
    const key = await getKey()
    const valid = await crypto.subtle.verify('HMAC', key, fromBase64url(sig), enc.encode(data))
    if (!valid) return null
    const dec = new TextDecoder()
    const payload = JSON.parse(dec.decode(fromBase64url(data)))
    if (payload.exp < Date.now()) return null
    return { email: payload.email, name: payload.name, role: payload.role }
  } catch {
    return null
  }
}
