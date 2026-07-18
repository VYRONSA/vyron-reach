'use client'

import Link from 'next/link'
import type { DevelopmentSession } from '@/lib/dev/developmentOrchestrator'
import type { DevelopmentDependencyStatus } from '@/lib/dev/developmentDependencyEngine'
import type { DevelopmentConversationMemory } from '@/lib/dev/developmentConversationMemoryEngine'
import type { ExecutiveActionQueue } from '@/lib/dev/executiveActionEngine'
import type { GeneratedPrompt } from '@/lib/dev/promptIntelligenceEngine'
import type { GitIntelligence } from '@/lib/dev/gitIntelligence'
import type { DeploymentIntelligence } from '@/lib/dev/deploymentIntelligence'
import type { Handover } from '@/lib/dev/handoverStorage'
import { useEffect, useRef } from 'react'
import { useExecutionService } from './useExecutionService'
import { copyToClipboard, DevBadge, devValidationTone } from './ui'

const ACTION_BUTTON_CLASS =
  'block w-full rounded-lg px-4 py-3.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50'

const PRIORITY_TONE: Record<string, 'danger' | 'warning' | 'info' | 'neutral'> = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'info',
  Low: 'neutral',
}

/**
 * Mission Control — the dashboard's "what's most important right now"
 * widget. All execution orchestration now lives in the Execution Service
 * (lib/dev/runtime/executionService.ts); this component is a thin
 * subscriber via useExecutionService, rendering whatever phase the
 * service reports. Reaching a Completed job no longer auto-applies — the
 * CEO reviews the result (Build/TypeScript validation + the parsed
 * report) and must click Approve or Reject before anything is written to
 * the Handover/Batch/Milestone/knowledge stores.
 */
