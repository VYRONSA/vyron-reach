import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { initializeLearning, learningSubsystemStatuses } from '../../../lib/dev/initializer/learningInitializer'

/**
 * Wave 4 (Unlocked Stores) remediation — learningInitializer.ts
 * previously did a raw fs read-check-write with no lock spanning the
 * three steps: two concurrent initializeLearning calls for the same
 * productSlug could both pass the "not yet initialized" check and both
 * touch every subsystem and write a marker. The whole check-and-set now
 * runs inside fileJsonStore.ts's updateJsonStore, under one real file
 * lock — these tests prove the on-disk behavior/format is unchanged, and
 * that repeated initialization attempts for the same product are
 * deterministic (exactly one ever actually reports a real initialization).
 */

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

describe('learningInitializer — format and compatibility', () => {
  it('reports all seven subsystems as ready with zero entries for a fresh product', () => {
    const statuses = learningSubsystemStatuses(uniqueSlug())
    expect(statuses).toHaveLength(7)
    expect(statuses.every(s => s.ready)).toBe(true)
    expect(statuses.map(s => s.name)).toEqual([
      'Engineering Learning', 'Engineering Knowledge', 'Recommendation Learning',
      'Execution Analytics', 'Pattern Recognition', 'Decision Memory', 'Architecture Knowledge',
    ])
  })

  it('initializes a fresh product exactly once, listing every subsystem as created', () => {
    const slug = uniqueSlug()
    const result = initializeLearning(slug)

    expect(result.step).toBe('Learning System')
    expect(result.created).toHaveLength(7)
    expect(result.skipped).toEqual([])
  })

  it('a second call against an already-initialized product is a no-op, reporting skipped', () => {
    const slug = uniqueSlug()
    initializeLearning(slug)

    const second = initializeLearning(slug)

    expect(second.created).toEqual([])
    expect(second.skipped).toHaveLength(1)
    expect(second.skipped[0]).toMatch(/Already initialized/)
  })

  it('two different products get fully independent initialization markers', () => {
    const slugA = uniqueSlug('a')
    const slugB = uniqueSlug('b')
    initializeLearning(slugA)

    // B has never been initialized — must still report a real creation, not "already initialized."
    const resultB = initializeLearning(slugB)
    expect(resultB.created).toHaveLength(7)
  })
})

describe('learningInitializer — repeated/concurrent initialization attempts (Wave 4)', () => {
  it('multiple repeated initializeLearning calls for the same product never produce more than one real initialization', () => {
    const slug = uniqueSlug()
    const attempts = 10
    const results = Array.from({ length: attempts }, () => initializeLearning(slug))

    const realInits = results.filter(r => r.created.length > 0)
    const skips = results.filter(r => r.skipped.length > 0)
    expect(realInits).toHaveLength(1)
    expect(skips).toHaveLength(attempts - 1)
  })
})
