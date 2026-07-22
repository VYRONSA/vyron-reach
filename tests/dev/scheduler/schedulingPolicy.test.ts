import { describe, it, expect } from 'vitest'
import { evaluateEligibility, computePriorityScore, rankProjects, type SchedulingFactorInputs } from '../../../lib/dev/scheduler/schedulingPolicy'
import type { ProjectSchedulingInfo } from '../../../lib/dev/scheduler/schedulerTypes'

function factors(overrides: Partial<SchedulingFactorInputs> = {}): SchedulingFactorInputs {
  return {
    project: 'acme',
    engineeringHealth: 'Healthy',
    riskLevel: 'Low',
    outstandingCeoDecisions: 0,
    projectStatus: 'active',
    recoveryFrequencyRisk: 'Low',
    lastExecutedAt: '2026-01-01T00:00:00.000Z',
    now: '2026-01-01T00:01:00.000Z',
    ...overrides,
  }
}

describe('Scheduling Policy — eligibility', () => {
  it('is Running for a project already Running or Planning', () => {
    expect(evaluateEligibility('Running', true, false)).toBe('Running')
    expect(evaluateEligibility('Planning', true, false)).toBe('Running')
  })

  it('is Blocked / WaitingForCeo for those exact Director states, regardless of available work', () => {
    expect(evaluateEligibility('Blocked', true, false)).toBe('Blocked')
    expect(evaluateEligibility('Blocked', false, false)).toBe('Blocked')
    expect(evaluateEligibility('Waiting for CEO', true, false)).toBe('WaitingForCeo')
  })

  it('is NoWork for an Idle project with nothing to do', () => {
    expect(evaluateEligibility('Idle', false, false)).toBe('NoWork')
  })

  it('is Completed for a Completed project with nothing left to do', () => {
    expect(evaluateEligibility('Completed', false, false)).toBe('Completed')
  })

  it('is Eligible for an Idle or Completed project that has available work — a Completed project can become schedulable again', () => {
    expect(evaluateEligibility('Idle', true, false)).toBe('Eligible')
    expect(evaluateEligibility('Completed', true, false)).toBe('Eligible')
  })

  it('is Eligible for a Cancelled project with available work too', () => {
    expect(evaluateEligibility('Cancelled', true, false)).toBe('Eligible')
  })

  it('is AwaitingGo for an Idle project with available work still awaiting its first Executive Go decision — never Eligible until that decision is made', () => {
    expect(evaluateEligibility('Idle', true, true)).toBe('AwaitingGo')
  })

  it('Blocked / WaitingForCeo / Running still take precedence over AwaitingGo — a Director state fact always outranks the Go/Hold gate', () => {
    expect(evaluateEligibility('Blocked', true, true)).toBe('Blocked')
    expect(evaluateEligibility('Waiting for CEO', true, true)).toBe('WaitingForCeo')
    expect(evaluateEligibility('Running', true, true)).toBe('Running')
  })
})

describe('Scheduling Policy — priority score is deterministic', () => {
  it('identical inputs always produce an identical score', () => {
    const input = factors()
    expect(computePriorityScore(input).score).toBe(computePriorityScore(input).score)
  })

  it('never reads the wall clock internally — only the explicit `now` input affects staleness', () => {
    const a = computePriorityScore(factors({ now: '2026-01-01T00:01:00.000Z' }))
    const b = computePriorityScore(factors({ now: '2026-01-01T00:01:00.000Z' }))
    expect(a.score).toBe(b.score)
  })
})

