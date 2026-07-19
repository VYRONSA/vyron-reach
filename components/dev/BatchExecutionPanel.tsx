'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { GitIntelligence } from '@/lib/dev/gitIntelligence'
import type { DeploymentIntelligence } from '@/lib/dev/deploymentIntelligence'
import { getBuildResultDisplay, type BuildIntelligence } from '@/lib/dev/buildIntelligence'
import { getBatches, type Batch } from '@/lib/dev/batchesStorage'
import { getMilestones } from '@/lib/dev/milestonesStorage'
import { decisionsForBatch } from '@/lib/dev/decisionsStorage'
import { debtForBatch } from '@/lib/dev/technicalDebtStorage'
import { getProductBible } from '@/lib/dev/productBibleStorage'
import { getProjectBySlug } from '@/lib/dev/projectsData'
import { getSelfDevelopmentStatus } from '@/lib/dev/selfDevelopmentEngine'
import { developmentDependencyStatusForProject } from '@/lib/dev/developmentDependencyEngine'
import { developmentEventsForProject } from '@/lib/dev/developmentEventEngine'
import { getDevelopmentConversationMemory } from '@/lib/dev/developmentConversationMemoryEngine'
import { getExecutiveActions } from '@/lib/dev/executiveActionEngine'
import { getGeneratedPrompt } from '@/lib/dev/promptIntelligenceEngine'
import { getLatestHandover } from '@/lib/dev/handoverStorage'
import type { ReviewPackage } from '@/lib/dev/runtime/reviewPackage'
import type { ExecutionIdentity } from '@/lib/dev/runtime/executionIdentity'
import { useExecutionService } from './useExecutionService'
import { copyToClipboard, DevBadge, DevCard, DevEmptyState, DevPageHeader } from './ui'

const STATUS_TONE: Record<Batch['status'], 'neutral' | 'info' | 'success'> = {
  Queued: 'neutral',
  Active: 'info',
  Complete: 'success',
}

export function BatchExecutionPanel({
  batchId,
  git,
  deployment,
  build,
}: {
  batchId: string
  git?: GitIntelligence
  deployment?: DeploymentIntelligence
  build?: BuildIntelligence
}) {
  const [batch, setBatch] = useState<Batch | null | undefined>(undefined)
  const [projectSlug, setProjectSlug] = useState<string | null>(null)

  useEffect(() => {
    const found = getBatches().find(b => b.id === batchId) ?? null
    setBatch(found)
    if (found?.milestone) {
      const milestone = getMilestones().find(m => m.id === found.milestone)
      setProjectSlug(milestone?.project || null)
    }
  }, [batchId])

  if (batch === undefined) return null

  if (!batch) {
    return <DevEmptyState>Batch not found.</DevEmptyState>
  }

  if (!projectSlug) {
    return (
      <div>
        <BatchSummaryCard batch={batch} />
        <div className="mt-4">
          <DevEmptyState>
            This batch has no project assigned (its milestone has no project), so it can&apos;t be executed. Assign a milestone
            with a project first.
          </DevEmptyState>
        </div>
      </div>
    )
  }

  return <BatchExecutionPanelWithProject batch={batch} projectSlug={projectSlug} git={git} deployment={deployment} build={build} />
}

function BatchSummaryCard({ batch }: { batch: Batch }) {
  return (
    <DevCard eyebrow={`Batch ${batch.batchNumber}`} title={batch.objective || 'No objective set'}>
      <div className="mt-2 flex items-center gap-2">
        <DevBadge tone={STATUS_TONE[batch.status]}>{batch.status}</DevBadge>
      </div>
      {batch.summary ? <p className="mt-3 text-sm text-[var(--dev-text-muted)]">{batch.summary}</p> : null}
    </DevCard>
  )
}

