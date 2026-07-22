import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import {
  startServerDirector,
  pauseServerDirector,
  resumeServerDirector,
  cancelServerDirector,
  DirectorLifecycleError,
} from '../../../lib/dev/director/serverExecutionLoop'
import { getDirectorStatus, patchDirectorStatus, isCurrentInboxBlocker } from '../../../lib/dev/director/directorRuntimeStore'
import { saveExecutionSnapshot } from '../../../lib/dev/director/executionSnapshotStore'
import { listInboxItems, createInboxItem, resolveInboxItem } from '../../../lib/dev/director/engineeringInboxStore'
import { historyForProject } from '../../../lib/dev/director/directorHistoryStore'
import { acquireLoopOwnership, releaseLoopOwnership } from '../../../lib/dev/director/directorLock'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import type { HandoffInput } from '../../../lib/dev/director/executionSnapshotTypes'
import type { Batch } from '../../../lib/dev/batchesStorage'
import type { Milestone } from '../../../lib/dev/milestonesStorage'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function batch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: 'b1', batchNumber: 'B1', milestone: 'm1', objective: '', summary: '', completedTasks: '',
    lessonsLearned: '', claudePrompt: '', completionDate: '', status: 'Active', archived: false,
    sequence: 1, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z', ...overrides,
  }
}

function milestone(overrides: Partial<Milestone> = {}): Milestone {
  return {
    id: 'm1', project: 'proj', title: 'M1', description: '', phase: 'Phase 1', startDate: '', targetDate: '',
    progress: 0, status: 'Upcoming', archived: false, sequence: 1, createdAt: '', updatedAt: '', ...overrides,
  }
}

function handoff(project: string, overrides: Partial<HandoffInput> = {}): HandoffInput {
  return {
    project,
    projectName: project,
    projectTagline: '',
    projectDescription: '',
    milestones: [],
    batches: [],
    decisions: [],
    technicalDebt: [],
    openRisks: [],
    developmentRules: '',
    productBible: { vision: '', goals: '', targetMarket: '', coreFeatures: '', futureRoadmap: '', notes: '', updatedAt: '' },
    ...overrides,
  }
}

describe('Engineering Director — Start → Completion', () => {
  it('transitions straight to Completed when every batch in the handoff is already Complete', async () => {
    const project = uniqueSlug()
    startServerDirector(handoff(project, {
      milestones: [milestone({ project })],
      batches: [batch({ status: 'Complete' })],
    }))

    await waitFor(() => getDirectorStatus(project).state === 'Completed')
    const status = getDirectorStatus(project)
    expect(status.completedAt).not.toBeNull()
    expect(status.remainingBatches).toBe(0)
    expect(historyForProject(project).some(h => h.event === 'Development completed')).toBe(true)
  })
})

