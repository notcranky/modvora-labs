'use client'

import { useEffect, useState } from 'react'
import { SessionUser } from '@/lib/session'

interface AuthState {
  user: SessionUser | null
  loading: boolean
}

const AUTH_CACHE_KEY = 'modvora_auth_cache_v1'
const AUTH_CACHE_TTL_MS = 5_000

let inFlightAuthRequest: Promise<SessionUser | null> | null = null

function readCachedUser(): SessionUser | null {
  if (typeof window === 'undefined') return null

  try {
    const raw = sessionStorage.getItem(AUTH_CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as { user: SessionUser | null; ts: number }
    if (!parsed || Date.now() - parsed.ts > AUTH_CACHE_TTL_MS) {
      sessionStorage.removeItem(AUTH_CACHE_KEY)
      return null
    }

    return parsed.user ?? null
  } catch {
    return null
  }
}

function writeCachedUser(user: SessionUser | null) {
  if (typeof window === 'undefined') return

  try {
    sessionStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({ user, ts: Date.now() }))
  } catch {}
}

async function fetchCurrentUser(signal?: AbortSignal): Promise<SessionUser | null> {
  if (!inFlightAuthRequest) {
    inFlightAuthRequest = fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      signal,
    })
      .then(async (res) => {
        if (!res.ok) return null
        const data = await res.json()
        const user = data.user ?? null
        writeCachedUser(user)
        return user
      })
      .catch(() => null)
      .finally(() => {
        inFlightAuthRequest = null
      })
  }

  return inFlightAuthRequest
}

export function useAuth(initialUser: SessionUser | null = null): AuthState {
  const cachedUser = readCachedUser()
  const [user, setUser] = useState<SessionUser | null>(cachedUser ?? initialUser)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    const syncAuth = () => {
      setLoading(true)
      fetchCurrentUser(controller.signal)
        .then((nextUser) => {
          if (!active) return
          setUser(nextUser)
        })
        .finally(() => {
          if (!active) return
          setLoading(false)
        })
    }

    syncAuth()

    const onFocus = () => syncAuth()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') syncAuth()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      active = false
      controller.abort()
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return { user, loading }
}

export async function signOut() {
  try {
    sessionStorage.removeItem(AUTH_CACHE_KEY)
  } catch {}

  await fetch('/api/auth/signout', {
    method: 'POST',
    credentials: 'same-origin',
    cache: 'no-store',
  })

  window.location.replace('/')
}
