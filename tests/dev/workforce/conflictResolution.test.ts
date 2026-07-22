import { describe, it, expect } from 'vitest'
import { detectWorkforceConflict, resolveWorkforceConflict } from '../../../lib/dev/director/workforce/conflictResolution'
import type { WorkforceTask } from '../../../lib/dev/director/workforce/workforceTypes'
import type { EngineeringAssessment, QualityGateReport, RiskAssessment } from '../../../lib/dev/director/assessment/assessmentTypes'

function task(overrides: Partial<WorkforceTask> = {}): WorkforceTask {
  return {
    id: 'task-1', project: 'acme', phase: 'Phase 1', milestoneId: 'm1', batchId: 'b1', requiredRole: 'Backend Engineer',
    executionContextVersion: 'ctx1', knowledgeVersion: 'k1', planningVersion: 1, dnaVersion: 'none',
    runtimeJobId: 'job-1', createdAt: '2026-01-01T00:00:00.000Z', filesChanged: null,
    ...overrides,
  }
}

function cleanGates(): QualityGateReport {
  const names = ['Build Status', 'TypeScript Status', 'Test Status', 'Planning Consistency', 'Dependency Consistency', 'Completion Consistency', 'Execution Health'] as const
  const list = names.map(gate => ({ gate, status: 'Passing' as const, detail: '' }))
  return { gates: list, passing: 7, failing: 0, unknown: 0 }
}

function lowRisk(): RiskAssessment {
  const names = ['Open Risks', 'Risk Severity', 'Blocked Milestones', 'Stalled Batches', 'Technical Debt Growth', 'Repeated Failures', 'Recovery Frequency', 'Outstanding CEO Decisions'] as const
  return { factors: names.map(factor => ({ factor, level: 'Low' as const, detail: '' })), overall: 'Low' }
}

function assessment(overrides: Partial<EngineeringAssessment> = {}): EngineeringAssessment {
  return { project: 'acme', qualityGates: cleanGates(), riskAssessment: lowRisk(), engineeringHealth: 'Healthy', technicalDebtBaseline: 0, ...overrides }
}

describe('Conflict Resolution — detection', () => {
  it('detects a conflict when two tasks changed the same file', () => {
    const priorTask = task({ id: 'task-1', requiredRole: 'Backend Engineer', filesChanged: { created: [], modified: ['app/api/route.ts'], deleted: [] } })
    const newTask = task({ id: 'task-2', requiredRole: 'Frontend Engineer' })
    const conflict = detectWorkforceConflict(newTask, { created: [], modified: ['app/api/route.ts'], deleted: [] }, [priorTask])
    expect(conflict).not.toBeNull()
    expect(conflict?.overlappingFiles).toEqual(['app/api/route.ts'])
    expect(conflict?.conflictingTask.id).toBe('task-1')
  })

  it('does not detect a conflict when files do not overlap', () => {
    const priorTask = task({ id: 'task-1', filesChanged: { created: [], modified: ['app/api/route.ts'], deleted: [] } })
    const newTask = task({ id: 'task-2' })
    const conflict = detectWorkforceConflict(newTask, { created: [], modified: ['components/Button.tsx'], deleted: [] }, [priorTask])
    expect(conflict).toBeNull()
  })

  it('ignores a prior task with no recorded file changes yet (still in flight)', () => {
    const priorTask = task({ id: 'task-1', filesChanged: null })
    const newTask = task({ id: 'task-2' })
    const conflict = detectWorkforceConflict(newTask, { created: [], modified: ['app/api/route.ts'], deleted: [] }, [priorTask])
    expect(conflict).toBeNull()
  })

  it('never flags a task as conflicting with itself', () => {
    const newTask = task({ id: 'task-2', filesChanged: { created: [], modified: ['app/api/route.ts'], deleted: [] } })
    const conflict = detectWorkforceConflict(newTask, { created: [], modified: ['app/api/route.ts'], deleted: [] }, [newTask])
    expect(conflict).toBeNull()
  })

  it('detects overlap across created/modified/deleted regardless of which bucket each side used', () => {
    const priorTask = task({ id: 'task-1', filesChanged: { created: ['shared.ts'], modified: [], deleted: [] } })
    const newTask = task({ id: 'task-2' })
    const conflict = detectWorkforceConflict(newTask, { created: [], modified: [], deleted: ['shared.ts'] }, [priorTask])
    expect(conflict).not.toBeNull()
  })
})

describe('Conflict Resolution — resolution via the existing strategic layer (resolveAgentConflict)', () => {
  it('sides with proceeding when the Assessment Service reports no Critical/High findings', () => {
    const priorTask = task({ id: 'task-1', filesChanged: { created: [], modified: ['x.ts'], deleted: [] } })
    const newTask = task({ id: 'task-2' })
    const conflict = detectWorkforceConflict(newTask, { created: [], modified: ['x.ts'], deleted: [] }, [priorTask])!
    const resolved = resolveWorkforceConflict(conflict, assessment())
    expect(resolved.resolution).toMatch(/siding with proceeding/)
  })

  it('sides with the blocking position when a core Quality Gate is failing', () => {
    const priorTask = task({ id: 'task-1', filesChanged: { created: [], modified: ['x.ts'], deleted: [] } })
    const newTask = task({ id: 'task-2' })
    const conflict = detectWorkforceConflict(newTask, { created: [], modified: ['x.ts'], deleted: [] }, [priorTask])!
    const gates = cleanGates()
    gates.gates = gates.gates.map(g => (g.gate === 'Build Status' ? { ...g, status: 'Failing' as const } : g))
    gates.failing = 1
    gates.passing = 6
    const resolved = resolveWorkforceConflict(conflict, assessment({ qualityGates: gates }))
    expect(resolved.resolution).toMatch(/siding with the blocking position/)
  })

  it('sides with the blocking position when a risk factor is High', () => {
    const priorTask = task({ id: 'task-1', filesChanged: { created: [], modified: ['x.ts'], deleted: [] } })
    const newTask = task({ id: 'task-2' })
    const conflict = detectWorkforceConflict(newTask, { created: [], modified: ['x.ts'], deleted: [] }, [priorTask])!
    const risk = lowRisk()
    risk.factors = risk.factors.map(f => (f.factor === 'Open Risks' ? { ...f, level: 'High' as const } : f))
    risk.overall = 'High'
    const resolved = resolveWorkforceConflict(conflict, assessment({ riskAssessment: risk }))
    expect(resolved.resolution).toMatch(/siding with the blocking position/)
  })

  it('preserves the original conflict fields, only adding a resolution', () => {
    const priorTask = task({ id: 'task-1', filesChanged: { created: [], modified: ['x.ts'], deleted: [] } })
    const newTask = task({ id: 'task-2' })
    const conflict = detectWorkforceConflict(newTask, { created: [], modified: ['x.ts'], deleted: [] }, [priorTask])!
    const resolved = resolveWorkforceConflict(conflict, assessment())
    expect(resolved.task).toEqual(conflict.task)
    expect(resolved.conflictingTask).toEqual(conflict.conflictingTask)
    expect(resolved.overlappingFiles).toEqual(conflict.overlappingFiles)
  })
})
