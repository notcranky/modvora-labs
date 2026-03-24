'use client'

import { useState } from 'react'
import { Part, IntakeData } from '@/lib/types'
import { buildRetailerUrl, buildYoutubeUrl } from '@/lib/parts-matcher'

const categoryColors: Record<string, string> = {
  intake: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  exhaust: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  suspension: 'bg-green-500/20 text-green-300 border-green-500/30',
  brakes: 'bg-red-500/20 text-red-300 border-red-500/30',
  'wheels-tires': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  exterior: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  interior: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  lighting: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  tune: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'forced-induction': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
}

const difficultyConfig: Record<string, { label: string; color: string; bg: string; border: string; bars: number; desc: string }> = {
  'bolt-on':     { label: 'Bolt-On DIY',   color: 'text-green-400',  bg: 'bg-green-500',  border: 'border-green-500/30',  bars: 1, desc: 'Anyone can do this with basic hand tools' },
  moderate:      { label: 'Moderate',      color: 'text-yellow-400', bg: 'bg-yellow-500', border: 'border-yellow-500/30', bars: 2, desc: 'Some mechanical experience recommended' },
  advanced:      { label: 'Advanced',      color: 'text-orange-400', bg: 'bg-orange-500', border: 'border-orange-500/30', bars: 3, desc: 'Experienced DIYer or home garage setup needed' },
  professional:  { label: 'Professional',  color: 'text-red-400',    bg: 'bg-red-500',    border: 'border-red-500/30',    bars: 4, desc: 'Recommend a professional shop install' },
}

interface PartsCardProps {
  part: Part
  intake: IntakeData
}

export default function PartsCard({ part, intake }: PartsCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [imgError, setImgError] = useState(false)

  const youtubeUrl = buildYoutubeUrl(part.youtubeQuery, intake)
  const catColor = categoryColors[part.category] || 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  const diff = difficultyConfig[part.difficulty]

  return (
    <div className="bg-[#16161a] border border-[#2a2a30] rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all duration-300 group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-[#0f0f12]">
        {!imgError ? (
          <img
            src={part.image}
            alt={part.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-[#0f0f12]">
            <span className="text-4xl">⚙️</span>
          </div>
        )}
        {/* Phase badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-black/70 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-full border border-white/10">
            Phase {part.phase}
          </span>
        </div>
        {/* Category badge */}
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${catColor} backdrop-blur-sm`}>
            {part.subcategory}
          </span>
        </div>
        {/* YouTube preview button */}
        <a
          href={youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          See it on your car
        </a>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-xs text-purple-400 font-medium mb-1">{part.brand}</p>
            <h3 className="text-white font-bold text-lg leading-tight">{part.name}</h3>
          </div>
          <div className="text-right shrink-0">
            <p className="text-purple-400 font-bold text-lg">
              ${part.priceRange.min.toLocaleString()}–${part.priceRange.max.toLocaleString()}
            </p>
          </div>
        </div>

        <p className="text-zinc-400 text-sm leading-relaxed mb-3">{part.description}</p>

        {/* Install difficulty + time — prominent block */}
        <div className={`rounded-xl border p-3 mb-4 ${diff.border} bg-[#0f0f12]`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${diff.color}`}>{diff.label}</span>
              {/* 4-bar difficulty meter */}
              <div className="flex gap-0.5">
                {[1, 2, 3, 4].map(n => (
                  <div
                    key={n}
                    className={`w-4 h-2 rounded-sm ${n <= diff.bars ? diff.bg : 'bg-[#2a2a30]'}`}
                  />
                ))}
              </div>
            </div>
            {/* Time to install */}
            <div className="flex items-center gap-1.5 text-zinc-300">
              <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-semibold">{part.timeToInstall}</span>
            </div>
          </div>
          <p className="text-zinc-500 text-xs">{diff.desc}</p>
        </div>

        {/* Gain estimate */}
        {part.gainEstimate && (
          <div className="flex items-center gap-2 mb-4 text-xs">
            <span className="text-zinc-500">Est. gain:</span>
            <span className="text-green-400 font-semibold">{part.gainEstimate}</span>
          </div>
        )}

        {/* Benefits */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {part.benefits.slice(0, 3).map((b, i) => (
            <span key={i} className="text-xs bg-[#0f0f12] border border-[#2a2a30] text-zinc-400 px-2 py-1 rounded-full">
              ✓ {b}
            </span>
          ))}
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mb-4 p-4 bg-[#0f0f12] rounded-xl border border-[#2a2a30]">
            <p className="text-zinc-400 text-sm leading-relaxed mb-3">{part.longDescription}</p>
            {part.installNotes && (
              <div className="flex gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <span className="text-yellow-400 text-sm">⚠</span>
                <p className="text-yellow-200/80 text-xs leading-relaxed">{part.installNotes}</p>
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-purple-400 hover:text-purple-300 transition-colors mb-4 flex items-center gap-1"
        >
          {expanded ? '▲ Show less' : '▼ Show full details'}
        </button>

        {/* Buy Buttons */}
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider mb-2">Buy from</p>
          <div className="grid grid-cols-2 gap-2">
            {part.retailers.map((retailer, i) => (
              <a
                key={i}
                href={buildRetailerUrl(retailer.urlTemplate, intake)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-[#0f0f12] hover:bg-purple-600/20 border border-[#2a2a30] hover:border-purple-500/40 text-white text-xs font-medium px-3 py-2.5 rounded-xl transition-all duration-200 group/btn"
              >
                <span>{retailer.icon}</span>
                <span className="flex-1">{retailer.name}</span>
                <svg className="w-3 h-3 text-zinc-600 group-hover/btn:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
