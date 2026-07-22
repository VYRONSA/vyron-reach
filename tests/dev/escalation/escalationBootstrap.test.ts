import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { createInboxItem } from '../../../lib/dev/director/engineeringInboxStore'
import { listInAppNotifications } from '../../../lib/dev/notifications/inAppNotificationStore'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function seedOpenItem(project: string) {
  planningStateService.createProject({ name: project, slug: project, description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x' })
  return createInboxItem({ project, batchId: null, batchNumber: null, reasonType: 'Approval Required', severity: 'High', reason: 'x', recommendedAction: 'x' })
}

/** vi.resetModules() + a dynamic import gives a genuinely fresh module instance — the closest thing to "a new process" for exercising escalationBootstrap.ts's in-memory bootstrapPromise singleton, mirroring schedulerBootstrap.test.ts's and deliveryBootstrap.test.ts's identical pattern. */
async function freshEscalationBootstrap() {
  vi.resetModules()
  return import('../../../lib/dev/escalation/escalationBootstrap')
}

describe('Escalation Bootstrap — runs an initial cycle on resume', () => {
  it('runs an escalation cycle that observes existing Open inbox items', async () => {
    const project = uniqueSlug()
    seedOpenItem(project)

    const { runEscalationBootstrap } = await freshEscalationBootstrap()
    await runEscalationBootstrap()

    const { listEscalationStates } = await import('../../../lib/dev/escalation/escalationStateStore')
    expect(listEscalationStates({ project })).toHaveLength(1) // monitoring started under the default catch-all rule
  })
})

describe('Escalation Bootstrap — single recovery per process (in-memory singleton)', () => {
  it('returns the exact same in-flight promise to every caller within one process', async () => {
    const { runEscalationBootstrap } = await freshEscalationBootstrap()
    const p1 = runEscalationBootstrap()
    const p2 = runEscalationBootstrap()
    expect(p1).toBe(p2)
    await p1
  })

  it('releases the bootstrap lock once the initial cycle completes', async () => {
    const { runEscalationBootstrap } = await freshEscalationBootstrap()
    await runEscalationBootstrap()
    expect(fs.existsSync(path.join(isolated.dir, 'escalation-bootstrap.lock'))).toBe(false)
  })
})

describe('Escalation Bootstrap — lock reclaim', () => {
  it('reclaims and proceeds when the recorded lock holder is a dead process', async () => {
    fs.mkdirSync(isolated.dir, { recursive: true })
    fs.writeFileSync(
      path.join(isolated.dir, 'escalation-bootstrap.lock'),
      JSON.stringify({ pid: 999_999_999, acquiredAt: new Date().toISOString() }),
      'utf-8'
    )
    const project = uniqueSlug()
    seedOpenItem(project)

    const { runEscalationBootstrap } = await freshEscalationBootstrap()
    await runEscalationBootstrap()

    const { listEscalationStates } = await import('../../../lib/dev/escalation/escalationStateStore')
    expect(listEscalationStates({ project })).toHaveLength(1)
  })

  it('does nothing and leaves the lock untouched when a still-alive process already holds it', async () => {
    fs.mkdirSync(isolated.dir, { recursive: true })
    const lockFile = path.join(isolated.dir, 'escalation-bootstrap.lock')
    fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid, acquiredAt: new Date().toISOString() }), 'utf-8')

    const project = uniqueSlug()
    seedOpenItem(project)

    const { runEscalationBootstrap } = await freshEscalationBootstrap()
    await runEscalationBootstrap()
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(fs.existsSync(lockFile)).toBe(true) // never released — we never owned it
    const { listEscalationStates } = await import('../../../lib/dev/escalation/escalationStateStore')
    expect(listEscalationStates({ project })).toHaveLength(0) // never ran — the "live" holder owns bootstrap
  })
})

describe('Escalation Bootstrap — prevents duplicate reminders across a simulated restart', () => {
  it('a resumed process never re-sends a reminder for a level already reached before the crash', async () => {
    const project = uniqueSlug()
    const item = seedOpenItem(project)

    const { createEscalationRule } = await import('../../../lib/dev/escalation/escalationRulesStore')
    createEscalationRule({
      name: 'fast', enabled: true, reasonType: null, severity: null, project, priority: null,
      maxOpenDurationMs: 100_000, maxNotificationCount: 5, channel: 'In-App',
      levels: [{ level: 1, label: 'Normal reminder', afterMs: 0, severity: 'Medium' }],
    })

    const { runEscalationCycle } = await import('../../../lib/dev/escalation/escalationService')
    runEscalationCycle({ now: new Date(new Date(item.timestamp).getTime() + 1_000).toISOString() })
    await waitFor(() => listInAppNotifications(project).filter(n => n.type === 'Inbox Item Escalated').length === 1)

    // "Restart" — a fresh bootstrap module instance, exactly like the singleton tests above.
    const { runEscalationBootstrap } = await freshEscalationBootstrap()
    await runEscalationBootstrap()
    await new Promise(resolve => setTimeout(resolve, 50))

    expect(listInAppNotifications(project).filter(n => n.type === 'Inbox Item Escalated')).toHaveLength(1)
  })
})
