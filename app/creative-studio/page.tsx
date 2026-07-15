const ads = [
  'VYRON CORE IS LIVE',
  'STOP LOSING PAYROLL HOURS',
  'THE FUTURE OF WORK',
]

export default function CreativeStudio() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-cyan-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[40px] bg-white p-10 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-black tracking-[0.4em] text-violet-600">
                CREATIVE STUDIO
              </div>

              <h1 className="mt-4 text-6xl font-black tracking-[-0.08em]">
                Premium advert gallery
              </h1>
            </div>

            <button className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-8 py-4 font-black text-white">
              UPLOAD CREATIVE
            </button>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {ads.map((ad, index) => (
              <div
                key={ad}
                className="overflow-hidden rounded-[32px] bg-white shadow-2xl"
              >
                <div
                  className={`min-h-[420px] p-8 text-white ${
                    index === 0
                      ? 'bg-gradient-to-br from-slate-950 to-cyan-900'
                      : index === 1
                      ? 'bg-gradient-to-br from-violet-950 to-pink-700'
                      : 'bg-gradient-to-br from-slate-950 to-emerald-700'
                  }`}
                >
                  <div className="text-xs font-black tracking-[0.3em] text-cyan-300">
                    FACEBOOK CAMPAIGN
                  </div>

                  <h2 className="mt-24 text-5xl font-black tracking-[-0.08em]">
                    {ad}
                  </h2>

                  <p className="mt-5 text-lg font-semibold text-white/80">
                    AI-generated premium marketing campaign preview.
                  </p>
                </div>

                <div className="flex gap-3 p-5">
                  <button className="flex-1 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-6 py-4 font-black text-white">
                    APPROVE
                  </button>

                  <button className="flex-1 rounded-2xl border border-slate-300 bg-white px-6 py-4 font-black text-slate-900">
                    REVISE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
