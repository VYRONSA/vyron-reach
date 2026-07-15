'use client'

import { useAppNavigation } from '@/context/AppNavigationContext'
import { useVyronData } from '@/context/VyronDataContext'
import { PLATFORMS } from '@/lib/platforms'
import { getPlatformLaunchUrl } from '@/lib/creativeUpload/platformLinks'

export function SimplifiedDashboardHome() {
  const { navigate, navigateWithPrefill } = useAppNavigation()
  const { store } = useVyronData()

  const approved = store.uploadedCreatives.filter(c => c.status === 'Approved')
  const pending = store.uploadedCreatives.filter(c => c.status === 'Pending Review')
  const final = approved.filter(c => c.isFinalCampaignCreative)
  const monthlySpend = store.campaigns.reduce((s, c) => s + (c.dailyBudget ?? 0) * 30, 0)

  const openPlatform = (platform: (typeof PLATFORMS)[number]) =>
    navigateWithPrefill('ai-marketing-director', {
      source: 'dashboard-platform',
      message: `${platform.label} campaign`,
      directorPlatform: platform.id,
    })

  return (
    <div className="space-y-8">
      <section className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-8 shadow-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-600">VYRON REACH</p>
        <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Your marketing at a glance</h2>
        <p className="mt-3 max-w-xl text-base font-semibold text-slate-600">
          Create a campaign in under 30 seconds: pick a platform → open ChatGPT → upload the final creatives → approve →
          launch.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigate('ai-marketing-director')}
            className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-4 text-sm font-black uppercase tracking-wider text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:shadow-xl"
          >
            Create Campaign →
          </button>
          <button
            type="button"
            onClick={() => navigate('creatives')}
            className="rounded-2xl border border-slate-200 bg-white px-8 py-4 text-sm font-black uppercase tracking-wider text-slate-800"
          >
            Open Creative Studio
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Active campaigns" value={String(store.campaigns.length || final.length)} tone="from-violet-600 to-fuchsia-600" />
        <StatCard label="Pending review" value={String(pending.length)} tone="from-amber-500 to-orange-500" />
        <StatCard label="Approved" value={String(approved.length)} tone="from-emerald-600 to-teal-600" />
        <StatCard label="Ad spend (mo)" value={monthlySpend ? `R${monthlySpend.toLocaleString('en-ZA')}` : '—'} tone="from-cyan-600 to-blue-600" />
        <StatCard label="AI suggestions" value={store.uploadedCreatives.length ? 'Review & launch' : 'Create 1 campaign'} tone="from-slate-800 to-slate-600" />
      </section>

      <section>
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Create campaign</h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {PLATFORMS.filter(p => ['Facebook', 'Instagram', 'Google Ads', 'LinkedIn'].includes(p.id)).map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => openPlatform(p)}
              className="group relative overflow-hidden rounded-[28px] border border-white/20 p-6 text-left text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
              style={{
                background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
              }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient} opacity-100 transition group-hover:scale-105`} />
              <div
                className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl transition group-hover:scale-125"
                style={{ background: p.glow }}
              />
              <div className="relative z-10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-black backdrop-blur-sm">
                  {p.icon}
                </div>
                <div className="mt-5 text-2xl font-black">{p.label}</div>
                <div className="mt-1 text-sm font-semibold text-white/85">{p.tagline}</div>
                <div className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/70 opacity-0 transition group-hover:opacity-100">
                  Start →
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Latest creatives</h3>
            <p className="mt-1 text-sm font-semibold text-slate-600">Image-first. Approve and launch the winners.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('creatives')}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-black uppercase text-slate-700"
          >
            View all →
          </button>
        </div>

        {store.uploadedCreatives.length === 0 ? (
          <div className="mt-5 rounded-[24px] border border-slate-100 bg-white p-6">
            <p className="text-sm font-semibold text-slate-600">
              No creatives yet. Create a campaign → generate in ChatGPT → upload images → approve.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...store.uploadedCreatives]
              .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
              .slice(0, 8)
              .map(c => (
                <article
                  key={c.id}
                  className="overflow-hidden rounded-[24px] border border-white/60 bg-white/70 shadow-lg ring-1 ring-slate-100/80 backdrop-blur-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.imageUrl} alt={c.variationName} className="aspect-[4/5] w-full object-cover" />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-black text-slate-900">{c.clientName}</p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">
                          {c.platform} · {c.variationName}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                          c.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'Pending Review'
                              ? 'bg-amber-100 text-amber-900'
                              : c.status === 'Needs Revision'
                                ? 'bg-violet-100 text-violet-900'
                                : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => navigate('creatives')}
                        className="rounded-xl bg-violet-600 px-3 py-2.5 text-[10px] font-black uppercase text-white"
                      >
                        Review
                      </button>
                      <button
                        type="button"
                        onClick={() => window.open(getPlatformLaunchUrl(c.platform), '_blank')}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[10px] font-black uppercase text-slate-700"
                      >
                        Open ads
                      </button>
                    </div>
                  </div>
                </article>
              ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone: string
}) {
  return (
    <div className="relative overflow-hidden rounded-[24px] border border-slate-100 bg-white p-5 shadow-sm">
      <div className={`absolute inset-0 bg-gradient-to-br ${tone} opacity-[0.08]`} />
      <div className="relative">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      </div>
    </div>
  )
}
