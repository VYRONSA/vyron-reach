'use client'

export function ChurnRiskPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-red-500/20 bg-[#0b0b1d] p-6 text-white">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
          High Risk Clients
        </div>

        <div className="mt-4 text-4xl font-black text-red-300">
          2
        </div>
      </div>

      <div className="rounded-3xl border border-emerald-500/20 bg-[#0b0b1d] p-6 text-white">
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Healthy Accounts
        </div>

        <div className="mt-4 text-4xl font-black text-emerald-300">
          18
        </div>
      </div>
    </div>
  )
}
