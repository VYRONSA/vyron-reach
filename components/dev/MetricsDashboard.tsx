'use client'

import { useEffect, useRef, useState } from 'react'
import type { MetricsKpis, MetricSnapshot, SnapshotGranularity } from '@/lib/dev/metrics/metricsTypes'
import type { TopProject } from '@/lib/dev/metrics/metricsService'
import { useDashboardEvents } from './realtime/useDashboardEvents'
import { DevCard, DevCardHeader, DevField, DevButton, DevEmptyState } from './ui'

type StatusResponse = {
  kpis: MetricsKpis
  topProjects: TopProject[]
  latestSnapshots: Record<SnapshotGranularity, MetricSnapshot | null>
}

const GRANULARITIES: SnapshotGranularity[] = ['hourly', 'daily', 'weekly', 'monthly']

function fmtMs(value: number | null): string {
  if (value === null) return '—'
  if (value < 1000) return `${Math.round(value)}ms`
  return `${(value / 1000).toFixed(1)}s`
}

function fmtPct(value: number | null): string {
  if (value === null) return '—'
  return `${value.toFixed(1)}%`
}

async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch('/api/dev/metrics/status')
  if (!res.ok) throw new Error(`Failed to load metrics (${res.status})`)
  return res.json()
}

async function fetchSnapshots(granularity: SnapshotGranularity): Promise<MetricSnapshot[]> {
  const res = await fetch(`/api/dev/metrics/snapshots?granularity=${granularity}&pageSize=12`)
  if (!res.ok) throw new Error(`Failed to load snapshots (${res.status})`)
  const body = await res.json()
  return body.items as MetricSnapshot[]
}

function exportUrl(format: 'json' | 'csv', scope: 'current' | 'snapshots', granularity?: SnapshotGranularity): string {
  const params = new URLSearchParams({ format, scope })
  if (granularity) params.set('granularity', granularity)
  return `/api/dev/metrics/export?${params.toString()}`
}

/**
 * The Engineering Metrics Dashboard (Production Validation 2.1,
 * Milestone 2.1.1) — a read-only view of the Metrics Service's derived
 * KPIs. Never computes anything itself: every number here is either
 * MetricsKpis (already-computed percentages/averages, see
 * metricsService.ts's computeKpis) or a plain snapshot list.
 *
 * "Trend graphs (data only if charts do not yet exist)" — this codebase
 * has no charting dependency, so trends are shown as a compact data
 * table (most recent periods, newest first) rather than pulling one in.
 */
