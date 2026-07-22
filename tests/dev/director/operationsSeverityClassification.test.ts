import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { classifySeverity } from '../../../lib/dev/director/operations/operationsMonitoringService'
import {
  checkDeploymentMonitoring,
  checkServiceHealth,
  checkApplicationHealth,
  checkErrorMonitoring,
  checkPerformanceMonitoring,
  checkAvailabilityMonitoring,
} from '../../../lib/dev/director/operations/operationsMonitoringRunners'
import { recordVerification, recordRelease } from '../../../lib/dev/knowledge/knowledgeService'
import type { OperationalCheckResult } from '../../../lib/dev/director/operations/operationsMonitoringTypes'
import type { ReleaseRequest } from '../../../lib/dev/director/releaseManagement/releaseManagementTypes'

/**
 * Wave 4 (Testing Gaps) — Operations' incident-severity classification
 * and its six health checks previously had zero direct unit test
 * coverage anywhere in this repo (only exercised indirectly, at the two
 * extremes, via tests/dev/director/operationsEventPublishing.test.ts's
 * fully-failing/fully-healthy fetch stubs). These tests exercise the real
 * classifySeverity decision function and each of the six check functions
 * in operationsMonitoringRunners.ts directly, including the Medium/Low
 * branches nothing previously reached.
 */

function check(overrides: Partial<OperationalCheckResult> = {}): OperationalCheckResult {
  return { check: 'Deployment Monitoring', status: 'Healthy', summary: '', detail: '', durationMs: null, ...overrides }
}

describe('classifySeverity — decision logic (Wave 4)', () => {
  it('returns null when every check is Healthy or Not Applicable', () => {
    const checks = [
      check({ check: 'Service Health Monitoring', status: 'Healthy' }),
      check({ check: 'Application Health Monitoring', status: 'Healthy' }),
      check({ check: 'Performance Monitoring', status: 'Not Applicable' }),
    ]
    expect(classifySeverity(checks)).toBeNull()
  })

  it('Service Health Monitoring Down is Critical', () => {
    const checks = [check({ check: 'Service Health Monitoring', status: 'Down' })]
    expect(classifySeverity(checks)).toBe('Critical')
  })

  it('Application Health Monitoring Down is Critical', () => {
    const checks = [check({ check: 'Application Health Monitoring', status: 'Down' })]
    expect(classifySeverity(checks)).toBe('Critical')
  })

  it('Application Health Monitoring Degraded (with everything else healthy) is High', () => {
    const checks = [check({ check: 'Application Health Monitoring', status: 'Degraded' })]
    expect(classifySeverity(checks)).toBe('High')
  })

  it('Performance Monitoring Down (with everything else healthy) is High', () => {
    const checks = [check({ check: 'Performance Monitoring', status: 'Down' })]
    expect(classifySeverity(checks)).toBe('High')
  })

  it('Error Monitoring Down (with everything else healthy) is Medium', () => {
    const checks = [check({ check: 'Error Monitoring', status: 'Down' })]
    expect(classifySeverity(checks)).toBe('Medium')
  })

  it('any other Degraded check (with nothing worse present) is Low', () => {
    const checks = [check({ check: 'Availability Monitoring', status: 'Degraded' })]
    expect(classifySeverity(checks)).toBe('Low')
  })

  it('Critical takes priority over High and Medium when multiple conditions are present simultaneously', () => {
    const checks = [
      check({ check: 'Service Health Monitoring', status: 'Down' }),
      check({ check: 'Performance Monitoring', status: 'Down' }),
      check({ check: 'Error Monitoring', status: 'Down' }),
    ]
    expect(classifySeverity(checks)).toBe('Critical')
  })

  it('High takes priority over Medium and Low when both are present', () => {
    const checks = [
      check({ check: 'Application Health Monitoring', status: 'Degraded' }),
      check({ check: 'Error Monitoring', status: 'Down' }),
      check({ check: 'Availability Monitoring', status: 'Degraded' }),
    ]
    expect(classifySeverity(checks)).toBe('High')
  })

  it('Medium takes priority over Low when both are present', () => {
    const checks = [
      check({ check: 'Error Monitoring', status: 'Down' }),
      check({ check: 'Availability Monitoring', status: 'Degraded' }),
    ]
    expect(classifySeverity(checks)).toBe('Medium')
  })
})

describe('checkDeploymentMonitoring (Wave 4)', () => {
  it('is always Healthy and reports the release version and age', () => {
    const release = { version: '1.2.3', deploymentUrl: 'https://x.test', commitSha: 'abc1234', updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() } as ReleaseRequest
    const result = checkDeploymentMonitoring(release)
    expect(result.status).toBe('Healthy')
    expect(result.summary).toContain('1.2.3')
    expect(result.summary).toMatch(/~3h/)
  })
})

