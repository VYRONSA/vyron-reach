import type { Batch, BatchStatus } from '../batchesStorage'
import type { Milestone, MilestoneStatus } from '../milestonesStorage'
import type { ExecutionSnapshot } from './executionSnapshotTypes'

/**
 * Server-side port of batchesStorage.ts's enforcePlanningState /
 * milestonesStorage.ts's deriveMilestoneStatus — same algorithm, same
 * invariants ("only one Active batch," "Current Batch === Active Batch,"
 * "milestone status derives from batch completion"), operating on the
 * ExecutionSnapshot's own arrays instead of localStorage. This is a
 * deliberate port rather than a shared import: batchesStorage.ts's
 * functions read/write through localStore.ts, which no-ops server-side —
 * calling them here would silently do nothing. The algorithm itself is
 * unchanged.
 */

function deriveMilestoneStatus(batchStatuses: BatchStatus[], currentStatus: MilestoneStatus): MilestoneStatus {
  if (batchStatuses.length === 0) return currentStatus
  if (batchStatuses.every(s => s === 'Complete')) return 'Complete'
  if (currentStatus === 'At Risk') return 'At Risk'
  return batchStatuses.some(s => s === 'Active' || s === 'Complete') ? 'In Progress' : 'Upcoming'
}

export function enforceSnapshotPlanningState(snapshot: ExecutionSnapshot, justActivatedBatchId?: string): ExecutionSnapshot {
  const batches = [...snapshot.batches]
  const sorted = [...batches].sort((a, b) => a.sequence - b.sequence)
  const activeBatches = sorted.filter(b => b.status === 'Active')

  const patchBatch = (id: string, patch: Partial<Batch>) => {
    const idx = batches.findIndex(b => b.id === id)
    if (idx !== -1) batches[idx] = { ...batches[idx], ...patch, updatedAt: new Date().toISOString() }
  }

  if (activeBatches.length > 1) {
    const keep = activeBatches.find(b => b.id === justActivatedBatchId) ?? activeBatches[0]
    for (const extra of activeBatches.filter(b => b.id !== keep.id)) patchBatch(extra.id, { status: 'Queued' })
  } else if (activeBatches.length === 0) {
    const next = sorted.find(b => b.status !== 'Complete')
    if (next) patchBatch(next.id, { status: 'Active' })
  }

  const milestones = snapshot.milestones.map(m => {
    const statuses = batches.filter(b => b.milestone === m.id).map(b => b.status)
    const derived = deriveMilestoneStatus(statuses, m.status)
    return derived === m.status ? m : { ...m, status: derived, updatedAt: new Date().toISOString() }
  })

  return { ...snapshot, batches, milestones }
}

export function getCurrentBatch(snapshot: ExecutionSnapshot): Batch | null {
  return snapshot.batches.find(b => b.status === 'Active') ?? null
}

export function getMilestoneForBatch(snapshot: ExecutionSnapshot, batch: Batch): Milestone | null {
  return snapshot.milestones.find(m => m.id === batch.milestone) ?? null
}

export function isProjectComplete(snapshot: ExecutionSnapshot): boolean {
  return snapshot.batches.length > 0 && snapshot.batches.every(b => b.status === 'Complete')
}

/** True when every milestone sharing `phase` is Complete — the "Phase Completed" notification's trigger condition. */
export function isPhaseComplete(snapshot: ExecutionSnapshot, phase: string): boolean {
  const inPhase = snapshot.milestones.filter(m => m.phase === phase)
  return inPhase.length > 0 && inPhase.every(m => m.status === 'Complete')
}

/** Marks one batch Complete and re-runs enforcement so the next batch auto-promotes to Active and milestone status re-derives — the server-side equivalent of batchesStorage.completeBatch() + its enforcePlanningState side effect. */
export function completeBatchInSnapshot(snapshot: ExecutionSnapshot, batchId: string): ExecutionSnapshot {
  const now = new Date().toISOString()
  const withCompletion: ExecutionSnapshot = {
    ...snapshot,
    batches: snapshot.batches.map(b =>
      b.id === batchId ? { ...b, status: 'Complete', completionDate: now.slice(0, 10), updatedAt: now } : b
    ),
  }
  return enforceSnapshotPlanningState(withCompletion)
}
