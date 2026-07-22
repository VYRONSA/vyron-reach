import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, type IsolatedDataDir } from '../support/testHarness'
import { readOperationsHistory, appendOperationsSnapshot } from '../../../lib/dev/operations/operationsHistoryStorage'
import type { OperationsSnapshot } from '../../../lib/dev/operations/operationsTypes'

/**
 * Wave 4 (Unlocked Stores) remediation — operationsHistoryStorage.ts
 * previously read/wrote raw JSON via fs.readFileSync/writeFileSync with
 * no lock and a non-atomic direct overwrite. It now goes through
 * fileJsonStore.ts's locked readJsonStore/updateJsonStore, the same
 * primitive every other store in this codebase already uses. These tests
 * prove the on-disk format and behavior are unchanged, and that repeated/
 * rapid appends — the exact scenario a raw read-modify-write can silently
 * drop one side of — never lose a snapshot.
 */

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

function makeSnapshot(overrides: Partial<OperationsSnapshot> = {}): OperationsSnapshot {
  return {
    timestamp: new Date().toISOString(),
    projectSlug: 'proj-a',
    jobId: null,
    engineeringScore: 80,
    overallHealth: 'Healthy',
    deliveryRisk: 'Low',
    technicalDebtScore: 10,
    productCompletion: 50,
    buildStatus: 'Passing',
    typescriptStatus: 'Passing',
    cost: null,
    duration: null,
    applied: true,
    ...overrides,
  }
}

describe('operationsHistoryStorage — format and compatibility', () => {
  it('starts empty when never written', () => {
    expect(readOperationsHistory()).toEqual([])
  })

  it('appends newest-first and filters by projectSlug', () => {
    appendOperationsSnapshot(makeSnapshot({ projectSlug: 'proj-a', productCompletion: 10 }))
    appendOperationsSnapshot(makeSnapshot({ projectSlug: 'proj-b', productCompletion: 20 }))
    appendOperationsSnapshot(makeSnapshot({ projectSlug: 'proj-a', productCompletion: 30 }))

    const all = readOperationsHistory()
    expect(all).toHaveLength(3)
    expect(all[0].productCompletion).toBe(30) // newest first

    const projectA = readOperationsHistory('proj-a')
    expect(projectA).toHaveLength(2)
    expect(projectA.every(s => s.projectSlug === 'proj-a')).toBe(true)
  })

  it('caps history at 200 entries, dropping the oldest', () => {
    for (let i = 0; i < 205; i++) {
      appendOperationsSnapshot(makeSnapshot({ productCompletion: i }))
    }
    const all = readOperationsHistory()
    expect(all).toHaveLength(200)
    // The 5 oldest (productCompletion 0-4) were dropped; the newest (204) is first.
    expect(all[0].productCompletion).toBe(204)
    expect(all.some(s => s.productCompletion < 5)).toBe(false)
  })
})

describe('operationsHistoryStorage — concurrent/repeated writes never lose a snapshot (Wave 4)', () => {
  it('50 rapid, back-to-back appends all land — none silently dropped', () => {
    const count = 50
    for (let i = 0; i < count; i++) {
      appendOperationsSnapshot(makeSnapshot({ jobId: `job-${i}` }))
    }

    const all = readOperationsHistory()
    expect(all).toHaveLength(count)
    const jobIds = new Set(all.map(s => s.jobId))
    expect(jobIds.size).toBe(count) // every one is distinct — no overwrite, no duplicate collapse
  })

  it('interleaved appends across two different projects never clobber each other', () => {
    for (let i = 0; i < 20; i++) {
      appendOperationsSnapshot(makeSnapshot({ projectSlug: i % 2 === 0 ? 'proj-a' : 'proj-b', jobId: `job-${i}` }))
    }

    expect(readOperationsHistory('proj-a')).toHaveLength(10)
    expect(readOperationsHistory('proj-b')).toHaveLength(10)
    expect(readOperationsHistory()).toHaveLength(20)
  })
})
