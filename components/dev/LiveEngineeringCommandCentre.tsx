'use client'

import { useEffect, useState } from 'react'
import { gatherDirectorHandoff } from '@/lib/dev/runtime/directorHandoff'
import {
  getDirectorStatus,
  listEngineeringInbox,
  resolveEngineeringInboxItem,
  dismissEngineeringInboxItem,
  startDirector,
  cancelDirector,
  pauseDirector,
  resumeDirector,
} from '@/lib/dev/runtime/directorClient'
import type { DirectorRuntimeStatus, EngineeringInboxItem } from '@/lib/dev/director/directorRuntimeTypes'
import { DevBadge, DevButton, DevCard, DevCardHeader, DevField, devValidationTone } from './ui'

function formatElapsed(startedAt: string | null, completedAt: string | null, nowMs: number): string {
  if (!startedAt) return 'Not started'
  const start = new Date(startedAt).getTime()
  const end = completedAt ? new Date(completedAt).getTime() : nowMs
  const seconds = Math.max(0, Math.round((end - start) / 1000))
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const sec = seconds % 60
  return h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${sec}s` : `${sec}s`
}

function formatEta(iso: string | null): string {
  if (!iso) return 'Unknown'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleString()
}

function stateTone(state: DirectorRuntimeStatus['state']): 'success' | 'info' | 'warning' | 'danger' | 'neutral' {
  switch (state) {
    case 'Completed':
      return 'success'
    case 'Running':
    case 'Planning':
      return 'info'
    case 'Waiting for CEO':
      return 'warning'
    case 'Blocked':
      return 'danger'
    default:
      return 'neutral'
  }
}

const SEVERITY_TONE: Record<EngineeringInboxItem['severity'], 'danger' | 'warning' | 'info' | 'neutral'> = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'info',
  Low: 'neutral',
}

/**
 * The Live Engineering Command Centre — a monitoring interface only. It
 * never executes anything itself: Start Development hands off a snapshot
 * and the server takes it from there (serverExecutionLoop.ts); every other
 * button here (Pause/Resume/Cancel/Resolve/Dismiss) is a thin POST/PATCH
 * to a server endpoint that already owns the state transition. Closing
 * this tab — or this component never mounting again until a page reload —
 * has zero effect on whether the run continues; the polling below is
 * purely for display.
 */
export function LiveEngineeringCommandCentre({ projectSlug }: { projectSlug: string }) {
  const [status, setStatus] = useState<DirectorRuntimeStatus | null>(null)
  const [inbox, setInbox] = useState<EngineeringInboxItem[]>([])
  const [now, setNow] = useState(() => Date.now())
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refresh = async () => {
    try {
      const [liveStatus, openItems] = await Promise.all([getDirectorStatus(projectSlug), listEngineeringInbox(projectSlug, 'Open')])
      setStatus(liveStatus)
      setInbox(openItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Director status.')
    }
  }

  useEffect(() => {
    let cancelled = false
    const tick = async () => {
      if (cancelled) return
      await refresh()
    }
    tick()
    const timer = setInterval(tick, 4000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectSlug])

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(tick)
  }, [])

  const isActive = status?.state === 'Running' || status?.state === 'Planning'
  const canStart = !status || status.state === 'Idle' || status.state === 'Completed' || status.state === 'Cancelled'
  const progressPercent = status && status.totalBatches > 0 ? Math.round((status.completedBatches / status.totalBatches) * 100) : 0

  const handleStart = async () => {
    setBusy(true)
    setError(null)
    try {
      const handoff = gatherDirectorHandoff(projectSlug)
      const started = await startDirector(projectSlug, handoff)
      setStatus(started)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start autonomous development.')
    } finally {
      setBusy(false)
    }
  }

  const handleCancel = async () => {
    setBusy(true)
    try {
      setStatus(await cancelDirector(projectSlug))
    } finally {
      setBusy(false)
    }
  }

  const handlePause = async () => {
    setBusy(true)
    try {
      setStatus(await pauseDirector(projectSlug))
    } finally {
      setBusy(false)
    }
  }

  const handleResume = async () => {
    setBusy(true)
    try {
      setStatus(await resumeDirector(projectSlug))
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  const handleResolve = async (item: EngineeringInboxItem) => {
    setBusy(true)
    try {
      // Resolving the item is what resumes the project server-side (see
      // app/api/dev/director/inbox/[id]/route.ts) — nothing further to call.
      await resolveEngineeringInboxItem(item.id)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  const handleDismiss = async (item: EngineeringInboxItem) => {
    setBusy(true)
    try {
      await dismissEngineeringInboxItem(item.id)
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  const s = status

  return (
    <DevCard>
      <DevCardHeader title="Live Engineering Command Centre" badge={s ? <DevBadge tone={stateTone(s.state)}>{s.state}</DevBadge> : null} />

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <DevField label="Overall Progress">
          <span className="text-sm text-[var(--dev-text)]">{progressPercent}%</span>
        </DevField>
        <DevField label="Current Project">
          <span className="text-sm text-[var(--dev-text)]">{projectSlug}</span>
        </DevField>
        <DevField label="Current Phase">
          <span className="text-sm text-[var(--dev-text)]">{s?.currentPhase ?? 'Unknown'}</span>
        </DevField>
        <DevField label="Current Milestone">
          <span className="text-sm text-[var(--dev-text)]">{s?.currentMilestoneTitle ?? 'None'}</span>
        </DevField>
        <DevField label="Current Batch">
          <span className="text-sm text-[var(--dev-text)]">{s?.currentBatchNumber ? `Batch ${s.currentBatchNumber}` : 'None'}</span>
        </DevField>
        <DevField label="Current Activity">
          <span className="text-sm text-[var(--dev-text)]">{s?.currentActivity ?? 'Not started'}</span>
        </DevField>
        <DevField label="Current AI Task">
          <span className="text-sm text-[var(--dev-text)]">{s?.currentAiTask ?? 'None'}</span>
        </DevField>
        <DevField label="Elapsed Runtime">
          <span className="text-sm text-[var(--dev-text)]">{formatElapsed(s?.startedAt ?? null, s?.completedAt ?? null, now)}</span>
        </DevField>
        <DevField label="Estimated Completion">
          <span className="text-sm text-[var(--dev-text)]">{formatEta(s?.estimatedCompletionAt ?? null)}</span>
        </DevField>
        <DevField label="Build Status">
          <DevBadge tone={devValidationTone(s?.buildStatus ?? 'Unknown')}>{s?.buildStatus ?? 'Unknown'}</DevBadge>
        </DevField>
        <DevField label="TypeScript Status">
          <DevBadge tone={devValidationTone(s?.typescriptStatus ?? 'Unknown')}>{s?.typescriptStatus ?? 'Unknown'}</DevBadge>
        </DevField>
        <DevField label="Risk Level">
          <span className="text-sm text-[var(--dev-text)]">{s?.riskLevel ?? 'Unknown'}</span>
        </DevField>
        <DevField label="Engineering Health">
          <span className="text-sm text-[var(--dev-text)]">{s?.engineeringHealth ?? 'Unknown'}</span>
        </DevField>
        {s && (s.state === 'Waiting for CEO' || s.state === 'Blocked') ? (
          <DevField label="Current Waiting Reason">
            <span className="text-sm text-rose-500 dark:text-rose-400">{s.waitingReason ?? 'Unknown'}</span>
          </DevField>
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-rose-500 dark:text-rose-400">{error}</p> : null}

      <div className="mt-4 flex items-center gap-2">
        {canStart ? (
          <DevButton onClick={handleStart} disabled={busy}>
            START DEVELOPMENT
          </DevButton>
        ) : (
          <>
            {isActive ? (
              <DevButton variant="secondary" onClick={handlePause} disabled={busy}>
                Pause
              </DevButton>
            ) : (
              <DevButton onClick={handleResume} disabled={busy}>
                Resume
              </DevButton>
            )}
            <DevButton variant="danger" onClick={handleCancel} disabled={busy}>
              Cancel
            </DevButton>
          </>
        )}
      </div>

      {inbox.length > 0 ? (
        <div className="mt-5 border-t border-[var(--dev-border)] pt-4">
          <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-accent)]">Engineering Inbox</div>
          <ul className="mt-2 space-y-2">
            {inbox.map(item => (
              <li key={item.id} className="rounded-lg border border-[var(--dev-border)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <DevBadge tone={SEVERITY_TONE[item.severity]}>{item.severity}</DevBadge>
                    <span className="text-sm font-medium text-[var(--dev-text)]">{item.reasonType}</span>
                  </div>
                  <span className="text-[11px] text-[var(--dev-text-faint)]">{item.batchNumber ? `Batch ${item.batchNumber}` : projectSlug}</span>
                </div>
                <p className="mt-1.5 text-xs text-[var(--dev-text-muted)]">{item.reason}</p>
                <p className="mt-1 text-xs text-[var(--dev-text-faint)]">
                  <span className="font-medium">Recommended:</span> {item.recommendedAction}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <DevButton onClick={() => handleResolve(item)} disabled={busy}>
                    Approve (Resolve &amp; Resume)
                  </DevButton>
                  <DevButton variant="secondary" onClick={() => handleDismiss(item)} disabled={busy}>
                    Reject (Dismiss)
                  </DevButton>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </DevCard>
  )
}
