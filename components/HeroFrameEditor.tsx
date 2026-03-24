'use client'

import { CommunityHeroFrame, CommunityHeroOrientation } from '@/lib/community'

const framePresets: Array<{ label: string; value: CommunityHeroFrame }> = [
  { label: 'Balanced', value: { x: 50, y: 50, zoom: 1 } },
  { label: 'Upper focus', value: { x: 50, y: 32, zoom: 1.08 } },
  { label: 'Lower stance', value: { x: 50, y: 68, zoom: 1.08 } },
  { label: 'Close crop', value: { x: 50, y: 50, zoom: 1.18 } },
]

const orientationOptions: Array<{ label: string; value: CommunityHeroOrientation }> = [
  { label: 'Horizontal', value: 'landscape' },
  { label: 'Vertical', value: 'portrait' },
]

function getPreviewHeight(orientation?: CommunityHeroOrientation) {
  return orientation === 'portrait' ? 'h-[30rem] sm:h-[34rem]' : 'h-64 sm:h-72'
}

function imageStyle(frame: CommunityHeroFrame) {
  return {
    objectPosition: `${frame.x}% ${frame.y}%`,
    transform: `scale(${Math.max(frame.zoom, 1)})`,
  }
}

export default function HeroFrameEditor({
  image,
  frame,
  onChange,
}: {
  image: string
  frame: CommunityHeroFrame
  onChange: (next: CommunityHeroFrame) => void
}) {
  const orientation = frame.orientation ?? 'landscape'

  return (
    <div className="rounded-[24px] border border-[#23232a] bg-[#0f0f13] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white">Hero framing</p>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500">Pick whether the cover should feel horizontal or vertical, then nudge the crop until the hero lands cleanly on the post and gallery cards.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ x: 50, y: 50, zoom: 1, orientation: 'landscape' })}
          className="rounded-xl border border-[#2a2a30] px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white"
        >
          Reset framing
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {orientationOptions.map((option) => {
          const active = orientation === option.value
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ ...frame, orientation: option.value })}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${active ? 'bg-purple-600 text-white' : 'border border-[#2a2a30] bg-[#111116] text-zinc-300 hover:border-purple-500/40 hover:text-white'}`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#23232a] bg-[#111116]">
        <div className={`relative overflow-hidden bg-black ${getPreviewHeight(orientation)}`}>
          <img
            src={image}
            alt="Hero framing preview"
            className="h-full w-full object-cover transition-transform duration-200"
            style={imageStyle(frame)}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {framePresets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange({ ...preset.value, orientation })}
            className="rounded-full border border-[#2a2a30] bg-[#111116] px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-purple-500/40 hover:text-white"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Horizontal</span>
          <input type="range" min={0} max={100} value={frame.x} onChange={(event) => onChange({ ...frame, x: Number(event.target.value) })} className="w-full accent-purple-500" />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Vertical</span>
          <input type="range" min={0} max={100} value={frame.y} onChange={(event) => onChange({ ...frame, y: Number(event.target.value) })} className="w-full accent-purple-500" />
        </label>
        <label className="block">
          <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">Zoom</span>
          <input type="range" min={100} max={140} value={Math.round(frame.zoom * 100)} onChange={(event) => onChange({ ...frame, zoom: Number(event.target.value) / 100 })} className="w-full accent-purple-500" />
        </label>
      </div>
    </div>
  )
}
