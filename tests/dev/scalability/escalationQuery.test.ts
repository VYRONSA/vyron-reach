import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { startMonitoring, closeEscalation, queryEscalationStates, archiveClosedEscalations, queryArchivedEscalations } from '../../../lib/dev/escalation/escalationStateStore'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

describe('Escalation History — pagination and filtering', () => {
  it('paginates and filters by project/status', () => {
    const project = uniqueSlug()
    const now = '2026-01-01T00:00:00.000Z'
    for (let i = 0; i < 4; i++) startMonitoring(`item-${i}`, project, 'default', now)
    closeEscalation('item-0', 'Resolved', now)

    const page = queryEscalationStates({ project }, { pageSize: 2 })
    expect(page.items).toHaveLength(2)
    expect(page.total).toBe(4)
    expect(queryEscalationStates({ project, status: 'Monitoring' }).total).toBe(3)
    expect(queryEscalationStates({ project, status: 'Resolved' }).total).toBe(1)
  })
})

describe('Escalation History — archiving and retention', () => {
  it('never archives a Monitoring escalation regardless of age', () => {
    const project = uniqueSlug()
    startMonitoring('item-1', project, 'default', '2020-01-01T00:00:00.000Z')
    const result = archiveClosedEscalations('2099-01-01T00:00:00.000Z', { maxAgeMs: 0, maxLiveCount: null })
    expect(result.archived).toBe(0)
  })

  it('archives Resolved/Cancelled escalations past retention, and they remain queryable', () => {
    const project = uniqueSlug()
    startMonitoring('item-1', project, 'default', '2020-01-01T00:00:00.000Z')
    closeEscalation('item-1', 'Resolved', '2020-01-02T00:00:00.000Z')

    const result = archiveClosedEscalations('2099-01-01T00:00:00.000Z', { maxAgeMs: 0, maxLiveCount: null })
    expect(result.archived).toBe(1)
    expect(queryEscalationStates({ project }).total).toBe(0)
    expect(queryArchivedEscalations(project).total).toBe(1)
  })
})
