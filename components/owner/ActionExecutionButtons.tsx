'use client'

import { useAppNavigation } from '@/context/AppNavigationContext'
import { useVyronData } from '@/context/VyronDataContext'
import { prefillFromAction } from '@/lib/executionPrefill'
import type { VyronActionQueueItem } from '@/lib/vyronStore/types'

const PAGES = {
  ads: 'google-ads-ai',
  seo: 'seo-war-room',
  content: 'content-engine',
  creative: 'ai-creative-studio',
  reports: 'reports',
  clients: 'clients',
} as const

function Btn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-violet-800"
    >
      {children}
    </button>
  )
}

export function ActionExecutionButtons({
  action,
  onGenerateOutput,
  onCopyOutput,
  copyLabel,
}: {
  action: VyronActionQueueItem
  onGenerateOutput: () => void
  onCopyOutput: () => void
  copyLabel: string
}) {
  const { navigateWithPrefill } = useAppNavigation()
  const {
    store,
    generateMonthlyReport,
    appendSeoPlan,
    appendAdsTestPlan,
    appendContentBrief,
    getCreativeLaunchPrefill,
  } = useVyronData()

  const go = (page: string) => {
    navigateWithPrefill(page, prefillFromAction(action, store.settings))
  }

  const isAds =
    action.kind === 'google_ads' || action.sourcePage.toLowerCase().includes('google ads')
  const isSeo =
    action.kind === 'seo' ||
    action.sourcePage.toLowerCase().includes('seo') ||
    action.sourcePage.toLowerCase().includes('ranking')
  const isContent =
    action.kind === 'content' ||
    action.kind === 'advert_image' ||
    action.sourcePage.toLowerCase().includes('content')
  const isCreative = action.kind === 'advert_image' || isContent || isAds
  const isReport = action.sourcePage.toLowerCase().includes('report')
  const isClient = action.sourcePage.toLowerCase().includes('client')
  const approvedCreative = store.creatives.find(
    c => c.actionId === action.id && (c.status === 'Approved' || c.status === 'Launched'),
  )

  return (
    <div className="mt-5 border-t border-slate-100 pt-5">
      <h3 className="text-sm font-black text-slate-800">Execute — open tools</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <Btn onClick={() => go(PAGES.creative)}>Open Creative Studio</Btn>
        <Btn onClick={() => go(PAGES.creative)}>Create Advert Creative</Btn>
        {isCreative ? (
          <>
            <Btn onClick={() => go(PAGES.creative)}>Generate Variations</Btn>
            <Btn onClick={() => go(PAGES.creative)}>Open Client Approval</Btn>
          </>
        ) : null}
        {approvedCreative ? (
          <Btn
            onClick={() => {
              const prefill = getCreativeLaunchPrefill(approvedCreative.id)
              if (prefill) navigateWithPrefill(PAGES.ads, prefill)
            }}
          >
            Launch Google Ads Setup
          </Btn>
        ) : null}
        {isAds ? (
          <>
            <Btn onClick={() => go(PAGES.ads)}>Open Google Ads Builder</Btn>
            <Btn onClick={onGenerateOutput}>Generate Ads Plan</Btn>
            <Btn onClick={() => appendAdsTestPlan(action.id)}>Generate Google Ads Test Plan</Btn>
            <Btn onClick={onCopyOutput}>{copyLabel === 'output' ? 'Copied ✓' : 'Copy Plan'}</Btn>
          </>
        ) : null}
        {isSeo ? (
          <>
            <Btn onClick={() => go(PAGES.seo)}>Open SEO War Room</Btn>
            <Btn onClick={() => appendSeoPlan(action.id)}>Generate SEO Plan</Btn>
            <Btn onClick={() => appendContentBrief(action.id)}>Generate Content Brief</Btn>
          </>
        ) : null}
        {isContent ? (
          <>
            <Btn onClick={() => go(PAGES.content)}>Open Content Engine</Btn>
            <Btn onClick={() => go(PAGES.content)}>Generate Marketing Material</Btn>
            <Btn onClick={onCopyOutput}>Copy Content</Btn>
          </>
        ) : null}
        {isReport ? (
          <>
            <Btn onClick={() => go(PAGES.reports)}>Open Reports</Btn>
            <Btn
              onClick={() => {
                generateMonthlyReport()
                go(PAGES.reports)
              }}
            >
              Generate Report
            </Btn>
          </>
        ) : null}
        {isClient ? <Btn onClick={() => go(PAGES.clients)}>Open Clients</Btn> : null}
        {!isAds && !isSeo && !isContent && !isReport && !isClient ? (
          <>
            <Btn onClick={onGenerateOutput}>Generate Output</Btn>
            <Btn onClick={onCopyOutput}>Copy Output</Btn>
          </>
        ) : null}
      </div>
    </div>
  )
}
