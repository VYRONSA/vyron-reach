import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import * as planningService from '../../../lib/dev/planningState/planningStateService'
import { importFromLocalStorage } from '../../../lib/dev/planningState/planningStateMigration'
import { getMigrationStatus } from '../../../lib/dev/planningState/planningStateStore'
import type { PlanningMigrationPayload } from '../../../lib/dev/planningState/planningStateTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function projectInput(slug: string) {
  return {
    name: `Project ${slug}`,
    slug,
    description: 'A test project',
    category: 'test',
    status: 'active' as const,
    progress: 0,
    color: '#000000',
    icon: 'rocket',
  }
}

describe('Planning Service — Project CRUD', () => {
  it('creates a project and can read it back', () => {
    const slug = uniqueSlug()
    const created = planningService.createProject(projectInput(slug))
    expect(created.slug).toBe(slug)
    expect(planningService.getProject(slug)).toEqual(created)
    expect(planningService.listProjects().map(p => p.slug)).toContain(slug)
  })

  it('reports slug availability correctly', () => {
    const slug = uniqueSlug()
    expect(planningService.isProjectSlugTaken(slug)).toBe(false)
    planningService.createProject(projectInput(slug))
    expect(planningService.isProjectSlugTaken(slug)).toBe(true)
  })

  it('updates a project and preserves untouched fields', () => {
    const slug = uniqueSlug()
    planningService.createProject(projectInput(slug))
    const updated = planningService.updateProject(slug, { status: 'paused', progress: 40 })
    expect(updated?.status).toBe('paused')
    expect(updated?.progress).toBe(40)
    expect(updated?.name).toBe(`Project ${slug}`)
  })

  it('returns null when updating a project that does not exist', () => {
    expect(planningService.updateProject(uniqueSlug('missing'), { status: 'paused' })).toBeNull()
  })

  it('returns null for getProject on an unknown slug', () => {
    expect(planningService.getProject(uniqueSlug('missing'))).toBeNull()
  })
})

describe('Planning Service — Milestone CRUD', () => {
  it('creates, updates, archives, restores, and deletes a milestone', () => {
    const slug = uniqueSlug()
    planningService.createProject(projectInput(slug))

    const milestone = planningService.createMilestone(slug, {
      title: 'Phase 1',
      description: 'desc',
      phase: 'Phase 1',
      startDate: '2026-01-01',
      targetDate: '2026-02-01',
      progress: 0,
      status: 'Upcoming',
    })
    expect(planningService.listMilestones(slug).map(m => m.id)).toContain(milestone.id)

    const updated = planningService.updateMilestone(slug, milestone.id, { title: 'Phase 1 — renamed' })
    expect(updated?.title).toBe('Phase 1 — renamed')

    const archived = planningService.archiveMilestone(slug, milestone.id)
    expect(archived?.archived).toBe(true)

    const restored = planningService.restoreMilestone(slug, milestone.id)
    expect(restored?.archived).toBe(false)

    planningService.deleteMilestone(slug, milestone.id)
    expect(planningService.listMilestones(slug).map(m => m.id)).not.toContain(milestone.id)
  })

  it('returns null when updating an unknown milestone id', () => {
    const slug = uniqueSlug()
    planningService.createProject(projectInput(slug))
    expect(planningService.updateMilestone(slug, 'no-such-id', { title: 'x' })).toBeNull()
  })
})

describe('Planning Service — Batch CRUD', () => {
  function batchInput(milestoneId: string, overrides: Partial<planningService.PlanningBatchInput> = {}) {
    return {
      batchNumber: 'B1',
      milestone: milestoneId,
      objective: 'Ship it',
      summary: '',
      completedTasks: '',
      lessonsLearned: '',
      claudePrompt: '',
      completionDate: '',
      status: 'Queued' as const,
      ...overrides,
    }
  }

  it('creates, updates, completes, archives, restores, and deletes a batch', () => {
    const slug = uniqueSlug()
    planningService.createProject(projectInput(slug))
    const milestone = planningService.createMilestone(slug, {
      title: 'M1',
      description: '',
      phase: 'Phase 1',
      startDate: '',
      targetDate: '',
      progress: 0,
      status: 'Upcoming',
    })

    const batch = planningService.createBatch(slug, batchInput(milestone.id))
    expect(planningService.listBatches(slug).map(b => b.id)).toContain(batch.id)
    expect(planningService.batchesForMilestone(slug, milestone.id).map(b => b.id)).toContain(batch.id)

    const updated = planningService.updateBatch(slug, batch.id, { objective: 'Ship it faster' })
    expect(updated?.objective).toBe('Ship it faster')

    const archived = planningService.archiveBatch(slug, batch.id)
    expect(archived?.archived).toBe(true)
    const restored = planningService.restoreBatch(slug, batch.id)
    expect(restored?.archived).toBe(false)

    const completed = planningService.completeBatch(slug, batch.id)
    expect(completed?.status).toBe('Complete')
    expect(completed?.completionDate).toBeTruthy()

    planningService.deleteBatch(slug, batch.id)
    expect(planningService.listBatches(slug).map(b => b.id)).not.toContain(batch.id)
  })

  it('stamps completionDate automatically when a status update marks a batch Complete without one', () => {
    const slug = uniqueSlug()
    planningService.createProject(projectInput(slug))
    const batch = planningService.createBatch(slug, batchInput(''))
    const updated = planningService.updateBatch(slug, batch.id, { status: 'Complete' })
    expect(updated?.completionDate).toBeTruthy()
  })

  it('returns null when updating a batch that does not exist', () => {
    const slug = uniqueSlug()
    planningService.createProject(projectInput(slug))
    expect(planningService.updateBatch(slug, 'no-such-id', { objective: 'x' })).toBeNull()
  })
})

