'use client'

export function LoadingState({
  title = 'Loading workspace...',
}: {
  title?: string
}) {
  return (
    <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-10">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-400" />

        <div>
          <div className="text-xl font-black text-white">
            {title}
          </div>

          <div className="mt-2 text-sm text-slate-400">
            Syncing VYRON REACH revenue systems...
          </div>
        </div>
      </div>
    </div>
  )
}