function BatchExecutionPanelWithProject({
  batch,
  projectSlug,
  git,
  deployment,
  build,
}: {
  batch: Batch
  projectSlug: string
  git?: GitIntelligence
  deployment?: DeploymentIntelligence
  build?: BuildIntelligence
}) {
  const context = useMemo(
    () => ({ buildStatus: build?.lastBuildStatus, typescriptStatus: build?.lastTypeScriptStatus, git, deployment, build }),
    [build, git, deployment]
  )
  const status = useMemo(() => getSelfDevelopmentStatus(projectSlug, context), [projectSlug, context])
  const dependencies = useMemo(() => developmentDependencyStatusForProject(projectSlug, context), [projectSlug, context])
  const events = useMemo(() => developmentEventsForProject(projectSlug, { git, build, deployment }), [projectSlug, git, build, deployment])
  const memory = useMemo(
    () => getDevelopmentConversationMemory(projectSlug, status.session, status.plan, dependencies, events),
    [projectSlug, status, dependencies, events]
  )
  const queue = useMemo(
    () => getExecutiveActions(status.session, status.plan, dependencies, events, memory),
    [status, dependencies, events, memory]
  )
  const latestHandover = useMemo(() => getLatestHandover(projectSlug), [projectSlug])
  const generatedPrompt = useMemo(
    () => getGeneratedPrompt(projectSlug, status.session, dependencies, events, memory),
    [projectSlug, status, dependencies, events, memory]
  )
  const bible = useMemo(() => getProductBible(projectSlug), [projectSlug])
  const project = getProjectBySlug(projectSlug)

  const { state, service } = useExecutionService({
    slug: projectSlug,
    session: status.session,
    dependencies,
    memory,
    latestHandover,
    queue,
    git,
    deployment,
  })

  const decisionCount = decisionsForBatch(batch.id).length
  const debtCount = debtForBatch(batch.id).length

  const jobIsLive = state.phase === 'queued' || state.phase === 'running' || state.phase === 'validating'
  const jobDone = state.phase === 'failed' || state.phase === 'cancelled' || state.phase === 'rejected' || state.phase === 'completed'
  const canRetry = state.phase === 'failed' || state.phase === 'cancelled' || state.phase === 'rejected'
  const canExecute = state.phase === 'idle'

  const handleCopyFallback = async () => {
    await copyToClipboard(state.prompt?.fullText ?? generatedPrompt.fullText)
  }

  return (
    <div>
      <DevPageHeader
        eyebrow={`Batch ${batch.batchNumber}`}
        title={batch.objective || 'No objective set'}
        description={project ? `${project.name} — ${status.session.currentMilestone?.title ?? 'No milestone'}` : undefined}
        actions={<DevBadge tone={STATUS_TONE[batch.status]}>{batch.status}</DevBadge>}
      />

      {batch.summary ? <p className="mb-6 text-sm text-[var(--dev-text-muted)]">{batch.summary}</p> : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DevCard eyebrow="Execution" title="Execution Status">
            {canExecute ? (
              <button
                type="button"
                onClick={service.execute}
                className="mt-3 w-full rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                EXECUTE BATCH
              </button>
            ) : (
              <div className="mt-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[var(--dev-text)]">Job Status</span>
                  <DevBadge tone={phaseTone(state.phase)}>{phaseLabel(state.phase, state.job?.currentPhase)}</DevBadge>
                </div>

                {state.plannedTask ? (
                  <p className="mt-2 text-xs text-[var(--dev-text-faint)]">
                    {state.plannedTask.title} — {state.plannedTask.reason}
                  </p>
                ) : null}

                {jobIsLive ? <p className="mt-2 text-xs text-[var(--dev-text-faint)]">Claude Code is running — this can take several minutes.</p> : null}

                {state.phase === 'failed' ? <p className="mt-2 text-sm text-rose-500 dark:text-rose-400">{state.job?.error}</p> : null}
                {state.phase === 'cancelled' ? <p className="mt-2 text-sm text-[var(--dev-text-faint)]">Job cancelled.</p> : null}
                {state.phase === 'rejected' ? (
                  <p className="mt-2 text-sm text-[var(--dev-text-faint)]">Rejected{state.job?.rejectionReason ? `: ${state.job.rejectionReason}` : '.'}</p>
                ) : null}

                {state.phase === 'awaiting-review' ? (
                  <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-accent)]">Validation Status</div>
                    <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <ValidationField
                        label="Build"
                        value={getBuildResultDisplay(
                          state.validationResult?.buildStatus ?? state.job?.buildStatus ?? 'Unknown',
                          state.validationResult?.buildWarningCount ?? 0
                        )}
                        hint={
                          state.validationResult?.buildWarningCount ? `${state.validationResult.buildWarningCount} warning(s)` : undefined
                        }
                      />
                      <ValidationField label="TypeScript" value={state.validationResult?.typescriptStatus ?? state.job?.typescriptStatus ?? 'Unknown'} />
                      <ValidationField label="Duration" value={state.job?.duration ? `${Math.round(state.job.duration / 1000)}s` : 'Unknown'} />
                      <ValidationField label="Cost" value={state.job?.cost !== null && state.job?.cost !== undefined ? `$${state.job.cost.toFixed(4)}` : 'Unknown'} />
                    </div>

                    <div className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-accent)]">Review Package</div>
                    {state.reviewPackage ? <ReviewPackageView pkg={state.reviewPackage} /> : null}

                    <details className="mt-3">
                      <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">
                        Raw report &amp; diff
                      </summary>
                      <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-black/20 p-3 font-mono text-[11px] leading-relaxed text-[var(--dev-text-muted)]">
                        {state.job?.result}
                      </p>
                      {state.job?.gitDiffSummary ? (
                        <p className="mt-2 whitespace-pre-wrap rounded-lg border border-[var(--dev-border)] p-3 font-mono text-[11px] text-[var(--dev-text-faint)]">
                          {state.job.gitDiffSummary}
                        </p>
                      ) : null}
                    </details>

                    <div className="mt-4 flex items-center gap-2">
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

                {state.phase === 'applying' ? <p className="mt-3 text-xs text-[var(--dev-text-faint)]">Applying — updating every knowledge store.</p> : null}
                {state.phase === 'completed' ? <p className="mt-3 text-sm text-emerald-500 dark:text-emerald-400">Batch updated — knowledge stores synced.</p> : null}

                <div className="mt-4 flex items-center gap-2">
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
          </DevCard>
        </div>

        <div>
          <DevCard eyebrow="Engineering Context" title={project?.name ?? projectSlug}>
            <div className="mt-2 space-y-2 text-xs text-[var(--dev-text-muted)]">
              <p>Phase: {status.session.currentPhase}</p>
              <p>Milestone: {status.session.currentMilestone?.title ?? 'None'}</p>
              {bible.vision ? <p className="line-clamp-3">Vision: {bible.vision}</p> : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/dev/decisions?batch=${batch.id}`} className="text-xs text-[var(--dev-accent)] hover:underline">
                {decisionCount} decisions
              </Link>
              <Link href={`/dev/technical-debt?batch=${batch.id}`} className="text-xs text-[var(--dev-accent)] hover:underline">
                {debtCount} debt items
              </Link>
            </div>
          </DevCard>
        </div>
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

function ValidationField({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-[var(--dev-text-faint)]">{label}</div>
      <div className="mt-0.5 text-sm font-medium text-[var(--dev-text)]">{value}</div>
      {hint ? <div className="mt-0.5 text-[10px] text-[var(--dev-text-faint)]">{hint}</div> : null}
    </div>
  )
}

function ReviewList({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="mt-3">
      <div className="text-[10px] uppercase tracking-wide text-[var(--dev-text-faint)]">
        {label} ({items.length})
      </div>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-[var(--dev-text-muted)]">
        {items.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  )
}

/** Renders the automatically-generated Review Package — Engineering Summary, file/architecture/database/security changes, and the CEO Review Checklist — everything the mission asks VYRON DEV to produce with no manual report processing. */
function ReviewPackageView({ pkg }: { pkg: ReviewPackage }) {
  return (
    <div className="mt-2 rounded-lg border border-[var(--dev-border)] p-3">
      {pkg.engineeringSummary ? <p className="text-sm text-[var(--dev-text)]">{pkg.engineeringSummary}</p> : null}

      <div className="mt-3 flex items-center justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-[var(--dev-text-faint)]">Build</div>
          <div className="mt-0.5 text-sm font-medium text-[var(--dev-text)]">{pkg.buildResultDisplay}</div>
        </div>
        {pkg.buildWarningCount > 0 ? (
          <span className="text-xs text-[var(--dev-text-faint)]">{pkg.buildWarningCount} warning(s)</span>
        ) : null}
      </div>

      <ReviewList label="Files Created" items={pkg.filesCreated} />
      <ReviewList label="Files Modified" items={pkg.filesModified} />
      <ReviewList label="Architecture Changes" items={pkg.architectureChanges} />
      <ReviewList label="Database Changes" items={pkg.databaseChanges} />
      <ReviewList label="Security Changes" items={pkg.securityChanges} />

      <div className="mt-3 text-[10px] uppercase tracking-wide text-[var(--dev-text-faint)]">Knowledge Updates</div>
      <p className="mt-1 text-xs text-[var(--dev-text-muted)]">
        {pkg.knowledgeUpdates.risksCreated} risk(s) · {pkg.knowledgeUpdates.technicalDebtCreated} debt item(s) ·{' '}
        {pkg.knowledgeUpdates.decisionsCreated} architecture decision(s) · 1 journal entry
      </p>

      <div className="mt-3 text-[10px] uppercase tracking-wide text-[var(--dev-text-faint)]">CEO Review Checklist</div>
      <ul className="mt-1 space-y-1">
        {pkg.ceoChecklist.map(item => (
          <li key={item.label} className="flex items-center justify-between gap-2 text-xs">
            <span className="text-[var(--dev-text-muted)]">{item.label}</span>
            <DevBadge tone={item.passed ? 'success' : 'danger'}>{item.passed ? 'Pass' : 'Check'}</DevBadge>
          </li>
        ))}
      </ul>

      {pkg.executionIdentity ? <ExecutionIdentityView identity={pkg.executionIdentity} /> : null}
    </div>
  )
}

/** What exactly this CEO Review is a review of — the same Execution Identity Recurrence Detection compares, made visible instead of implied. */
function ExecutionIdentityView({ identity }: { identity: ExecutionIdentity }) {
  const rows: [string, string][] = [
    ['Product', identity.product],
    ['Project', identity.project],
    ['Phase', identity.phase],
    ['Milestone', identity.milestoneTitle ?? 'None'],
    ['Batch', identity.batchNumber ? `Batch ${identity.batchNumber} (${identity.batchStatus})` : 'None'],
    ['Repository Commit', identity.repositoryCommit ?? 'Unavailable'],
    ['CEO Decision', identity.ceoDecision],
    ['Knowledge Version', identity.knowledgeVersion],
  ]
  return (
    <div className="mt-3 border-t border-[var(--dev-border)] pt-3">
      <div className="text-[10px] uppercase tracking-wide text-[var(--dev-text-faint)]">Execution Identity</div>
      <dl className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-2">
            <dt className="text-[var(--dev-text-faint)]">{label}</dt>
            <dd className="truncate text-right text-[var(--dev-text-muted)]" title={value}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
