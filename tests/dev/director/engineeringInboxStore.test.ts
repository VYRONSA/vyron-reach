import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { createInboxItem, listInboxItems, resolveInboxItem } from '../../../lib/dev/director/engineeringInboxStore'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

describe('Engineering Inbox — batch-scoped dedup (DEF-002, regression guard)', () => {
  it('reopens the same row for a recurring batch-level condition instead of creating a duplicate', () => {
    const project = uniqueSlug()
    const first = createInboxItem({
      project, batchId: 'batch-1', batchNumber: 'B1', reasonType: 'Quality Assurance Failure',
      reason: 'Tests failed.', severity: 'High', recommendedAction: 'Fix and retry.',
    })
    resolveInboxItem(first.id)
    const second = createInboxItem({
      project, batchId: 'batch-1', batchNumber: 'B1', reasonType: 'Quality Assurance Failure',
      reason: 'Tests failed again.', severity: 'High', recommendedAction: 'Fix and retry.',
    })

    expect(second.id).toBe(first.id)
    expect(listInboxItems({ project })).toHaveLength(1)
    expect(listInboxItems({ project })[0].status).toBe('Open')
  })
})

describe('Engineering Inbox — project-level dedup via sourceRef (PRA-P1-019)', () => {
  it('reopens the same row for a recurring project-level condition (e.g. a release) when sourceRef matches', () => {
    const project = uniqueSlug()
    const releaseId = 'release-abc'

    const first = createInboxItem({
      project, batchId: null, batchNumber: null, reasonType: 'Release Go/Hold Required',
      reason: 'Release v1.0.1 ready.', severity: 'Medium', recommendedAction: 'Decide.', sourceRef: releaseId,
    })
    const second = createInboxItem({
      project, batchId: null, batchNumber: null, reasonType: 'Release Go/Hold Required',
      reason: 'Release v1.0.1 still ready.', severity: 'Medium', recommendedAction: 'Decide.', sourceRef: releaseId,
    })

    expect(second.id).toBe(first.id)
    expect(listInboxItems({ project })).toHaveLength(1)
  })

  it('does not merge two genuinely different releases/incidents just because they share a project and reasonType', () => {
    const project = uniqueSlug()

    createInboxItem({
      project, batchId: null, batchNumber: null, reasonType: 'Release Go/Hold Required',
      reason: 'Release v1.0.1 ready.', severity: 'Medium', recommendedAction: 'Decide.', sourceRef: 'release-1',
    })
    createInboxItem({
      project, batchId: null, batchNumber: null, reasonType: 'Release Go/Hold Required',
      reason: 'Release v1.0.2 ready.', severity: 'Medium', recommendedAction: 'Decide.', sourceRef: 'release-2',
    })

    expect(listInboxItems({ project })).toHaveLength(2)
  })

  it('a resolved project-level item reopens (not duplicates) once its condition recurs, matching the batch-scoped behavior', () => {
    const project = uniqueSlug()
    const incidentId = 'incident-1'

    const first = createInboxItem({
      project, batchId: null, batchNumber: null, reasonType: 'Operational Incident',
      reason: 'First occurrence.', severity: 'High', recommendedAction: 'Investigate.', sourceRef: incidentId,
    })
    resolveInboxItem(first.id)
    expect(listInboxItems({ project, status: 'Resolved' })).toHaveLength(1)

    const reopened = createInboxItem({
      project, batchId: null, batchNumber: null, reasonType: 'Operational Incident',
      reason: 'Recurred.', severity: 'High', recommendedAction: 'Investigate.', sourceRef: incidentId,
    })

    expect(reopened.id).toBe(first.id)
    expect(reopened.status).toBe('Open')
    expect(listInboxItems({ project })).toHaveLength(1)
  })

  it('a project-level item with no sourceRef is never deduped — unchanged, backward-compatible behavior for any caller not yet updated', () => {
    const project = uniqueSlug()

    createInboxItem({
      project, batchId: null, batchNumber: null, reasonType: 'Deployment Approval',
      reason: 'First.', severity: 'Medium', recommendedAction: 'Approve.',
    })
    createInboxItem({
      project, batchId: null, batchNumber: null, reasonType: 'Deployment Approval',
      reason: 'Second, no sourceRef on either — never deduped.', severity: 'Medium', recommendedAction: 'Approve.',
    })

    expect(listInboxItems({ project })).toHaveLength(2)
  })
})
