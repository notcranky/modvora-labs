'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function PartnerLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        setError('Invalid email or password')
        setLoading(false)
        return
      }

      if (data.user) {
        // Check if user is moderator or admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('verified, verified_type')
          .eq('id', data.user.id)
          .single()

        if (!profile?.verified || !['admin', 'moderator'].includes(profile.verified_type)) {
          setError('Unauthorized. Partner access only.')
          await supabase.auth.signOut()
          setLoading(false)
          return
        }

        // Redirect to moderator dashboard
        window.location.href = '/partner/dashboard'
      }
    } catch {
      setError('Login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-purple-600 flex items-center justify-center text-2xl mb-4">
            🛡️
          </div>
          <h2 className="text-2xl font-bold text-white">Partner Moderator Portal</h2>
          <p className="mt-2 text-sm text-zinc-500">Access the content moderation dashboard</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[#1e1e24] bg-[#111116] px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-purple-500 transition-colors"
              placeholder="moderator@partner.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-400 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#1e1e24] bg-[#111116] px-4 py-3 text-white placeholder-zinc-600 outline-none focus:border-purple-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-purple-600 px-4 py-3 font-semibold text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in to Moderator Dashboard'}
          </button>
        </form>

        <div className="text-center text-sm">
          <Link href="/signin" className="text-zinc-500 hover:text-white transition-colors">
            ← Regular user login
          </Link>
        </div>
      </div>
    </div>
  )
}