describe('Engineering Director — Blocked state (preflight blockers)', () => {
  it('blocks on unresolved High-priority technical debt before running the batch', async () => {
    const project = uniqueSlug()
    // Live Knowledge Refresh (Milestone 2.2) reloads technicalDebt from the
    // Planning Service at the very first synchronization boundary (a run's
    // first batch has no prior baseline, so it always refreshes) — that
    // refresh happens synchronously before startServerDirector's first
    // await, so the Planning Service must already contain this item BEFORE
    // startServerDirector is called, or it gets superseded by an empty read.
    planningStateService.createTechnicalDebt(project, {
      title: 'No tests', description: '', priority: 'High', estimatedEffort: '', createdDate: '', resolvedDate: '', status: 'Open',
    })
    startServerDirector(handoff(project, {
      milestones: [milestone({ project })],
      batches: [batch()],
      technicalDebt: [{ title: 'No tests', priority: 'High', relatedBatch: '' }],
    }))

    await waitFor(() => getDirectorStatus(project).state === 'Blocked')
    const status = getDirectorStatus(project)
    expect(status.waitingReason).toMatch(/technical debt/i)

    const inbox = listInboxItems({ project })
    expect(inbox).toHaveLength(1)
    expect(inbox[0].reasonType).toBe('Technical Debt Escalation')
    expect(status.waitingInboxItemId).toBe(inbox[0].id)
  })

  it('blocks on an open high-severity risk (Business Decision Required) before running the batch', async () => {
    const project = uniqueSlug()
    // Same reason as the technical-debt test above — seed the Planning
    // Service BEFORE calling startServerDirector, so the risk survives the
    // first-boundary Live Knowledge Refresh (which runs synchronously
    // before startServerDirector's first await).
    planningStateService.createRisk(project, {
      title: 'Vendor risk', description: '', severity: 'High', probability: 'Medium', mitigation: '', owner: '', status: 'Open',
    })
    startServerDirector(handoff(project, {
      milestones: [milestone({ project })],
      batches: [batch()],
      openRisks: [{ title: 'Vendor risk', severity: 'High', relatedMilestone: 'm1' }],
    }))

    await waitFor(() => getDirectorStatus(project).state === 'Blocked')
    const inbox = listInboxItems({ project })
    expect(inbox[0].reasonType).toBe('Business Decision Required')
  })

  it('does not start Claude execution while blocked — no runtime job id is ever attached', async () => {
    const project = uniqueSlug()
    planningStateService.createTechnicalDebt(project, {
      title: 'Debt', description: '', priority: 'High', estimatedEffort: '', createdDate: '', resolvedDate: '', status: 'Open',
    })
    startServerDirector(handoff(project, {
      milestones: [milestone({ project })],
      batches: [batch()],
      technicalDebt: [{ title: 'Debt', priority: 'High', relatedBatch: '' }],
    }))
    await waitFor(() => getDirectorStatus(project).state === 'Blocked')
    expect(getDirectorStatus(project).currentJobId).toBeNull()
  })
})

describe('Engineering Director — Pause / Waiting for CEO', () => {
  it('pausing while Running moves to Waiting for CEO and records why', () => {
    const project = uniqueSlug()
    patchDirectorStatus(project, { state: 'Running' })
    pauseServerDirector(project)
    const status = getDirectorStatus(project)
    expect(status.state).toBe('Waiting for CEO')
    expect(status.waitingReason).toBe('Paused by CEO')
    expect(historyForProject(project).some(h => h.event === 'Paused by CEO')).toBe(true)
  })

  it('pausing while Planning also moves to Waiting for CEO', () => {
    const project = uniqueSlug()
    patchDirectorStatus(project, { state: 'Planning' })
    pauseServerDirector(project)
    expect(getDirectorStatus(project).state).toBe('Waiting for CEO')
  })

  it('is a no-op when the project is Idle — pause only ever acts on Running/Planning', () => {
    const project = uniqueSlug()
    pauseServerDirector(project)
    expect(getDirectorStatus(project).state).toBe('Idle')
  })

  it('is a no-op when already Waiting for CEO (does not double-record the pause)', () => {
    const project = uniqueSlug()
    patchDirectorStatus(project, { state: 'Running' })
    pauseServerDirector(project)
    pauseServerDirector(project)
    expect(historyForProject(project).filter(h => h.event === 'Paused by CEO')).toHaveLength(1)
  })

  it('is a no-op when Blocked — pause never touches an already-blocked project', () => {
    const project = uniqueSlug()
    patchDirectorStatus(project, { state: 'Blocked', waitingReason: 'Technical debt' })
    pauseServerDirector(project)
    const status = getDirectorStatus(project)
    expect(status.state).toBe('Blocked')
    expect(status.waitingReason).toBe('Technical debt')
  })
})

