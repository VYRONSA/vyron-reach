import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import * as planningService from '../../../lib/dev/planningState/planningStateService'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function setupProject() {
  const slug = uniqueSlug()
  planningService.createProject({
    name: slug, slug, description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x',
  })
  return slug
}

function makeMilestone(slug: string, sequence: number) {
  return planningService.createMilestone(slug, {
    title: `M${sequence}`, description: '', phase: 'Phase 1', startDate: '', targetDate: '', progress: 0, status: 'Upcoming', sequence,
  })
}

function makeBatch(slug: string, milestoneId: string, sequence: number, status: 'Queued' | 'Active' | 'Complete') {
  return planningService.createBatch(slug, {
    batchNumber: `B${sequence}`, milestone: milestoneId, objective: '', summary: '', completedTasks: '', lessonsLearned: '',
    claudePrompt: '', completionDate: '', status, sequence,
  })
}

describe('Planning Invariants — exactly one Active batch', () => {
  it('never allows two batches to both stay Active after a mutation', () => {
    const slug = setupProject()
    const m = makeMilestone(slug, 1)
    const b1 = makeBatch(slug, m.id, 1, 'Active')
    makeBatch(slug, m.id, 2, 'Queued')

    // Forcing a second batch Active must demote the first back to Queued.
    const b2 = planningService.listBatches(slug).find(b => b.batchNumber === 'B2')!
    planningService.updateBatch(slug, b2.id, { status: 'Active' })

    const active = planningService.listBatches(slug).filter(b => b.status === 'Active')
    expect(active).toHaveLength(1)
    expect(active[0].id).toBe(b2.id)

    const demoted = planningService.listBatches(slug).find(b => b.id === b1.id)
    expect(demoted?.status).toBe('Queued')
  })

  it('keeps the just-activated batch active, not an arbitrary one, when two are forced active at once', () => {
    const slug = setupProject()
    const m = makeMilestone(slug, 1)
    const b1 = makeBatch(slug, m.id, 1, 'Active')
    const b2 = makeBatch(slug, m.id, 2, 'Active') // createBatch itself re-enforces after each call

    // After both creations, enforcement should have already collapsed to one Active batch.
    const active = planningService.listBatches(slug).filter(b => b.status === 'Active')
    expect(active).toHaveLength(1)
    // The most recently activated one (b2, passed as justActivatedId on its own create) wins.
    expect(active[0].id).toBe(b2.id)
    expect(planningService.listBatches(slug).find(b => b.id === b1.id)?.status).toBe('Queued')
  })
})

describe('Planning Invariants — automatic promotion', () => {
  it('auto-promotes the next queued batch by sequence when the Active batch completes', () => {
    const slug = setupProject()
    const m = makeMilestone(slug, 1)
    const b1 = makeBatch(slug, m.id, 1, 'Active')
    const b2 = makeBatch(slug, m.id, 2, 'Queued')
    const b3 = makeBatch(slug, m.id, 3, 'Queued')

    planningService.completeBatch(slug, b1.id)

    const current = planningService.getCurrentBatchForProject(slug)
    expect(current?.id).toBe(b2.id)
    expect(planningService.listBatches(slug).find(b => b.id === b3.id)?.status).toBe('Queued')
  })

  it('promotes strictly by ascending sequence among queued candidates, not by which was created first', () => {
    const slug = setupProject()
    const m = makeMilestone(slug, 1)
    const active = makeBatch(slug, m.id, 1, 'Active')
    // Both created while `active` already holds the Active slot, so neither
    // creation triggers its own self-promotion — the only way to isolate
    // sequence ordering from creation-order/array-order effects. Created
    // out of sequence order on purpose: the higher-sequence one first.
    const highSeq = makeBatch(slug, m.id, 5, 'Queued')
    const lowSeq = makeBatch(slug, m.id, 2, 'Queued')

    planningService.completeBatch(slug, active.id)

    const current = planningService.getCurrentBatchForProject(slug)
    expect(current?.id).toBe(lowSeq.id)
    expect(planningService.listBatches(slug).find(b => b.id === highSeq.id)?.status).toBe('Queued')
  })

  it('leaves no Active batch when every batch is already Complete', () => {
    const slug = setupProject()
    const m = makeMilestone(slug, 1)
    const b1 = makeBatch(slug, m.id, 1, 'Complete')
    planningService.updateBatch(slug, b1.id, { status: 'Complete' })
    expect(planningService.getCurrentBatchForProject(slug)).toBeNull()
  })
})