describe('Planning Service — Decision / Risk / Technical Debt CRUD', () => {
  it('supports full Decision CRUD', () => {
    const slug = uniqueSlug()
    planningService.createProject(projectInput(slug))
    const decision = planningService.createDecision(slug, {
      decision: 'Use Postgres',
      reason: 'Because',
      alternatives: 'MySQL',
      approvedDate: '2026-01-01',
      status: 'Proposed',
    })
    expect(planningService.listDecisions(slug).map(d => d.id)).toContain(decision.id)

    const updated = planningService.updateDecision(slug, decision.id, { status: 'Approved' })
    expect(updated?.status).toBe('Approved')

    expect(planningService.updateDecision(slug, 'missing', { status: 'Rejected' })).toBeNull()

    planningService.deleteDecision(slug, decision.id)
    expect(planningService.listDecisions(slug).map(d => d.id)).not.toContain(decision.id)
  })

  it('supports full Risk CRUD', () => {
    const slug = uniqueSlug()
    planningService.createProject(projectInput(slug))
    const risk = planningService.createRisk(slug, {
      title: 'Vendor lock-in',
      description: 'desc',
      severity: 'High',
      probability: 'Medium',
      mitigation: 'diversify',
      owner: 'CTO',
      status: 'Open',
    })
    expect(planningService.listRisks(slug).map(r => r.id)).toContain(risk.id)

    const updated = planningService.updateRisk(slug, risk.id, { status: 'Mitigated' })
    expect(updated?.status).toBe('Mitigated')

    expect(planningService.updateRisk(slug, 'missing', { status: 'Closed' })).toBeNull()

    planningService.deleteRisk(slug, risk.id)
    expect(planningService.listRisks(slug).map(r => r.id)).not.toContain(risk.id)
  })

  it('supports full Technical Debt CRUD', () => {
    const slug = uniqueSlug()
    planningService.createProject(projectInput(slug))
    const debt = planningService.createTechnicalDebt(slug, {
      title: 'No test suite',
      description: 'desc',
      priority: 'High',
      estimatedEffort: '2w',
      createdDate: '2026-01-01',
      resolvedDate: '',
      status: 'Open',
    })
    expect(planningService.listTechnicalDebt(slug).map(d => d.id)).toContain(debt.id)

    const updated = planningService.updateTechnicalDebt(slug, debt.id, { status: 'Resolved' })
    expect(updated?.status).toBe('Resolved')

    expect(planningService.updateTechnicalDebt(slug, 'missing', { status: 'Open' })).toBeNull()

    planningService.deleteTechnicalDebt(slug, debt.id)
    expect(planningService.listTechnicalDebt(slug).map(d => d.id)).not.toContain(debt.id)
  })
})

describe('Planning Service — Roadmap CRUD', () => {
  it('adds, updates, and deletes roadmap and upcoming items independently', () => {
    const slug = uniqueSlug()
    planningService.createProject(projectInput(slug))

    const roadmapItem = planningService.addRoadmapItem(slug, 'roadmap', { title: 'Q3 goal', detail: 'Q3 2026', status: 'Planned' })
    const upcomingItem = planningService.addRoadmapItem(slug, 'upcoming', { title: 'Next up', detail: '', status: 'Next' })

    const lists = planningService.getRoadmapLists(slug)
    expect(lists.roadmap.map(i => i.id)).toContain(roadmapItem.id)
    expect(lists.upcoming.map(i => i.id)).toContain(upcomingItem.id)

    const updated = planningService.updateRoadmapItem(slug, 'roadmap', roadmapItem.id, { status: 'Done' })
    expect(updated?.status).toBe('Done')
    // The 'upcoming' list must be untouched by a 'roadmap' mutation.
    expect(planningService.getRoadmapLists(slug).upcoming.map(i => i.id)).toContain(upcomingItem.id)

    planningService.deleteRoadmapItem(slug, 'roadmap', roadmapItem.id)
    expect(planningService.getRoadmapLists(slug).roadmap.map(i => i.id)).not.toContain(roadmapItem.id)
  })
})

