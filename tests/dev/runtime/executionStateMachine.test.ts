import { describe, it, expect } from 'vitest'
import { canTransition, assertTransition, isTerminalStatus } from '../../../lib/dev/runtime/executionStateMachine'
import type { JobStatus } from '../../../lib/dev/runtime/runtimeTypes'

const ALL_STATUSES: JobStatus[] = ['Queued', 'Running', 'Validating', 'Completed', 'Updating', 'Rejected', 'Failed', 'Cancelled']

const LEGAL: Record<JobStatus, JobStatus[]> = {
  Queued: ['Running', 'Cancelled'],
  Running: ['Validating', 'Failed', 'Cancelled'],
  Validating: ['Completed', 'Failed', 'Cancelled'],
  Completed: ['Updating', 'Rejected'],
  Updating: ['Completed'],
  Rejected: [],
  Failed: [],
  Cancelled: [],
}

describe('Runtime State Machine — every legal transition', () => {
  for (const from of ALL_STATUSES) {
    for (const to of LEGAL[from]) {
      it(`allows ${from} → ${to}`, () => {
        expect(canTransition(from, to)).toBe(true)
        expect(() => assertTransition(from, to)).not.toThrow()
      })
    }
  }
})

describe('Runtime State Machine — every illegal transition is rejected', () => {
  for (const from of ALL_STATUSES) {
    const legalTargets = new Set(LEGAL[from])
    for (const to of ALL_STATUSES) {
      if (legalTargets.has(to)) continue
      it(`rejects ${from} → ${to}`, () => {
        expect(canTransition(from, to)).toBe(false)
        expect(() => assertTransition(from, to)).toThrow(/Illegal job status transition/)
      })
    }
  }
})

describe('Runtime State Machine — terminal states are immutable', () => {
  const terminal: JobStatus[] = ['Rejected', 'Failed', 'Cancelled']

  it('classifies exactly Rejected, Failed, and Cancelled as terminal', () => {
    for (const status of terminal) expect(isTerminalStatus(status)).toBe(true)
    for (const status of ALL_STATUSES.filter(s => !terminal.includes(s))) expect(isTerminalStatus(status)).toBe(false)
  })

  for (const status of terminal) {
    it(`${status} has no legal outgoing transition to any status`, () => {
      for (const to of ALL_STATUSES) expect(canTransition(status, to)).toBe(false)
    })
  }
})

describe('Runtime State Machine — self-transitions', () => {
  it('never allows a status to transition to itself unless explicitly listed', () => {
    for (const status of ALL_STATUSES) {
      const selfAllowed = LEGAL[status].includes(status)
      expect(canTransition(status, status)).toBe(selfAllowed)
    }
  })
})