describe('Engineering Director — Resume / Approval flow', () => {
  it('resumes from Blocked, re-enters the loop, and reaches Completed when the snapshot has nothing left to do', async () => {
    const project = uniqueSlug()
    patchDirectorStatus(project, { state: 'Blocked', waitingReason: 'Technical debt' })
    saveExecutionSnapshot({
      ...handoff(project, { milestones: [milestone({ project })], batches: [batch({ status: 'Complete' })] }),
      completions: [], handedOffAt: new Date().toISOString(),
    })

    resumeServerDirector(project)
    await waitFor(() => getDirectorStatus(project).state === 'Completed')
    expect(historyForProject(project).some(h => h.event === 'Resumed')).toBe(true)
  })

  it('is a no-op when the project is already Running (nothing to resume)', async () => {
    const project = uniqueSlug()
    patchDirectorStatus(project, { state: 'Running' })
    resumeServerDirector(project)
    // Give the fire-and-forget path a moment to settle, then verify no "Resumed" entry was recorded.
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(historyForProject(project).some(h => h.event === 'Resumed')).toBe(false)
    expect(getDirectorStatus(project).state).toBe('Running')
  })

  it('is a no-op when the project is Idle, and releases the loop lock again afterward', async () => {
    const project = uniqueSlug()
    resumeServerDirector(project)
    await new Promise(resolve => setTimeout(resolve, 50))
    expect(getDirectorStatus(project).state).toBe('Idle')
    // If resumeServerDirector had failed to release the lock on this no-op path, this would return null.
    const owner = acquireLoopOwnership(project)
    expect(owner).not.toBeNull()
    releaseLoopOwnership(project, owner!)
  })

  it('approval flow: resolving the blocking inbox item and resuming clears the waiting state', async () => {
    const project = uniqueSlug()
    planningStateService.createTechnicalDebt(project, {
      title: 'Debt', description: '', priority: 'High', estimatedEffort: '', createdDate: '', resolvedDate: '', status: 'Open',
    })
    startServerDirector(handoff(project, {
      milestones: [milestone({ project })],
      batches: [batch()],
      technicalDebt: [{ title: 'Debt', priority: 'High', relatedBatch: '' }],
    }))
    await waitFor(() => getDirectorStatus(project).state === 'Blocked')

    // Simulate the CEO resolving the underlying issue, then the inbox route's
    // coupled resumeServerDirector call (see app/api/dev/director/inbox/[id]/route.ts).
    saveExecutionSnapshot({
      ...handoff(project, { milestones: [milestone({ project })], batches: [batch({ status: 'Complete' })] }),
      completions: [], handedOffAt: new Date().toISOString(),
    })

    // patchDirectorStatus flips to 'Blocked' synchronously inside pause(),
    // before its own await raiseNotification(...) calls settle — so the
    // original loop may still be holding the loop-ownership lock for a
    // moment after 'Blocked' becomes observable. Retry the resume call
    // (itself a safe no-op whenever it can't win the lock) until it
    // actually lands, rather than assuming a fixed delay.
    await waitFor(() => {
      if (getDirectorStatus(project).state === 'Blocked') resumeServerDirector(project)
      return getDirectorStatus(project).state === 'Completed'
    })
  })
})

