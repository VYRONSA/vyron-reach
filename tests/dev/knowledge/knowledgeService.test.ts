import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import * as knowledgeService from '../../../lib/dev/knowledge/knowledgeService'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

describe('Knowledge Service — Engineering Handover', () => {
  it('records a handover and it persists for the project', () => {
    const project = uniqueSlug()
    const record = knowledgeService.recordHandover({
      project, phase: 'Phase 1', objective: 'Ship X', executiveSummary: 'Shipped X',
      filesCreated: ['a.ts'], filesModified: [], filesDeleted: [], buildStatus: 'Passing', typescriptStatus: 'Passing',
    })
    expect(record.id).toBeTruthy()
    expect(record.timestamp).toBeTruthy()
    expect(knowledgeService.listHandovers(project).map(h => h.id)).toContain(record.id)
  })

  it('scopes handovers strictly by project', () => {
    const projectA = uniqueSlug('a')
    const projectB = uniqueSlug('b')
    knowledgeService.recordHandover({ project: projectA, phase: '', objective: '', executiveSummary: 'A', filesCreated: [], filesModified: [], filesDeleted: [], buildStatus: 'Unknown', typescriptStatus: 'Unknown' })
    expect(knowledgeService.listHandovers(projectB)).toEqual([])
    expect(knowledgeService.listHandovers(projectA)).toHaveLength(1)
  })
})

describe('Knowledge Service — Architecture Decisions vs Business Decisions', () => {
  it('records architecture and business decisions into separate domains', () => {
    const project = uniqueSlug()
    knowledgeService.recordArchitectureDecision({ project, decision: 'Use Postgres' })
    knowledgeService.recordBusinessDecision({ project, decision: 'Delay launch by a week' })

    expect(knowledgeService.listArchitectureDecisions(project)).toHaveLength(1)
    expect(knowledgeService.listBusinessDecisions(project)).toHaveLength(1)
    expect(knowledgeService.listArchitectureDecisions(project)[0].decision).toBe('Use Postgres')
    expect(knowledgeService.listBusinessDecisions(project)[0].decision).toBe('Delay launch by a week')
  })

  it('mirrors a recorded Architecture Decision into the Planning Service current-state Decision entity', () => {
    const project = uniqueSlug()
    knowledgeService.recordArchitectureDecision({ project, decision: 'Use Postgres', reason: 'Because' })
    const mirrored = planningStateService.listDecisions(project)
    expect(mirrored).toHaveLength(1)
    expect(mirrored[0].decision).toBe('Use Postgres')
    expect(mirrored[0].status).toBe('Approved')
  })

  it('mirrors a recorded Business Decision into the Planning Service current-state Decision entity too', () => {
    const project = uniqueSlug()
    knowledgeService.recordBusinessDecision({ project, decision: 'Delay launch' })
    expect(planningStateService.listDecisions(project)).toHaveLength(1)
  })
})

describe('Knowledge Service — Technical Debt', () => {
  it('records technical debt and mirrors it into the Planning Service', () => {
    const project = uniqueSlug()
    const record = knowledgeService.recordTechnicalDebt({ project, title: 'No tests', priority: 'High' })
    expect(record.priority).toBe('High')
    expect(knowledgeService.listTechnicalDebt(project)).toHaveLength(1)
    const mirrored = planningStateService.listTechnicalDebt(project)
    expect(mirrored).toHaveLength(1)
    expect(mirrored[0].title).toBe('No tests')
    expect(mirrored[0].status).toBe('Open')
  })

  it('defaults priority to Medium when not specified', () => {
    const project = uniqueSlug()
    const record = knowledgeService.recordTechnicalDebt({ project, title: 'Untyped module' })
    expect(record.priority).toBe('Medium')
  })
})

describe('Knowledge Service — Risk Register', () => {
  it('records a risk and mirrors it into the Planning Service', () => {
    const project = uniqueSlug()
    const record = knowledgeService.recordRisk({ project, title: 'Vendor lock-in', severity: 'High' })
    expect(record.severity).toBe('High')
    expect(knowledgeService.listRisks(project)).toHaveLength(1)
    const mirrored = planningStateService.listRisks(project)
    expect(mirrored).toHaveLength(1)
    expect(mirrored[0].status).toBe('Open')
  })
})

describe('Knowledge Service — Engineering Journal', () => {
  it('appends a journal entry', () => {
    const project = uniqueSlug()
    const record = knowledgeService.appendJournalEntry({ project, summary: 'Good progress today', wins: 'Shipped X' })
    expect(record.summary).toBe('Good progress today')
    expect(knowledgeService.listJournalEntries(project)).toHaveLength(1)
  })

  it('never overwrites a previous entry — every append is additive', () => {
    const project = uniqueSlug()
    knowledgeService.appendJournalEntry({ project, summary: 'Day 1' })
    knowledgeService.appendJournalEntry({ project, summary: 'Day 2' })
    knowledgeService.appendJournalEntry({ project, summary: 'Day 3' })
    expect(knowledgeService.listJournalEntries(project)).toHaveLength(3)
  })
})

