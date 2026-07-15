'use client'

import { useEffect, useState } from 'react'
import { useAppNavigation } from '@/context/AppNavigationContext'
import { ExecutionPrefillBanner } from '@/components/owner/ExecutionPrefillBanner'
import { useVyronData } from '@/context/VyronDataContext'
import { generateAIKeywords } from '@/lib/keywordGenerator'
import { SEO_TIMELINE_NOTE } from '@/lib/ownerMarketingData'
import { buildOwnerDrill } from '@/lib/ownerDrill'
import type { KeywordIntent } from '@/lib/vyronStore/types'
import { OwnerCard, OwnerEmptyState, OwnerPageShell, OwnerStatGrid, ClickableRow } from '@/components/owner/OwnerPageShell'

const INTENTS: KeywordIntent[] = ['Commercial', 'Local', 'Informational', 'Buyer Intent']

export function SeoWarRoomPage() {
  const { openDrill, executionPrefill } = useAppNavigation()
  const { store, addKeyword, addKeywords, deleteKeyword } = useVyronData()
  const { keywords, settings, competitors } = store

  const [showForm, setShowForm] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [business, setBusiness] = useState(settings.businessName)
  const [industry, setIndustry] = useState(settings.businessType)
  const [targetArea, setTargetArea] = useState(settings.defaultTargetArea)
  const [intent, setIntent] = useState<KeywordIntent>('Buyer Intent')
  const [services, setServices] = useState('')

  useEffect(() => {
    if (executionPrefill?.seo) {
      const s = executionPrefill.seo
      setKeyword(s.keyword)
      setBusiness(s.business)
      setIndustry(s.industry)
      setTargetArea(s.targetArea)
      setIntent(s.intent as KeywordIntent)
      setShowForm(true)
    }
  }, [executionPrefill])

  const commercial = keywords.filter(
    k => k.intent === 'Commercial' || k.intent === 'Buyer Intent' || k.intent === 'Transactional',
  ).length
  const competitorGaps = competitors.flatMap(c => c.keywordGaps.map(gap => ({ gap, competitor: c.name })))

  const saveKeyword = () => {
    if (!keyword.trim()) return
    addKeyword({
      keyword: keyword.trim(),
      volume: 400,
      difficulty: 35,
      intent,
      forecast: `6-month ranking target for ${settings.defaultProject}`,
      gap: 'Create or optimize dedicated landing page',
      recommendedPage: 'New landing page',
      business: business.trim(),
      industry: industry.trim(),
      targetArea: targetArea.trim() || settings.defaultTargetArea,
    })
    setKeyword('')
    setShowForm(false)
  }

  const runAiKeywords = () => {
    const generated = generateAIKeywords({
      business,
      industry,
      targetArea,
      services,
      settings,
    })
    const existing = new Set(keywords.map(k => k.keyword.toLowerCase()))
    const fresh = generated.filter(g => !existing.has(g.keyword.toLowerCase()))
    if (fresh.length) addKeywords(fresh)
  }

  const openKeywordDrill = (kw: (typeof keywords)[0]) => {
    openDrill(
      buildOwnerDrill(
        kw.keyword,
        kw.gap || kw.forecast,
        'SEO War Room',
        [
          { label: 'Search Volume', value: String(kw.volume) },
          { label: 'Difficulty', value: String(kw.difficulty) },
          { label: 'Intent', value: kw.intent },
          { label: 'Business', value: kw.business || '—' },
          { label: 'Industry', value: kw.industry || '—' },
          { label: 'Target Area', value: kw.targetArea || settings.defaultTargetArea },
          { label: '6-Month Forecast', value: kw.forecast },
        ],
        [
          'Audit current ranking page or create new landing page',
          'Add FAQ schema and internal links from related service pages',
          `Publish buyer-intent content targeting "${kw.keyword}"`,
          `Track weekly — ~${settings.defaultSeoTimelineMonths} month horizon`,
        ],
        [
          { label: 'Difficulty', value: String(kw.difficulty), tone: 'purple' },
          { label: 'Intent', value: kw.intent, tone: 'green' },
        ],
        { department: 'SEO War Room', priority: kw.difficulty > 35 ? 'High' : 'Medium' },
      ),
    )
  }

  return (
    <OwnerPageShell
      eyebrow="SEO Intelligence · 6-Month Horizon"
      title="SEO War Room"
      subtitle="Keyword opportunities, ranking difficulty, search intent, content gaps and competitor SEO weaknesses."
      theme="seo"
    >
      <OwnerStatGrid
        stats={[
          { label: 'Keywords', value: String(keywords.length), color: '#22d3ee' },
          { label: 'Buyer / Commercial', value: String(commercial), color: '#10b981' },
          { label: 'SEO Timeline', value: `${settings.defaultSeoTimelineMonths} mo`, color: '#7c3aed' },
          { label: 'Market', value: settings.defaultMarket.slice(0, 12), color: '#f97316' },
        ]}
      />

      <ExecutionPrefillBanner />

      <OwnerCard>
        <p className="text-sm font-semibold leading-7 text-slate-600">{SEO_TIMELINE_NOTE}</p>
      </OwnerCard>

      <OwnerCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-950">Add & Generate Keywords</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowForm(v => !v)}
              className="rounded-2xl bg-cyan-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white"
            >
              Add Keyword
            </button>
            <button
              type="button"
              onClick={runAiKeywords}
              className="rounded-2xl bg-gradient-to-r from-violet-600 to-cyan-500 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white"
            >
              Generate AI Keywords
            </button>
          </div>
        </div>

        {showForm ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Keyword
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
                placeholder="e.g. workforce management software South Africa"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Business
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={business}
                onChange={e => setBusiness(e.target.value)}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Industry
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={industry}
                onChange={e => setIndustry(e.target.value)}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Target Area
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={targetArea}
                onChange={e => setTargetArea(e.target.value)}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Intent
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={intent}
                onChange={e => setIntent(e.target.value as KeywordIntent)}
              >
                {INTENTS.map(i => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Services (optional, for AI generation)
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={services}
                onChange={e => setServices(e.target.value)}
                placeholder="staff clocking, rostering, HR compliance"
              />
            </label>
            <div className="flex gap-2 sm:col-span-2">
              <button
                type="button"
                onClick={saveKeyword}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white"
              >
                Save Keyword
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-black text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            AI generation uses your business type, industry, target area and VYRON CORE defaults when applicable.
          </p>
        )}
      </OwnerCard>

      {competitorGaps.length > 0 ? (
        <OwnerCard>
          <h2 className="text-lg font-black text-slate-950">Competitor Keyword Gaps</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {competitorGaps.slice(0, 8).map(({ gap, competitor }) => (
              <button
                key={`${competitor}-${gap}`}
                type="button"
                onClick={() =>
                  openDrill(
                    buildOwnerDrill(
                      gap,
                      `Gap vs ${competitor}`,
                      'SEO War Room',
                      [{ label: 'Competitor', value: competitor }],
                      ['Build comparison landing page', 'Outdepth weak competitor content'],
                      undefined,
                      { department: 'SEO War Room' },
                    ),
                  )
                }
                className="rounded-xl bg-cyan-50 px-3 py-2 text-xs font-bold text-cyan-900"
              >
                {gap}
              </button>
            ))}
          </div>
        </OwnerCard>
      ) : null}

      <OwnerCard>
        <h2 className="text-xl font-black text-slate-950">Keyword Opportunities</h2>
        <p className="mt-2 text-sm text-slate-500">Click a keyword for drilldown. Delete removes from your list.</p>
        <div className="mt-5 space-y-3">
          {keywords.length === 0 ? (
            <OwnerEmptyState
              title="Add your first SEO keyword"
              description="Use Add Keyword or Generate AI Keywords to build your SEO target list."
              action={
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="rounded-xl bg-cyan-600 px-5 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white"
                >
                  Add Keyword
                </button>
              }
            />
          ) : (
            keywords.map(kw => (
              <div key={kw.id} className="rounded-2xl border border-slate-100 bg-white p-1">
                <ClickableRow
                  title={kw.keyword}
                  subtitle={`${kw.business || '—'} · ${kw.industry || '—'} · ${kw.targetArea || settings.defaultTargetArea} · Diff ${kw.difficulty}`}
                  badge={kw.intent}
                  accent="#22d3ee"
                  onClick={() => openKeywordDrill(kw)}
                />
                <div className="px-3 pb-2">
                  <button
                    type="button"
                    onClick={() => deleteKeyword(kw.id)}
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
