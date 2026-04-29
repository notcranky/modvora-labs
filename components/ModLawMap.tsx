'use client'

import { useState, useEffect, useRef } from 'react'
import { MOD_LAWS, type StateLaws } from '@/lib/mod-laws'

// ─── AI Chat Types ──────────────────────────────────────────────────────────

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  isLoading?: boolean
  sources?: { state: string; relevantField: string }[]
  relatedQuestions?: string[]
}

// ─── helpers ────────────────────────────────────────────────────────────────

function strictnessColor(s: StateLaws['strictness']) {
  if (s === 'lenient') return 'bg-emerald-400'
  if (s === 'moderate') return 'bg-amber-400'
  return 'bg-red-400'
}

function strictnessBadge(s: StateLaws['strictness']) {
  if (s === 'lenient')
    return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
  if (s === 'moderate')
    return 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
  return 'bg-red-500/15 text-red-300 border border-red-500/25'
}

function statusIcon(status: 'legal' | 'restricted' | 'illegal') {
  if (status === 'legal') return { icon: '✓', cls: 'text-emerald-400' }
  if (status === 'restricted') return { icon: '~', cls: 'text-amber-400' }
  return { icon: '✕', cls: 'text-red-400' }
}

function statusPill(status: 'legal' | 'restricted' | 'illegal') {
  if (status === 'legal')
    return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25'
  if (status === 'restricted')
    return 'bg-amber-500/15 text-amber-300 border border-amber-500/25'
  return 'bg-red-500/15 text-red-300 border border-red-500/25'
}

// ─── sub-components ──────────────────────────────────────────────────────────

function DetailCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[#2a2a30] bg-[#111114] p-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {title}
      </p>
      {children}
    </div>
  )
}

function StatusRow({
  label,
  status,
  note,
}: {
  label: string
  status: 'legal' | 'restricted' | 'illegal'
  note: string
}) {
  const { icon, cls } = statusIcon(status)
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          status === 'legal'
            ? 'bg-emerald-500/20'
            : status === 'restricted'
            ? 'bg-amber-500/20'
            : 'bg-red-500/20'
        } ${cls}`}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-white">{label}</span>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${statusPill(status)}`}
          >
            {status}
          </span>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-400">{note}</p>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#2a2a30] bg-[#111114]">
        <svg
          className="h-8 w-8 text-zinc-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.159.69.159 1.006 0Z"
          />
        </svg>
      </div>
      <p className="text-sm font-medium text-zinc-300">Select a state</p>
      <p className="mt-1 max-w-[220px] text-xs leading-relaxed text-zinc-600">
        Click any state on the map to view its modification laws.
      </p>
    </div>
  )
}

