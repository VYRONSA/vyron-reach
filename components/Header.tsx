'use client'

type CurrentUser = {
  name: string
  email: string
  role: string
  status?: string
}

type HeaderProps = {
  active: string
  currentUser: CurrentUser
  onSignOut: () => void
}

export function Header({ active, currentUser, onSignOut }: HeaderProps) {
  const title = active === 'Command Centre' ? 'DASHBOARD' : active.toUpperCase()
  const initials = currentUser.name.slice(0, 2).toUpperCase()

  return (
    <header className="flex items-center justify-between bg-[#070713] px-6 py-4 text-white">
      <div>
        <div className="text-[11px] font-black uppercase tracking-[0.32em] text-purple-300">
          VYRON REACH
        </div>
        <h1 className="mt-1 text-2xl font-black tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-300 md:block">
          Live Connected
        </div>

        <button className="grid h-11 w-11 place-items-center rounded-2xl border border-purple-500/15 bg-white/[0.04] text-lg shadow-[0_0_22px_rgba(168,85,247,0.14)]">
          🔔
        </button>

        <div className="hidden items-center gap-3 rounded-2xl border border-purple-500/15 bg-white/[0.04] px-3 py-2 md:flex">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 text-sm font-black">
            {initials}
          </div>

          <div>
            <div className="text-sm font-black">{currentUser.name}</div>
            <div className="text-xs font-bold text-slate-400">{currentUser.role}</div>
          </div>
        </div>

        <button
          onClick={onSignOut}
          className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-red-200 hover:bg-red-500/20"
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}