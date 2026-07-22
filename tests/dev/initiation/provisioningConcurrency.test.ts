import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, waitFor, type IsolatedDataDir } from '../support/testHarness'
import * as planningStateService from '../../../lib/dev/planningState/planningStateService'
import { insertInitiationRequest, getInitiationRequest } from '../../../lib/dev/initiation/initiationStore'
import { computeProgrammeFingerprint } from '../../../lib/dev/initiation/initiationGenerationValidation'
import { runProvisioning, resumeStuckProvisioning } from '../../../lib/dev/initiation/initiationProvisioningService'
import { acquireProvisioningOwnership, releaseProvisioningOwnership } from '../../../lib/dev/initiation/provisioningLock'
import type { GeneratedPlanCandidate, InitiationRequest } from '../../../lib/dev/initiation/initiationTypes'

/**
 * CB-002 remediation — beginProvisioning's CAS (initiationService.ts)
 * deliberately accepts 'Provisioning' as a source status to support
 * crash-resumability (PRA-P1-015), but that same widening let two
 * genuinely overlapping calls for the same InitiationRequest both pass
 * the CAS and both run provisionProgramme concurrently, each creating its
 * own duplicate Planning Service records. provisioningLock.ts closes this
 * with a per-initiation lock, mirroring directorLock.ts's exact pattern
 * (and this file's own test structure mirrors tests/dev/locking/directorLock.test.ts).
 */

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  vi.restoreAllMocks()
  isolated.cleanup()
})

function makeProgramme(): GeneratedPlanCandidate {
  const milestones = [1, 2, 3].map(n => ({
    tempId: `m${n}`, title: `Milestone ${n}`, description: '', phase: 'Phase 1', sequence: n,
  }))
  const batches = milestones.flatMap(m =>
    [1, 2].map(n => ({
      tempId: `${m.tempId}-b${n}`, milestoneRef: m.tempId, batchNumber: `${m.tempId}-B${n}`,
      objective: `Objective for ${m.tempId} batch ${n}`, summary: '', claudePrompt: '', sequence: n,
    }))
  )
  return {
    assessment: {
      summary: 'Summary', scope: 'Scope', feasibilityNotes: '', assumptions: [], openQuestions: [],
      estimatedComplexity: 'Medium', recommendedCategory: 'General', knowledgeSourcesConsidered: [],
    },
    milestones, batches, risks: [], dependencies: [],
  }
}

function seedProject(): string {
  const slug = uniqueSlug()
  planningStateService.createProject({ name: slug, slug, description: '', category: 'test', status: 'planning', progress: 0, color: '#000', icon: 'x' })
  return slug
}

function makeApprovedInitiation(project: string, programme: GeneratedPlanCandidate, overrides: Partial<InitiationRequest> = {}): InitiationRequest {
  const now = new Date().toISOString()
  const fingerprint = computeProgrammeFingerprint(programme)
  const record: InitiationRequest = {
    id: `init_${Math.random().toString(36).slice(2)}`,
    project, directiveTitle: 'Ship the thing', directiveText: 'Ship the thing.', submittedBy: 'ceo',
    status: 'Approved', generationModel: 'test-model', generationAttempts: 1, lastGenerationError: null,
    knowledgeDiscovery: null, generatedProgramme: programme, reviewedProgramme: programme, reviewNotes: '',
    reviewValidation: { fingerprint, validatedAt: now, valid: true, reason: null },
    approvedBy: 'ceo', approvedAt: now, approvedProgrammeFingerprint: fingerprint,
    provisionResult: null, provisioningError: null, cancelledBy: null, cancelledAt: null,
    createdAt: now, updatedAt: now, ...overrides,
  }
  insertInitiationRequest(record)
  return record
}

