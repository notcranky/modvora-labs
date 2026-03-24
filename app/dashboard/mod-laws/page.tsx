import ModLawMap from '@/components/ModLawMap'

export const metadata = {
  title: 'Mod Law Map | Modvora',
  description: 'Check what car mods are legal in your state.',
}

export default function ModLawsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-purple-200 mb-4">
            <span className="h-2 w-2 rounded-full bg-purple-400" /> Ultra Member Feature
          </div>
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Mod Law Map</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-400">
            Click your state to see what modifications are legal, restricted, or illegal where you drive.
            Laws vary wildly — know before you build.
          </p>
        </div>
        <ModLawMap />
      </div>
    </div>
  )
}
