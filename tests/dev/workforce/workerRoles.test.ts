import { describe, it, expect } from 'vitest'
import { WORKER_ROLE_REGISTRY, ALL_WORKER_ROLES, getWorkerRoleConfig, matchWorkerRoles } from '../../../lib/dev/director/workforce/workerRoles'
import type { WorkerRole } from '../../../lib/dev/director/workforce/workforceTypes'

const EXPECTED_ROLES: WorkerRole[] = [
  'Architecture Engineer',
  'Backend Engineer',
  'Frontend Engineer',
  'Database Engineer',
  'QA Engineer',
  'DevOps Engineer',
  'Documentation Engineer',
]

describe('Worker Role registry — the 7 required roles', () => {
  it('registers exactly the 7 roles the mission requires', () => {
    expect(ALL_WORKER_ROLES.sort()).toEqual([...EXPECTED_ROLES].sort())
  })

  it('every registered role has non-empty responsibilities and boundaries', () => {
    for (const config of WORKER_ROLE_REGISTRY) {
      expect(config.responsibilities.trim()).not.toBe('')
      expect(config.boundaries.trim()).not.toBe('')
      expect(config.domainKeywords.length).toBeGreaterThan(0)
    }
  })

  it('getWorkerRoleConfig returns the matching config for every role', () => {
    for (const role of EXPECTED_ROLES) {
      expect(getWorkerRoleConfig(role).role).toBe(role)
    }
  })

  it('getWorkerRoleConfig throws for an unregistered role — never silently returns undefined', () => {
    expect(() => getWorkerRoleConfig('Not A Real Role' as WorkerRole)).toThrow()
  })
})

describe('Worker Role registry — domain matching (configuration, not hardcoded logic)', () => {
  it('matches Database Engineer for schema/migration language', () => {
    expect(matchWorkerRoles('Add a migration for the new schema table')).toContain('Database Engineer')
  })

  it('matches QA Engineer for test/regression language', () => {
    expect(matchWorkerRoles('Fix the regression in the build')).toContain('QA Engineer')
  })

  it('matches DevOps Engineer for deployment/CI language', () => {
    expect(matchWorkerRoles('Update the CI pipeline deployment config')).toContain('DevOps Engineer')
  })

  it('matches Documentation Engineer for docs language', () => {
    expect(matchWorkerRoles('Update the README documentation')).toContain('Documentation Engineer')
  })

  it('is case-insensitive', () => {
    expect(matchWorkerRoles('ADD A NEW API ENDPOINT')).toContain('Backend Engineer')
  })

  it('returns an empty array when nothing matches, rather than guessing', () => {
    expect(matchWorkerRoles('xyzzy plugh qwerty')).toEqual([])
  })

  it('a batch touching multiple domains matches multiple roles, in registry order', () => {
    const matches = matchWorkerRoles('Refactor the architecture and update the API endpoint')
    expect(matches).toContain('Architecture Engineer')
    expect(matches).toContain('Backend Engineer')
    expect(matches.indexOf('Architecture Engineer')).toBeLessThan(matches.indexOf('Backend Engineer'))
  })
})
