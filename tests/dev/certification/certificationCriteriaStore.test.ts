import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, type IsolatedDataDir } from '../support/testHarness'
import {
  listCertificationCriteria,
  getCertificationCriteria,
  createCertificationCriteria,
  updateCertificationCriteria,
  deleteCertificationCriteria,
  listCertificationCriteriaHistory,
  selectCriteria,
} from '../../../lib/dev/certification/certificationCriteriaStore'
import type { CreateCertificationCriteriaInput } from '../../../lib/dev/certification/certificationCriteriaStore'

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function input(overrides: Partial<CreateCertificationCriteriaInput> = {}): CreateCertificationCriteriaInput {
  return {
    name: 'custom',
    enabled: true,
    project: 'acme',
    maxInterventionsForAutonomous: 1,
    maxInterventionsForAssisted: 5,
    requireAtLeastOneCompletedTask: true,
    recoveryDisqualifiesAutonomous: false,
    ...overrides,
  }
}

describe('Certification Criteria Store — defaults', () => {
  it('seeds exactly one default criteria record when never written', () => {
    const all = listCertificationCriteria()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('default')
    expect(all[0].project).toBeNull()
  })
})

describe('Certification Criteria Store — CRUD', () => {
  it('creates, reads, updates, and deletes a criteria record', () => {
    const created = createCertificationCriteria(input())
    expect(getCertificationCriteria(created.id)?.name).toBe('custom')

    const updated = updateCertificationCriteria(created.id, { maxInterventionsForAutonomous: 9 }, 'owner')
    expect(updated?.maxInterventionsForAutonomous).toBe(9)
    expect(updated?.createdAt).toBe(created.createdAt)

    expect(deleteCertificationCriteria(created.id, 'owner')).toBe(true)
    expect(getCertificationCriteria(created.id)).toBeNull()
  })

  it('updating/deleting a nonexistent id is a safe no-op', () => {
    expect(updateCertificationCriteria('nope', { name: 'x' }, 'owner')).toBeNull()
    expect(deleteCertificationCriteria('nope', 'owner')).toBe(false)
  })

  it('configuration changes take effect immediately — a fresh read sees the update', () => {
    const created = createCertificationCriteria(input({ maxInterventionsForAssisted: 5 }))
    updateCertificationCriteria(created.id, { maxInterventionsForAssisted: 99 }, 'owner')
    expect(getCertificationCriteria(created.id)?.maxInterventionsForAssisted).toBe(99)
  })
})

describe('Certification Criteria Store — attributed history (PRA-P1-030)', () => {
  it('records the actor and the full prior value on update, without overwriting earlier entries', () => {
    const created = createCertificationCriteria(input({ maxInterventionsForAssisted: 5 }))

    updateCertificationCriteria(created.id, { maxInterventionsForAssisted: 10 }, 'alice')
    updateCertificationCriteria(created.id, { maxInterventionsForAssisted: 20 }, 'bob')

    const history = listCertificationCriteriaHistory(created.id)
    expect(history).toHaveLength(2)
    expect(history.map(h => h.changedBy)).toEqual(['bob', 'alice'])
    expect(history.map(h => h.changeType)).toEqual(['Updated', 'Updated'])
    // Most recent entry's "previous" is the value right before it — the 10, not the original 5.
    expect(history[0].previous.maxInterventionsForAssisted).toBe(10)
    expect(history[1].previous.maxInterventionsForAssisted).toBe(5)
  })

  it('records a Deleted entry with the full record as it stood at deletion time', () => {
    const created = createCertificationCriteria(input({ name: 'to-delete' }))
    deleteCertificationCriteria(created.id, 'carol')

    const history = listCertificationCriteriaHistory(created.id)
    expect(history).toHaveLength(1)
    expect(history[0].changeType).toBe('Deleted')
    expect(history[0].changedBy).toBe('carol')
    expect(history[0].previous.name).toBe('to-delete')
  })

  it('a no-op update/delete against a nonexistent id never appends a history entry', () => {
    updateCertificationCriteria('nope', { name: 'x' }, 'owner')
    deleteCertificationCriteria('nope', 'owner')
    expect(listCertificationCriteriaHistory('nope')).toHaveLength(0)
  })
})

describe('Certification Criteria Store — selectCriteria', () => {
  it('prefers a project-specific criteria over the null/wildcard default', () => {
    const specific = createCertificationCriteria(input({ project: 'acme' }))
    const all = listCertificationCriteria()
    expect(selectCriteria('acme', all)?.id).toBe(specific.id)
  })

  it('falls back to the default (null project) when nothing project-specific matches', () => {
    createCertificationCriteria(input({ project: 'other' }))
    const all = listCertificationCriteria()
    expect(selectCriteria('acme', all)?.id).toBe('default')
  })

  it('never selects a disabled criteria', () => {
    const created = createCertificationCriteria(input({ project: 'acme', enabled: false }))
    const all = listCertificationCriteria()
    expect(selectCriteria('acme', all)?.id).not.toBe(created.id)
  })
})
