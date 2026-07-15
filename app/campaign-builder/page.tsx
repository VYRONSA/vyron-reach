const platforms = [
  { name: 'Facebook', color: 'from-blue-600 to-cyan-500' },
  { name: 'Instagram', color: 'from-pink-500 to-violet-600' },
  { name: 'Google Ads', color: 'from-blue-500 to-green-500' },
  { name: 'LinkedIn', color: 'from-sky-700 to-slate-900' },
]

export default function CampaignBuilder() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[40px] bg-white p-10 shadow-2xl">
          <div className="text-xs font-black tracking-[0.4em] text-violet-600">
            CREATE CAMPAIGN
          </div>

          <h1 className="mt-5 text-6xl font-black tracking-[-0.08em]">
            Choose your platform
          </h1>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {platforms.map((platform) => (
              <button
                key={platform.name}
                className={`rounded-[32px] bg-gradient-to-br ${platform.color} p-8 text-left text-white shadow-2xl transition hover:-translate-y-1`}
              >
                <div className="text-4xl font-black">
                  {platform.name}
                </div>

                <div className="mt-6 text-sm font-bold text-white/80">
                  Open premium AI campaign workflow
                </div>
              </button>
            ))}
          </div>

          <div className="mt-12 rounded-[32px] border border-dashed border-slate-300 p-10">
            <div className="text-2xl font-black">
              ChatGPT Prompt Builder
            </div>

            <textarea
              className="mt-6 h-56 w-full rounded-3xl border border-slate-200 p-6 text-lg"
              placeholder="Describe the campaign you want to create..."
            />

            <button className="mt-6 rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-8 py-4 font-black text-white">
              OPEN IN CHATGPT
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
