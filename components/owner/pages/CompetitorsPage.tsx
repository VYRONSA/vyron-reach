'use client'

import { useState } from 'react'
import { useAppNavigation } from '@/context/AppNavigationContext'
import { useVyronData } from '@/context/VyronDataContext'
import { buildOwnerDrill } from '@/lib/ownerDrill'
import type { VyronCompetitor } from '@/lib/vyronStore/types'
import { OwnerCard, OwnerEmptyState, OwnerPageShell, OwnerStatGrid, ClickableRow } from '@/components/owner/OwnerPageShell'

const EMPTY = {
  name: '',
  domain: '',
  threat: 'Medium' as VyronCompetitor['threat'],
  keywordGaps: '',
  weakPages: '',
}

export function CompetitorsPage() {
  const { openDrill } = useAppNavigation()
  const { store, addCompetitor, deleteCompetitor } = useVyronData()
  const { competitors } = store
  const [form, setForm] = useState(EMPTY)
  const [showForm, setShowForm] = useState(false)

  const highThreat = competitors.filter(c => c.threat === 'High').length
  const gapCount = competitors.reduce((s, c) => s + c.keywordGaps.length, 0)

  const saveCompetitor = () => {
    if (!form.name.trim() || !form.domain.trim()) return
    addCompetitor({
      name: form.name.trim(),
      domain: form.domain.trim(),
      threat: form.threat,
      keywordGaps: form.keywordGaps
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      weakPages: form.weakPages
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    })
    setForm(EMPTY)
    setShowForm(false)
  }

  return (
    <OwnerPageShell
      eyebrow="Competitive Intelligence"
      title="Competitor Intelligence"
      subtitle="Competitor tracking, keyword gaps, weak pages, comparison opportunities and market openings."
      theme="competitors"
    >
      <OwnerStatGrid
        stats={[
          { label: 'Tracked', value: String(competitors.length), color: '#6366f1' },
          { label: 'High Threat', value: String(highThreat), color: '#ef4444' },
          { label: 'Gap Keywords', value: String(gapCount), color: '#10b981' },
          { label: 'Weak Pages', value: String(competitors.reduce((s, c) => s + c.weakPages.length, 0)), color: '#f97316' },
        ]}
      />
      <OwnerCard>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-950">Competitor Profiles</h2>
          <button
            type="button"
            onClick={() => setShowForm(v => !v)}
            className="rounded-2xl bg-indigo-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white"
          >
            {showForm ? 'Cancel' : 'Add Competitor'}
          </button>
        </div>

        {showForm ? (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              Competitor Name
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Domain
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                placeholder="competitor.co.za"
                value={form.domain}
                onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Threat Level
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.threat}
                onChange={e => setForm(f => ({ ...f, threat: e.target.value as VyronCompetitor['threat'] }))}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Keyword Gaps (comma-separated)
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.keywordGaps}
                onChange={e => setForm(f => ({ ...f, keywordGaps: e.target.value }))}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
              Weak Pages (comma-separated URLs or titles)
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={form.weakPages}
                onChange={e => setForm(f => ({ ...f, weakPages: e.target.value }))}
              />
            </label>
            <button
              type="button"
              onClick={saveCompetitor}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white sm:col-span-2"
            >
              Save Competitor
            </button>
          </div>
        ) : null}

        <div className="mt-5 space-y-3">
          {competitors.length === 0 ? (
            <OwnerEmptyState
              title="No competitors tracked yet"
              description="Add competitor domains to monitor keyword gaps, weak pages and comparison opportunities."
              action={
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="rounded-2xl bg-indigo-600 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white"
                >
                  Add First Competitor
                </button>
              }
            />
          ) : (
            competitors.map(c => (
              <div key={c.id} className="rounded-2xl border border-slate-100 p-2">
                <ClickableRow
                  title={c.name}
                  subtitle={`${c.domain} · Threat: ${c.threat} · Gaps: ${c.keywordGaps.join(', ') || '—'}`}
                  badge={c.threat}
                  accent="#6366f1"
                  onClick={() =>
                    openDrill(
                      buildOwnerDrill(
                        c.name,
                        `Competitive analysis for ${c.domain}`,
                        'Competitors',
                        [
                          { label: 'Domain', value: c.domain },
                          { label: 'Threat Level', value: c.threat },
                          { label: 'Weak Pages', value: c.weakPages.join(' · ') || '—' },
                          { label: 'Keyword Gaps', value: c.keywordGaps.join(', ') || '—' },
                          { label: 'Opportunity', value: 'Comparison landing page + outdepth content' },
                        ],
                        [
                          'Build comparison landing page targeting gap keywords',
                          'Publish content that outdepths weak competitor pages',
                          'Monitor their ranking movement weekly',
                          'Capture comparison search intent in Google Ads only after SEO assets exist',
                        ],
                        [
                          { label: 'Threat', value: c.threat, tone: c.threat === 'High' ? 'red' : 'green' },
                          { label: 'Gaps', value: String(c.keywordGaps.length), tone: 'cyan' },
                        ],
                        { department: 'Competitors', priority: c.threat === 'High' ? 'Critical' : 'Medium' },
                      ),
                    )
                  }
                />
                <div className="px-3 pb-2">
                  <button
                    type="button"
                    onClick={() => deleteCompetitor(c.id)}
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
