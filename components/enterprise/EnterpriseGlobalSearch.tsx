export function EnterpriseGlobalSearch() {
  return (
    <section className="rounded-[36px] border border-white/10 bg-[#08111d]/90 p-8">
      <div className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-400">
        GLOBAL SEARCH
      </div>

      <h2 className="mt-3 text-3xl font-black text-white">
        Enterprise Intelligence Search
      </h2>

      <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 px-6 py-5">
        <input
          placeholder="Search campaigns, clients, AI jobs, revenue signals..."
          className="w-full bg-transparent text-lg text-white outline-none placeholder:text-slate-500"
        />
      </div>
    </section>
  )
}