function DetailPanel({ laws }: { laws: StateLaws }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-white">{laws.state}</h2>
          <p className="text-sm text-zinc-500">{laws.abbr} · Modification Laws</p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ${strictnessBadge(
            laws.strictness
          )}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${strictnessColor(laws.strictness)}`} />
          {laws.strictness}
        </span>
      </div>

      {/* Tint */}
      <DetailCard title="Window Tint">
        <div className="space-y-1.5 text-xs text-zinc-300">
          <div className="flex justify-between">
            <span className="text-zinc-500">Front Side</span>
            <span className="font-medium text-white">{laws.tint.frontSide}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Rear Side</span>
            <span className="font-medium text-white">{laws.tint.rearSide}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Rear Window</span>
            <span className="font-medium text-white">{laws.tint.rear}</span>
          </div>
          {laws.tint.note && (
            <p className="mt-2 border-t border-[#2a2a30] pt-2 leading-relaxed text-zinc-500">
              {laws.tint.note}
            </p>
          )}
        </div>
      </DetailCard>

      {/* Exhaust */}
      <DetailCard title="Exhaust Noise">
        <div className="text-xs text-zinc-300">
          <p className="font-medium text-white">{laws.exhaust.limit}</p>
          {laws.exhaust.note && (
            <p className="mt-1 leading-relaxed text-zinc-500">{laws.exhaust.note}</p>
          )}
        </div>
      </DetailCard>

      {/* Emissions */}
      <DetailCard title="Emissions Testing">
        <div className="flex items-start gap-3 text-xs">
          <span
            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              laws.emissions.required
                ? 'bg-red-500/20 text-red-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {laws.emissions.required ? '✕' : '✓'}
          </span>
          <div>
            <p className="font-medium text-white">
              {laws.emissions.required ? 'Required' : 'Not Required'}
            </p>
            {laws.emissions.areas && (
              <p className="mt-0.5 text-zinc-400">Areas: {laws.emissions.areas}</p>
            )}
            {laws.emissions.note && (
              <p className="mt-0.5 leading-relaxed text-zinc-500">{laws.emissions.note}</p>
            )}
          </div>
        </div>
      </DetailCard>

      {/* Underglow, Straight Pipe, Colored Headlights */}
      <DetailCard title="Lighting & Exhaust Mods">
        <div className="space-y-4">
          <StatusRow
            label="Underglow"
            status={laws.underglow.status}
            note={laws.underglow.note}
          />
          <StatusRow
            label="Straight Pipe"
            status={laws.straightPipe.status}
            note={laws.straightPipe.note}
          />
          <StatusRow
            label="Colored Headlights"
            status={laws.coloredHeadlights.status}
            note={laws.coloredHeadlights.note}
          />
        </div>
      </DetailCard>

      {/* Disclaimer */}
      <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-4">
        <div className="flex gap-3">
          <svg
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <p className="text-xs leading-relaxed text-amber-200/70">
            Laws change frequently. Always verify with your state DMV before modifying your
            vehicle.
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── geographic USA map ───────────────────────────────────────────────────────

function UsaMap({ selected, onSelect }: { selected: string | null; onSelect: (abbr: string) => void }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  // Colors helper
  function getColors(strictness: string) {
    if (strictness === 'lenient')  return { fill: '#14532d', stroke: '#22c55e' }
    if (strictness === 'moderate') return { fill: '#451a03', stroke: '#f59e0b' }
    return { fill: '#450a0a', stroke: '#ef4444' }
  }

  // Apply selected highlight
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    Object.entries(MOD_LAWS).forEach(([abbr, laws]) => {
      const path = svg.querySelector('#' + abbr) as SVGPathElement | null
      if (!path) return
      if (abbr === selected) {
        path.style.fill = '#4c1d95'
        path.style.stroke = '#9333ea'
      } else {
        const c = getColors(laws.strictness)
        path.style.fill = c.fill
        path.style.stroke = c.stroke
      }
    })
  }, [selected])

  // Fetch and inject SVG once on mount
  useEffect(() => {
    fetch('/us-map.svg')
      .then(r => r.text())
      .then(text => {
        if (!mapRef.current) return
        mapRef.current.innerHTML = text
        const svg = mapRef.current.querySelector('svg') as SVGSVGElement
        if (!svg) return
        svg.style.cssText = 'stroke-linejoin: round; width: 100%; height: auto; display: block;'
        svgRef.current = svg

        Object.entries(MOD_LAWS).forEach(([abbr, laws]) => {
          const path = svg.querySelector('#' + abbr) as SVGPathElement | null
          if (!path) return
          const c = getColors(laws.strictness)
          path.style.fill = c.fill
          path.style.stroke = c.stroke
          path.style.strokeWidth = '1'
          path.style.cursor = 'pointer'
          path.style.transition = 'filter 0.15s ease'

          path.addEventListener('mouseover', () => { path.style.filter = 'brightness(1.6)' })
          path.addEventListener('mouseout',  () => { path.style.filter = '' })
          path.addEventListener('click',     () => onSelect(abbr))
        })
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={mapRef}
      className="w-full overflow-x-auto"
      style={{ minHeight: 200 }}
    />
  )
}

// ─── legend ──────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-500">
      <span className="font-medium text-zinc-400">Strictness:</span>
      {(
        [
          { label: 'Lenient', cls: 'bg-emerald-400' },
          { label: 'Moderate', cls: 'bg-amber-400' },
          { label: 'Strict', cls: 'bg-red-400' },
        ] as const
      ).map(({ label, cls }) => (
        <span key={label} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${cls}`} />
          {label}
        </span>
      ))}
    </div>
  )
}

// ─── AI Chat Component ───────────────────────────────────────────────────────

