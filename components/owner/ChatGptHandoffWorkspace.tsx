'use client'

import { useEffect, useMemo, useState } from 'react'
import { useVyronData } from '@/context/VyronDataContext'
import { buildDirectorContext } from '@/lib/marketingDirector/context'
import { buildWorldClassChatGptPrompt, type HandoffBrief } from '@/lib/marketingDirector/handoffPrompt'
import { CreativeUploadPanel } from '@/components/owner/CreativeUploadPanel'
import { CHATGPT_URL } from '@/lib/marketingDirector/prompts'
import type { PlatformId } from '@/lib/platforms'
import { PLATFORMS, getPlatform } from '@/lib/platforms'

const DRAFT_KEY = 'vyron-create-campaign-draft-v1'

type Step = 1 | 2 | 3 | 4 | 5

type Draft = {
  platform: PlatformId
  clientId: string | null
  campaignGoal: string
  requestText: string
  pastedResult: string
}

export function ChatGptHandoffWorkspace({
  initialPlatform,
  initialClientId,
  onToast,
}: {
  initialPlatform: PlatformId | null
  initialClientId: string | null
  onToast: (msg: string) => void
}) {
  const { store } = useVyronData()

  const [step, setStep] = useState<Step>(1)
  const [platform, setPlatform] = useState<PlatformId>(initialPlatform ?? 'Facebook')
  const [clientId, setClientId] = useState<string | null>(initialClientId ?? store.clients[0]?.id ?? null)
  const [campaignGoal, setCampaignGoal] = useState('Generate qualified leads and demo bookings')
  const [requestText, setRequestText] = useState('')
  const [pastedResult, setPastedResult] = useState('')

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return
      const d = JSON.parse(raw) as Draft
      if (d.platform) setPlatform(d.platform)
      if (d.clientId !== undefined) setClientId(d.clientId)
      if (d.campaignGoal) setCampaignGoal(d.campaignGoal)
      if (d.requestText) setRequestText(d.requestText)
      if (d.pastedResult) setPastedResult(d.pastedResult)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    const d: Draft = { platform, clientId, campaignGoal, requestText, pastedResult }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(d))
  }, [platform, clientId, campaignGoal, requestText, pastedResult])

  const ctx = buildDirectorContext(store, clientId)
  const platformConfig = getPlatform(platform)

  const brief: HandoffBrief = useMemo(
    () => ({
      clientId,
      platform,
      campaignGoal,
      offerAngle: requestText || undefined,
      extraNotes: 'Use the user request verbatim as the creative direction. Keep it premium and visual.',
    }),
    [clientId, platform, campaignGoal, requestText],
  )

  const prompt = useMemo(() => buildWorldClassChatGptPrompt(ctx, brief), [ctx, brief])

  const openChatGpt = async () => {
    await navigator.clipboard.writeText(prompt)
    window.open(CHATGPT_URL, '_blank', 'noopener,noreferrer')
    onToast('Prompt copied — paste into ChatGPT')
    setStep(5)
  }

  return (
    <div className="space-y-6">
      <StepPills step={step} />

      {step === 1 ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-black text-slate-950">Step 1 — Choose platform</h2>
          <p className="mt-1 text-sm text-slate-500">Big icons only. Pick where you’re advertising.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLATFORMS.filter(p => ['Facebook', 'Instagram', 'Google Ads', 'LinkedIn'].includes(p.id)).map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPlatform(p.id)
                  setStep(2)
                }}
                className="group relative overflow-hidden rounded-[28px] border border-white/20 p-6 text-left text-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${p.gradient}`} />
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-2xl transition group-hover:scale-110"
                  style={{ background: p.glow }}
                />
                <div className="relative z-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-black backdrop-blur-sm">
                    {p.icon}
                  </div>
                  <div className="mt-5 text-2xl font-black">{p.label}</div>
                  <div className="mt-1 text-sm font-semibold text-white/85">{p.tagline}</div>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-black text-slate-950">Step 2 — Choose client</h2>
          <p className="mt-1 text-sm text-slate-500">We’ll build the prompt with full client context.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-black text-slate-700">
              Client
              <select
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
                value={clientId ?? ''}
                onChange={e => setClientId(e.target.value || null)}
              >
                <option value="">Select client…</option>
                {store.clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.businessName}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-black text-slate-700">
              Campaign goal
              <input
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
                value={campaignGoal}
                onChange={e => setCampaignGoal(e.target.value)}
              />
            </label>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase text-slate-700"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!clientId}
              onClick={() => setStep(3)}
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-4 text-sm font-black uppercase tracking-wide text-white disabled:opacity-40"
            >
              Continue →
            </button>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-black text-slate-950">Step 3 — Type what you want</h2>
          <p className="mt-1 text-sm text-slate-500">Natural language. This becomes the heart of the prompt.</p>
          <textarea
            className="mt-5 min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-base font-semibold leading-relaxed"
            placeholder={`e.g. Create a premium ${platformConfig.label} advert for ${ctx.client?.businessName ?? 'VYRON CORE'}…`}
            value={requestText}
            onChange={e => setRequestText(e.target.value)}
          />
          <div className="mt-6 flex flex-wrap gap-3">
            {[
              `Create a premium ${platformConfig.label} advert for ${ctx.client?.businessName ?? 'VYRON CORE'}`,
              'Make it more like the VYRON CORE launch poster',
              'More premium and cinematic',
              'Stronger headline and CTA',
            ].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setRequestText(s)}
                className="rounded-full bg-violet-50 px-3 py-1.5 text-[10px] font-black uppercase text-violet-800"
              >
                {s.slice(0, 28)}…
              </button>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase text-slate-700"
            >
              Back
            </button>
            <button
              type="button"
              disabled={!requestText.trim()}
              onClick={() => setStep(4)}
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-8 py-4 text-sm font-black uppercase tracking-wide text-white disabled:opacity-40"
            >
              Continue →
            </button>
          </div>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h2 className="text-xl font-black text-slate-950">Step 4 — Open in ChatGPT</h2>
            <p className="mt-1 text-sm text-slate-500">
              We prepared a strategist-grade prompt for <strong>{ctx.client?.businessName}</strong> ·{' '}
              <strong>{platformConfig.label}</strong>. Copy it or open ChatGPT.
            </p>
          </div>
          <textarea
            readOnly
            className="min-h-[260px] w-full resize-y border-0 bg-slate-50 px-6 py-5 font-mono text-xs leading-relaxed text-slate-800 focus:ring-0"
            value={prompt}
          />
          <div className="grid gap-3 border-t border-slate-100 p-5 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void navigator.clipboard.writeText(prompt).then(() => onToast('Prompt copied'))}
              className="rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm font-black uppercase tracking-wide text-slate-800 hover:bg-slate-50"
            >
              Copy prompt
            </button>
            <button
              type="button"
              onClick={() => void openChatGpt()}
              className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-sm font-black uppercase tracking-wide text-white shadow-lg"
            >
              Open in ChatGPT →
            </button>
          </div>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-black text-slate-950">Step 5 — Paste result + upload images</h2>
          <p className="mt-1 text-sm text-slate-500">
            Paste the final ChatGPT output, then upload the advert images. Approve the best one and launch.
          </p>
          <textarea
            className="mt-5 min-h-[160px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium leading-relaxed"
            placeholder="Paste final ChatGPT output (copy, captions, CTA, image prompt)…"
            value={pastedResult}
            onChange={e => setPastedResult(e.target.value)}
          />
          {clientId ? (
            <div className="mt-8">
              <CreativeUploadPanel
                clientId={clientId}
                clientName={ctx.client?.businessName ?? store.settings.defaultProject}
                platform={platformConfig.label}
                campaignGoal={campaignGoal}
                chatgptNotes={pastedResult}
                defaultCaption={pastedResult.split('\n').find(l => l.length > 20)?.slice(0, 280) ?? ''}
                defaultCta="BOOK DEMO"
                onToast={onToast}
              />
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}

function StepPills({ step }: { step: Step }) {
  const items: { n: Step; label: string }[] = [
    { n: 1, label: 'Platform' },
    { n: 2, label: 'Client' },
    { n: 3, label: 'Request' },
    { n: 4, label: 'ChatGPT' },
    { n: 5, label: 'Import' },
  ]
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(i => (
        <span
          key={i.n}
          className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-wide ${
            step === i.n
              ? 'bg-violet-600 text-white'
              : step > i.n
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-500'
          }`}
        >
          {i.n}. {i.label}
        </span>
      ))}
    </div>
  )
}
