import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { createInboxItem, resolveInboxItem, queryInboxItems, archiveClosedInboxItems, queryArchivedInboxItems } from '../../../lib/dev/director/engineeringInboxStore'
import type { CreateInboxItemInput } from '../../../lib/dev/director/engineeringInboxStore'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function item(project: string, overrides: Partial<CreateInboxItemInput> = {}) {
  return createInboxItem({
    project,
    batchId: null,
    batchNumber: null,
    reasonType: 'Approval Required',
    severity: 'High',
    reason: 'Needs sign-off on payments integration',
    recommendedAction: 'Review the diff',
    ...overrides,
  })
}

describe('Engineering Inbox — pagination', () => {
  it('never returns more than pageSize items even with a large backlog', () => {
    const project = uniqueSlug()
    for (let i = 0; i < 30; i++) item(project, { reason: `item ${i}` })
    const page = queryInboxItems({ project }, { page: 1, pageSize: 10 })
    expect(page.items).toHaveLength(10)
    expect(page.total).toBe(30)
    expect(page.totalPages).toBe(3)
  })
})

describe('Engineering Inbox — filtering', () => {
  it('filters by project, status, severity, and reasonType', () => {
    const project = uniqueSlug()
    const other = uniqueSlug()
    item(project, { severity: 'Critical', reasonType: 'Security Review' })
    item(project, { severity: 'Low', reasonType: 'Approval Required' })
    item(other, { severity: 'Critical' })

    expect(queryInboxItems({ project }).total).toBe(2)
    expect(queryInboxItems({ project, severity: 'Critical' }).total).toBe(1)
    expect(queryInboxItems({ project, reasonType: 'Security Review' }).total).toBe(1)
  })

  it('filters by status after resolution', () => {
    const project = uniqueSlug()
    const a = item(project)
    item(project)
    resolveInboxItem(a.id)
    expect(queryInboxItems({ project, status: 'Resolved' }).total).toBe(1)
    expect(queryInboxItems({ project, status: 'Open' }).total).toBe(1)
  })
})

describe('Engineering Inbox — search', () => {
  it('finds items by reason/recommendedAction text', () => {
    const project = uniqueSlug()
    item(project, { reason: 'Build failing on payments service' })
    item(project, { reason: 'Unrelated security concern' })
    const results = queryInboxItems({ project, search: 'payments' })
    expect(results.items).toHaveLength(1)
  })
})

describe('Engineering Inbox — archiving and retention', () => {
  it('never archives an Open item regardless of age', () => {
    const project = uniqueSlug()
    item(project)
    const result = archiveClosedInboxItems('2099-01-01T00:00:00.000Z', { maxAgeMs: 0, maxLiveCount: null })
    expect(result.archived).toBe(0)
    expect(queryInboxItems({ project }).total).toBe(1)
  })

  it('archives Resolved/Dismissed items past the retention window, and they remain queryable', () => {
    const project = uniqueSlug()
    const a = item(project)
    resolveInboxItem(a.id)

    const result = archiveClosedInboxItems('2099-01-01T00:00:00.000Z', { maxAgeMs: 0, maxLiveCount: null })
    expect(result.archived).toBe(1)
    expect(queryInboxItems({ project }).total).toBe(0)

    const archived = queryArchivedInboxItems(project)
    expect(archived.total).toBe(1)
    expect(archived.items[0].id).toBe(a.id)
  })
})
