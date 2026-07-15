'use client'

type SidebarProps = {
  active: string
  setActive: (value: string) => void
  companyName?: string
}

const navGroups = [
  {
    title: 'Marketing Intelligence',
    items: [
      'Command Centre',
      'Client Intake',
      'AI Strategy',
      'Geo Intelligence',
      'Ad Generator',
      'Campaigns',
      'Marketing Reports',
    ],
  },
  {
    title: 'Control',
    items: ['System Settings'],
  },
]

export function Sidebar({
  active,
  setActive,
  companyName = 'VYRON REACH',
}: SidebarProps) {
  return (
    <div className="flex h-full flex-col px-5 py-6 text-white">
      <div className="mb-7">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-cyan-400 shadow-[0_0_30px_rgba(168,85,247,0.45)]">
            <span className="text-lg font-black text-white">V</span>
          </div>

          <div>
            <div className="text-lg font-black tracking-[0.18em] text-white">VYRON</div>
            <div className="text-[10px] font-black uppercase tracking-[0.35em] text-purple-300">REACH</div>
          </div>
        </div>

        <div className="mt-5 rounded-3xl border border-purple-500/20 bg-white/[0.04] p-4">
          <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Operating Model</div>
          <div className="mt-2 text-sm font-black leading-5 text-white">{companyName}</div>
          <div className="mt-3 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
            AI Marketing Intelligence
          </div>
        </div>
      </div>

      <nav className="min-h-0 flex-1 space-y-7 overflow-y-auto pr-1">
        {navGroups.map(group => (
          <div key={group.title}>
            <div className="mb-3 px-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
              {group.title}
            </div>

            <div className="space-y-2">
              {group.items.map(item => {
                const isActive = active === item

                return (
                  <button
                    key={item}
                    onClick={() => setActive(item)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
                      isActive
                        ? 'border border-purple-400/35 bg-purple-500/20 text-white shadow-[0_0_24px_rgba(168,85,247,0.22)]'
                        : 'border border-transparent bg-white/[0.025] text-slate-400 hover:border-purple-400/20 hover:bg-purple-500/10 hover:text-white'
                    }`}
                  >
                    <span>{item}</span>
                    {isActive ? <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.85)]" /> : null}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-6 rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/15 to-cyan-500/10 p-4">
        <div className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-200">Rule</div>
        <div className="mt-2 text-sm font-black leading-5 text-white">Strategy first. Spend second.</div>
        <div className="mt-3 text-xs leading-5 text-slate-400">
          Protect ad budget, target the right areas and generate campaigns intelligently.
        </div>
      </div>
    </div>
  )
}