describe('checkServiceHealth (Wave 4)', () => {
  it('is Healthy when the probe succeeded', () => {
    const result = checkServiceHealth({ ok: true, status: 200, latencyMs: 50, error: null })
    expect(result.status).toBe('Healthy')
  })

  it('is Down when the probe failed', () => {
    const result = checkServiceHealth({ ok: false, status: null, latencyMs: 0, error: 'timeout' })
    expect(result.status).toBe('Down')
    expect(result.detail).toContain('timeout')
  })
})

describe('checkApplicationHealth (Wave 4)', () => {
  it('is Down when the probe failed outright', () => {
    const result = checkApplicationHealth({ ok: false, status: null, latencyMs: 0, error: 'connection refused' })
    expect(result.status).toBe('Down')
  })

  it('is Healthy on a genuine 2xx response', () => {
    const result = checkApplicationHealth({ ok: true, status: 200, latencyMs: 40, error: null })
    expect(result.status).toBe('Healthy')
  })

  it('is Degraded on a reachable but non-2xx response', () => {
    const result = checkApplicationHealth({ ok: true, status: 503, latencyMs: 40, error: null })
    expect(result.status).toBe('Degraded')
    expect(result.summary).toContain('503')
  })
})

describe('checkPerformanceMonitoring (Wave 4)', () => {
  it('is Not Applicable when there was no response to measure', () => {
    const result = checkPerformanceMonitoring({ ok: false, status: null, latencyMs: 0, error: 'timeout' })
    expect(result.status).toBe('Not Applicable')
  })

  it('is Healthy under 1000ms', () => {
    expect(checkPerformanceMonitoring({ ok: true, status: 200, latencyMs: 200, error: null }).status).toBe('Healthy')
  })

  it('is Degraded between 1000ms and 5000ms', () => {
    expect(checkPerformanceMonitoring({ ok: true, status: 200, latencyMs: 2500, error: null }).status).toBe('Degraded')
  })

  it('is Down at or above 5000ms', () => {
    expect(checkPerformanceMonitoring({ ok: true, status: 200, latencyMs: 6000, error: null }).status).toBe('Down')
  })
})

describe('checkAvailabilityMonitoring (Wave 4)', () => {
  it('is Healthy with no incident history', () => {
    expect(checkAvailabilityMonitoring([]).status).toBe('Healthy')
  })

  it('is Healthy when recent incidents exist but none were High/Critical', () => {
    expect(checkAvailabilityMonitoring(['Low', 'Low', 'Medium']).status).toBe('Healthy')
  })

  it('is Degraded with exactly one recent High/Critical incident', () => {
    expect(checkAvailabilityMonitoring(['Low', 'High']).status).toBe('Degraded')
  })

  it('is Down with two or more recent High/Critical incidents', () => {
    expect(checkAvailabilityMonitoring(['Critical', 'High', 'Low']).status).toBe('Down')
  })
})

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

describe('checkErrorMonitoring (Wave 4) — real recorded verification/release outcomes', () => {
  it('is Healthy with zero recent failures', () => {
    const project = uniqueSlug()
    const result = checkErrorMonitoring(project)
    expect(result.status).toBe('Healthy')
    expect(result.summary).toContain('0 recent failed verification(s), 0 recent failed release(s)')
  })

  it('is Degraded with 1-2 recent failures combined', () => {
    const project = uniqueSlug()
    recordVerification({ project, passed: false, durationMs: 10, activities: [{ activity: 'Build', status: 'Failed', summary: 'x' }] })

    const result = checkErrorMonitoring(project)
    expect(result.status).toBe('Degraded')
  })

  it('is Down with more than 2 recent failures combined', () => {
    const project = uniqueSlug()
    recordVerification({ project, passed: false, durationMs: 10, activities: [{ activity: 'Build', status: 'Failed', summary: 'x' }] })
    recordVerification({ project, passed: false, durationMs: 10, activities: [{ activity: 'Build', status: 'Failed', summary: 'x' }] })
    recordRelease({ project, version: '1.0.1', passed: false, durationMs: 10, activities: [{ activity: 'Release Preparation', status: 'Failed', summary: 'x' }] })

    const result = checkErrorMonitoring(project)
    expect(result.status).toBe('Down')
  })

  it('never mixes in another project\'s failures', () => {
    const projectA = uniqueSlug('a')
    const projectB = uniqueSlug('b')
    recordVerification({ project: projectB, passed: false, durationMs: 10, activities: [{ activity: 'Build', status: 'Failed', summary: 'x' }] })

    expect(checkErrorMonitoring(projectA).status).toBe('Healthy')
    expect(checkErrorMonitoring(projectB).status).toBe('Degraded')
  })
})
