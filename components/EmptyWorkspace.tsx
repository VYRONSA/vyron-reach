'use client'

export function EmptyWorkspace({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <div className="rounded-3xl border border-dashed border-purple-500/20 bg-[#0b0b1d] p-10 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20">
        <span className="text-3xl font-black text-white">V</span>
      </div>

      <h2 className="mt-6 text-3xl font-black text-white">
        {title}
      </h2>

      <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-400">
        {subtitle}
      </p>
    </div>
  )
}
