'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Battle, 
  getActiveBattle, 
  getBattleHistory,
  voteInBattle, 
  hasVotedInBattle,
  getUserVoteForBattle,
  formatTimeRemaining,
  getBattleThemes,
} from '@/lib/build-battles'

interface BuildBattleProps {
  className?: string
}

export default function BuildBattle({ className = '' }: BuildBattleProps) {
  const [activeBattle, setActiveBattle] = useState<Battle | null>(null)
  const [history, setHistory] = useState<Battle[]>([])
  const [userVote, setUserVote] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [votedBuildId, setVotedBuildId] = useState<string | null>(null)
  
  useEffect(() => {
    const battle = getActiveBattle()
    setActiveBattle(battle)
    
    if (battle) {
      setHasVoted(hasVotedInBattle(battle.id))
      const vote = getUserVoteForBattle(battle.id)
      setVotedBuildId(vote?.buildId || null)
    }
    
    setHistory(getBattleHistory())
  }, [])
  
  const handleVote = (buildId: string) => {
    if (!activeBattle || hasVoted) return
    
    const success = voteInBattle(activeBattle.id, buildId)
    if (success) {
      setHasVoted(true)
      setVotedBuildId(buildId)
    }
  }
  
  if (!activeBattle) return null
  
  const { buildA, buildB, theme, endsAt, totalVotes } = activeBattle
  const timeLeft = formatTimeRemaining(endsAt)
  
  return (
    <div className={`bg-[#111116] rounded-2xl border border-[#1e1e24] overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e1e24]/50 bg-gradient-to-r from-purple-900/20 to-pink-900/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span>⚔️</span> Build Battle
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">{theme}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-purple-400">{timeLeft}</span>
            <p className="text-xs text-zinc-600">{totalVotes.toLocaleString()} votes</p>
          </div>
        </div>
      </div>
      
      {/* Battle Arena */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {/* Build A */}
          <BattleBuildCard
            build={buildA}
            isWinner={activeBattle.status === 'ended' && activeBattle.winner === buildA.id}
            isVoted={votedBuildId === buildA.id}
            canVote={!hasVoted && activeBattle.status === 'active'}
            onVote={() => handleVote(buildA.id)}
          />
          
          {/* VS Badge */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="w-10 h-10 rounded-full bg-[#0a0a0e] border-2 border-[#2a2a35] flex items-center justify-center text-xs font-bold text-zinc-400">
              VS
            </div>
          </div>
          
          {/* Build B */}
          <BattleBuildCard
            build={buildB}
            isWinner={activeBattle.status === 'ended' && activeBattle.winner === buildB.id}
            isVoted={votedBuildId === buildB.id}
            canVote={!hasVoted && activeBattle.status === 'active'}
            onVote={() => handleVote(buildB.id)}
          />
        </div>
        
        {/* Vote Progress */}
        {hasVoted && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>{buildA.votePercentage}%</span>
              <span>{buildB.votePercentage}%</span>
            </div>
            <div className="h-2 bg-[#1e1e24] rounded-full overflow-hidden flex">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${buildA.votePercentage}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400"
              />
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${buildB.votePercentage}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="h-full bg-gradient-to-l from-pink-600 to-pink-400"
              />
            </div>
            <p className="text-center text-xs text-zinc-500 mt-2">
              {votedBuildId === buildA.id 
                ? `✓ You voted for ${buildA.title}` 
                : votedBuildId === buildB.id 
                  ? `✓ You voted for ${buildB.title}` 
                  : 'Vote submitted'}
            </p>
          </div>
        )}
        
        {!hasVoted && activeBattle.status === 'active' && (
          <p className="text-center text-xs text-zinc-500 mt-3">
            Tap a build to vote
          </p>
        )}
      </div>
      
      {/* History Toggle */}
      <div className="border-t border-[#1e1e24]/50">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="w-full py-2.5 text-xs text-zinc-400 hover:text-white transition-colors flex items-center justify-center gap-1"
        >
          {showHistory ? 'Hide' : 'Show'} Past Battles
          <svg 
            viewBox="0 0 24 24" 
            className={`h-4 w-4 fill-none stroke-current transition-transform ${showHistory ? 'rotate-180' : ''}`} 
            strokeWidth={2}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 space-y-2">
                <p className="text-xs text-zinc-600 uppercase tracking-wider">Recent Battles</p>
                {history.slice(0, 3).map((battle) => (
                  <div key={battle.id} className="p-2 rounded-lg bg-[#18181f] text-sm">
                    <p className="text-zinc-400 text-xs mb-1">{battle.theme}</p>
                    <div className="flex items-center justify-between">
                      <span className={`${battle.winner === battle.buildA.id ? 'text-white font-medium' : 'text-zinc-500'}`}>
                        {battle.buildA.author}
                      </span>
                      <span className="text-zinc-600">vs</span>
                      <span className={`${battle.winner === battle.buildB.id ? 'text-white font-medium' : 'text-zinc-500'}`}>
                        {battle.buildB.author}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

interface BattleBuildCardProps {
  build: {
    id: string
    slug: string
    title: string
    author: string
    handle: string
    vehicleLabel: string
    hp: number
    tags: string[]
    votes: number
    votePercentage: number
  }
  isWinner?: boolean
  isVoted?: boolean
  canVote?: boolean
  onVote?: () => void
}

function BattleBuildCard({ build, isWinner, isVoted, canVote, onVote }: BattleBuildCardProps) {
  return (
    <motion.div
      whileHover={canVote ? { scale: 1.02 } : {}}
      whileTap={canVote ? { scale: 0.98 } : {}}
      onClick={canVote ? onVote : undefined}
      className={`relative bg-[#18181f] rounded-xl overflow-hidden ${
        canVote ? 'cursor-pointer hover:border-purple-500/50' : ''
      } border border-[#2a2a35] ${isVoted ? 'ring-2 ring-purple-500' : ''}`}
    >
      {/* Image Placeholder */}
      <div className="aspect-[4/3] bg-gradient-to-br from-[#1e1e28] to-[#2a2a35] flex items-center justify-center">
        <span className="text-3xl">🏎️</span>
        {isWinner && (
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium border border-yellow-500/30">
              🏆 Winner
            </span>
          </div>
        )}
        {isVoted && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs font-medium border border-purple-500/30">
              ✓ Your Vote
            </span>
          </div>
        )}
      </div>
      
      {/* Info */}
      <div className="p-3">
        <Link 
          href={`/community/${build.slug}`}
          className="text-sm font-medium text-white hover:text-purple-400 transition-colors line-clamp-1"
          onClick={(e) => e.stopPropagation()}
        >
          {build.title}
        </Link>
        <p className="text-xs text-zinc-500">{build.author}</p>
        
        {/* Stats */}
        <div className="flex items-center gap-2 mt-2">
          <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 text-xs">
            {build.hp} HP
          </span>
          <span className="text-xs text-zinc-600">
            {build.votes.toLocaleString()} votes
          </span>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-2">
          {build.tags.slice(0, 2).map(tag => (
            <span key={tag} className="text-[10px] text-zinc-500">#{tag}</span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}