export function MissionControl({
  slug,
  session,
  dependencies,
  memory,
  latestHandover,
  queue,
  generatedPrompt,
  git,
  deployment,
  onApplied,
}: {
  slug: string
  session: DevelopmentSession
  dependencies: DevelopmentDependencyStatus
  memory: DevelopmentConversationMemory
  latestHandover: Handover | null
  queue: ExecutiveActionQueue
  generatedPrompt: GeneratedPrompt
  git?: GitIntelligence
  deployment?: DeploymentIntelligence
  onApplied: () => void
}) {
  const { topAction, focus } = queue
  const { state, service } = useExecutionService({ slug, session, dependencies, memory, latestHandover, queue, git, deployment })
  const notifiedApplied = useRef(false)

  useEffect(() => {
    if (state.phase === 'completed' && !notifiedApplied.current) {
      notifiedApplied.current = true
      onApplied()
    }
    if (state.phase === 'idle') notifiedApplied.current = false
  }, [state.phase, onApplied])

  const handleCopyFallback = async () => {
    await copyToClipboard(state.prompt?.fullText ?? generatedPrompt.fullText)
  }

  const jobIsLive = state.phase === 'queued' || state.phase === 'running' || state.phase === 'validating'
  const jobDone = state.phase === 'failed' || state.phase === 'cancelled' || state.phase === 'rejected' || state.phase === 'completed'
  const canRetry = state.phase === 'failed' || state.phase === 'cancelled' || state.phase === 'rejected'

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

          {state.phase === 'idle' ? (
            <div className="mt-4">
              <button type="button" onClick={service.execute} className={`${ACTION_BUTTON_CLASS} bg-gradient-to-r from-sky-500 to-blue-600`}>
                EXECUTE DEVELOPMENT TASK
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-[var(--dev-text)]">Development Job</span>
                <DevBadge tone={phaseTone(state.phase)}>{phaseLabel(state.phase, state.job?.currentPhase)}</DevBadge>
              </div>

              {state.plannedTask ? (
                <p className="mt-2 text-xs text-[var(--dev-text-faint)]">
                  Executing: <span className="text-[var(--dev-text)]">{state.plannedTask.title}</span> — {state.plannedTask.reason}
                  {' '}({state.plannedTask.priority} priority, {state.plannedTask.confidence} confidence, est. {state.plannedTask.estimatedEffort} effort)
                </p>
              ) : null}
              {state.engineeringReport ? (
                <p className="mt-1 text-xs text-[var(--dev-text-faint)]">
                  Engineering Score: <span className="text-[var(--dev-text)]">{state.engineeringReport.engineeringScore}/100</span> (
                  {state.engineeringReport.overallHealth}) · {state.engineeringReport.criticalIssues.length} critical ·{' '}
                  {state.engineeringReport.highIssues.length} high
                </p>
              ) : null}
              {state.strategy ? (
                <p className="mt-1 text-xs text-[var(--dev-text-faint)]">
                  Strategy: <span className="text-[var(--dev-text)]">{state.strategy.currentDevelopmentTheme}</span> · Delivery confidence:{' '}
                  {state.strategy.deliveryConfidence} · {state.strategy.overallRecommendation}
                </p>
              ) : null}
              {state.workforceReport ? (
                <p className="mt-1 text-xs text-[var(--dev-text-faint)]">
                  Workforce ({state.workforceReport.provider}): {state.workforceReport.agentsUsed.join(', ')} · Confidence:{' '}
                  {state.workforceReport.overallConfidence}
                  {state.workforceReport.conflicts.length > 0 ? ` · ${state.workforceReport.conflicts.length} conflict(s) resolved by the Director` : ''}
                </p>
              ) : null}
              {state.relevantKnowledge ? (
                <p className="mt-1 text-xs text-[var(--dev-text-faint)]">
                  Knowledge Retrieved: {state.relevantKnowledge.memoryEntries.length} lesson(s), {state.relevantKnowledge.dnaEntries.length} DNA
                  entr{state.relevantKnowledge.dnaEntries.length === 1 ? 'y' : 'ies'}, {state.relevantKnowledge.patterns.length} pattern(s),{' '}
                  {state.relevantKnowledge.similarExecutions.length} similar execution(s) · Learning Confidence: {state.relevantKnowledge.confidence}
                  {state.dnaUpdated > 0 ? ` · DNA Updated: +${state.dnaUpdated}` : ''}
                </p>
              ) : null}

              {jobIsLive ? (
                <p className="mt-2 text-xs text-[var(--dev-text-faint)]">Claude Code is running — this can take several minutes.</p>
              ) : null}

              {state.phase === 'failed' ? <p className="mt-2 text-sm text-rose-500 dark:text-rose-400">{state.job?.error}</p> : null}
              {state.phase === 'cancelled' ? <p className="mt-2 text-sm text-[var(--dev-text-faint)]">Job cancelled.</p> : null}
              {state.phase === 'rejected' ? (
                <p className="mt-2 text-sm text-[var(--dev-text-faint)]">
                  Rejected{state.job?.rejectionReason ? `: ${state.job.rejectionReason}` : '.'}
                </p>
              ) : null}

              {state.phase === 'awaiting-review' ? (
                <div className="mt-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MissionField label="Build" value={state.validationResult?.buildStatus ?? state.job?.buildStatus ?? 'Unknown'} />
                    <MissionField label="TypeScript" value={state.validationResult?.typescriptStatus ?? state.job?.typescriptStatus ?? 'Unknown'} />
                    <MissionField label="Duration" value={state.job?.duration ? `${Math.round(state.job.duration / 1000)}s` : 'Unknown'} />
                    <MissionField label="Cost" value={state.job?.cost !== null && state.job?.cost !== undefined ? `$${state.job.cost.toFixed(4)}` : 'Unknown'} />
                  </div>
                  <p className="mt-3 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-black/20 p-2.5 font-mono text-[11px] leading-relaxed text-[var(--dev-text-muted)]">
                    {state.job?.result}
                  </p>
                  <p className="mt-2 text-xs text-[var(--dev-text-faint)]">Review the result, then Approve to update the Handover, batch, and every knowledge store, or Reject to discard it.</p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={service.approve}
                      className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:opacity-90"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => service.reject()}
                      className="rounded-lg border border-rose-500/30 px-3.5 py-2 text-[13px] font-medium text-rose-500 hover:bg-rose-500/10 dark:text-rose-400"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : null}

              {state.phase === 'applying' ? (
                <p className="mt-2 text-xs text-[var(--dev-text-faint)]">Applying — updating the Handover, batch, and knowledge stores.</p>
              ) : null}
              {state.phase === 'completed' ? <p className="mt-2 text-sm text-emerald-500 dark:text-emerald-400">Applied — project state updated.</p> : null}

              {state.dashboard ? (
                <p className="mt-1 text-xs text-[var(--dev-text-faint)]">
                  Platform Health: {state.dashboard.overallPlatformHealth} · Success Rate: {state.dashboard.executionSuccessRate}% · Engineering
                  Trend: {state.dashboard.engineeringTrend}
                </p>
              ) : null}
              {state.deploymentSnapshot ? (
                <p className="mt-1 text-xs text-[var(--dev-text-faint)]">
                  {state.deploymentSnapshot.branch}@{state.deploymentSnapshot.commitHash.slice(0, 8)} · {state.deploymentSnapshot.rollbackPoints.length}{' '}
                  rollback point{state.deploymentSnapshot.rollbackPoints.length === 1 ? '' : 's'} tracked
                </p>
              ) : null}

              <div className="mt-3 flex items-center gap-2">
                {jobIsLive ? (
                  <button
                    type="button"
                    onClick={service.cancel}
                    className="rounded-lg border border-[var(--dev-border-strong)] px-3.5 py-2 text-[13px] font-medium text-[var(--dev-text-muted)] hover:text-[var(--dev-text)]"
                  >
                    Cancel Execution
                  </button>
                ) : null}
                {canRetry ? (
                  <button
                    type="button"
                    onClick={service.retry}
                    className="rounded-lg border border-[var(--dev-accent)]/40 px-3.5 py-2 text-[13px] font-medium text-[var(--dev-accent)] hover:bg-[var(--dev-accent-soft)]"
                  >
                    Retry
                  </button>
                ) : null}
                {jobDone ? (
                  <button
                    type="button"
                    onClick={service.dismiss}
                    className="rounded-lg border border-[var(--dev-border-strong)] px-3.5 py-2 text-[13px] font-medium text-[var(--dev-text-muted)] hover:text-[var(--dev-text)]"
                  >
                    Dismiss
                  </button>
                ) : null}
              </div>

              {state.error ? (
                <div className="mt-2 flex items-center justify-between gap-2 text-xs text-rose-500 dark:text-rose-400">
                  <span>{state.error}</span>
                  {state.phase === 'blocked' ? (
                    <button type="button" onClick={handleCopyFallback} className="underline hover:no-underline">
                      Copy prompt instead
                    </button>
                  ) : null}
                </div>
              ) : null}
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

function phaseLabel(phase: string, runtimePhase?: string | null): string {
  if ((phase === 'running' || phase === 'validating') && runtimePhase) return runtimePhase
  if (phase === 'awaiting-review') return 'Waiting for CEO Review'
  if (phase === 'loading-repository') return 'Loading Repository'
  if (phase === 'generating-context') return 'Generating Context'
  if (phase === 'planning') return 'Preparing Context'
  if (phase === 'applying') return 'Updating Knowledge'
  return phase.charAt(0).toUpperCase() + phase.slice(1)
}

function phaseTone(phase: string): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  if (phase === 'completed') return 'success'
  if (phase === 'failed' || phase === 'blocked') return 'danger'
  if (phase === 'cancelled' || phase === 'rejected') return 'neutral'
  if (phase === 'queued') return 'neutral'
  if (phase === 'awaiting-review') return 'warning'
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
