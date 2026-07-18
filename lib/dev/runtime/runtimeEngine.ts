import { randomUUID } from 'node:crypto'
import { getJob, saveJob, updateJob, listJobsForProject } from './runtimeStorage'
import { enqueueDevelopmentJob } from './runtimeQueue'
import { killDevelopmentJob } from './claudeRuntime'
import { assertTransition } from './executionStateMachine'
import { isProcessAlive } from './processLiveness'
import type { CreateJobInput, DevelopmentJob } from './runtimeTypes'

/**
 * The Runtime Engine — the orchestration entry point for the job lifecycle.
 * It owns creating and looking up jobs; the actual Claude Code execution
 * lives in claudeRuntime.ts, queued one-at-a-time via runtimeQueue.ts, so
 * this file never runs a process itself. Server-only (uses node:crypto and
 * the file-backed job store) — only ever called from the runtime API
 * routes, never imported into a client component.
 */
export function createDevelopmentJob(input: CreateJobInput): DevelopmentJob {
  const job: DevelopmentJob = {
    id: randomUUID(),
    projectSlug: input.projectSlug,
    milestoneId: input.milestoneId,
    batchId: input.batchId,
    objective: input.objective,
    status: 'Queued',
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    runtime: 'claude-code-cli',
    claudeSessionId: null,
    claudeUuid: null,
    duration: null,
    cost: null,
    buildStatus: 'Unknown',
    typescriptStatus: 'Unknown',
    result: null,
    error: null,
    prompt: input.prompt,
    rawOutput: null,
    stderr: null,
    exitCode: null,
    usage: null,
    gitDiffSummary: null,
    approvedAt: null,
    appliedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    pid: null,
    currentPhase: null,
    resumedSessionId: input.resumeSessionId ?? null,
  }
  saveJob(job)
  enqueueDevelopmentJob(job)
  return job
}

/**
 * A job left at Running/Validating with a pid that's no longer alive means
 * the server process that was driving it died (crash, restart, `Windows
 * restarts`, etc.) — the in-memory ChildProcess handle and queue promise
 * chain (claudeCodeProvider.ts, runtimeQueue.ts) don't survive that, so
 * without this check the job would sit at "Running" forever with no way
 * to tell a real crash from a merely slow one. Called on every read so the
 * client never has to notice this itself — it always sees accurate state.
 */
function reconcileIfOrphaned(job: DevelopmentJob): DevelopmentJob {
  if ((job.status === 'Running' || job.status === 'Validating') && !isProcessAlive(job.pid)) {
    return (
      updateJob(job.id, {
        status: 'Failed',
        completedAt: new Date().toISOString(),
        error: 'Execution was interrupted — its process is no longer running (the server may have restarted or crashed). Use Retry to start again.',
      }) ?? job
    )
  }
  return job
}

export function getDevelopmentJob(id: string): DevelopmentJob | null {
  const job = getJob(id)
  return job ? reconcileIfOrphaned(job) : null
}

export function getDevelopmentJobsForProject(slug: string): DevelopmentJob[] {
  return listJobsForProject(slug).map(reconcileIfOrphaned)
}

/** Only meaningful while the job hasn't already reached a terminal state. */
export function cancelDevelopmentJob(id: string): DevelopmentJob | null {
  const job = getJob(id)
  if (!job) return null
  if (
    job.status === 'Completed' ||
    job.status === 'Failed' ||
    job.status === 'Cancelled' ||
    job.status === 'Rejected' ||
    job.status === 'Updating'
  ) {
    return job
  }
  killDevelopmentJob(id)
  assertTransition(job.status, 'Cancelled')
  return updateJob(id, { status: 'Cancelled', completedAt: new Date().toISOString() })
}

/**
 * The two client-driven transitions after a human reviews a Completed
 * job's result: "Updating" while the browser applies the change locally
 * (createHandover/completeBatch/recomputeMilestoneProgress — all
 * localStorage, so they happen client-side via the existing Development
 * Completion Engine, not here), then back to "Completed" with appliedAt
 * set once that finishes. This engine never performs those writes itself.
 */
export function markJobApproved(id: string): DevelopmentJob | null {
  const job = getJob(id)
  if (!job) return null
  assertTransition(job.status, 'Updating')
  return updateJob(id, { status: 'Updating', approvedAt: new Date().toISOString() })
}

export function markJobApplied(id: string): DevelopmentJob | null {
  const job = getJob(id)
  if (!job) return null
  assertTransition(job.status, 'Completed')
  return updateJob(id, { status: 'Completed', appliedAt: new Date().toISOString() })
}

/**
 * The CEO's Reject action on a Completed-but-not-yet-approved job — no
 * Handover/Batch/Milestone/knowledge writes happen for a rejected job (the
 * Execution Service's approve() path is what performs those, and it's
 * simply never called here). The job stays visible in Runtime History
 * with rejectedAt/rejectionReason set so a later Retry has full context on
 * why the previous attempt wasn't accepted.
 */
export function rejectDevelopmentJob(id: string, reason?: string): DevelopmentJob | null {
  const job = getJob(id)
  if (!job) return null
  assertTransition(job.status, 'Rejected')
  return updateJob(id, {
    status: 'Rejected',
    rejectedAt: new Date().toISOString(),
    rejectionReason: reason ?? null,
  })
}
