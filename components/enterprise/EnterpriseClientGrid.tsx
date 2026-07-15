const clients = [
  ['Nike Global', '$243K'],
  ['Tesla Retail', '$189K'],
  ['Apple Commerce', '$310K'],
  ['Amazon Growth', '$421K'],
]

export function EnterpriseClientGrid() {
  return (
    <section className="rounded-[38px] border border-white/10 bg-[#08111d]/90 p-8">
      <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
        CLIENT INTELLIGENCE
      </div>

      <h2 className="mt-3 text-3xl font-black text-white">
        Enterprise Client Portfolio
      </h2>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        {clients.map(client => (
          <div
            key={client[0]}
            className="rounded-3xl border border-white/10 bg-black/20 p-6"
          >
            <div className="text-xl font-black text-white">
              {client[0]}
            </div>

            <div className="mt-4 text-3xl font-black text-emerald-400">
              {client[1]}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}