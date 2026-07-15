'use client'

import { useEffect, useState } from 'react'
import { useVyronData } from '@/context/VyronDataContext'
import { isDemoEnvironmentLoaded } from '@/lib/vyronStore/demoEnvironment'
import { OwnerCard, OwnerPageShell, OwnerStatGrid } from '@/components/owner/OwnerPageShell'

function syncLabel(mode: string, storage: string, error: string | null) {
  if (mode === 'syncing') return 'Syncing to Supabase…'
  if (mode === 'synced') {
    return storage === 'normalized'
      ? 'Synced — normalized tables (clients, keywords, rankings, etc.)'
      : storage === 'blob'
        ? 'Synced — legacy blob (run normalized SQL to upgrade)'
        : 'Synced to Supabase'
  }
  if (mode === 'error') return error ? `Sync error: ${error}` : 'Sync error'
  if (mode === 'local-only') return 'Local only (sign in at /login to enable cloud)'
  return 'Local storage'
}

export function SettingsPage() {
  const {
    store,
    updateSettings,
    hydrated,
    syncMode,
    syncStorage,
    syncError,
    cloudEnabled,
    lastSyncedAt,
    syncNow,
    resetAllData,
    loadDemoEnvironment,
  } = useVyronData()
  const [draft, setDraft] = useState(store.settings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (hydrated) setDraft(store.settings)
  }, [hydrated])

  const save = () => {
    updateSettings(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <OwnerPageShell
      eyebrow="System Configuration"
      title="Settings"
      subtitle="Business profile, market selection, AI rules, SEO rules, ad spend rules and reporting preferences."
      theme="settings"
    >
      <OwnerStatGrid
        stats={[
          { label: 'Market', value: store.settings.defaultMarket.slice(0, 10), color: '#64748b' },
          { label: 'SEO Timeline', value: `${store.settings.defaultSeoTimelineMonths} mo`, color: '#10b981' },
          { label: 'Ad Start', value: `R${store.settings.defaultAdDailyBudget}/day`, color: '#ec4899' },
          { label: 'Project', value: store.settings.defaultProject, color: '#7c3aed' },
        ]}
      />

      <OwnerCard>
        <h2 className="text-xl font-black text-slate-950">Default Business Profile</h2>
        <p className="mt-1 text-sm text-slate-500">
          Saved locally{cloudEnabled ? ' and synced to Supabase when signed in' : ''} — used across SEO, ads, content and reports.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            Business Name
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={draft.businessName}
              onChange={e => setDraft(d => ({ ...d, businessName: e.target.value }))}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Default Project
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={draft.defaultProject}
              onChange={e => setDraft(d => ({ ...d, defaultProject: e.target.value }))}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Default Market
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={draft.defaultMarket}
              onChange={e => setDraft(d => ({ ...d, defaultMarket: e.target.value }))}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Contact Email
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={draft.contactEmail}
              onChange={e => setDraft(d => ({ ...d, contactEmail: e.target.value }))}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Business Type
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={draft.businessType}
              onChange={e => setDraft(d => ({ ...d, businessType: e.target.value }))}
              placeholder="Workforce management / HR software"
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Default Target Area
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={draft.defaultTargetArea}
              onChange={e => setDraft(d => ({ ...d, defaultTargetArea: e.target.value }))}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700 sm:col-span-2">
            AI Marketing Rules
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              rows={3}
              value={draft.aiMarketingRules}
              onChange={e => setDraft(d => ({ ...d, aiMarketingRules: e.target.value }))}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            Default Ad Budget (R/day)
            <input
              type="number"
              min={10}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={draft.defaultAdDailyBudget}
              onChange={e => setDraft(d => ({ ...d, defaultAdDailyBudget: Number(e.target.value) }))}
            />
          </label>
          <label className="text-sm font-semibold text-slate-700">
            SEO Timeline (months)
            <input
              type="number"
              min={3}
              max={12}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={draft.defaultSeoTimelineMonths}
              onChange={e => setDraft(d => ({ ...d, defaultSeoTimelineMonths: Number(e.target.value) }))}
            />
          </label>
        </div>
        <button
          type="button"
          onClick={save}
          className="mt-5 rounded-2xl bg-slate-900 px-6 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-white"
        >
          {saved ? 'Saved ✓' : 'Save Settings'}
        </button>
      </OwnerCard>

      <OwnerCard>
        <h2 className="text-lg font-black text-slate-950">Cloud Sync</h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">{syncLabel(syncMode, syncStorage, syncError)}</p>
        {lastSyncedAt ? (
          <p className="mt-1 text-xs font-semibold text-slate-400">
            Last synced: {new Date(lastSyncedAt).toLocaleString('en-ZA')}
          </p>
        ) : null}
        {cloudEnabled ? (
          <button
            type="button"
            onClick={() => void syncNow()}
            disabled={syncMode === 'syncing'}
            className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 disabled:opacity-50"
          >
            Sync Now
          </button>
        ) : (
          <p className="mt-3 text-xs font-semibold text-amber-700">
            Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local, then run{' '}
            <code className="rounded bg-slate-100 px-1">supabase/vyron_reach_owner_normalized.sql</code> in the Supabase SQL editor.
          </p>
        )}
      </OwnerCard>

      <OwnerCard>
        <h2 className="text-lg font-black text-slate-950">Full Demo Companies</h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Loads VYRON CORE, BRIDGEWATER BOTANICALS and CUTTING EDGE CUISINE with SEO, Google Ads plans, creatives,
          content, reports and a live AI Action Queue. Auto-loads on first open when no data exists.
        </p>
        {isDemoEnvironmentLoaded(store) ? (
          <p className="mt-3 text-xs font-black uppercase text-emerald-700">Demo environment active</p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                'Load the full 3-company demo? This replaces all current clients, keywords, queue items, creatives and plans.',
              )
            ) {
              loadDemoEnvironment()
            }
          }}
          className="mt-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-violet-800"
        >
          Load Full Demo Environment
        </button>
      </OwnerCard>

      <OwnerCard>
        <h2 className="text-lg font-black text-slate-950">Reset Test Environment</h2>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Clears all clients, keywords, campaigns, reports and queue data. Settings defaults are restored. Use this before manual testing.
        </p>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Reset all marketing data to a clean empty state?')) resetAllData()
          }}
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-red-700"
        >
          Reset All Data
        </button>
      </OwnerCard>

      <OwnerCard>
        <h2 className="text-lg font-black text-slate-950">Marketing Rules (active)</h2>
        <ul className="mt-4 space-y-3">
          {[
            `SEO horizon: ${store.settings.defaultSeoTimelineMonths} months minimum before expecting major movement`,
            `Google Ads start: R${store.settings.defaultAdDailyBudget}/day on buyer-intent keywords only`,
            'Scale ads only after rankings + search intent validated',
            'No vanity metrics — leads and revenue only',
            `Default market: ${store.settings.defaultMarket}`,
            `Default project: ${store.settings.defaultProject}`,
            `Business type: ${store.settings.businessType}`,
            `Target area: ${store.settings.defaultTargetArea}`,
            store.settings.aiMarketingRules,
          ].map(item => (
            <li key={item} className="rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
              {item}
            </li>
          ))}
        </ul>
      </OwnerCard>
    </OwnerPageShell>
  )
}
