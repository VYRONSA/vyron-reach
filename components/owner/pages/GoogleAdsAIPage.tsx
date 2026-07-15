'use client'

import { useEffect, useState } from 'react'
import { useAppNavigation } from '@/context/AppNavigationContext'
import { useVyronData } from '@/context/VyronDataContext'
import { CopyBlock } from '@/components/owner/CopyBlock'
import { ExecutionPrefillBanner } from '@/components/owner/ExecutionPrefillBanner'
import { GoogleAdsLaunchPanel } from '@/components/owner/GoogleAdsLaunchPanel'
import { ADS_STARTUP_RULE } from '@/lib/ownerMarketingData'
import { buildOwnerDrill } from '@/lib/ownerDrill'
import { generateGoogleAdsCampaignPlan, type GoogleAdsPlanSections } from '@/lib/googleAdsPlanGenerator'
import type { GoogleAdsBuilderPrefill } from '@/lib/executionPrefill'
import { OwnerCard, OwnerEmptyState, OwnerPageShell, OwnerStatGrid, ClickableRow } from '@/components/owner/OwnerPageShell'

const EMPTY: GoogleAdsBuilderPrefill = {
  campaignName: '',
  dailyBudget: 50,
  targetArea: 'South Africa',
  productService: '',
  keywordTheme: '',
  audience: '',
  offer: '',
  landingPageUrl: '',
}