describe('Planning Service — Dependency CRUD', () => {
  it('adds, lists, and removes dependency edges scoped to a project', () => {
    const slug = uniqueSlug()
    planningService.createProject(projectInput(slug))
    const dep = planningService.addDependency(slug, { fromType: 'milestone', fromId: 'm1', toType: 'milestone', toId: 'm2', note: 'blocks' })
    expect(planningService.listDependencies(slug).map(d => d.id)).toContain(dep.id)
    expect(dep.project).toBe(slug)

    planningService.removeDependency(slug, dep.id)
    expect(planningService.listDependencies(slug).map(d => d.id)).not.toContain(dep.id)
  })
})

describe('Planning Service — Planning Version', () => {
  it('starts a new project at version 0 and increments by exactly one per mutating call', () => {
    const slug = uniqueSlug()
    planningService.createProject(projectInput(slug))
    const afterCreate = planningService.getMetadata(slug)
    expect(afterCreate?.planningVersion).toBe(1) // createProject itself bumps once, after seeding metadata at 0

    planningService.updateProject(slug, { progress: 10 })
    expect(planningService.getMetadata(slug)?.planningVersion).toBe(2)

    const milestone = planningService.createMilestone(slug, {
      title: 'M', description: '', phase: 'P', startDate: '', targetDate: '', progress: 0, status: 'Upcoming',
    })
    expect(planningService.getMetadata(slug)?.planningVersion).toBe(3)

    planningService.deleteMilestone(slug, milestone.id)
    expect(planningService.getMetadata(slug)?.planningVersion).toBe(4)
  })

  it('does not bump the version for a no-op update against an unknown id', () => {
    const slug = uniqueSlug()
    planningService.createProject(projectInput(slug))
    const before = planningService.getMetadata(slug)?.planningVersion
    planningService.updateMilestone(slug, 'does-not-exist', { title: 'x' })
    expect(planningService.getMetadata(slug)?.planningVersion).toBe(before)
  })

  it('keeps each project on its own independent planning version', () => {
    const slugA = uniqueSlug('a')
    const slugB = uniqueSlug('b')
    planningService.createProject(projectInput(slugA))
    planningService.createProject(projectInput(slugB))
    planningService.updateProject(slugA, { progress: 5 })
    expect(planningService.getMetadata(slugA)?.planningVersion).toBe(2)
    expect(planningService.getMetadata(slugB)?.planningVersion).toBe(1)
  })
})

describe('Planning Service — Migration status', () => {
  it('reports unmigrated by default', () => {
    expect(getMigrationStatus()).toEqual({ migrated: false, migratedAt: null })
  })

  it('imports a payload exactly once and marks migration complete', () => {
    const slug = uniqueSlug('migrated')
    const payload: PlanningMigrationPayload = {
      projects: [{ ...projectInput(slug), tagline: '', archived: false, lastUpdated: '2026-01-01', notes: '', recentActivity: [], createdAt: '2026-01-01' }],
      milestones: [],
      batches: [],
      decisions: [],
      risks: [],
      technicalDebt: [],
      projectLists: [],
    }
    const result = importFromLocalStorage(payload)
    expect(result.imported).toBe(true)
    expect(result.projectsImported).toContain(slug)
    expect(getMigrationStatus().migrated).toBe(true)
    expect(planningService.getProject(slug)).not.toBeNull()

    // Idempotent: calling again must not re-import or duplicate data.
    const second = importFromLocalStorage(payload)
    expect(second.imported).toBe(false)
  })

  it('silently drops entities referencing a project slug that is not part of the payload', () => {
    const knownSlug = uniqueSlug('known')
    const payload: PlanningMigrationPayload = {
      projects: [{ ...projectInput(knownSlug), tagline: '', archived: false, lastUpdated: '2026-01-01', notes: '', recentActivity: [], createdAt: '2026-01-01' }],
      milestones: [
        { id: 'm-orphan', project: 'unknown-project', title: 'orphan', description: '', phase: '', startDate: '', targetDate: '', progress: 0, status: 'Upcoming', archived: false, sequence: 1, createdAt: '', updatedAt: '' },
      ],
      batches: [],
      decisions: [],
      risks: [],
      technicalDebt: [],
      projectLists: [],
    }
    importFromLocalStorage(payload)
    expect(planningService.listMilestones('unknown-project')).toEqual([])
  })
})
