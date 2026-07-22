import { describe, it, expect } from 'vitest'
import { buildExecutionIdentity, executionIdentityKey } from '../../../lib/dev/runtime/executionIdentity'
import type { DevelopmentSession } from '../../../lib/dev/developmentOrchestrator'
import type { GitIntelligence } from '../../../lib/dev/gitIntelligence'

function baseSession(overrides: Partial<DevelopmentSession> = {}): DevelopmentSession {
  return {
    project: { slug: 'acme', name: 'Acme' } as DevelopmentSession['project'],
    currentPhase: 'Phase 1',
    currentMilestone: { id: 'm1', title: 'Milestone 1' } as DevelopmentSession['currentMilestone'],
    currentBatch: {
      id: 'b1', batchNumber: 'B1', status: 'Active', updatedAt: '2026-01-01T00:00:00.000Z',
    } as DevelopmentSession['currentBatch'],
    ...overrides,
  } as DevelopmentSession
}

describe('Execution Identity — buildExecutionIdentity', () => {
  it('builds identity fields from the session, batch, and options', () => {
    const identity = buildExecutionIdentity(baseSession(), { runtimeJobId: 'job-1', ceoDecision: 'Approved', knowledgeVersion: 'dna:x@1|mem:y' })
    expect(identity.project).toBe('acme')
    expect(identity.product).toBe('Acme')
    expect(identity.phase).toBe('Phase 1')
    expect(identity.milestoneId).toBe('m1')
    expect(identity.batchId).toBe('b1')
    expect(identity.batchNumber).toBe('B1')
    expect(identity.batchVersion).toBe('2026-01-01T00:00:00.000Z')
    expect(identity.batchStatus).toBe('Active')
    expect(identity.runtimeJobId).toBe('job-1')
    expect(identity.ceoDecision).toBe('Approved')
    expect(identity.knowledgeVersion).toBe('dna:x@1|mem:y')
  })

  it('falls back to "None" batchVersion/batchStatus when there is no current batch', () => {
    const identity = buildExecutionIdentity(baseSession({ currentBatch: null }))
    expect(identity.batchId).toBeNull()
    expect(identity.batchVersion).toBe('None')
    expect(identity.batchStatus).toBe('None')
  })

  it('defaults ceoDecision to Pending and knowledgeVersion to Unknown when omitted', () => {
    const identity = buildExecutionIdentity(baseSession())
    expect(identity.ceoDecision).toBe('Pending')
    expect(identity.knowledgeVersion).toBe('Unknown')
    expect(identity.runtimeJobId).toBeNull()
  })

  it('normalizes an "Unavailable" git commit hash to null', () => {
    const git = { commitHash: 'Unavailable' } as GitIntelligence
    const identity = buildExecutionIdentity(baseSession(), { git })
    expect(identity.repositoryCommit).toBeNull()
  })

  it('carries through a real git commit hash unchanged', () => {
    const git = { commitHash: 'abc123' } as GitIntelligence
    const identity = buildExecutionIdentity(baseSession(), { git })
    expect(identity.repositoryCommit).toBe('abc123')
  })
})

describe('Execution Identity — executionIdentityKey (recurrence-detection comparison key)', () => {
  it('produces an identical key for two identities built from unchanged inputs', () => {
    const a = buildExecutionIdentity(baseSession(), { knowledgeVersion: 'k1' })
    const b = buildExecutionIdentity(baseSession(), { knowledgeVersion: 'k1' })
    expect(executionIdentityKey(a)).toBe(executionIdentityKey(b))
  })

  it('changes when the batch version (batch.updatedAt) changes', () => {
    const a = buildExecutionIdentity(baseSession())
    const b = buildExecutionIdentity(
      baseSession({ currentBatch: { id: 'b1', batchNumber: 'B1', status: 'Active', updatedAt: '2026-02-01T00:00:00.000Z' } as DevelopmentSession['currentBatch'] })
    )
    expect(executionIdentityKey(a)).not.toBe(executionIdentityKey(b))
  })

  it('changes when the repository commit changes', () => {
    const a = buildExecutionIdentity(baseSession(), { git: { commitHash: 'aaa' } as GitIntelligence })
    const b = buildExecutionIdentity(baseSession(), { git: { commitHash: 'bbb' } as GitIntelligence })
    expect(executionIdentityKey(a)).not.toBe(executionIdentityKey(b))
  })

  it('changes when the knowledge version changes', () => {
    const a = buildExecutionIdentity(baseSession(), { knowledgeVersion: 'k1' })
    const b = buildExecutionIdentity(baseSession(), { knowledgeVersion: 'k2' })
    expect(executionIdentityKey(a)).not.toBe(executionIdentityKey(b))
  })

  it('is unaffected by runtimeJobId, executionTimestamp, or ceoDecision — the fields every run varies by definition', () => {
    const a = buildExecutionIdentity(baseSession(), { runtimeJobId: 'job-1', ceoDecision: 'Approved', knowledgeVersion: 'k1' })
    const b = buildExecutionIdentity(baseSession(), { runtimeJobId: 'job-2', ceoDecision: 'Pending', knowledgeVersion: 'k1' })
    expect(a.runtimeJobId).not.toBe(b.runtimeJobId)
    expect(a.ceoDecision).not.toBe(b.ceoDecision)
    expect(executionIdentityKey(a)).toBe(executionIdentityKey(b))
  })

  it('substitutes "none" for null milestoneId/batchId/repositoryCommit rather than leaving gaps', () => {
    const identity = buildExecutionIdentity(baseSession({ currentMilestone: null, currentBatch: null }))
    // planningVersion (Version 2.0 Milestone 2.2) defaults to 0 when not supplied.
    expect(executionIdentityKey(identity)).toBe(['acme', 'none', 'none', 'None', 'none', 'Unknown', 0].join('::'))
  })

  it('changes when planningVersion changes, independent of knowledgeVersion', () => {
    const a = buildExecutionIdentity(baseSession(), { knowledgeVersion: 'k1', planningVersion: 1 })
    const b = buildExecutionIdentity(baseSession(), { knowledgeVersion: 'k1', planningVersion: 2 })
    expect(executionIdentityKey(a)).not.toBe(executionIdentityKey(b))
  })
})

// computeKnowledgeVersion moved to lib/dev/knowledge/knowledgeVersion.ts as
// part of Version 2.0 Milestone 2.1 — see tests/dev/knowledge/knowledgeVersion.test.ts.
// It is no longer defined here, and no longer takes a browser-supplied
// RelevantKnowledge blob (see that module's doc comment for why).
