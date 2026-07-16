export const metadata = {
  title: 'Sign in — VYRON DEV',
}

export default async function DevLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07080B] px-4 text-slate-100">
      <div className="w-full max-w-[380px]">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 font-mono text-lg font-bold text-white">
            V
          </div>
          <div className="mt-4 text-[15px] font-semibold text-slate-100">VYRON DEV</div>
          <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
            Internal Developer Portal
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#101319] p-7 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)]">
          <form action="/api/dev/login" method="POST" className="space-y-4">
            <div>
              <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-slate-400">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="w-full rounded-lg border border-white/[0.09] bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30"
                placeholder="developer"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-400">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-lg border border-white/[0.09] bg-black/30 px-3 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30"
                placeholder="••••••••••"
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
                Invalid username or password.
              </div>
            ) : null}

            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Sign in
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          Restricted to VYRONSOFT Pty Ltd developers.
        </p>
      </div>
    </div>
  )
}
