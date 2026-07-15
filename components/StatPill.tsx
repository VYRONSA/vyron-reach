'use client'

export function StatPill({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 px-4 py-3">
      <div className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-200">
        {label}
      </div>

      <div className="mt-2 text-xl font-black text-white">
        {value}
      </div>
    </div>
  )
}
