'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Nomination, VotingPhase,
  getCurrentWeekId, getVotingPhase, getPhaseLabel, getPhaseDescription, getTimeUntilNextPhase,
  getNominations, getVoteCounts, getUserVote, castVote, submitNomination,
  subscribeToVotes, subscribeToNominations,
} from '@/lib/voting'
import { loadCommunityPosts } from '@/lib/community'

// ── Helpers ──────────────────────────────────────────────────────────────────

function PhaseBar({ phase, timeLeft }: { phase: VotingPhase; timeLeft: string }) {
  const colors: Record<VotingPhase, string> = {
    nominations: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
    final:       'bg-orange-500/20 border-orange-500/30 text-orange-300',
    results:     'bg-yellow-500/20 border-yellow-500/30 text-yellow-300',
  }
  return (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm ${colors[phase]}`}>
      <span className="font-semibold">{getPhaseLabel(phase)}</span>
      <span className="opacity-70">{timeLeft}</span>
    </div>
  )
}

function VoteBar({ count, total }: { count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>{count} {count === 1 ? 'vote' : 'votes'}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-[#1e1e24] rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ── NomineeCard ───────────────────────────────────────────────────────────────

interface NomineeCardProps {
  nomination: Nomination
  voteCount: number
  totalVotes: number
  myVote: string | null
  phase: VotingPhase
  rank?: number
  isWinner?: boolean
  onVote: (nominationId: string) => void
  voting: boolean
}

function NomineeCard({ nomination, voteCount, totalVotes, myVote, phase, rank, isWinner, onVote, voting }: NomineeCardProps) {
  const voted = myVote === nomination.id
  const canVote = phase !== 'results'
  const isTop3 = rank !== undefined && rank <= 3

  return (
    <div className={`relative rounded-2xl border bg-[#0e0e12] overflow-hidden transition-all ${
      voted ? 'border-purple-500/60 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'border-[#1e1e24] hover:border-[#2a2a35]'
    } ${isWinner ? 'border-yellow-500/60 shadow-[0_0_30px_rgba(234,179,8,0.2)]' : ''}`}>

      {/* Rank badge */}
      {rank && phase !== 'nominations' && (
        <div className={`absolute top-3 left-3 z-10 flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
          rank === 1 ? 'bg-yellow-500 text-black' :
          rank === 2 ? 'bg-zinc-400 text-black' :
          rank === 3 ? 'bg-orange-600 text-white' : 'bg-[#1e1e24] text-zinc-400'
        }`}>
          {rank === 1 && isWinner ? '👑' : `#${rank}`}
        </div>
      )}

      {/* Photo */}
      <div className="relative w-full overflow-hidden bg-[#0a0a0e]" style={{ aspectRatio: '16/9' }}>
        {nomination.post_hero_image ? (
          <img
            src={nomination.post_hero_image}
            alt={nomination.post_title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-700">
            <svg viewBox="0 0 24 24" className="h-10 w-10 fill-none stroke-current" strokeWidth={1.5}>
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        {voted && (
          <div className="absolute inset-0 bg-purple-500/10 flex items-end justify-end p-3">
            <span className="bg-purple-500 text-white text-xs font-semibold px-2 py-1 rounded-full">Your vote ✓</span>
          </div>
        )}
        {isWinner && (
          <div className="absolute inset-0 bg-yellow-500/10 flex items-end justify-end p-3">
            <span className="bg-yellow-500 text-black text-xs font-semibold px-2 py-1 rounded-full">🏆 Winner</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-white text-sm leading-tight">{nomination.post_title}</h3>
          {nomination.vehicle_label && (
            <p className="text-xs text-zinc-500 mt-0.5">{nomination.vehicle_label}</p>
          )}
        </div>

        {/* Live vote count */}
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold tabular-nums ${voted ? 'text-purple-400' : 'text-white'}`}>
            {voteCount}
          </span>
          <VoteBar count={voteCount} total={totalVotes} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canVote && (
            <button
              onClick={() => onVote(nomination.id)}
              disabled={voting}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
                voted
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/10'
                  : 'bg-purple-600 text-white hover:bg-purple-500 active:scale-95'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {voting ? '...' : voted ? 'Change vote' : 'Vote'}
            </button>
          )}
          <Link
            href={`/community/${nomination.post_slug}`}
            className="rounded-xl border border-[#2a2a35] px-3 py-2.5 text-sm text-zinc-400 hover:text-white hover:border-zinc-600 transition-colors"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── SubmitModal ───────────────────────────────────────────────────────────────

interface SubmitModalProps {
  weekId: string
  userId: string
  onClose: () => void
  onSuccess: () => void
}

function SubmitModal({ weekId, userId, onClose, onSuccess }: SubmitModalProps) {
  const myPosts = loadCommunityPosts().filter(p => p.state === 'published')
  const [selectedId, setSelectedId] = useState(myPosts[0]?.id ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    const post = myPosts.find(p => p.id === selectedId)
    if (!post) return
    setSubmitting(true)
    setError('')
    const result = await submitNomination({
      weekId,
      postId: post.id,
      postSlug: post.slug,
      postTitle: post.title,
      postHeroImage: post.heroImage,
      vehicleLabel: '',
      submitterUserId: userId,
    })
    setSubmitting(false)
    if (result.ok) {
      onSuccess()
      onClose()
    } else {
      setError(result.error ?? 'Failed to submit')
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-2xl border border-[#2a2a35] bg-[#111116] p-6 shadow-2xl max-w-md mx-auto">
        <h2 className="text-lg font-semibold text-white mb-1">Nominate Your Build</h2>
        <p className="text-sm text-zinc-500 mb-5">Submit your published build for Build of the Week voting.</p>

        {myPosts.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-zinc-400 text-sm mb-4">You need a published community build to nominate.</p>
            <Link href="/dashboard/publish" className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500">
              Publish a Build
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-5">
              {myPosts.map(post => (
                <button
                  key={post.id}
                  onClick={() => setSelectedId(post.id)}
                  className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                    selectedId === post.id ? 'border-purple-500/60 bg-purple-500/10' : 'border-[#2a2a35] hover:border-zinc-600'
                  }`}
                >
                  {post.heroImage && (
                    <img src={post.heroImage} alt={post.title} className="h-12 w-16 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{post.title}</p>
                    <p className="text-xs text-zinc-500 capitalize">{post.status}</p>
                  </div>
                  {selectedId === post.id && (
                    <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-purple-500 flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-white" strokeWidth={3}>
                        <path d="m20 6-11 11-5-5" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {error && <p className="text-sm text-red-400 mb-3">{error}</p>}

            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 rounded-xl border border-[#2a2a35] py-2.5 text-sm text-zinc-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedId}
                className="flex-1 rounded-xl bg-purple-600 py-2.5 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Build'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}

// ── Fallback sample nominees (shown when DB has no nominations yet) ───────────

const SAMPLE_NOMINATIONS: Nomination[] = [
  {
    id: 'demo-wrx',
    week_id: '',
    post_id: 'sample-nom-wrx',
    post_slug: 'widebody-wrx-sti-build',
    post_title: 'Widebody WRX STI',
    post_hero_image: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=800&q=80',
    vehicle_label: '2018 Subaru WRX STI',
    submitter_user_id: 'sample',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-gr86',
    week_id: '',
    post_id: 'sample-nom-gr86',
    post_slug: 'gr86-track-day-spec',
    post_title: 'GR86 Track Day Spec',
    post_hero_image: 'https://images.unsplash.com/photo-1632245889029-e406faaa34cd?w=800&q=80',
    vehicle_label: '2023 Toyota GR86',
    submitter_user_id: 'sample',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-350z',
    week_id: '',
    post_id: 'sample-nom-350z',
    post_slug: 'track-built-350z',
    post_title: 'Track-Built 350Z',
    post_hero_image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=800&q=80',
    vehicle_label: '2004 Nissan 350Z',
    submitter_user_id: 'sample',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-mustang',
    week_id: '',
    post_id: 'sample-nom-mustang',
    post_slug: 'coyote-mustang-gt',
    post_title: 'Coyote Mustang GT',
    post_hero_image: 'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&q=80',
    vehicle_label: '2021 Ford Mustang GT',
    submitter_user_id: 'sample',
    created_at: new Date().toISOString(),
  },
  {
    id: 'demo-m2',
    week_id: '',
    post_id: 'sample-nom-m2',
    post_slug: 'bmw-m2-competition',
    post_title: 'BMW M2 Competition',
    post_hero_image: 'https://images.unsplash.com/photo-1555626906-fcf10d6851b4?w=800&q=80',
    vehicle_label: '2020 BMW M2 Competition',
    submitter_user_id: 'sample',
    created_at: new Date().toISOString(),
  },
]

const SAMPLE_VOTES: Record<string, number> = {
  'demo-wrx': 8,
  'demo-gr86': 6,
  'demo-350z': 5,
  'demo-mustang': 2,
  'demo-m2': 1,
}

// ── VotingHub (main export) ───────────────────────────────────────────────────

interface VotingHubProps {
  userId: string | null   // hashed UUID — null = guest
  isLoggedIn: boolean
}

export default function VotingHub({ userId, isLoggedIn }: VotingHubProps) {
  const weekId = getCurrentWeekId()
  const phase = getVotingPhase()
  const timeLeft = getTimeUntilNextPhase()

  const [nominations, setNominations] = useState<Nomination[]>([])
  const [voteCounts, setVoteCounts] = useState<Record<string, number>>({})
  const [myVote, setMyVote] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [showSubmit, setShowSubmit] = useState(false)

  // Round: 1 = main, 2 = final
  const round = phase === 'final' ? 2 : 1

  const refresh = useCallback(async () => {
    const [noms, counts] = await Promise.all([
      getNominations(weekId),
      getVoteCounts(weekId, round),
    ])
    setNominations(noms)
    setVoteCounts(counts)
    if (userId) {
      const vote = await getUserVote(weekId, userId, round)
      setMyVote(vote)
    }
    setLoading(false)
  }, [weekId, round, userId])

  // Initial load
  useEffect(() => { refresh() }, [refresh])

  // Real-time subscriptions
  useEffect(() => {
    const votesSub = subscribeToVotes(weekId, () => {
      // Refresh vote counts live
      getVoteCounts(weekId, round).then(counts => {
        setVoteCounts(counts)
      })
      if (userId) {
        getUserVote(weekId, userId, round).then(vote => setMyVote(vote))
      }
    })
    const nomsSub = subscribeToNominations(weekId, () => {
      getNominations(weekId).then(noms => setNominations(noms))
    })
    return () => {
      votesSub.unsubscribe()
      nomsSub.unsubscribe()
    }
  }, [weekId, round, userId])

  // Use live DB data if available, otherwise fall back to sample nominees
  const useDemo = nominations.length === 0
  const activeCounts = useDemo ? SAMPLE_VOTES : voteCounts
  const activeNoms   = useDemo ? SAMPLE_NOMINATIONS : nominations

  // Sort by vote count
  const sorted = [...activeNoms].sort((a, b) => (activeCounts[b.id] ?? 0) - (activeCounts[a.id] ?? 0))

  // Final round: top 3 only
  const displayed = phase === 'final' ? sorted.slice(0, 3) : sorted

  // Results: top nominee is winner
  const winner = phase === 'results' ? sorted[0] : null

  const totalVotes = Object.values(activeCounts).reduce((s, n) => s + n, 0)

  async function handleVote(nominationId: string) {
    if (!userId) return
    if (voting) return

    // Demo mode — optimistic local-only vote so UI feels live
    if (useDemo) {
      setMyVote(prev => prev === nominationId ? null : nominationId)
      return
    }

    setVoting(true)

    // Optimistic update
    const prev = myVote
    setMyVote(nominationId)
    setVoteCounts(c => {
      const next = { ...c }
      if (prev) next[prev] = Math.max(0, (next[prev] ?? 0) - 1)
      next[nominationId] = (next[nominationId] ?? 0) + 1
      return next
    })

    const result = await castVote(weekId, nominationId, userId, round)
    if (!result.ok) {
      // Revert optimistic update
      setMyVote(prev)
      setVoteCounts(c => {
        const next = { ...c }
        next[nominationId] = Math.max(0, (next[nominationId] ?? 0) - 1)
        if (prev) next[prev] = (next[prev] ?? 0) + 1
        return next
      })
    }
    setVoting(false)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="h-48 rounded-2xl bg-[#111116] animate-pulse border border-[#1e1e24]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-white">Build of the Week</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{getPhaseDescription(phase)}</p>
          </div>
          {phase !== 'results' && (
            <button
              onClick={() => setShowSubmit(true)}
              className="flex-shrink-0 rounded-xl bg-[#1a1a22] border border-[#2a2a35] px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
            >
              + Nominate
            </button>
          )}
        </div>

        <PhaseBar phase={phase} timeLeft={timeLeft} />

        {/* Total votes badge */}
        {totalVotes > 0 && (
          <p className="text-xs text-zinc-600 text-center">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} cast this week · updates live
          </p>
        )}
      </div>

      {/* Guest prompt */}
      {!userId && phase !== 'results' && (
        <div className="rounded-xl border border-[#2a2a35] bg-[#111116] p-4 text-center text-sm text-zinc-400">
          <Link href="/signin" className="text-purple-400 hover:underline">Sign in</Link> to vote and nominate your build.
        </div>
      )}


      {/* Nominee grid */}
      {displayed.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((nom, idx) => (
            <NomineeCard
              key={nom.id}
              nomination={nom}
              voteCount={activeCounts[nom.id] ?? 0}
              totalVotes={totalVotes}
              myVote={myVote}
              phase={phase}
              rank={idx + 1}
              isWinner={phase === 'results' && idx === 0}
              onVote={handleVote}
              voting={voting}
            />
          ))}
        </div>
      )}

      {/* Phase explanation */}
      {phase === 'nominations' && nominations.length > 0 && (
        <p className="text-xs text-zinc-600 text-center">
          Top 3 advance to the Final Round on Saturday · Winner announced Sunday
        </p>
      )}

      {/* Submit modal */}
      {showSubmit && userId && (
        <SubmitModal
          weekId={weekId}
          userId={userId}
          onClose={() => setShowSubmit(false)}
          onSuccess={refresh}
        />
      )}
    </div>
  )
}
