import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { computeKnowledgeVersion } from '../../../lib/dev/knowledge/knowledgeVersion'
import * as knowledgeService from '../../../lib/dev/knowledge/knowledgeService'
import { appendDNAEntry } from '../../../lib/dev/learning/learningStorage'
import type { EngineeringDNAEntry } from '../../../lib/dev/learning/learningTypes'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function dnaEntry(overrides: Partial<EngineeringDNAEntry> = {}): EngineeringDNAEntry {
  return {
    id: 'dna1', productSlug: 'proj', category: 'Architecture', title: 'Use Postgres', description: '',
    evidenceExecutionIds: [], version: 1, createdAt: new Date().toISOString(), supersedes: null, ...overrides,
  }
}

describe('Knowledge Version — the one authoritative algorithm', () => {
  it('is stable across repeated calls when nothing has changed (restart stability)', () => {
    const project = uniqueSlug()
    knowledgeService.recordRisk({ project, title: 'X' })
    const v1 = computeKnowledgeVersion(project)
    const v2 = computeKnowledgeVersion(project)
    expect(v1).toBe(v2)
  })

  it('is unaffected by wall-clock time passing — no timestamp is ever embedded', async () => {
    const project = uniqueSlug()
    knowledgeService.recordRisk({ project, title: 'X' })
    const before = computeKnowledgeVersion(project)
    await new Promise(resolve => setTimeout(resolve, 30))
    const after = computeKnowledgeVersion(project)
    expect(before).toBe(after)
  })

  it('changes when a new Architecture Decision is recorded', () => {
    const project = uniqueSlug()
    const before = computeKnowledgeVersion(project)
    knowledgeService.recordArchitectureDecision({ project, decision: 'X' })
    expect(computeKnowledgeVersion(project)).not.toBe(before)
  })

  it('changes when a new Business Decision is recorded', () => {
    const project = uniqueSlug()
    const before = computeKnowledgeVersion(project)
    knowledgeService.recordBusinessDecision({ project, decision: 'X' })
    expect(computeKnowledgeVersion(project)).not.toBe(before)
  })

  it('changes when Technical Debt, a Risk, a Handover, a Journal entry, or a completion is recorded', () => {
    const project = uniqueSlug()
    let previous = computeKnowledgeVersion(project)

    knowledgeService.recordTechnicalDebt({ project, title: 'X' })
    let next = computeKnowledgeVersion(project)
    expect(next).not.toBe(previous)
    previous = next

    knowledgeService.recordRisk({ project, title: 'X' })
    next = computeKnowledgeVersion(project)
    expect(next).not.toBe(previous)
    previous = next

    knowledgeService.recordHandover({ project, phase: '', objective: '', executiveSummary: '', filesCreated: [], filesModified: [], filesDeleted: [], buildStatus: 'Unknown', typescriptStatus: 'Unknown' })
    next = computeKnowledgeVersion(project)
    expect(next).not.toBe(previous)
    previous = next

    knowledgeService.appendJournalEntry({ project, summary: 'X' })
    next = computeKnowledgeVersion(project)
    expect(next).not.toBe(previous)
    previous = next

    knowledgeService.recordBatchCompletion({ project, batchId: 'b1', batchNumber: 'B1', objective: '', summary: '' })
    next = computeKnowledgeVersion(project)
    expect(next).not.toBe(previous)
    previous = next

    knowledgeService.recordMilestoneCompletion({ project, milestoneId: 'm1', milestoneTitle: 'M', phase: 'P' })
    next = computeKnowledgeVersion(project)
    expect(next).not.toBe(previous)
  })

  it('changes when the project\'s DNA profile gains a new entry', () => {
    const project = uniqueSlug()
    const before = computeKnowledgeVersion(project)
    appendDNAEntry(dnaEntry({ productSlug: project }))
    expect(computeKnowledgeVersion(project)).not.toBe(before)
  })

  it('changes when a DNA entry is superseded by a new version, even though the logical entry count is unchanged', () => {
    const project = uniqueSlug()
    appendDNAEntry(dnaEntry({ id: 'dna1', productSlug: project, version: 1 }))
    const v1 = computeKnowledgeVersion(project)
    appendDNAEntry(dnaEntry({ id: 'dna2', productSlug: project, version: 2, supersedes: 'dna1' }))
    const v2 = computeKnowledgeVersion(project)
    expect(v1).not.toBe(v2)
  })

  it('keeps two different projects\' versions fully independent', () => {
    const projectA = uniqueSlug('a')
    const projectB = uniqueSlug('b')
    const baseline = computeKnowledgeVersion(projectB)
    knowledgeService.recordRisk({ project: projectA, title: 'X' })
    expect(computeKnowledgeVersion(projectB)).toBe(baseline)
  })

  it('is not affected by a DNA profile belonging to a different project', () => {
    const projectA = uniqueSlug('a')
    const projectB = uniqueSlug('b')
    const baseline = computeKnowledgeVersion(projectB)
    appendDNAEntry(dnaEntry({ productSlug: projectA }))
    expect(computeKnowledgeVersion(projectB)).toBe(baseline)
  })
})
