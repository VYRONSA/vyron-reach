import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { subscribe } from '../../../lib/dev/events/eventBus'
import { insertReleaseRequest } from '../../../lib/dev/director/releaseManagement/releaseManagementStore'
import { insertIncident } from '../../../lib/dev/director/operations/operationsMonitoringStore'
import { runOperationsMonitoringCycle, submitRollbackControlDecision } from '../../../lib/dev/director/operations/operationsMonitoringService'
import type { DashboardEvent } from '../../../lib/dev/events/eventTypes'
import type { ReleaseRequest } from '../../../lib/dev/director/releaseManagement/releaseManagementTypes'
import type { Incident } from '../../../lib/dev/director/operations/operationsMonitoringTypes'

/**
 * PRA-P1-033 remediation — Autonomous Operations previously never
 * published to the Real-Time Event Service, so these are the first tests
 * this module has ever had (no prior test file exercised
 * operationsMonitoringService at all). Scoped deliberately narrow: these
 * only prove the new `publish()` calls fire on each real state
 * transition, not general Operations behavior.
 */

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  vi.unstubAllGlobals()
  isolated.cleanup()
})

async function capture(action: () => Promise<void> | void): Promise<DashboardEvent[]> {
  const events: DashboardEvent[] = []
  const unsubscribe = subscribe(e => events.push(e))
  try {
    await action()
  } finally {
    unsubscribe()
  }
  return events
}

function releasedDeployment(project: string, overrides: Partial<ReleaseRequest> = {}): ReleaseRequest {
  const now = new Date().toISOString()
  const record: ReleaseRequest = {
    id: `release_${Math.random().toString(36).slice(2)}`,
    project,
    status: 'Released',
    version: '1.0.0',
    notes: '',
    branchName: `autonomous-release/${project}/v1.0.0`,
    commitSha: 'abc1234',
    prUrl: null,
    deploymentUrl: 'https://example.test/deployment',
    preparationReport: { activities: [], passed: true, runAt: now, durationMs: 0 },
    executionReport: { activities: [], passed: true, runAt: now, durationMs: 0 },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
  insertReleaseRequest(record)
  return record
}

const failingFetch = vi.fn(async () => {
  throw new Error('connection refused')
})
const healthyFetch = vi.fn(async () => ({ status: 200 }))

describe('Operations event publishing (PRA-P1-033)', () => {
  it('a newly detected incident publishes incident-opened, and a prior good release publishes rollback-pending', async () => {
    const project = uniqueSlug()
    const priorGood = releasedDeployment(project, { version: '0.9.0' })
    void priorGood
    releasedDeployment(project, { version: '1.0.0' })
    vi.stubGlobal('fetch', failingFetch)

    const events = await capture(() => runOperationsMonitoringCycle())

    const opened = events.find(e => e.category === 'Operations' && e.type === 'incident-opened' && e.project === project)
    expect(opened).toBeDefined()
    const pending = events.find(e => e.category === 'Operations' && e.type === 'rollback-pending' && e.project === project)
    expect(pending).toBeDefined()
    expect(pending!.payload.incidentId).toBe(opened!.payload.incidentId)
  })

  it('a second cycle against the same still-unhealthy deployment publishes incident-refreshed, not a second incident-opened', async () => {
    const project = uniqueSlug()
    releasedDeployment(project)
    vi.stubGlobal('fetch', failingFetch)

    await runOperationsMonitoringCycle()
    const events = await capture(() => runOperationsMonitoringCycle())

    expect(events.some(e => e.category === 'Operations' && e.type === 'incident-refreshed' && e.project === project)).toBe(true)
    expect(events.some(e => e.type === 'incident-opened')).toBe(false)
  })

  it('a cycle that finds the deployment healthy again publishes incident-resolved', async () => {
    const project = uniqueSlug()
    releasedDeployment(project)
    vi.stubGlobal('fetch', failingFetch)
    await runOperationsMonitoringCycle()

    vi.stubGlobal('fetch', healthyFetch)
    const events = await capture(() => runOperationsMonitoringCycle())

    expect(events.some(e => e.category === 'Operations' && e.type === 'incident-resolved' && e.project === project)).toBe(true)
  })

  it('a Go/Hold rollback decision publishes rollback-decision', async () => {
    const project = uniqueSlug()
    const release = releasedDeployment(project)
    const now = new Date().toISOString()
    const incident: Incident = {
      id: `incident_${Math.random().toString(36).slice(2)}`,
      project,
      status: 'RollbackPending',
      severity: 'Critical',
      detectedAt: now,
      resolvedAt: null,
      relatedReleaseId: release.id,
      rollbackTargetReleaseId: release.id,
      checks: [],
      postIncidentReview: null,
      createdAt: now,
      updatedAt: now,
    }
    insertIncident(incident)

    const events = await capture(() => {
      submitRollbackControlDecision(project, incident.id, { executive: 'cfo', decision: 'Go', reason: 'approved' })
    })

    const decisionEvent = events.find(e => e.category === 'Operations' && e.type === 'rollback-decision')
    expect(decisionEvent).toBeDefined()
    expect(decisionEvent!.payload.decision).toBe('Go')
    expect(decisionEvent!.payload.incidentId).toBe(incident.id)
  })
})