export function MetricsDashboard() {
  const [data, setData] = useState<StatusResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [granularity, setGranularity] = useState<SnapshotGranularity>('daily')
  const [snapshots, setSnapshots] = useState<MetricSnapshot[]>([])

  const refresh = () => {
    fetchStatus()
      .then(setData)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load metrics.'))
  }

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, 30_000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchSnapshots(granularity).then(setSnapshots).catch(() => setSnapshots([]))
  }, [granularity])

  const refreshDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useDashboardEvents({
    // Every category the Metrics Service consumes — a change in any of
    // them means the live KPIs below are now stale.
    categories: [
      'Engineering Director',
      'Worker Assignment',
      'Worker Completion',
      'Planning Changes',
      'Knowledge Updates',
      'Assessment Updates',
      'Scheduler Activity',
      'Notification Delivery',
      'Engineering Inbox',
      'Escalation',
      'Recovery',
      'Project Status',
      'Operations',
    ],
    onEvent: () => {
      if (refreshDebounceTimer.current) clearTimeout(refreshDebounceTimer.current)
      refreshDebounceTimer.current = setTimeout(refresh, 500)
    },
  })

  if (error) return <p className="text-sm text-rose-500 dark:text-rose-400">{error}</p>
  if (!data) return <DevEmptyState>Loading metrics...</DevEmptyState>

  const { kpis, topProjects } = data

  return (
    <div className="space-y-4">
      <DevCard>
        <DevCardHeader
          title="Engineering Throughput"
          badge={
            <span className="text-xs text-[var(--dev-text-faint)]">
              Automation: {fmtPct(kpis.automation.automationPercentage)} · CEO intervention: {fmtPct(kpis.automation.ceoInterventionPercentage)}
            </span>
          }
        />
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <DevField label="Projects Started"><span className="text-sm">{kpis.throughput.projectsStarted}</span></DevField>
          <DevField label="Projects Completed"><span className="text-sm">{kpis.throughput.projectsCompleted}</span></DevField>
          <DevField label="Features Planned"><span className="text-sm">{kpis.throughput.featuresPlanned}</span></DevField>
          <DevField label="Features Delivered"><span className="text-sm">{kpis.throughput.featuresDelivered}</span></DevField>
          <DevField label="Tasks Assigned"><span className="text-sm">{kpis.throughput.tasksAssigned}</span></DevField>
          <DevField label="Tasks Completed"><span className="text-sm">{kpis.throughput.tasksCompleted}</span></DevField>
          <DevField label="Avg Feature Duration"><span className="text-sm">{fmtMs(kpis.throughput.averageFeatureDurationMs)}</span></DevField>
          <DevField label="Avg Project Duration"><span className="text-sm">{fmtMs(kpis.throughput.averageProjectDurationMs)}</span></DevField>
        </div>
      </DevCard>

      <DevCard>
        <DevCardHeader title="Automation" />
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <DevField label="Automation %"><span className="text-sm">{fmtPct(kpis.automation.automationPercentage)}</span></DevField>
          <DevField label="Manual Overrides"><span className="text-sm">{kpis.automation.manualOverrides}</span></DevField>
          <DevField label="Director Decisions"><span className="text-sm">{kpis.automation.directorDecisions}</span></DevField>
          <DevField label="Worker Decisions"><span className="text-sm">{kpis.automation.workerDecisions}</span></DevField>
          <DevField label="Scheduler Decisions"><span className="text-sm">{kpis.automation.schedulerDecisions}</span></DevField>
          <DevField label="Recovery Events"><span className="text-sm">{kpis.automation.recoveryEvents}</span></DevField>
        </div>
      </DevCard>

      <DevCard>
        <DevCardHeader title="Engineering Quality" />
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <DevField label="Tech Debt Created"><span className="text-sm">{kpis.quality.technicalDebtCreated}</span></DevField>
          <DevField label="Tech Debt Resolved"><span className="text-sm">{kpis.quality.technicalDebtResolved}</span></DevField>
          <DevField label="Knowledge Updates"><span className="text-sm">{kpis.quality.knowledgeUpdates}</span></DevField>
          <DevField label="Documentation Generated"><span className="text-sm">{kpis.quality.documentationGenerated}</span></DevField>
          <DevField label="Planning Accuracy"><span className="text-sm">{fmtPct(kpis.quality.planningAccuracyPercentage)}</span></DevField>
          <DevField label="Assessment Accuracy"><span className="text-sm">{fmtPct(kpis.quality.assessmentAccuracyPercentage)}</span></DevField>
          <DevField label="Risk Prediction Accuracy"><span className="text-sm">{fmtPct(kpis.quality.riskPredictionAccuracyPercentage)}</span></DevField>
        </div>
        <p className="mt-2 text-[11px] text-[var(--dev-text-faint)]">
          Assessment/Risk accuracy are proxy signals (see lib/dev/metrics/metricClassifier.ts), not validated predictive accuracy.
        </p>
      </DevCard>

      <DevCard>
        <DevCardHeader title="System Reliability" />
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <DevField label="Recovery Count"><span className="text-sm">{kpis.reliability.recoveryCount}</span></DevField>
          <DevField label="Avg Recovery Duration"><span className="text-sm">{fmtMs(kpis.reliability.averageRecoveryDurationMs)}</span></DevField>
          <DevField label="Notification Failures"><span className="text-sm">{kpis.reliability.notificationFailures}</span></DevField>
          <DevField label="Escalation Frequency"><span className="text-sm">{kpis.reliability.escalationFrequency}</span></DevField>
          <DevField label="Scheduler Cycles"><span className="text-sm">{kpis.reliability.schedulerCycles}</span></DevField>
          <DevField label="Worker Failures"><span className="text-sm">{kpis.reliability.workerFailures}</span></DevField>
          <DevField label="Retry Counts"><span className="text-sm">{kpis.reliability.retryCounts}</span></DevField>
          <DevField label="Incidents Opened"><span className="text-sm">{kpis.reliability.incidentsOpened}</span></DevField>
          <DevField label="Incidents Resolved"><span className="text-sm">{kpis.reliability.incidentsResolved}</span></DevField>
          <DevField label="Avg Incident Duration"><span className="text-sm">{fmtMs(kpis.reliability.averageIncidentDurationMs)}</span></DevField>
          <DevField label="Rollbacks Approved"><span className="text-sm">{kpis.reliability.rollbacksApproved}</span></DevField>
        </div>
      </DevCard>

      <DevCard>
        <DevCardHeader title="Performance (average durations)" />
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <DevField label="Planning"><span className="text-sm">{fmtMs(kpis.performance.averagePlanningDurationMs)}</span></DevField>
          <DevField label="Assessment"><span className="text-sm">{fmtMs(kpis.performance.averageAssessmentDurationMs)}</span></DevField>
          <DevField label="Worker"><span className="text-sm">{fmtMs(kpis.performance.averageWorkerDurationMs)}</span></DevField>
          <DevField label="Scheduling"><span className="text-sm">{fmtMs(kpis.performance.averageSchedulingDurationMs)}</span></DevField>
          <DevField label="Notification"><span className="text-sm">{fmtMs(kpis.performance.averageNotificationDurationMs)}</span></DevField>
          <DevField label="Escalation"><span className="text-sm">{fmtMs(kpis.performance.averageEscalationDurationMs)}</span></DevField>
        </div>
      </DevCard>

      <DevCard>
        <DevCardHeader title="Testing" />
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <DevField label="Tests Executed"><span className="text-sm">{kpis.testing.testsExecuted}</span></DevField>
          <DevField label="Tests Passed"><span className="text-sm">{kpis.testing.testsPassed}</span></DevField>
          <DevField label="Tests Failed"><span className="text-sm">{kpis.testing.testsFailed}</span></DevField>
          <DevField label="Regression Failures"><span className="text-sm">{kpis.testing.regressionFailures}</span></DevField>
          <DevField label="Avg Execution Duration"><span className="text-sm">{fmtMs(kpis.testing.averageExecutionDurationMs)}</span></DevField>
        </div>
      </DevCard>

      <DevCard>
        <DevCardHeader title="Top Projects" />
        {topProjects.length === 0 ? (
          <DevEmptyState>No project activity yet.</DevEmptyState>
        ) : (
          <ul className="mt-3 space-y-1">
            {topProjects.map((p, i) => (
              <li key={p.project} className="flex items-center gap-2 text-sm text-[var(--dev-text)]">
                <span className="text-[var(--dev-text-muted)]">{i + 1}.</span>
                <span>{p.project}</span>
                <span className="text-xs text-[var(--dev-text-faint)]">
                  {p.completedBatches} batches · {p.completedTasks} tasks
                </span>
              </li>
            ))}
          </ul>
        )}
      </DevCard>

      <DevCard>
        <DevCardHeader
          title="Trend Data"
          badge={
            <div className="flex gap-1">
              {GRANULARITIES.map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGranularity(g)}
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize transition-colors ${
                    granularity === g ? 'bg-[var(--dev-accent)] text-white' : 'bg-[var(--dev-surface-hover)] text-[var(--dev-text-muted)]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          }
        />
        {snapshots.length === 0 ? (
          <DevEmptyState>No {granularity} snapshots yet.</DevEmptyState>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[var(--dev-text-faint)]">
                  <th className="pb-2 pr-4">Period</th>
                  <th className="pb-2 pr-4">Projects Started</th>
                  <th className="pb-2 pr-4">Features Delivered</th>
                  <th className="pb-2 pr-4">Automation %</th>
                  <th className="pb-2 pr-4">Recovery Count</th>
                </tr>
              </thead>
              <tbody>
                {snapshots.map(s => (
                  <tr key={s.id} className="border-t border-[var(--dev-border)] text-[var(--dev-text)]">
                    <td className="py-1.5 pr-4">{s.periodKey}</td>
                    <td className="py-1.5 pr-4">{s.kpis.throughput.projectsStarted}</td>
                    <td className="py-1.5 pr-4">{s.kpis.throughput.featuresDelivered}</td>
                    <td className="py-1.5 pr-4">{fmtPct(s.kpis.automation.automationPercentage)}</td>
                    <td className="py-1.5 pr-4">{s.kpis.reliability.recoveryCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DevCard>

      <DevCard>
        <DevCardHeader title="Export" />
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={exportUrl('json', 'current')}><DevButton variant="secondary">Current KPIs — JSON</DevButton></a>
          <a href={exportUrl('csv', 'current')}><DevButton variant="secondary">Current KPIs — CSV</DevButton></a>
          <a href={exportUrl('json', 'snapshots', granularity)}><DevButton variant="secondary">{granularity} History — JSON</DevButton></a>
          <a href={exportUrl('csv', 'snapshots', granularity)}><DevButton variant="secondary">{granularity} History — CSV</DevButton></a>
        </div>
      </DevCard>
    </div>
  )
}
