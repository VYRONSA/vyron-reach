import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { refreshEngineeringContextIfNeeded } from '../../../lib/dev/director/liveKnowledgeRefresh'
import { computeEngineeringContextVersions } from '../../../lib/dev/director/engineeringContextVersion'
import * as knowledgeService from '../../../lib/dev/knowledge/knowledgeService'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { setDevelopmentRules } from '../../../lib/dev/knowledge/developmentRulesStore'
import type { ExecutionSnapshot } from '../../../lib/dev/director/executionSnapshotTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function baseSnapshot(project: string, overrides: Partial<ExecutionSnapshot> = {}): ExecutionSnapshot {
  return {
    project, projectName: project, projectTagline: '', projectDescription: '',
    milestones: [], batches: [],
    decisions: [], technicalDebt: [], openRisks: [],
    developmentRules: '', productBible: { vision: '', goals: '', targetMarket: '', coreFeatures: '', futureRoadmap: '', notes: '', updatedAt: '' },
    completions: [], handedOffAt: new Date().toISOString(),
    ...overrides,
  }
}

describe('Live Knowledge Refresh — comparison-based boundary check', () => {
  it('is a no-op (refreshed=false) when lastVersions already matches current state', () => {
    const project = uniqueSlug()
    const versions = computeEngineeringContextVersions(project)
    const snapshot = baseSnapshot(project)

    const outcome = refreshEngineeringContextIfNeeded(snapshot, versions)
    expect(outcome.refreshed).toBe(false)
    expect(outcome.snapshot).toBe(snapshot) // same reference — nothing rebuilt
  })

  it('always refreshes when lastVersions is null (first-ever boundary, or a forced post-recovery reset)', () => {
    const project = uniqueSlug()
    const snapshot = baseSnapshot(project)
    const outcome = refreshEngineeringContextIfNeeded(snapshot, null)
    expect(outcome.refreshed).toBe(true)
  })

  it('does not log a timeline event when nothing changed', () => {
    const project = uniqueSlug()
    const versions = computeEngineeringContextVersions(project)
    refreshEngineeringContextIfNeeded(baseSnapshot(project), versions)
    expect(knowledgeService.listTimeline(project)).toEqual([])
  })

  it('logs exactly one Knowledge Refresh timeline event when something changed', () => {
    const project = uniqueSlug()
    const stale = computeEngineeringContextVersions(project)
    knowledgeService.recordRisk({ project, title: 'X' }) // also logs its own 'Risk' timeline event

    refreshEngineeringContextIfNeeded(baseSnapshot(project), stale)

    const refreshEvents = knowledgeService.listTimeline(project).filter(e => e.category === 'Knowledge Refresh')
    expect(refreshEvents).toHaveLength(1)
  })
})

describe('Live Knowledge Refresh — collapses multiple edits into exactly one refresh', () => {
  it('many edits before a single boundary check produce exactly one refresh and one timeline entry', () => {
    const project = uniqueSlug()
    const stale = computeEngineeringContextVersions(project)

    // Simulate several CEO edits happening while a batch is executing —
    // none of these ever call the refresh function themselves.
    knowledgeService.recordBusinessDecision({ project, decision: 'A' })
    knowledgeService.recordArchitectureDecision({ project, decision: 'B' })
    knowledgeService.recordRisk({ project, title: 'C' })
    knowledgeService.recordTechnicalDebt({ project, title: 'D' })
    planningStateService.createProject({ name: project, slug: project, description: '', category: 'test', status: 'active', progress: 0, color: '#000', icon: 'x' })

    const outcome = refreshEngineeringContextIfNeeded(baseSnapshot(project), stale)
    expect(outcome.refreshed).toBe(true)

    const refreshEvents = knowledgeService.listTimeline(project).filter(e => e.category === 'Knowledge Refresh')
    expect(refreshEvents).toHaveLength(1) // one boundary check → at most one refresh, no matter how many edits preceded it

    // A second boundary check right after, with nothing new in between, must not refresh again.
    const second = refreshEngineeringContextIfNeeded(outcome.snapshot, outcome.versions)
    expect(second.refreshed).toBe(false)
    expect(knowledgeService.listTimeline(project).filter(e => e.category === 'Knowledge Refresh')).toHaveLength(1)
  })
})

describe('Live Knowledge Refresh — reloads exactly the in-scope engineering context', () => {
  it('reloads Architecture Decisions from the Planning Service, capped at the 10 most recent', () => {
    const project = uniqueSlug()
    for (let i = 0; i < 15; i++) planningStateService.createDecision(project, { decision: `D${i}`, reason: '', alternatives: '', approvedDate: '', status: 'Approved' })

    const outcome = refreshEngineeringContextIfNeeded(baseSnapshot(project), null)
    expect(outcome.snapshot.decisions).toHaveLength(10)
  })

  it('reloads only High-priority, unresolved Technical Debt', () => {
    const project = uniqueSlug()
    planningStateService.createTechnicalDebt(project, { title: 'high-open', description: '', priority: 'High', estimatedEffort: '', createdDate: '', resolvedDate: '', status: 'Open' })
    planningStateService.createTechnicalDebt(project, { title: 'high-resolved', description: '', priority: 'High', estimatedEffort: '', createdDate: '', resolvedDate: '', status: 'Resolved' })
    planningStateService.createTechnicalDebt(project, { title: 'low-open', description: '', priority: 'Low', estimatedEffort: '', createdDate: '', resolvedDate: '', status: 'Open' })

    const outcome = refreshEngineeringContextIfNeeded(baseSnapshot(project), null)
    expect(outcome.snapshot.technicalDebt.map(d => d.title)).toEqual(['high-open'])
  })

  it('reloads only High-severity, still-open Risks', () => {
    const project = uniqueSlug()
    planningStateService.createRisk(project, { title: 'high-open', description: '', severity: 'High', probability: 'Medium', mitigation: '', owner: '', status: 'Open' })
    planningStateService.createRisk(project, { title: 'high-mitigated', description: '', severity: 'High', probability: 'Medium', mitigation: '', owner: '', status: 'Mitigated' })
    planningStateService.createRisk(project, { title: 'medium-open', description: '', severity: 'Medium', probability: 'Medium', mitigation: '', owner: '', status: 'Open' })

    const outcome = refreshEngineeringContextIfNeeded(baseSnapshot(project), null)
    expect(outcome.snapshot.openRisks.map(r => r.title)).toEqual(['high-open'])
  })

  it('reloads Development Rules from the server-owned store', () => {
    const project = uniqueSlug()
    setDevelopmentRules('Always write tests.')
    const outcome = refreshEngineeringContextIfNeeded(baseSnapshot(project), null)
    expect(outcome.snapshot.developmentRules).toBe('Always write tests.')
  })

  it('leaves milestones/batches/completions/productBible untouched by a refresh — only the listed context fields are reloaded', () => {
    const project = uniqueSlug()
    const snapshot = baseSnapshot(project, { completions: [{ batchId: 'b1', batchNumber: 'B1', milestoneId: '', milestoneTitle: '', objective: '', summary: '', completedAt: '', runtimeJobId: '' }] })
    const outcome = refreshEngineeringContextIfNeeded(snapshot, null)
    expect(outcome.snapshot.completions).toBe(snapshot.completions)
    expect(outcome.snapshot.milestones).toBe(snapshot.milestones)
    expect(outcome.snapshot.batches).toBe(snapshot.batches)
    expect(outcome.snapshot.productBible).toBe(snapshot.productBible)
  })
})
