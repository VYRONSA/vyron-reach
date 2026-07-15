'use client'

import { useMemo } from 'react'
import { useAppNavigation } from '@/context/AppNavigationContext'
import { useVyronData } from '@/context/VyronDataContext'
import { buildOwnerDrill } from '@/lib/ownerDrill'
import { OwnerCard, OwnerEmptyState, OwnerPageShell, OwnerStatGrid, ClickableRow } from '@/components/owner/OwnerPageShell'

export function RankingsPage() {
  const { openDrill } = useAppNavigation()
  const { store } = useVyronData()
  const { rankings } = store

  const improved = rankings.filter(r => r.change > 0).length
  const stuck = rankings.filter(r => r.stuck).length
  const top10 = rankings.filter(r => r.position <= 10).length
  const top20 = rankings.filter(r => r.position <= 20).length
  const top50 = rankings.filter(r => r.position <= 50).length
  const avgPos = useMemo(() => {
    if (!rankings.length) return '—'
    return (rankings.reduce((s, r) => s + r.position, 0) / rankings.length).toFixed(1)
  }, [rankings])

  return (
    <OwnerPageShell
      eyebrow="Ranking Tracker · Weekly Movement"
      title="Rankings Tracker"
      subtitle="Weekly tracking, movement graphs, ranking forecasts, page performance and stuck-page alerts."
      theme="rankings"
    >
      <OwnerStatGrid
        stats={[
          { label: 'Tracked', value: String(rankings.length), color: '#10b981' },
          { label: 'Top 10', value: String(top10), color: '#22d3ee' },
          { label: 'Top 20', value: String(top20), color: '#7c3aed' },
          { label: 'Stuck', value: String(stuck), color: '#f97316' },
        ]}
      />

      {rankings.length > 0 ? (
        <OwnerCard>
          <p className="text-sm font-semibold text-slate-600">
            Top 50: {top50} · Top 20: {top20} · Top 10: {top10} · Improved this week: {improved} · Avg position: #{avgPos}
          </p>
        </OwnerCard>
      ) : null}

      <OwnerCard>
        <h2 className="text-xl font-black text-slate-950">Keyword Positions</h2>
        <div className="mt-5 space-y-3">
          {rankings.length === 0 ? (
            <OwnerEmptyState
              title="No rankings tracked yet"
              description="Add SEO keywords in SEO War Room, then track weekly position movement here."
            />
          ) : (
            rankings.map(r => (
            <ClickableRow
              key={r.id}
              title={r.keyword}
              subtitle={`${r.page} · Pos #${r.position} · ${r.change >= 0 ? '+' : ''}${r.change} · ${r.forecast}`}
              badge={r.stuck ? 'Stuck' : 'Moving'}
              accent={r.stuck ? '#f97316' : '#10b981'}
              onClick={() =>
                openDrill(
                  buildOwnerDrill(
                    r.keyword,
                    r.forecast,
                    'Rankings',
                    [
                      { label: 'Page', value: r.page },
                      { label: 'Position', value: `#${r.position}` },
                      { label: 'Change', value: `${r.change >= 0 ? '+' : ''}${r.change}` },
                      { label: 'Forecast', value: r.forecast },
                      { label: 'Alert', value: r.stuck ? 'Stuck — needs intervention' : 'On track' },
                    ],
                    r.stuck
                      ? [
                          'Run internal linking audit to this page',
                          'Expand content depth and add FAQ schema',
                          'Check competitor pages outranking you',
                          'Re-submit URL in Search Console after updates',
                        ]
                      : [
                          'Continue weekly position tracking',
                          'Maintain internal link support',
                          'Monitor SERP feature changes',
                          'Document ranking movement in client report',
                        ],
                    [
                      { label: 'Position', value: `#${r.position}`, tone: r.position <= 10 ? 'green' : 'purple' },
                      { label: 'Change', value: `${r.change >= 0 ? '+' : ''}${r.change}`, tone: 'cyan' },
                    ],
                    { department: 'Rankings', priority: r.stuck ? 'Critical' : 'Medium' },
                  ),
                )
              }
            />
            ))
          )}
        </div>
      </OwnerCard>
    </OwnerPageShell>
  )
}
