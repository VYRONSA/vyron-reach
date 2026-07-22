import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { recordTimelineEvent, recordHandover, queryTimeline } from '../../../lib/dev/knowledge/knowledgeService'
import { queryKnowledgeRecords } from '../../../lib/dev/knowledge/knowledgeStore'
import type { HandoverRecord } from '../../../lib/dev/knowledge/knowledgeTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

describe('Knowledge Service — Timeline pagination, filtering, search', () => {
  it('paginates a project\'s timeline', () => {
    const project = uniqueSlug()
    for (let i = 0; i < 15; i++) recordTimelineEvent({ project, category: 'Handover', title: `event ${i}`, detail: 'x' })
    const page = queryTimeline(project, {}, { pageSize: 10 })
    expect(page.items).toHaveLength(10)
    expect(page.total).toBe(15)
  })

  it('filters by date range', () => {
    const project = uniqueSlug()
    recordTimelineEvent({ project, category: 'Handover', title: 'x', detail: 'x' })
    const future = queryTimeline(project, { dateRange: { from: '2099-01-01T00:00:00.000Z' } })
    expect(future.total).toBe(0)
  })

  it('searches timeline title/detail text', () => {
    const project = uniqueSlug()
    recordTimelineEvent({ project, category: 'Handover', title: 'Payments integration handover', detail: 'x' })
    recordTimelineEvent({ project, category: 'Handover', title: 'Auth service handover', detail: 'x' })
    expect(queryTimeline(project, { search: 'payments' }).items).toHaveLength(1)
  })

  it('never loses or truncates records — permanent, never capped/archived', () => {
    const project = uniqueSlug()
    for (let i = 0; i < 50; i++) recordTimelineEvent({ project, category: 'Handover', title: `x${i}`, detail: 'x' })
    expect(queryTimeline(project, {}, { pageSize: 1000 }).total).toBe(50)
  })
})

describe('Knowledge Service — generic domain query (Knowledge History)', () => {
  it('paginates/searches any Knowledge domain, e.g. handovers', () => {
    const project = uniqueSlug()
    for (let i = 0; i < 5; i++) {
      recordHandover({
        project,
        phase: 'Phase 1',
        objective: `objective-${i}`,
        executiveSummary: 'summary',
        filesCreated: [],
        filesModified: [],
        filesDeleted: [],
        buildStatus: 'Passing',
        typescriptStatus: 'Passing',
      })
    }
    const page = queryKnowledgeRecords<HandoverRecord>('handovers', project, {}, { pageSize: 2 }, r => r.objective)
    expect(page.items).toHaveLength(2)
    expect(page.total).toBe(5)

    const searched = queryKnowledgeRecords<HandoverRecord>('handovers', project, { search: 'objective-3' }, {}, r => r.objective)
    expect(searched.total).toBe(1)
  })
})