export function GoogleAdsAIPage() {
  const { openDrill, executionPrefill } = useAppNavigation()
  const { store, saveGoogleAdsPlan, deleteGoogleAdsPlan, markGoogleAdsPlanLaunched } = useVyronData()
  const { settings, campaigns, googleAdsPlans } = store

  const [form, setForm] = useState<GoogleAdsBuilderPrefill>({
    ...EMPTY,
    dailyBudget: settings.defaultAdDailyBudget,
    productService: settings.businessType,
    targetArea: settings.defaultTargetArea,
    campaignName: `${settings.defaultProject} — Search Test`,
    audience: 'South African business owners and HR managers',
    offer: 'Stop losing payroll hours — book a demo',
  })
  const [sections, setSections] = useState<GoogleAdsPlanSections | null>(null)
  const [showLaunchPanel, setShowLaunchPanel] = useState(false)

  useEffect(() => {
    if (executionPrefill?.googleAds) {
      setForm({ ...executionPrefill.googleAds })
    }
    if (executionPrefill?.attachedCreative) {
      const a = executionPrefill.attachedCreative
      setForm(f => ({
        ...f,
        campaignName: `${a.productName} — ${a.platform}`,
        keywordTheme: a.headline,
        audience: a.audience,
        offer: a.offer,
        productService: a.productName,
      }))
    }
    if (executionPrefill?.showGoogleAdsLaunch) {
      if (executionPrefill.googleAds) {
        setSections(generateGoogleAdsCampaignPlan(executionPrefill.googleAds, settings))
      }
      setShowLaunchPanel(true)
    }
  }, [executionPrefill, settings])

  const dailyTest = `R${form.dailyBudget}/day`

  const runGenerate = () => {
    const plan = generateGoogleAdsCampaignPlan(form, settings)
    setSections(plan)
  }

  const savePlan = () => {
    if (!sections) {
      runGenerate()
      return
    }
    const s = sections ?? generateGoogleAdsCampaignPlan(form, settings)
    saveGoogleAdsPlan({
      campaignName: form.campaignName,
      dailyBudget: form.dailyBudget,
      targetArea: form.targetArea,
      keywordTheme: form.keywordTheme,
      productService: form.productService,
      audience: form.audience,
      offer: form.offer,
      landingPageUrl: form.landingPageUrl,
      planText: s.fullPlan,
      actionId: executionPrefill?.actionId,
    })
  }

  const exportPlan = async () => {
    const text = sections?.fullPlan ?? generateGoogleAdsCampaignPlan(form, settings).fullPlan
    await navigator.clipboard.writeText(text)
  }

  return (
    <OwnerPageShell
      eyebrow="Google Ads AI · Spend Control"
      title="Google Ads AI"
      subtitle="Campaign builder, ad copy, keywords, negatives and saved plans — connected to AI Action Queue."
      theme="ads"
    >
      <ExecutionPrefillBanner />

      {executionPrefill?.attachedCreative ? (
        <OwnerCard>
          <p className="text-sm font-black text-violet-800">Creative attached from AI Creative Studio</p>
          <p className="mt-2 text-sm text-slate-600">
            Headline: {executionPrefill.attachedCreative.headline} · CTA: {executionPrefill.attachedCreative.cta} ·{' '}
            {executionPrefill.attachedCreative.platform}
          </p>
        </OwnerCard>
      ) : null}

      {showLaunchPanel && sections ? (
        <GoogleAdsLaunchPanel
          form={form}
          sections={sections}
          campaignReady={Boolean(executionPrefill?.attachedCreative)}
          onClose={() => setShowLaunchPanel(false)}
        />
      ) : null}

      <OwnerStatGrid
        stats={[
          { label: 'Test Budget', value: dailyTest, color: '#ec4899' },
          { label: 'Saved Plans', value: String(googleAdsPlans.length), color: '#7c3aed' },
          { label: 'Campaigns', value: String(campaigns.length), color: '#1688ff' },
          { label: 'Launched', value: String(googleAdsPlans.filter(p => p.launched).length), color: '#10b981' },
        ]}
      />

      <OwnerCard>
        <h2 className="text-xl font-black text-slate-950">Google Ads Builder</h2>
        <p className="mt-1 text-sm text-slate-500">{ADS_STARTUP_RULE}</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Campaign Name" value={form.campaignName} onChange={v => setForm(f => ({ ...f, campaignName: v }))} />
          <Field
            label="Daily Budget (ZAR)"
            value={String(form.dailyBudget)}
            onChange={v => setForm(f => ({ ...f, dailyBudget: Number(v) || 50 }))}
          />
          <Field label="Target Area" value={form.targetArea} onChange={v => setForm(f => ({ ...f, targetArea: v }))} />
          <Field label="Product / Service" value={form.productService} onChange={v => setForm(f => ({ ...f, productService: v }))} />
          <Field label="Keyword Theme" value={form.keywordTheme} onChange={v => setForm(f => ({ ...f, keywordTheme: v }))} />
          <Field label="Audience" value={form.audience} onChange={v => setForm(f => ({ ...f, audience: v }))} />
          <Field label="Offer" value={form.offer} onChange={v => setForm(f => ({ ...f, offer: v }))} />
          <Field label="Landing Page URL" value={form.landingPageUrl} onChange={v => setForm(f => ({ ...f, landingPageUrl: v }))} />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runGenerate}
            className="rounded-2xl bg-gradient-to-r from-fuchsia-600 to-orange-500 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white"
          >
            Generate Campaign
          </button>
          <button
            type="button"
            onClick={savePlan}
            className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-[10px] font-black uppercase text-violet-800"
          >
            Save Google Ads Plan
          </button>
          <button
            type="button"
            onClick={exportPlan}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-[10px] font-black uppercase text-slate-700"
          >
            Export Google Ads Plan
          </button>
          {sections ? (
            <button
              type="button"
              onClick={() => setShowLaunchPanel(true)}
              className="rounded-2xl border border-emerald-300 bg-emerald-50 px-5 py-3 text-[10px] font-black uppercase text-emerald-800"
            >
              Launch Google Ads Setup
            </button>
          ) : null}
        </div>

        {sections ? (
          <div className="mt-6 space-y-3">
            <CopyBlock label="Full Plan" text={sections.fullPlan} />
            <CopyBlock label="Campaign Structure" text={sections.structure} />
            <CopyBlock label="Ad Groups" text={sections.adGroups} />
            <CopyBlock label="Exact Match Keywords" text={sections.exactKeywords} />
            <CopyBlock label="Phrase Match Keywords" text={sections.phraseKeywords} />
            <CopyBlock label="Negative Keywords" text={sections.negativeKeywords} />
            <CopyBlock label="Headlines" text={sections.headlines} />
            <CopyBlock label="Descriptions" text={sections.descriptions} />
            <CopyBlock label="Landing Page" text={sections.landingPage} />
            <CopyBlock label="Budget & Scaling" text={sections.budgetRule} />
            <CopyBlock label="Next Steps" text={sections.nextSteps} />
          </div>
        ) : (
          <p className="mt-5 text-sm font-semibold text-slate-500">
            Fill fields and click Generate Campaign to see structure, keywords, ad copy and export.
          </p>
        )}
      </OwnerCard>

      <OwnerCard>
        <h2 className="text-xl font-black text-slate-950">Saved Google Ads Plans</h2>
        <div className="mt-5 space-y-3">
          {googleAdsPlans.length === 0 ? (
            <OwnerEmptyState
              title="No saved plans yet"
              description="Generate a campaign above and click Save Google Ads Plan."
            />
          ) : (
            googleAdsPlans.map(p => (
              <div key={p.id} className="rounded-2xl border border-slate-100 p-3">
                <ClickableRow
                  title={p.campaignName}
                  subtitle={`R${p.dailyBudget}/day · ${p.targetArea} · ${p.keywordTheme}`}
                  badge={p.launched ? 'Launched' : 'Draft'}
                  accent="#ec4899"
                  onClick={() =>
                    openDrill(
                      buildOwnerDrill(
                        p.campaignName,
                        p.planText.slice(0, 200),
                        'Google Ads AI',
                        [
                          { label: 'Budget', value: `R${p.dailyBudget}/day` },
                          { label: 'Keywords', value: p.keywordTheme },
                          { label: 'Landing', value: p.landingPageUrl },
                        ],
                        ['Copy plan sections', 'Launch in Google Ads', 'Mark launched when live'],
                        undefined,
                        { department: 'Google Ads AI', kind: 'google_ads' },
                      ),
                    )
                  }
                />
                <div className="mt-2 flex flex-wrap gap-2 px-2 pb-2">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(p.planText)}
                    className="text-[10px] font-black uppercase text-violet-600"
                  >
                    Copy Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        campaignName: p.campaignName,
                        dailyBudget: p.dailyBudget,
                        targetArea: p.targetArea,
                        keywordTheme: p.keywordTheme,
                        productService: p.productService,
                        audience: p.audience,
                        offer: p.offer,
                        landingPageUrl: p.landingPageUrl,
                      })
                      setSections(generateGoogleAdsCampaignPlan(
                        {
                          campaignName: p.campaignName,
                          dailyBudget: p.dailyBudget,
                          targetArea: p.targetArea,
                          keywordTheme: p.keywordTheme,
                          productService: p.productService,
                          audience: p.audience,
                          offer: p.offer,
                          landingPageUrl: p.landingPageUrl,
                        },
                        settings,
                      ))
                      setShowLaunchPanel(true)
                    }}
                    className="text-[10px] font-black uppercase text-emerald-600"
                  >
                    Launch Google Ads Setup
                  </button>
                  {!p.launched ? (
                    <button
                      type="button"
                      onClick={() => markGoogleAdsPlanLaunched(p.id)}
                      className="text-[10px] font-black uppercase text-violet-600"
                    >
                      Mark Launched
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => deleteGoogleAdsPlan(p.id)}
                    className="text-[10px] font-black uppercase text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </OwnerCard>
    </OwnerPageShell>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label}
      <input
        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  )
}
