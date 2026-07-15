'use client'

export function SectionCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-3xl border border-purple-500/20 bg-[#0b0b1d] p-6">
      <h2 className="text-2xl font-black text-white">
        {title}
      </h2>

      <div className="mt-5">
        {children}
      </div>
    </div>
  )
}
