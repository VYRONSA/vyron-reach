import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { createWorkforceTask, recordWorkforceTaskCompletion, queryWorkforceTasks } from '../../../lib/dev/director/workforce/workforceTaskStore'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function task(project: string, role: 'Backend Engineer' | 'Frontend Engineer' = 'Backend Engineer') {
  return createWorkforceTask({
    project,
    phase: 'Phase 1',
    milestoneId: null,
    batchId: 'batch-1',
    requiredRole: role,
    executionContextVersion: 'v1',
    knowledgeVersion: 'v1',
    planningVersion: 1,
    dnaVersion: 'v1',
  })
}

describe('Worker History — pagination, filtering, search', () => {
  it('paginates and filters by role and completion', () => {
    const project = uniqueSlug()
    for (let i = 0; i < 6; i++) task(project, i % 2 === 0 ? 'Backend Engineer' : 'Frontend Engineer')
    const t = task(project, 'Backend Engineer')
    recordWorkforceTaskCompletion(t.id, { created: [], modified: [], deleted: [] })

    const page = queryWorkforceTasks(project, {}, { pageSize: 3 })
    expect(page.items).toHaveLength(3)
    expect(page.total).toBe(7)
    expect(queryWorkforceTasks(project, { role: 'Backend Engineer' }).total).toBe(4)
    expect(queryWorkforceTasks(project, { completed: true }).total).toBe(1)
    expect(queryWorkforceTasks(project, { completed: false }).total).toBe(6)
  })

  it('searches by role/phase/batch', () => {
    const project = uniqueSlug()
    task(project, 'Backend Engineer')
    task(project, 'Frontend Engineer')
    expect(queryWorkforceTasks(project, { search: 'frontend' }).total).toBe(1)
  })
})
