import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function seedProject(project: string) {
  planningStateService.createProject({ name: project, slug: project, description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x' })
}

describe('Planning History — Decisions', () => {
  it('paginates, filters by status, and searches', () => {
    const project = uniqueSlug()
    seedProject(project)
    for (let i = 0; i < 10; i++) {
      planningStateService.createDecision(project, { decision: `Use approach ${i}`, reason: 'because', alternatives: '', approvedDate: '2026-01-01', status: i % 2 === 0 ? 'Approved' : 'Proposed' })
    }
    const page = planningStateService.queryDecisions(project, {}, { pageSize: 4 })
    expect(page.items).toHaveLength(4)
    expect(page.total).toBe(10)
    expect(planningStateService.queryDecisions(project, { status: 'Approved' }).total).toBe(5)
    expect(planningStateService.queryDecisions(project, { search: 'approach 3' }).total).toBe(1)
  })
})

describe('Planning History — Risks', () => {
  it('filters by severity and status', () => {
    const project = uniqueSlug()
    seedProject(project)
    planningStateService.createRisk(project, { title: 'R1', description: 'x', severity: 'High', probability: 'Medium', mitigation: '', owner: '', status: 'Open' })
    planningStateService.createRisk(project, { title: 'R2', description: 'x', severity: 'Low', probability: 'Low', mitigation: '', owner: '', status: 'Mitigated' })
    expect(planningStateService.queryRisks(project, { severity: 'High' }).total).toBe(1)
    expect(planningStateService.queryRisks(project, { status: 'Open' }).total).toBe(1)
  })
})

describe('Planning History — Technical Debt', () => {
  it('filters by priority and status', () => {
    const project = uniqueSlug()
    seedProject(project)
    planningStateService.createTechnicalDebt(project, { title: 'D1', description: 'x', priority: 'High', estimatedEffort: '1d', createdDate: '2026-01-01', resolvedDate: '', status: 'Open' })
    planningStateService.createTechnicalDebt(project, { title: 'D2', description: 'x', priority: 'Low', estimatedEffort: '1d', createdDate: '2026-01-01', resolvedDate: '', status: 'Resolved' })
    expect(planningStateService.queryTechnicalDebt(project, { priority: 'High' }).total).toBe(1)
    expect(planningStateService.queryTechnicalDebt(project, { status: 'Resolved' }).total).toBe(1)
    expect(planningStateService.queryTechnicalDebt(project, { search: 'D1' }).total).toBe(1)
  })
})
