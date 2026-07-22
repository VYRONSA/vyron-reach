import { afterEach, describe, it, expect, vi } from 'vitest'
import { acquireConcurrencySlot, releaseConcurrencySlot, getConcurrencyStateForTests } from '../../../lib/dev/director/serverExecutionLoop'

afterEach(() => {
  // Drain anything a failed assertion might have left acquired/queued, so
  // one test's state can never leak into the next (this module's counter
  // is process-wide, not reset per test the way file-backed stores are).
  const state = getConcurrencyStateForTests()
  for (let i = 0; i < state.active; i++) releaseConcurrencySlot()
})

describe('Project loop concurrency ceiling — PRA-P1-022', () => {
  it('grants a slot immediately while under the ceiling', async () => {
    const before = getConcurrencyStateForTests()
    await acquireConcurrencySlot()
    expect(getConcurrencyStateForTests().active).toBe(before.active + 1)
    releaseConcurrencySlot()
    expect(getConcurrencyStateForTests().active).toBe(before.active)
  })

  it('queues a request once the ceiling is reached, and grants it as soon as a slot is released', async () => {
    const { max } = getConcurrencyStateForTests()

    // Fill every slot.
    for (let i = 0; i < max; i++) await acquireConcurrencySlot()
    expect(getConcurrencyStateForTests().active).toBe(max)
    expect(getConcurrencyStateForTests().queued).toBe(0)

    // One more request — must not resolve yet.
    let granted = false
    const pending = acquireConcurrencySlot().then(() => {
      granted = true
    })
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(granted).toBe(false)
    expect(getConcurrencyStateForTests().queued).toBe(1)

    // Freeing one slot must grant exactly the queued request, not exceed the ceiling.
    releaseConcurrencySlot()
    await pending
    expect(granted).toBe(true)
    expect(getConcurrencyStateForTests().active).toBe(max)
    expect(getConcurrencyStateForTests().queued).toBe(0)

    // Drain the rest.
    for (let i = 0; i < max; i++) releaseConcurrencySlot()
    expect(getConcurrencyStateForTests().active).toBe(0)
  })

  it('serves queued requests in FIFO order', async () => {
    const { max } = getConcurrencyStateForTests()
    for (let i = 0; i < max; i++) await acquireConcurrencySlot()

    const order: number[] = []
    const p1 = acquireConcurrencySlot().then(() => order.push(1))
    const p2 = acquireConcurrencySlot().then(() => order.push(2))
    const p3 = acquireConcurrencySlot().then(() => order.push(3))

    for (let i = 0; i < max + 3; i++) releaseConcurrencySlot()
    await Promise.all([p1, p2, p3])

    expect(order).toEqual([1, 2, 3])
  })
})

describe('Project loop concurrency ceiling — configurable via env (PRA-P1-022)', () => {
  afterEach(() => {
    delete process.env.VYRON_DEV_MAX_CONCURRENT_PROJECT_LOOPS
    vi.resetModules()
  })

  it('honors VYRON_DEV_MAX_CONCURRENT_PROJECT_LOOPS when set to a valid positive number', async () => {
    process.env.VYRON_DEV_MAX_CONCURRENT_PROJECT_LOOPS = '2'
    vi.resetModules()
    const fresh = await import('../../../lib/dev/director/serverExecutionLoop')
    expect(fresh.getConcurrencyStateForTests().max).toBe(2)
  })

  it('falls back to the default (5) for an invalid value rather than a silently broken ceiling', async () => {
    process.env.VYRON_DEV_MAX_CONCURRENT_PROJECT_LOOPS = 'not-a-number'
    vi.resetModules()
    const fresh = await import('../../../lib/dev/director/serverExecutionLoop')
    expect(fresh.getConcurrencyStateForTests().max).toBe(5)
  })
})