describe('Scheduling Policy — factor contributions', () => {
  it('a worse Engineering Health increases the score', () => {
    const healthy = computePriorityScore(factors({ engineeringHealth: 'Healthy' })).score
    const critical = computePriorityScore(factors({ engineeringHealth: 'Critical' })).score
    expect(critical).toBeGreaterThan(healthy)
  })

  it('a higher Risk Level increases the score', () => {
    const low = computePriorityScore(factors({ riskLevel: 'Low' })).score
    const high = computePriorityScore(factors({ riskLevel: 'High' })).score
    expect(high).toBeGreaterThan(low)
  })

  it('an "active" project outranks a "paused" one, all else equal', () => {
    const active = computePriorityScore(factors({ projectStatus: 'active' })).score
    const paused = computePriorityScore(factors({ projectStatus: 'paused' })).score
    expect(active).toBeGreaterThan(paused)
  })

  it('a High recovery-frequency risk (flaky/unstable) decreases the score', () => {
    const stable = computePriorityScore(factors({ recoveryFrequencyRisk: 'Low' })).score
    const flaky = computePriorityScore(factors({ recoveryFrequencyRisk: 'High' })).score
    expect(flaky).toBeLessThan(stable)
  })

  it('more outstanding CEO decisions increases the score, capped so it cannot dominate everything else', () => {
    const none = computePriorityScore(factors({ outstandingCeoDecisions: 0 })).score
    const some = computePriorityScore(factors({ outstandingCeoDecisions: 3 })).score
    const many = computePriorityScore(factors({ outstandingCeoDecisions: 1000 })).score
    expect(some).toBeGreaterThan(none)
    expect(many).toBe(computePriorityScore(factors({ outstandingCeoDecisions: 5 })).score) // caps at 5
  })
})

describe('Scheduling Policy — fairness / starvation prevention', () => {
  it('a project that has never run outranks a Critical-health project that has run recently', () => {
    const neverRun = computePriorityScore(factors({ engineeringHealth: 'Healthy', riskLevel: 'Low', lastExecutedAt: null })).score
    const criticalButRecent = computePriorityScore(
      factors({ engineeringHealth: 'Critical', riskLevel: 'High', lastExecutedAt: '2026-01-01T00:00:59.000Z', now: '2026-01-01T00:01:00.000Z' })
    ).score
    expect(neverRun).toBeGreaterThan(criticalButRecent)
  })

  it('given enough elapsed wait time, a Healthy/Low-risk project eventually outranks a Critical/High-risk project that ran recently — no ceiling on the other factors can permanently win', () => {
    const recentCritical = computePriorityScore(
      factors({ engineeringHealth: 'Critical', riskLevel: 'High', projectStatus: 'active', lastExecutedAt: '2026-01-01T00:00:00.000Z', now: '2026-01-01T00:00:30.000Z' })
    ).score

    // The same "recently ran" project's own maximum possible non-staleness
    // score is a fixed ceiling — waiting long enough must cross it.
    const staleHealthy = computePriorityScore(
      factors({ engineeringHealth: 'Healthy', riskLevel: 'Low', projectStatus: 'paused', lastExecutedAt: '2026-01-01T00:00:00.000Z', now: '2026-01-05T00:00:00.000Z' })
    ).score

    expect(staleHealthy).toBeGreaterThan(recentCritical)
  })

  it('staleness alone grows monotonically with elapsed time', () => {
    const early = computePriorityScore(factors({ lastExecutedAt: '2026-01-01T00:00:00.000Z', now: '2026-01-01T00:01:00.000Z' })).score
    const later = computePriorityScore(factors({ lastExecutedAt: '2026-01-01T00:00:00.000Z', now: '2026-01-01T01:00:00.000Z' })).score
    expect(later).toBeGreaterThan(early)
  })
})

describe('Scheduling Policy — ranking', () => {
  function info(project: string, priorityScore: number): ProjectSchedulingInfo {
    return { project, eligibility: 'Eligible', priorityScore, factors: [] }
  }

  it('ranks by priority score descending', () => {
    const ranked = rankProjects([info('low', 10), info('high', 100), info('mid', 50)])
    expect(ranked.map(i => i.project)).toEqual(['high', 'mid', 'low'])
  })

  it('breaks ties deterministically by project slug — never by insertion/iteration order', () => {
    const ranked1 = rankProjects([info('zebra', 50), info('alpha', 50), info('mango', 50)])
    const ranked2 = rankProjects([info('mango', 50), info('zebra', 50), info('alpha', 50)])
    expect(ranked1.map(i => i.project)).toEqual(['alpha', 'mango', 'zebra'])
    expect(ranked2.map(i => i.project)).toEqual(ranked1.map(i => i.project))
  })
})