describe('provisioningLock — per-initiation ownership primitive (CB-002)', () => {
  it('grants ownership to the first caller and refuses every concurrent caller until release', () => {
    const id = uniqueSlug()
    const attempts = 10
    const results = Array.from({ length: attempts }, () => acquireProvisioningOwnership(id))
    const winners = results.filter((r): r is string => r !== null)
    expect(winners).toHaveLength(1)
    expect(results.filter(r => r === null)).toHaveLength(attempts - 1)
  })

  it('allows re-acquisition only after the legitimate owner releases', () => {
    const id = uniqueSlug()
    const owner = acquireProvisioningOwnership(id)
    expect(owner).not.toBeNull()
    expect(acquireProvisioningOwnership(id)).toBeNull()

    releaseProvisioningOwnership(id, owner!)
    const nextOwner = acquireProvisioningOwnership(id)
    expect(nextOwner).not.toBeNull()
    expect(nextOwner).not.toBe(owner)
  })

  it('keeps different initiations fully independent — one holding its lock never blocks another (no unnecessary serialization)', () => {
    const idA = uniqueSlug('a')
    const idB = uniqueSlug('b')
    const ownerA = acquireProvisioningOwnership(idA)
    const ownerB = acquireProvisioningOwnership(idB)
    expect(ownerA).not.toBeNull()
    expect(ownerB).not.toBeNull()
    expect(ownerA).not.toBe(ownerB)
  })

  it('reclaims a stale lock left by a process that is no longer alive (recovery behaviour preserved)', () => {
    const id = uniqueSlug()
    const lockFile = path.join(isolated.dir, 'provisioning-locks', `${id}.lock`)
    fs.mkdirSync(path.dirname(lockFile), { recursive: true })
    const deadPid = 999_999_999
    fs.writeFileSync(lockFile, JSON.stringify({ owner: 'ghost', pid: deadPid, acquiredAt: new Date().toISOString() }), 'utf-8')

    const owner = acquireProvisioningOwnership(id)
    expect(owner).not.toBeNull()
    expect(owner).not.toBe('ghost')
  })

  it('does NOT reclaim a lock held by a still-alive process', () => {
    const id = uniqueSlug()
    const lockFile = path.join(isolated.dir, 'provisioning-locks', `${id}.lock`)
    fs.mkdirSync(path.dirname(lockFile), { recursive: true })
    fs.writeFileSync(lockFile, JSON.stringify({ owner: 'still-alive', pid: process.pid, acquiredAt: new Date().toISOString() }), 'utf-8')

    expect(acquireProvisioningOwnership(id)).toBeNull()
  })
})

describe('Concurrent provisioning requests for the same InitiationRequest (CB-002)', () => {
  it('a second overlapping call, arriving while another holder already owns this exact initiation, does not touch the Planning Service at all', async () => {
    const project = seedProject()
    const programme = makeProgramme()
    const initiation = makeApprovedInitiation(project, programme)

    // Simulate "another request/process is already actively provisioning
    // this exact initiation right now" by holding the lock externally,
    // exactly as a genuinely concurrent runProvisioningWork call would.
    const externalOwner = acquireProvisioningOwnership(initiation.id)
    expect(externalOwner).not.toBeNull()

    const result = await runProvisioning(initiation.id)

    // beginProvisioning's own CAS still ran (harmless — Provisioning to
    // Provisioning), but the actual mutating work never ran a second time.
    expect(result.status).toBe('Provisioning')
    expect(planningStateService.listMilestones(project)).toHaveLength(0)
    expect(planningStateService.listBatches(project)).toHaveLength(0)

    // Once the "other holder" finishes and releases, recovery/resumability
    // still work exactly as before this fix — nothing about the normal
    // path regressed.
    releaseProvisioningOwnership(initiation.id, externalOwner!)
    const resumed = await runProvisioning(initiation.id)
    expect(resumed.status).toBe('Provisioned')
    expect(planningStateService.listMilestones(project)).toHaveLength(3)
    expect(planningStateService.listBatches(project)).toHaveLength(6)
  })

  it('concurrent provisioning requests for two DIFFERENT projects are not serialized against each other', async () => {
    const projectA = seedProject()
    const projectB = seedProject()
    const initiationA = makeApprovedInitiation(projectA, makeProgramme())
    const initiationB = makeApprovedInitiation(projectB, makeProgramme())

    const [resultA, resultB] = await Promise.all([runProvisioning(initiationA.id), runProvisioning(initiationB.id)])

    expect(resultA.status).toBe('Provisioned')
    expect(resultB.status).toBe('Provisioned')
    expect(planningStateService.listMilestones(projectA)).toHaveLength(3)
    expect(planningStateService.listMilestones(projectB)).toHaveLength(3)
  })

  it('resumeStuckProvisioning still recovers a genuinely crashed (lock-free) record after this change', async () => {
    const project = seedProject()
    const programme = makeProgramme()
    const stuck = makeApprovedInitiation(project, programme, { status: 'Provisioning', provisionResult: null })

    // No lock file exists for this id (the "crashed" process never left one
    // behind mid-acquire, or it was already reclaimed) — the normal,
    // already-tested crash-recovery path.
    const { resumed, failed } = await resumeStuckProvisioning()

    expect(resumed).toEqual([stuck.id])
    expect(failed).toEqual([])
    expect(getInitiationRequest(stuck.id)?.status).toBe('Provisioned')
    await waitFor(() => planningStateService.listMilestones(project).length === 3)
  })
})