function AiLawChat({ selectedState }: { selectedState: string | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 Ask me anything about car mod laws!\n\n**Examples:**\n• Is underglow legal in Texas?\n• What are the tint laws in California?\n• Which states are most lenient?\n• Compare Texas vs Florida"
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Pre-fill with selected state
  useEffect(() => {
    if (selectedState && !input && messages.length === 1) {
      const stateName = MOD_LAWS[selectedState]?.state
      if (stateName) {
        setInput(`Tell me about mod laws in ${stateName}`)
      }
    }
  }, [selectedState])

  async function sendMessage() {
    if (!input.trim() || isLoading) return
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    }
    
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    // Add loading message
    const loadingId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, {
      id: loadingId,
      role: 'assistant',
      content: '...',
      isLoading: true
    }])

    try {
      const res = await fetch('/api/mod-law-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg.content })
      })
      
      const data = await res.json()
      
      setMessages(prev => prev.filter(m => m.id !== loadingId))
      
      if (data.error) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `Sorry, I had trouble: ${data.error}`
        }])
      } else {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.answer,
          sources: data.sources,
          relatedQuestions: data.relatedQuestions
        }])
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== loadingId))
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.'
      }])
    } finally {
      setIsLoading(false)
    }
  }

  function handleQuickQuestion(question: string) {
    setInput(question)
    // Auto-send after a brief delay to show the user what was selected
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => {} }
      sendMessage()
    }, 100)
  }

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-[#0d0d0f] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-purple-500/20 bg-purple-500/10 px-4 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20">
          <span className="text-sm">🤖</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Mod Law AI</h3>
          <p className="text-xs text-zinc-500">Ask about tint, exhaust, underglow & more</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-[320px] overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm ${
              msg.role === 'user' 
                ? 'bg-purple-600 text-white rounded-br-md' 
                : 'bg-[#1a1a20] text-zinc-300 rounded-bl-md border border-[#2a2a30]'
            }`}>
              {msg.isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500/30 border-t-purple-500" />
                  <span className="text-zinc-500">Thinking...</span>
                </div>
              ) : (
                <div className="whitespace-pre-wrap">{msg.content}</div>
              )}
              
              {/* Related questions */}
              {msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.relatedQuestions.slice(0, 3).map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickQuestion(q.replace(/\[state\]/, MOD_LAWS[selectedState || 'CA']?.state || 'California'))}
                      className="text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-1 rounded-full transition-colors"
                    >
                      {q.replace(/\[state\]/, MOD_LAWS[selectedState || 'CA']?.state || 'California')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-[#2a2a30] p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about mod laws..."
            className="flex-1 rounded-xl border border-[#2a2a35] bg-[#111116] px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none focus:border-purple-500 transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '...' : 'Ask'}
          </button>
        </div>
        
        {/* Quick questions */}
        <div className="mt-3 flex flex-wrap gap-2">
          {['Most lenient states?', 'Where are straight pipes legal?', 'Emissions-free states?'].map((q) => (
            <button
              key={q}
              onClick={() => handleQuickQuestion(q)}
              className="text-xs text-zinc-500 hover:text-zinc-300 bg-[#1a1a20] hover:bg-[#25252c] px-3 py-1.5 rounded-full border border-[#2a2a30] transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── main component ──────────────────────────────────────────────────────────

export default function ModLawMap() {
  const [selected, setSelected] = useState<string | null>(null)

  const selectedLaws = selected ? MOD_LAWS[selected] : null

  return (
    <div className="space-y-8">
      {/* AI Chat — full width at top */}
      <div className="max-w-3xl">
        <AiLawChat selectedState={selected} />
      </div>
      
      <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:gap-10">
        {/* Left — map */}
        <div className="min-w-0 shrink-0">
          <div className="overflow-x-auto rounded-2xl border border-[#2a2a30] bg-[#0d0d0f] p-5 sm:p-6">
            <UsaMap selected={selected} onSelect={setSelected} />
            <Legend />
          </div>
        </div>

        {/* Right — detail */}
        <div className="w-full xl:min-w-[380px] xl:max-w-[440px]">
          <div className="rounded-2xl border border-[#2a2a30] bg-[#0d0d0f] p-5 sm:p-6">
            {selectedLaws ? (
              <DetailPanel laws={selectedLaws} />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
