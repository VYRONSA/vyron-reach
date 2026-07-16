'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { DevelopmentSession } from '@/lib/dev/developmentOrchestrator'
import type { ExecutiveActionQueue } from '@/lib/dev/executiveActionEngine'
import type { GeneratedPrompt } from '@/lib/dev/promptIntelligenceEngine'
import type { DevelopmentJob } from '@/lib/dev/runtime/runtimeTypes'
import { completeDevelopmentCycle } from '@/lib/dev/developmentCompletionEngine'
import { copyToClipboard, DevBadge, devValidationTone } from './ui'

const ACTION_BUTTON_CLASS =
  'block w-full rounded-lg px-4 py-3.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'

const PRIORITY_TONE: Record<string, 'danger' | 'warning' | 'info' | 'neutral'> = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'info',
  Low: 'neutral',
}

const POLL_INTERVAL_MS = 2000
const RUNNING_STATUSES = new Set(['Queued', 'Running', 'Validating'])

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init)
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`)
  return body as T
}

/**
 * Mission Control — driven by the Executive Action Engine (blocked/action
 * state, unchanged from Batch 9) and, once ready, the Runtime (this
 * batch). "Copy Today's Claude Prompt" is replaced by "Execute Development
 * Task", which creates a Development Job, polls it live through the
 * server-side Claude Code run, and — only after a human reviews and
 * approves the result — applies it via the existing Development
 * Completion Engine (createHandover/completeBatch/recomputeMilestone
 * Progress), exactly the same write path the manual paste-a-report flow
 * already used. The runtime never writes project state on its own.
 */
export function MissionControl({
  slug,
  session,
  queue,
  generatedPrompt,
  onApplied,
}: {
  slug: string
  session: DevelopmentSession
  queue: ExecutiveActionQueue
  generatedPrompt: GeneratedPrompt
  onApplied: () => void
}) {
  const { topAction, focus } = queue
  const [job, setJob] = useState<DevelopmentJob | null>(null)
  const [launchError, setLaunchError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current)
    }
  }, [])

  const pollJob = (id: string) => {
    pollTimer.current = setTimeout(async () => {
      try {
        const { job: latest } = await fetchJson<{ job: DevelopmentJob }>(`/api/dev/runtime/jobs/${id}`)
        setJob(latest)
        if (RUNNING_STATUSES.has(latest.status)) pollJob(id)
      } catch {
        // transient poll failure — try again on the next tick
        pollJob(id)
      }
    }, POLL_INTERVAL_MS)
  }

  const handleExecute = async () => {
    setLaunchError(null)
    try {
      const { job: created } = await fetchJson<{ job: DevelopmentJob }>('/api/dev/runtime/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectSlug: slug,
          milestoneId: session.currentMilestone?.id ?? '',
          batchId: session.currentBatch?.id ?? '',
          objective: session.currentObjective ?? '',
          prompt: generatedPrompt.fullText,
        }),
      })
      setJob(created)
      pollJob(created.id)
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : 'Failed to start the runtime.')
    }
  }

  const handleApprove = async () => {
    if (!job || !job.result) return
    setApplying(true)
    try {
      await fetchJson(`/api/dev/runtime/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      completeDevelopmentCycle(job.projectSlug, job.result, { claudeModel: job.runtime, originalPrompt: job.prompt })
      const { job: applied } = await fetchJson<{ job: DevelopmentJob }>(`/api/dev/runtime/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'applied' }),
      })
      setJob(applied)
      onApplied()
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : 'Failed to apply the result.')
    } finally {
      setApplying(false)
    }
  }

  const handleDismiss = () => {
    setJob(null)
    setLaunchError(null)
  }

  const handleCopyFallback = async () => {
    await copyToClipboard(generatedPrompt.fullText)
  }

  const jobIsLive = job !== null && RUNNING_STATUSES.has(job.status)
  const jobAwaitingReview = job !== null && job.status === 'Completed' && !job.appliedAt
  const jobDone = job !== null && (job.status === 'Failed' || job.status === 'Cancelled' || Boolean(job.appliedAt))

  return (
    <div className="rounded-2xl border border-[var(--dev-accent)]/30 bg-[var(--dev-accent-soft)] p-5">
      {topAction ? (
        <>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-accent)]">
            Today&apos;s Executive Action
          </div>
          <div className="mt-3 flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-[var(--dev-text)]">{topAction.title}</h3>
            <DevBadge tone={PRIORITY_TONE[topAction.priority]}>{topAction.priority}</DevBadge>
          </div>
          <p className="mt-1.5 text-sm text-[var(--dev-text-muted)]">{topAction.reason}</p>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <MissionField label="Recommended Action" value={topAction.recommendedAction} />
            <MissionField label="Estimated Impact" value={topAction.estimatedImpact} />
          </div>
          <div className="mt-3">
            <MissionField label="Executive Focus" value={focus} />
          </div>

          <div className="mt-4">
            <Link
              href={topAction.href}
              className={`${ACTION_BUTTON_CLASS} ${
                topAction.category === 'Validation' ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 'bg-gradient-to-r from-amber-500 to-amber-600'
              }`}
            >
              {topAction.category === 'Validation' ? 'RUN VALIDATION' : 'VIEW CURRENT BLOCKERS'}
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-accent)]">
            Ready To Continue Development
          </div>
          <div className="mt-3">
            <MissionField label="Executive Focus" value={focus} />
          </div>

          {!job ? (
            <div className="mt-4">
              <button type="button" onClick={handleExecute} className={`${ACTION_BUTTON_CLASS} bg-gradient-to-r from-sky-500 to-blue-600`}>
                EXECUTE DEVELOPMENT TASK
              </button>
              {launchError ? (
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-rose-500 dark:text-rose-400">
                  <span>{launchError}</span>
                  <button type="button" onClick={handleCopyFallback} className="underline hover:no-underline">
                    Copy prompt instead
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[var(--dev-text)]">Development Job</span>
                <DevBadge tone={jobStatusTone(job.status)}>{job.status}</DevBadge>
              </div>

              {jobIsLive ? (
                <p className="mt-2 text-xs text-[var(--dev-text-faint)]">Claude Code is running — this can take several minutes.</p>
              ) : null}

              {job.status === 'Failed' ? <p className="mt-2 text-sm text-rose-500 dark:text-rose-400">{job.error}</p> : null}
              {job.status === 'Cancelled' ? <p className="mt-2 text-sm text-[var(--dev-text-faint)]">Job cancelled.</p> : null}

              {jobAwaitingReview ? (
                <div className="mt-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MissionField label="Build" value={job.buildStatus} />
                    <MissionField label="TypeScript" value={job.typescriptStatus} />
                    <MissionField label="Duration" value={job.duration ? `${Math.round(job.duration / 1000)}s` : 'Unknown'} />
                    <MissionField label="Cost" value={job.cost !== null ? `$${job.cost.toFixed(4)}` : 'Unknown'} />
                  </div>
                  <p className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-black/20 p-2.5 font-mono text-[11px] leading-relaxed text-[var(--dev-text-muted)]">
                    {job.result}
                  </p>
                  <p className="mt-2 text-xs text-[var(--dev-text-faint)]">
                    Review the result above before applying — approving will create a Handover and update the batch and milestone.
                  </p>
                </div>
              ) : null}

              {job.appliedAt ? <p className="mt-2 text-sm text-emerald-500 dark:text-emerald-400">Applied — project state updated.</p> : null}

              <div className="mt-3 flex items-center gap-2">
                {jobAwaitingReview ? (
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={applying}
                    className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-3.5 py-2 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {applying ? 'Applying…' : 'Approve & Apply'}
                  </button>
                ) : null}
                {jobDone || jobAwaitingReview ? (
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="rounded-lg border border-[var(--dev-border-strong)] px-3.5 py-2 text-[13px] font-medium text-[var(--dev-text-muted)] hover:text-[var(--dev-text)]"
                  >
                    Dismiss
                  </button>
                ) : null}
              </div>
              {launchError ? <p className="mt-2 text-xs text-rose-500 dark:text-rose-400">{launchError}</p> : null}
            </div>
          )}
        </>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatusPill label="Build" tone={devValidationTone(session.buildStatus)} value={session.buildStatus} />
        <StatusPill label="TypeScript" tone={devValidationTone(session.typescriptStatus)} value={session.typescriptStatus} />
        <StatusPill
          label="Git"
          tone={session.gitWorkingTreeStatus === 'Clean' ? 'success' : session.gitWorkingTreeStatus === 'Unknown' ? 'neutral' : 'danger'}
          value={session.gitWorkingTreeStatus}
        />
        <StatusPill label="Deployment" tone={session.deploymentStatus === 'Available' ? 'success' : 'warning'} value={session.deploymentStatus} />
      </div>
    </div>
  )
}

function jobStatusTone(status: DevelopmentJob['status']): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  if (status === 'Completed') return 'success'
  if (status === 'Failed') return 'danger'
  if (status === 'Cancelled') return 'neutral'
  if (status === 'Queued') return 'neutral'
  return 'info'
}

function MissionField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-[var(--dev-text-faint)]">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-[var(--dev-text)]">{value}</div>
    </div>
  )
}

function StatusPill({ label, value, tone }: { label: string; value: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[var(--dev-border)] px-2.5 py-1.5">
      <span className="text-[11px] text-[var(--dev-text-faint)]">{label}</span>
      <DevBadge tone={tone}>{value}</DevBadge>
    </div>
  )
}
