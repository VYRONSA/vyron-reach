import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { patchDirectorStatus } from '../../../lib/dev/director/directorRuntimeStore'
import { createInboxItem, resolveInboxItem } from '../../../lib/dev/director/engineeringInboxStore'
import { createWorkforceTask, recordWorkforceTaskCompletion } from '../../../lib/dev/director/workforce/workforceTaskStore'
import { recordTimelineEvent } from '../../../lib/dev/knowledge/knowledgeService'
import { runAssessment } from '../../../lib/dev/director/assessment/assessmentService'
import { runSchedulingCycle } from '../../../lib/dev/scheduler/schedulerService'
import { createDelivery, markDelivered } from '../../../lib/dev/notifications/deliveryStore'
import { startMonitoring, recordReminder, closeEscalation } from '../../../lib/dev/escalation/escalationStateStore'
import { subscribe } from '../../../lib/dev/events/eventBus'
import { appendPlanningRecord, applyApprovalDecision } from '../../../lib/dev/planning/planningRepository'
import { buildPlanningHistoryRecord } from '../../../lib/dev/planning/planningEngine'
import type { DashboardEvent, DashboardEventCategory } from '../../../lib/dev/events/eventTypes'
import type { NotificationEvent } from '../../../lib/dev/notifications/notificationTypes'
import type { EngineeringPlan } from '../../../lib/dev/planning/planningTypes'

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

/** Captures every event published during `action()`, so each test only asserts on what its own action produced — not whatever a shared module-level bus already accumulated from earlier tests in this file. */
function capture(action: () => void): DashboardEvent[] {
  const events: DashboardEvent[] = []
  const unsubscribe = subscribe(e => events.push(e))
  try {
    action()
  } finally {
    unsubscribe()
  }
  return events
}

function hasCategory(events: DashboardEvent[], category: DashboardEventCategory, project?: string): boolean {
  return events.some(e => e.category === category && (project === undefined || e.project === project))
}

function makeReviewedPlan(project: string): EngineeringPlan {
  return {
    id: `plan_${project}`,
    projectSlug: project,
    projectName: project,
    generatedAt: new Date().toISOString(),
    objective: 'x',
    reason: 'x',
    expectedOutcome: 'x',
    complexity: 'Medium',
    confidence: 'High',
    estimatedDuration: '1 week',
    riskLevel: 'Low',
    dependencies: [],
    acceptanceCriteria: [],
    tasks: [],
    risk: {
      technical: { level: 'Low', reason: 'x' },
      business: { level: 'Low', reason: 'x' },
      architecture: { level: 'Low', reason: 'x' },
      delivery: { level: 'Low', reason: 'x' },
      overall: { level: 'Low', reason: 'x' },
    },
    effort: { hours: 1, complexity: 'Medium', confidence: 'High', assumptions: [] },
    validation: { valid: true, issues: [] },
    approvalStatus: 'Director Reviewed',
    directorReviewNote: null,
  }
}

