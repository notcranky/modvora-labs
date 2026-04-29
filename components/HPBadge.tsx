'use client'

interface HPBadgeProps {
  hp?: number | null
  crankHP?: number | null
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export default function HPBadge({ hp, crankHP, size = 'md', showLabel = true }: HPBadgeProps) {
  const displayHP = hp ?? crankHP
  if (!displayHP || displayHP <= 0) return null

  const isWHP = hp !== null && hp !== undefined

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-0.5',
    md: 'px-2 py-0.5 text-xs gap-1',
    lg: 'px-2.5 py-1 text-sm gap-1',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 border border-orange-500/30 text-orange-400 font-medium ${sizeClasses[size]}`}
      title={isWHP ? 'Wheel Horsepower (WHP)' : 'Crank Horsepower'}
    >
      <span className={size === 'sm' ? 'text-[10px]' : 'text-sm'}>🔥</span>
      <span>{displayHP.toLocaleString()}hp</span>
      {showLabel && isWHP && (
        <span className="text-orange-500/70 text-[10px] hidden sm:inline">WHP</span>
      )}
    </span>
  )
}

// Helper to get HP from localStorage
const HP_STORAGE_KEY = 'modvora_profile_hp'
const CRANK_HP_STORAGE_KEY = 'modvora_profile_crank_hp'

export function getStoredHP(): { whp: number | null; crank: number | null } {
  if (typeof window === 'undefined') return { whp: null, crank: null }
  try {
    const whp = localStorage.getItem(HP_STORAGE_KEY)
    const crank = localStorage.getItem(CRANK_HP_STORAGE_KEY)
    return {
      whp: whp ? parseInt(whp, 10) : null,
      crank: crank ? parseInt(crank, 10) : null,
    }
  } catch {
    return { whp: null, crank: null }
  }
}

export function storeHP(whp: number | null, crank: number | null): void {
  if (typeof window === 'undefined') return
  try {
    if (whp !== null && whp > 0) {
      localStorage.setItem(HP_STORAGE_KEY, whp.toString())
    } else {
      localStorage.removeItem(HP_STORAGE_KEY)
    }
    if (crank !== null && crank > 0) {
      localStorage.setItem(CRANK_HP_STORAGE_KEY, crank.toString())
    } else {
      localStorage.removeItem(CRANK_HP_STORAGE_KEY)
    }
  } catch {}
}
