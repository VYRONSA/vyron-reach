import { randomUUID } from 'node:crypto'
import { getJob, saveJob, updateJob, listJobsForProject } from './runtimeStorage'
import { enqueueDevelopmentJob } from './runtimeQueue'
import { killDevelopmentJob } from './claudeRuntime'
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
    approvedAt: null,
    appliedAt: null,
  }
  saveJob(job)
  enqueueDevelopmentJob(job)
  return job
}

export function getDevelopmentJob(id: string): DevelopmentJob | null {
  return getJob(id)
}

export function getDevelopmentJobsForProject(slug: string): DevelopmentJob[] {
  return listJobsForProject(slug)
}

/** Only meaningful while the job hasn't already reached a terminal state. */
export function cancelDevelopmentJob(id: string): DevelopmentJob | null {
  const job = getJob(id)
  if (!job) return null
  if (job.status === 'Completed' || job.status === 'Failed' || job.status === 'Cancelled') return job
  killDevelopmentJob(id)
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
  return updateJob(id, { status: 'Updating', approvedAt: new Date().toISOString() })
}

export function markJobApplied(id: string): DevelopmentJob | null {
  return updateJob(id, { status: 'Completed', appliedAt: new Date().toISOString() })
}