describe('Engineering Inbox resolve — only the actual blocker resumes execution (PRA-P1-018)', () => {
  it('isCurrentInboxBlocker is true only for the item recorded as waitingInboxItemId', () => {
    const project = uniqueSlug()
    patchDirectorStatus(project, { state: 'Blocked', waitingInboxItemId: 'the-real-blocker' })

    expect(isCurrentInboxBlocker(project, 'the-real-blocker')).toBe(true)
    expect(isCurrentInboxBlocker(project, 'some-other-item')).toBe(false)
  })

  it('resolving a stale/unrelated Open item for a Blocked project does not resume it — the exact false-approval scenario this finding described', async () => {
    const project = uniqueSlug()
    planningStateService.createTechnicalDebt(project, {
      title: 'Debt', description: '', priority: 'High', estimatedEffort: '', createdDate: '', resolvedDate: '', status: 'Open',
    })
    startServerDirector(handoff(project, {
      milestones: [milestone({ project })],
      batches: [batch()],
      technicalDebt: [{ title: 'Debt', priority: 'High', relatedBatch: '' }],
    }))
    await waitFor(() => getDirectorStatus(project).state === 'Blocked')
    const realBlockerId = getDirectorStatus(project).waitingInboxItemId!
    expect(realBlockerId).toBeTruthy()

    // An unrelated, project-level item for the same project — e.g. a Release
    // Go/Hold notice — coexisting with the real blocker, exactly as PRA-P1-019
    // describes (project-level items are never deduplicated).
    const staleItem = createInboxItem({
      project,
      batchId: null,
      batchNumber: null,
      reasonType: 'Release Go/Hold Required',
      reason: 'Unrelated release awaiting a decision.',
      severity: 'Medium',
      recommendedAction: 'Review the release.',
    })

    // Replicates app/api/dev/director/inbox/[id]/route.ts's exact logic.
    resolveInboxItem(staleItem.id)
    expect(isCurrentInboxBlocker(project, staleItem.id)).toBe(false)
    // The route would NOT call resumeServerDirector here — confirm the project is still genuinely Blocked.
    expect(getDirectorStatus(project).state).toBe('Blocked')
    expect(getDirectorStatus(project).waitingInboxItemId).toBe(realBlockerId)
  })

  it('resolving the actual blocking item still resumes execution as before', async () => {
    const project = uniqueSlug()
    planningStateService.createTechnicalDebt(project, {
      title: 'Debt', description: '', priority: 'High', estimatedEffort: '', createdDate: '', resolvedDate: '', status: 'Open',
    })
    startServerDirector(handoff(project, {
      milestones: [milestone({ project })],
      batches: [batch()],
      technicalDebt: [{ title: 'Debt', priority: 'High', relatedBatch: '' }],
    }))
    await waitFor(() => getDirectorStatus(project).state === 'Blocked')
    const realBlockerId = getDirectorStatus(project).waitingInboxItemId!

    saveExecutionSnapshot({
      ...handoff(project, { milestones: [milestone({ project })], batches: [batch({ status: 'Complete' })] }),
      completions: [], handedOffAt: new Date().toISOString(),
    })

    resolveInboxItem(realBlockerId)
    expect(isCurrentInboxBlocker(project, realBlockerId)).toBe(true)

    await waitFor(() => {
      if (isCurrentInboxBlocker(project, realBlockerId) && getDirectorStatus(project).state === 'Blocked') resumeServerDirector(project)
      return getDirectorStatus(project).state === 'Completed'
    })
  })
})

