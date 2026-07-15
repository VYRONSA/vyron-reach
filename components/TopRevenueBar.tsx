'use client'

export function TopRevenueBar() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-3xl border border-purple-500/20 bg-[#0b0b1d] px-6 py-4">
      <Badge label="VYRON CORE Growth" />
      <Badge label="Revenue Focus" />
      <Badge label="Founder Sales OS" />
      <Badge label="Operational Simplicity" />
    </div>
  )
}

function Badge({ label }: { label: string }) {
  return (
    <div className="rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-purple-200">
      {label}
    </div>
  )
}
