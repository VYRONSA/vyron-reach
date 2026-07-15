'use client'

export function PageContainer({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-8">
        <p className="text-xs font-black uppercase tracking-[0.35em] text-purple-300">
          VYRON REACH
        </p>

        <h1 className="mt-3 text-4xl font-black text-white">
          {title}
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
          {subtitle}
        </p>
      </section>

      {children}
    </div>
  )
}
