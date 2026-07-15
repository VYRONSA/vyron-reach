'use client'

import { useState } from 'react'
import type { GoogleAdsBuilderPrefill } from '@/lib/executionPrefill'
import type { GoogleAdsPlanSections } from '@/lib/googleAdsPlanGenerator'
import { exportGoogleAdsCsv } from '@/lib/googleAdsCsvExport'
import { CopyBlock } from '@/components/owner/CopyBlock'

const SETUP_STEPS = [
  'Sign in at Google Ads → https://ads.google.com/',
  'Click **New campaign** → choose goal (Leads or Sales) → campaign type **Search** (or Display if noted in plan).',
  'Set campaign name to match the generated name below.',
  'Locations: paste target area exactly as shown in assets.',
  'Budget: set daily budget (ZAR) — start at test budget, do not scale for 14 days.',
  'Keywords: create ad groups → paste **Exact** and **Phrase** keyword lists.',
  'Ads: create Responsive Search Ads → paste headlines and descriptions.',
  'Negatives: add campaign-level negative keyword list.',
  'Extensions: sitelinks to demo/pricing/landing URL.',
  'Review → **Publish** → mark launched in VYRON REACH.',
]

export function GoogleAdsLaunchPanel({
  form,
  sections,
  campaignReady,
  onClose,
}: {
  form: GoogleAdsBuilderPrefill
  sections: GoogleAdsPlanSections
  campaignReady?: boolean
  onClose?: () => void
}) {
  const [csvCopied, setCsvCopied] = useState(false)

  const exportCsv = async () => {
    const csv = exportGoogleAdsCsv(form, sections)
    await navigator.clipboard.writeText(csv)
    setCsvCopied(true)
    setTimeout(() => setCsvCopied(false), 2000)
  }

  return (
    <div className="rounded-[28px] border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/90 via-white to-cyan-50/50 p-6 shadow-lg shadow-emerald-100/40">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">
            Real execution · Google Ads
          </p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">Launch Google Ads Setup</h2>
          {campaignReady ? (
            <span className="mt-2 inline-block rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-black uppercase text-white">
              Campaign Ready — creative approved
            </span>
          ) : null}
          <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600">
            Follow these steps in Google Ads. Copy each asset block below — or export CSV for Editor workflows.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="https://ads.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white"
          >
            Open in Google Ads ↗
          </a>
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-2xl border border-emerald-300 bg-white px-5 py-3 text-[10px] font-black uppercase text-emerald-800"
          >
            {csvCopied ? 'CSV Copied ✓' : 'Copy CSV Export'}
          </button>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-[10px] font-black uppercase text-slate-600"
            >
              Close
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-4">
        <p className="text-xs font-black uppercase text-slate-500">Where to go</p>
        <a
          href="https://ads.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 block text-lg font-black text-violet-700 underline"
        >
          https://ads.google.com/
        </a>
      </div>

      <div className="mt-5">
        <p className="text-xs font-black uppercase text-slate-500">Exact setup steps</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm font-semibold text-slate-700">
          {SETUP_STEPS.map(step => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <CopyBlock label="All setup steps (copy)" text={SETUP_STEPS.map((s, i) => `${i + 1}. ${s}`).join('\n')} />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <CopyBlock label="Campaign name" text={form.campaignName} />
        <CopyBlock label="Daily budget (ZAR)" text={`R${form.dailyBudget}/day`} />
        <CopyBlock label="Target location" text={form.targetArea} />
        <CopyBlock label="Audience" text={form.audience} />
        <CopyBlock label="Offer / value prop" text={form.offer} />
        <CopyBlock label="Landing page" text={form.landingPageUrl || 'https://your-client-site.com/landing'} />
        <CopyBlock label="CTA recommendation" text="Book a Demo / Get a Quote / Shop Now — match approved creative" />
        <CopyBlock label="Keyword theme" text={form.keywordTheme} />
      </div>

      <div className="mt-6 space-y-3">
        <p className="text-sm font-black text-slate-900">All generated campaign assets</p>
        <CopyBlock label="Campaign structure" text={sections.structure} />
        <CopyBlock label="Ad groups" text={sections.adGroups} />
        <CopyBlock label="Exact match keywords" text={sections.exactKeywords} />
        <CopyBlock label="Phrase match keywords" text={sections.phraseKeywords} />
        <CopyBlock label="Negative keywords" text={sections.negativeKeywords} />
        <CopyBlock label="Headlines (RSA)" text={sections.headlines} />
        <CopyBlock label="Descriptions (RSA)" text={sections.descriptions} />
        <CopyBlock label="Landing page spec" text={sections.landingPage} />
        <CopyBlock label="Budget & scaling" text={sections.budgetRule} />
        <CopyBlock label="Next steps after publish" text={sections.nextSteps} />
        <CopyBlock label="Full plan (single paste)" text={sections.fullPlan} />
      </div>
    </div>
  )
}