describe('Engineering Director — Cancel', () => {
  it('cancels unconditionally from Running', () => {
    const project = uniqueSlug()
    patchDirectorStatus(project, { state: 'Running' })
    cancelServerDirector(project)
    expect(getDirectorStatus(project).state).toBe('Cancelled')
  })

  it('cancels unconditionally from Idle (still no guard on non-terminal states)', () => {
    const project = uniqueSlug()
    cancelServerDirector(project)
    expect(getDirectorStatus(project).state).toBe('Cancelled')
    expect(historyForProject(project).some(h => h.event === 'Cancelled by CEO')).toBe(true)
  })

  it('cancels unconditionally from Blocked / Waiting for CEO', () => {
    const project = uniqueSlug()
    patchDirectorStatus(project, { state: 'Blocked' })
    cancelServerDirector(project)
    expect(getDirectorStatus(project).state).toBe('Cancelled')
  })

  // CB-001 (PRA-P1-020) — cancelServerDirector previously had no terminal-state
  // guard at all: a single call could silently regress an already-Completed
  // project back to Cancelled, discarding completedAt/final state.
  describe('Terminal-state guard (CB-001 / PRA-P1-020)', () => {
    it('rejects cancelling an already-Completed project with an explicit DirectorLifecycleError, never mutating state', () => {
      const project = uniqueSlug()
      const completedAt = new Date().toISOString()
      patchDirectorStatus(project, { state: 'Completed', completedAt })

      expect(() => cancelServerDirector(project)).toThrow(DirectorLifecycleError)

      const status = getDirectorStatus(project)
      expect(status.state).toBe('Completed')
      expect(status.completedAt).toBe(completedAt)
      expect(historyForProject(project).some(h => h.event === 'Cancelled by CEO')).toBe(false)
    })

    it('repeated cancellation attempts against a Completed project keep failing the same way (no partial mutation on retry)', () => {
      const project = uniqueSlug()
      patchDirectorStatus(project, { state: 'Completed', completedAt: new Date().toISOString() })

      expect(() => cancelServerDirector(project)).toThrow(DirectorLifecycleError)
      expect(() => cancelServerDirector(project)).toThrow(DirectorLifecycleError)
      expect(() => cancelServerDirector(project)).toThrow(DirectorLifecycleError)

      expect(getDirectorStatus(project).state).toBe('Completed')
    })

    it('cancelling an already-Cancelled project is an idempotent no-op, not an error', () => {
      const project = uniqueSlug()
      patchDirectorStatus(project, { state: 'Cancelled' })

      expect(() => cancelServerDirector(project)).not.toThrow()
      expect(() => cancelServerDirector(project)).not.toThrow()

      expect(getDirectorStatus(project).state).toBe('Cancelled')
      // The idempotent no-op path never re-appends history — only the
      // original transition into Cancelled (seeded directly here via
      // patchDirectorStatus) would have, and this test never took that path.
      expect(historyForProject(project).filter(h => h.event === 'Cancelled by CEO')).toHaveLength(0)
    })

    it('a genuine Running -> Cancelled -> repeated-cancel sequence stays idempotent end-to-end', () => {
      const project = uniqueSlug()
      patchDirectorStatus(project, { state: 'Running' })

      cancelServerDirector(project)
      expect(getDirectorStatus(project).state).toBe('Cancelled')
      expect(historyForProject(project).filter(h => h.event === 'Cancelled by CEO')).toHaveLength(1)

      // Retrying the same cancel call (e.g. a client double-submit) must not throw and must not double-record.
      expect(() => cancelServerDirector(project)).not.toThrow()
      expect(getDirectorStatus(project).state).toBe('Cancelled')
      expect(historyForProject(project).filter(h => h.event === 'Cancelled by CEO')).toHaveLength(1)
    })
  })
})

describe('Engineering Director — Locking (concurrent handoff/resume requests)', () => {
  it('concurrent handoff requests for the same project: only the winner performs setup, the loser is a pure no-op', async () => {
    const project = uniqueSlug()
    const h = handoff(project, { milestones: [milestone({ project })], batches: [batch({ status: 'Complete' })] })

    startServerDirector(h)
    startServerDirector(h) // fired immediately after — should lose the lock and do nothing

    await waitFor(() => getDirectorStatus(project).state === 'Completed')
    expect(historyForProject(project).filter(e => e.event === 'Autonomous development started')).toHaveLength(1)
  })

  it('concurrent resume requests for the same project: only one "Resumed" history entry is ever recorded', async () => {
    const project = uniqueSlug()
    patchDirectorStatus(project, { state: 'Blocked' })
    saveExecutionSnapshot({
      ...handoff(project, { milestones: [milestone({ project })], batches: [batch({ status: 'Complete' })] }),
      completions: [], handedOffAt: new Date().toISOString(),
    })

    resumeServerDirector(project)
    resumeServerDirector(project)

    await waitFor(() => getDirectorStatus(project).state === 'Completed')
    expect(historyForProject(project).filter(e => e.event === 'Resumed')).toHaveLength(1)
  })
})
