'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const isVerifyMode = !!token

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send reset request')
        setLoading(false)
        return
      }

      setSuccess(data.message || 'Reset instructions sent!')
      setLoading(false)
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to update password')
        setLoading(false)
        return
      }

      setSuccess(data.message || 'Password updated! Redirecting to sign in...')
      setLoading(false)

      // Redirect to sign in after 2 seconds
      setTimeout(() => {
        window.location.href = '/signin'
      }, 2000)
    } catch {
      setError('Something went wrong. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center px-4 py-20">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-purple-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
              M
            </div>
            <span className="text-white font-bold text-xl">Modvora <span className="text-purple-400">Labs</span></span>
          </Link>
          <h1 className="text-white text-2xl font-black mb-2">
            {isVerifyMode ? 'Set New Password' : 'Reset Password'}
          </h1>
          <p className="text-zinc-500 text-sm">
            {isVerifyMode
              ? 'Enter your new password below'
              : 'Enter your email to receive reset instructions'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#16161a] border border-[#2a2a30] rounded-2xl p-8">
          {/* Success message */}
          {success && (
            <div className="mb-5 p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2">
              <span className="text-green-400 text-sm">✓</span>
              <p className="text-green-300 text-sm">{success}</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-5 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-2">
              <span className="text-red-400 text-sm">⚠</span>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {isVerifyMode ? (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    className="w-full bg-[#0f0f12] border border-[#2a2a30] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-zinc-600 text-xs mt-1">Must be at least 6 characters</p>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-[#0f0f12] border border-[#2a2a30] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all mt-2 ${
                  loading
                    ? 'bg-purple-600/50 text-white/50 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password →'
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-medium uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full bg-[#0f0f12] border border-[#2a2a30] focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 text-white placeholder-zinc-600 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all mt-2 ${
                  loading
                    ? 'bg-purple-600/50 text-white/50 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-500 text-white'
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link →'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Back to sign in */}
        <div className="mt-6 text-center">
          <Link
            href="/signin"
            className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
          >
            ← Back to Sign In
          </Link>
        </div>

        <p className="text-center text-zinc-700 text-xs mt-6">
          <Link href="/" className="hover:text-zinc-500 transition-colors">← Back to home</Link>
        </p>
      </div>
    </div>
  )
}