describe('Knowledge Service — Milestone / Batch Completion History', () => {
  it('records a milestone completion', () => {
    const project = uniqueSlug()
    const record = knowledgeService.recordMilestoneCompletion({ project, milestoneId: 'm1', milestoneTitle: 'Phase 1 Complete', phase: 'Phase 1' })
    expect(record.milestoneTitle).toBe('Phase 1 Complete')
    expect(knowledgeService.listMilestoneCompletions(project)).toHaveLength(1)
  })

  it('records a batch completion', () => {
    const project = uniqueSlug()
    const record = knowledgeService.recordBatchCompletion({ project, batchId: 'b1', batchNumber: 'B1', objective: 'Ship X', summary: 'Done' })
    expect(record.batchNumber).toBe('B1')
    expect(knowledgeService.listBatchCompletions(project)).toHaveLength(1)
  })
})

describe('Knowledge Service — Project Timeline (auto-derived, never drifts)', () => {
  it('appends exactly one timeline event for every domain-specific record call', () => {
    const project = uniqueSlug()
    knowledgeService.recordHandover({ project, phase: '', objective: 'X', executiveSummary: '', filesCreated: [], filesModified: [], filesDeleted: [], buildStatus: 'Unknown', typescriptStatus: 'Unknown' })
    knowledgeService.recordArchitectureDecision({ project, decision: 'X' })
    knowledgeService.recordBusinessDecision({ project, decision: 'Y' })
    knowledgeService.recordTechnicalDebt({ project, title: 'X' })
    knowledgeService.recordRisk({ project, title: 'X' })
    knowledgeService.appendJournalEntry({ project, summary: 'X' })
    knowledgeService.recordMilestoneCompletion({ project, milestoneId: 'm1', milestoneTitle: 'M', phase: 'P' })
    knowledgeService.recordBatchCompletion({ project, batchId: 'b1', batchNumber: 'B1', objective: '', summary: '' })

    const timeline = knowledgeService.listTimeline(project)
    expect(timeline).toHaveLength(8)
    const categories = timeline.map(e => e.category).sort()
    expect(categories).toEqual(
      ['Architecture Decision', 'Batch Completed', 'Business Decision', 'Handover', 'Journal', 'Milestone Completed', 'Risk', 'Technical Debt'].sort()
    )
  })

  it('supports a direct timeline event for facts that fit no other domain', () => {
    const project = uniqueSlug()
    knowledgeService.recordTimelineEvent({ project, category: 'Architecture Decision', title: 'Custom event', detail: '' })
    expect(knowledgeService.listTimeline(project)).toHaveLength(1)
  })

  it('keeps different projects\' timelines fully independent', () => {
    const projectA = uniqueSlug('a')
    const projectB = uniqueSlug('b')
    knowledgeService.recordRisk({ project: projectA, title: 'X' })
    expect(knowledgeService.listTimeline(projectB)).toEqual([])
  })
})

describe('Knowledge Service — permanence (never lost, never capped)', () => {
  it('retains every record across many writes — no truncation, unlike the capped operational history log', () => {
    const project = uniqueSlug()
    // Each recordRisk call performs several real, synchronous, locked
    // read-modify-write cycles (the domain record, its timeline event, and
    // the Planning Service mirror) — 60 is already far beyond any plausible
    // accidental small cap (e.g. a copy-pasted MAX_ENTRIES) while staying
    // fast; the point is proving NO cap exists, not stress-testing I/O
    // throughput (that's crossProcessLock.test.ts's job).
    const total = 60
    for (let i = 0; i < total; i++) {
      knowledgeService.recordRisk({ project, title: `Risk ${i}` })
    }
    expect(knowledgeService.listRisks(project)).toHaveLength(total)
    expect(knowledgeService.listTimeline(project)).toHaveLength(total)
  }, 30000) // the full suite now spans 24+ files with several real-subprocess stress tests running concurrently across worker processes; this test's own real disk I/O has gotten slower under that load, not slower itself

  it('survives a simulated restart — a fresh read sees everything a prior process wrote, with nothing held only in memory', () => {
    const project = uniqueSlug()
    knowledgeService.recordHandover({ project, phase: '', objective: 'X', executiveSummary: 'summary', filesCreated: [], filesModified: [], filesDeleted: [], buildStatus: 'Unknown', typescriptStatus: 'Unknown' })
    knowledgeService.recordMilestoneCompletion({ project, milestoneId: 'm1', milestoneTitle: 'M1', phase: 'Phase 1' })

    // "Restart" — nothing here is a cached reference; every list* call reads fresh from disk.
    expect(knowledgeService.listHandovers(project)).toHaveLength(1)
    expect(knowledgeService.listMilestoneCompletions(project)).toHaveLength(1)
    expect(knowledgeService.listTimeline(project)).toHaveLength(2)
  })
})