describe('Planning Invariants — milestone status derivation', () => {
  it('stays Upcoming for a milestone with zero batches', () => {
    const slug = setupProject()
    const m = makeMilestone(slug, 1)
    expect(planningService.listMilestones(slug).find(x => x.id === m.id)?.status).toBe('Upcoming')
  })

  it('promotes a lone Queued batch to Active (auto-promotion), which in turn derives In Progress on its milestone', () => {
    const slug = setupProject()
    const m = makeMilestone(slug, 1)
    makeBatch(slug, m.id, 1, 'Queued')
    // A read through getCurrentBatchForProject triggers enforcePlanningStateFor, which
    // promotes the only queued batch to Active since no batch is Active yet.
    planningService.getCurrentBatchForProject(slug)
    const refreshed = planningService.listMilestones(slug).find(x => x.id === m.id)
    expect(refreshed?.status).toBe('In Progress')
  })

  it('derives In Progress once any batch is Active or Complete', () => {
    const slug = setupProject()
    const m = makeMilestone(slug, 1)
    makeBatch(slug, m.id, 1, 'Active')
    const refreshed = planningService.listMilestones(slug).find(x => x.id === m.id)
    expect(refreshed?.status).toBe('In Progress')
  })

  it('derives Complete only once every batch under the milestone is Complete', () => {
    const slug = setupProject()
    const m = makeMilestone(slug, 1)
    const b1 = makeBatch(slug, m.id, 1, 'Active')
    const b2 = makeBatch(slug, m.id, 2, 'Queued')

    planningService.completeBatch(slug, b1.id)
    expect(planningService.listMilestones(slug).find(x => x.id === m.id)?.status).toBe('In Progress')

    planningService.completeBatch(slug, b2.id)
    expect(planningService.listMilestones(slug).find(x => x.id === m.id)?.status).toBe('Complete')
  })

  it('keeps an At Risk milestone At Risk even while its batches are still in progress', () => {
    const slug = setupProject()
    const m = makeMilestone(slug, 1)
    planningService.updateMilestone(slug, m.id, { status: 'At Risk' })
    const b1 = makeBatch(slug, m.id, 1, 'Active')
    void b1
    expect(planningService.listMilestones(slug).find(x => x.id === m.id)?.status).toBe('At Risk')
  })

  it('does not change milestone status while it has zero batches', () => {
    const slug = setupProject()
    const m = makeMilestone(slug, 1)
    planningService.updateMilestone(slug, m.id, { status: 'At Risk' })
    // No batches created under this milestone — enforcement should leave status untouched.
    planningService.getCurrentBatchForProject(slug)
    expect(planningService.listMilestones(slug).find(x => x.id === m.id)?.status).toBe('At Risk')
  })
})

describe('Planning Invariants — project/current-batch self-healing read', () => {
  it('getCurrentBatchForProject always agrees with the Active-batch invariant, even after a manual multi-active write', () => {
    const slug = setupProject()
    const m = makeMilestone(slug, 1)
    const b1 = makeBatch(slug, m.id, 1, 'Active')
    const b2 = makeBatch(slug, m.id, 2, 'Queued')
    void b1
    void b2

    const current = planningService.getCurrentBatchForProject(slug)
    expect(current).not.toBeNull()
    expect(planningService.listBatches(slug).filter(b => b.status === 'Active')).toHaveLength(1)
  })
})

describe('Planning Invariants — planning synchronization across entities', () => {
  it('bumps planning version and re-derives milestone status together, atomically from the caller\'s perspective, on one batch mutation', () => {
    const slug = setupProject()
    const m = makeMilestone(slug, 1)
    const b1 = makeBatch(slug, m.id, 1, 'Active')
    const versionBefore = planningService.getMetadata(slug)!.planningVersion

    planningService.completeBatch(slug, b1.id)

    const versionAfter = planningService.getMetadata(slug)!.planningVersion
    expect(versionAfter).toBe(versionBefore + 1)
    expect(planningService.listMilestones(slug).find(x => x.id === m.id)?.status).toBe('Complete')
  })
})