describe('Real-Time Event Service — every producer publishes its category', () => {
  it('Engineering Director + Project Status: directorRuntimeStore.patchDirectorStatus', () => {
    const project = uniqueSlug()
    seedProject(project)
    const events = capture(() => {
      patchDirectorStatus(project, { state: 'Running' })
    })
    expect(hasCategory(events, 'Engineering Director', project)).toBe(true)
    expect(hasCategory(events, 'Project Status', project)).toBe(true)
  })

  it('Project Status: planningStateService.updateProject changing status', () => {
    const project = uniqueSlug()
    seedProject(project)
    const events = capture(() => {
      planningStateService.updateProject(project, { status: 'paused' })
    })
    expect(hasCategory(events, 'Project Status', project)).toBe(true)
    expect(hasCategory(events, 'Planning Changes', project)).toBe(true)
  })

  it('Worker Assignment: workforceTaskStore.createWorkforceTask', () => {
    const project = uniqueSlug()
    seedProject(project)
    const events = capture(() => {
      createWorkforceTask({
        project,
        phase: 'Phase 1',
        milestoneId: null,
        batchId: 'batch-1',
        requiredRole: 'Backend Engineer',
        executionContextVersion: 'v1',
        knowledgeVersion: 'v1',
        planningVersion: 1,
        dnaVersion: 'v1',
      })
    })
    expect(hasCategory(events, 'Worker Assignment', project)).toBe(true)
  })

  it('Worker Completion: workforceTaskStore.recordWorkforceTaskCompletion', () => {
    const project = uniqueSlug()
    seedProject(project)
    const task = createWorkforceTask({
      project,
      phase: 'Phase 1',
      milestoneId: null,
      batchId: 'batch-1',
      requiredRole: 'Backend Engineer',
      executionContextVersion: 'v1',
      knowledgeVersion: 'v1',
      planningVersion: 1,
      dnaVersion: 'v1',
    })
    const events = capture(() => {
      recordWorkforceTaskCompletion(task.id, { created: [], modified: [], deleted: [] })
    })
    expect(hasCategory(events, 'Worker Completion', project)).toBe(true)
  })

  it('Planning Changes: any planningStateService mutation (bumpPlanningVersion is the shared choke point)', () => {
    const project = uniqueSlug()
    const events = capture(() => {
      seedProject(project)
    })
    expect(hasCategory(events, 'Planning Changes', project)).toBe(true)
  })

  it('Knowledge Updates: knowledgeService.recordTimelineEvent', () => {
    const project = uniqueSlug()
    seedProject(project)
    const events = capture(() => {
      recordTimelineEvent({ project, category: 'Handover', title: 'x', detail: 'x' })
    })
    expect(hasCategory(events, 'Knowledge Updates', project)).toBe(true)
  })

  it('Assessment Updates: assessmentService.runAssessment (first run for a project is always "changed")', () => {
    const project = uniqueSlug()
    seedProject(project)
    const events = capture(() => {
      runAssessment(project)
    })
    expect(hasCategory(events, 'Assessment Updates', project)).toBe(true)
  })

  it('Scheduler Activity: schedulerService.runSchedulingCycle publishes one cross-project event per cycle', () => {
    const project = uniqueSlug()
    seedProject(project)
    const events = capture(() => {
      runSchedulingCycle({ maxConcurrent: 0 }) // decision-only, nothing actually started
    })
    expect(hasCategory(events, 'Scheduler Activity', '*')).toBe(true)
  })

  function notificationEvent(project: string): NotificationEvent {
    return { id: `e-${Math.random().toString(36).slice(2)}`, type: 'CEO Approval Required', project, title: 'x', message: 'x', severity: 'High', timestamp: new Date().toISOString(), metadata: {} }
  }

  it('Notification Delivery: deliveryStore.createDelivery and markDelivered', () => {
    const project = uniqueSlug()
    let deliveryId = ''
    const createEvents = capture(() => {
      deliveryId = createDelivery({ event: notificationEvent(project), provider: 'Email', maxAttempts: 3 }).id
    })
    expect(hasCategory(createEvents, 'Notification Delivery', project)).toBe(true)

    const updateEvents = capture(() => {
      markDelivered(deliveryId)
    })
    expect(hasCategory(updateEvents, 'Notification Delivery', project)).toBe(true)
  })

  it('Engineering Inbox: engineeringInboxStore.createInboxItem and resolveInboxItem', () => {
    const project = uniqueSlug()
    seedProject(project)
    let itemId = ''
    const openEvents = capture(() => {
      itemId = createInboxItem({ project, batchId: null, batchNumber: null, reasonType: 'Approval Required', severity: 'High', reason: 'x', recommendedAction: 'x' }).id
    })
    expect(hasCategory(openEvents, 'Engineering Inbox', project)).toBe(true)

    const closeEvents = capture(() => {
      resolveInboxItem(itemId)
    })
    expect(hasCategory(closeEvents, 'Engineering Inbox', project)).toBe(true)
  })

  it('Escalation: escalationStateStore.startMonitoring, recordReminder, closeEscalation', () => {
    const project = uniqueSlug()
    const now = '2026-01-01T00:00:00.000Z'
    const startEvents = capture(() => {
      startMonitoring('item-1', project, 'default', now)
    })
    expect(hasCategory(startEvents, 'Escalation', project)).toBe(true)

    const reminderEvents = capture(() => {
      recordReminder('item-1', 1, 'Normal reminder', now)
    })
    expect(hasCategory(reminderEvents, 'Escalation', project)).toBe(true)

    const closeEvents = capture(() => {
      closeEscalation('item-1', 'Resolved', now)
    })
    expect(hasCategory(closeEvents, 'Escalation', project)).toBe(true)
  })

  it('Escalation: closeEscalation is idempotent and never re-publishes for an already-closed item', () => {
    const project = uniqueSlug()
    const now = '2026-01-01T00:00:00.000Z'
    startMonitoring('item-1', project, 'default', now)
    closeEscalation('item-1', 'Resolved', now)

    const events = capture(() => {
      closeEscalation('item-1', 'Resolved', '2026-01-01T01:00:00.000Z')
    })
    expect(hasCategory(events, 'Escalation')).toBe(false)
  })

  it('Planning Changes: planningRepository.applyApprovalDecision (PRA-P1-011)', () => {
    const project = uniqueSlug()
    const record = buildPlanningHistoryRecord(makeReviewedPlan(project))
    appendPlanningRecord(record)

    const events = capture(() => {
      applyApprovalDecision(record.id, 'Approved')
    })
    expect(hasCategory(events, 'Planning Changes', project)).toBe(true)
  })

  it('never publishes for a rejected (not-actually-recorded) approval decision', () => {
    const project = uniqueSlug()
    const proposedPlan = { ...makeReviewedPlan(project), approvalStatus: 'Proposed' as const }
    const record = buildPlanningHistoryRecord(proposedPlan)
    appendPlanningRecord(record)

    const events = capture(() => {
      applyApprovalDecision(record.id, 'Approved') // plan is Proposed, not Director Reviewed — rejected
    })
    expect(hasCategory(events, 'Planning Changes', project)).toBe(false)
  })

  it('Recovery: each bootstrap publishes a cross-project Recovery event on completion', async () => {
    vi.resetModules()
    // vi.resetModules() gives recoveryBootstrap.ts a brand-new internal
    // eventBus.ts instance too — the top-of-file `subscribe` import still
    // points at the OLD module registry, so it must be re-imported here
    // to observe events from the same fresh instance the bootstrap
    // publishes through.
    const freshBus = await import('../../../lib/dev/events/eventBus')
    const { runRecoveryBootstrap } = await import('../../../lib/dev/director/recoveryBootstrap')
    const captured: DashboardEvent[] = []
    const unsubscribe = freshBus.subscribe(e => captured.push(e))
    await runRecoveryBootstrap()
    unsubscribe()
    expect(hasCategory(captured, 'Recovery', '*')).toBe(true)
  })
})
