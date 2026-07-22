'use client'

import { useEffect, useRef, useState } from 'react'
import type { FeatureCertification, PlatformCertificationSummary } from '@/lib/dev/certification/certificationTypes'
import { useDashboardEvents } from './realtime/useDashboardEvents'
import { DevBadge, DevCard, DevCardHeader, DevEmptyState, DevField } from './ui'

type StatusResponse = {
  openFeatures: number
  certifiedFeatures: number
  certifiedProjects: number
  latestCertifications: FeatureCertification[]
  platform: { last30Days: PlatformCertificationSummary; last90Days: PlatformCertificationSummary; last12Months: PlatformCertificationSummary }
}

const RESULT_TONE: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  'Certified Autonomous': 'success',
  'Certified Assisted': 'warning',
  'Manual Delivery': 'neutral',
}

function fmtPct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`
}

function fmtMs(value: number | null): string {
  if (value === null) return '—'
  if (value < 1000) return `${Math.round(value)}ms`
  if (value < 60_000) return `${(value / 1000).toFixed(1)}s`
  return `${(value / 60_000).toFixed(1)}m`
}

async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch('/api/dev/certification/status')
  if (!res.ok) throw new Error(`Failed to load certification status (${res.status})`)
  return res.json()
}

function exportUrl(scope: string, format: 'json' | 'csv'): string {
  return `/api/dev/certification/export?scope=${scope}&format=${format}`
}

/**
 * The Certification Dashboard (Production Validation 2.1, Milestone
 * 2.1.2) — read-only. Every number here is either a FeatureCertification
 * record or a ProjectCertificationSummary/PlatformCertificationSummary
 * already computed by certificationService.ts; this component performs
 * no certification logic of its own.
 */
export function CertificationDashboard() {
  const [data, setData] = useState<StatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = () => {
    fetchStatus()
      .then(setData)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load certification status.'))
  }

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 30_000)
    return () => clearInterval(timer)
  }, [])

  const refreshDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useDashboardEvents({
    categories: ['Planning Changes', 'Worker Assignment', 'Worker Completion', 'Knowledge Updates', 'Assessment Updates', 'Engineering Inbox', 'Recovery', 'Testing'],
    onEvent: () => {
      if (refreshDebounceTimer.current) clearTimeout(refreshDebounceTimer.current)
      refreshDebounceTimer.current = setTimeout(refresh, 500)
    },
  })

  if (error) return <p className="text-sm text-rose-500 dark:text-rose-400">{error}</p>
  if (!data) return <DevEmptyState>Loading certifications...</DevEmptyState>

  const { last30Days, last90Days, last12Months } = data.platform

  return (
    <div className="space-y-4">
      <DevCard>
        <DevCardHeader title="Certification Overview" />
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <DevField label="Open Features"><span className="text-sm">{data.openFeatures}</span></DevField>
          <DevField label="Certified Features"><span className="text-sm">{data.certifiedFeatures}</span></DevField>
          <DevField label="Automation % (30d)"><span className="text-sm">{fmtPct(last30Days.automationPercentage)}</span></DevField>
          <DevField label="Certified Projects"><span className="text-sm">{data.certifiedProjects}</span></DevField>
        </div>
      </DevCard>

      <DevCard>
        <DevCardHeader title="Platform Certification (rolling windows)" />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[var(--dev-text-faint)]">
                <th className="pb-2 pr-4">Window</th>
                <th className="pb-2 pr-4">Total</th>
                <th className="pb-2 pr-4">Autonomous</th>
                <th className="pb-2 pr-4">Assisted</th>
                <th className="pb-2 pr-4">Manual</th>
                <th className="pb-2 pr-4">Automation %</th>
                <th className="pb-2 pr-4">Avg Duration</th>
                <th className="pb-2 pr-4">Avg Quality</th>
              </tr>
            </thead>
            <tbody>
              {[last30Days, last90Days, last12Months].map(w => (
                <tr key={w.window} className="border-t border-[var(--dev-border)] text-[var(--dev-text)]">
                  <td className="py-1.5 pr-4">{w.window}</td>
                  <td className="py-1.5 pr-4">{w.totalFeatures}</td>
                  <td className="py-1.5 pr-4">{w.certifiedAutonomous}</td>
                  <td className="py-1.5 pr-4">{w.certifiedAssisted}</td>
                  <td className="py-1.5 pr-4">{w.manualDelivery}</td>
                  <td className="py-1.5 pr-4">{fmtPct(w.automationPercentage)}</td>
                  <td className="py-1.5 pr-4">{fmtMs(w.averageDeliveryDurationMs)}</td>
                  <td className="py-1.5 pr-4">{fmtPct(w.averageQualityScore)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[11px] text-[var(--dev-text-faint)]">
          "Certification Trends" — comparing 30-day vs 90-day vs 12-month windows above shows the trend directly; this codebase has no charting
          dependency yet, so trend data is shown as a table rather than a graph.
        </p>
      </DevCard>

      <DevCard>
        <DevCardHeader title="Latest Certifications" />
        {data.latestCertifications.length === 0 ? (
          <DevEmptyState>No certified features yet.</DevEmptyState>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.latestCertifications.map(f => (
              <li key={f.id} className="rounded-lg border border-[var(--dev-border)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <DevBadge tone={RESULT_TONE[f.result ?? ''] ?? 'neutral'}>{f.result}</DevBadge>
                  <span className="text-sm font-medium text-[var(--dev-text)]">{f.project}</span>
                  <span className="text-xs text-[var(--dev-text-faint)]">
                    {f.batchNumber ? `Batch ${f.batchNumber}` : f.batchId} · {fmtMs(f.deliveryDurationMs)}
                  </span>
                  <a href={`/api/dev/certification/evidence/${f.id}`} target="_blank" rel="noreferrer" className="ml-auto text-xs text-[var(--dev-accent)] hover:underline">
                    View Evidence Pack
                  </a>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-[var(--dev-text-faint)]">
                  <span>Tasks: {f.tasksCompleted}/{f.tasksGenerated}</span>
                  <span>CEO interventions: {f.ceoInterventions}</span>
                  <span>Manual overrides: {f.manualOverrides}</span>
                  <span>Recovery events: {f.recoveryEvents}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DevCard>

      <DevCard>
        <DevCardHeader title="Export" />
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={exportUrl('features', 'json')} className="text-xs text-[var(--dev-accent)] hover:underline">Features — JSON</a>
          <a href={exportUrl('features', 'csv')} className="text-xs text-[var(--dev-accent)] hover:underline">Features — CSV</a>
          <a href={exportUrl('platform', 'json')} className="text-xs text-[var(--dev-accent)] hover:underline">Platform (30d) — JSON</a>
          <a href={exportUrl('platform', 'csv')} className="text-xs text-[var(--dev-accent)] hover:underline">Platform (30d) — CSV</a>
        </div>
      </DevCard>
    </div>
  )
}
