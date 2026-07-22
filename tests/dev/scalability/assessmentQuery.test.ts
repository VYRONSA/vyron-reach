import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { runAssessment } from '../../../lib/dev/director/assessment/assessmentService'
import { queryAssessmentHistory } from '../../../lib/dev/director/assessment/assessmentStore'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

describe('Assessment History — pagination and filtering', () => {
  it('paginates a project\'s assessment history', () => {
    const project = uniqueSlug()
    planningStateService.createProject({ name: project, slug: project, description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x' })

    runAssessment(project) // first run is always "changed", appends one entry
    for (let i = 0; i < 3; i++) {
      planningStateService.createRisk(project, { title: `R${i}`, description: '', severity: 'High', probability: 'Medium', mitigation: '', owner: '', status: 'Open' })
      runAssessment(project) // each new High risk changes the computed assessment, appending again
    }

    const page = queryAssessmentHistory(project, {}, { pageSize: 2 })
    expect(page.items.length).toBeGreaterThan(0)
    expect(page.items.length).toBeLessThanOrEqual(2)
    expect(page.total).toBeGreaterThanOrEqual(2)
  })

  it('filters by engineering health', () => {
    const project = uniqueSlug()
    planningStateService.createProject({ name: project, slug: project, description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x' })
    runAssessment(project)
    const healthy = queryAssessmentHistory(project, { health: 'Healthy' })
    const critical = queryAssessmentHistory(project, { health: 'Critical' })
    expect(healthy.total + critical.total).toBeLessThanOrEqual(queryAssessmentHistory(project).total)
  })
})
