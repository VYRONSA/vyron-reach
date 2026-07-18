import type { JobStatus } from './runtimeTypes'

/**
 * The Execution State Machine — the single source of truth for which job
 * status transitions are legal. Mirrors exactly what runtimeEngine.ts and
 * claudeCodeProvider.ts already do today; this module doesn't invent new
 * behavior, it makes the existing transitions explicit and rejects
 * anything outside them, rather than trusting every call site to only
 * ever request a valid one.
 *
 * Completed appears on both sides of the approval cycle by design (an
 * existing convention this module preserves, not introduces): a job
 * reaching Completed means Claude's run produced a valid report, not that
 * project state changed. Updating→Completed is the same status value
 * again, now with appliedAt set — the CEO's Approve action.
 */
const TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  Queued: ['Running', 'Cancelled'],
  Running: ['Validating', 'Failed', 'Cancelled'],
  Validating: ['Completed', 'Failed', 'Cancelled'],
  Completed: ['Updating', 'Rejected'],
  Updating: ['Completed'],
  Rejected: [],
  Failed: [],
  Cancelled: [],
}

export function canTransition(from: JobStatus, to: JobStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false
}

/** Throws on an illegal transition instead of silently allowing it — callers should validate before persisting. */
export function assertTransition(from: JobStatus, to: JobStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal job status transition: ${from} → ${to}`)
  }
}

/** A job in one of these statuses is done and will never transition again on its own. */
export function isTerminalStatus(status: JobStatus): boolean {
  return TRANSITIONS[status].length === 0
}
