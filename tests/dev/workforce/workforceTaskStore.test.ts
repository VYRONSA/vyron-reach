import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { createWorkforceTask, attachRuntimeJobId, recordWorkforceTaskCompletion, listWorkforceTasks, recentWorkforceTasks } from '../../../lib/dev/director/workforce/workforceTaskStore'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function taskInput(project: string) {
  return {
    project, phase: 'Phase 1', milestoneId: 'm1', batchId: 'b1', requiredRole: 'Backend Engineer' as const,
    executionContextVersion: 'ctx1', knowledgeVersion: 'k1', planningVersion: 1, dnaVersion: 'none',
  }
}

describe('Workforce Task Store — creation and immutable versions', () => {
  it('creates a task with a fresh id and no runtimeJobId/filesChanged yet', () => {
    const project = uniqueSlug()
    const task = createWorkforceTask(taskInput(project))
    expect(task.id).toBeTruthy()
    expect(task.runtimeJobId).toBeNull()
    expect(task.filesChanged).toBeNull()
    expect(task.requiredRole).toBe('Backend Engineer')
  })

  it('scopes tasks strictly by project', () => {
    const projectA = uniqueSlug('a')
    const projectB = uniqueSlug('b')
    createWorkforceTask(taskInput(projectA))
    expect(listWorkforceTasks(projectB)).toEqual([])
    expect(listWorkforceTasks(projectA)).toHaveLength(1)
  })
})

describe('Workforce Task Store — lifecycle updates', () => {
  it('attaches a runtime job id without touching the frozen version fields', () => {
    const project = uniqueSlug()
    const task = createWorkforceTask(taskInput(project))
    const updated = attachRuntimeJobId(task.id, 'job-123')
    expect(updated?.runtimeJobId).toBe('job-123')
    expect(updated?.executionContextVersion).toBe('ctx1')
    expect(updated?.knowledgeVersion).toBe('k1')
    expect(updated?.planningVersion).toBe(1)
    expect(updated?.dnaVersion).toBe('none')
  })

  it('records completion file changes', () => {
    const project = uniqueSlug()
    const task = createWorkforceTask(taskInput(project))
    const updated = recordWorkforceTaskCompletion(task.id, { created: ['a.ts'], modified: [], deleted: [] })
    expect(updated?.filesChanged).toEqual({ created: ['a.ts'], modified: [], deleted: [] })
  })

  it('returns null when updating a task id that does not exist', () => {
    expect(attachRuntimeJobId('does-not-exist', 'job-1')).toBeNull()
    expect(recordWorkforceTaskCompletion('does-not-exist', { created: [], modified: [], deleted: [] })).toBeNull()
  })
})

describe('Workforce Task Store — permanence and restart survival', () => {
  it('every created task persists and is readable by a fresh call', () => {
    const project = uniqueSlug()
    createWorkforceTask(taskInput(project))
    createWorkforceTask(taskInput(project))
    createWorkforceTask(taskInput(project))
    expect(listWorkforceTasks(project)).toHaveLength(3)
  })

  it('recentWorkforceTasks returns newest first, limited to the requested window', () => {
    const project = uniqueSlug()
    const first = createWorkforceTask(taskInput(project))
    const second = createWorkforceTask(taskInput(project))
    const third = createWorkforceTask(taskInput(project))
    const recent = recentWorkforceTasks(project, 2)
    expect(recent).toHaveLength(2)
    expect(recent[0].id).toBe(third.id)
    expect(recent[1].id).toBe(second.id)
    expect(recent.map(t => t.id)).not.toContain(first.id)
  })
})
