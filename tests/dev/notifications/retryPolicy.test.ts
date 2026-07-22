import { describe, it, expect } from 'vitest'
import { computeBackoffDelayMs, classifyError, DeliveryError, DEFAULT_MAX_ATTEMPTS } from '../../../lib/dev/notifications/retryPolicy'

describe('Retry Policy — exponential backoff', () => {
  it('doubles the delay on each successive attempt', () => {
    const d1 = computeBackoffDelayMs(1)
    const d2 = computeBackoffDelayMs(2)
    const d3 = computeBackoffDelayMs(3)
    expect(d2).toBe(d1 * 2)
    expect(d3).toBe(d2 * 2)
  })

  it('is a pure function — identical attempt number always yields identical delay', () => {
    expect(computeBackoffDelayMs(3)).toBe(computeBackoffDelayMs(3))
  })

  it('never grows unbounded — caps at a maximum delay', () => {
    const huge = computeBackoffDelayMs(100)
    expect(huge).toBeLessThanOrEqual(5 * 60 * 1000)
    expect(huge).toBe(computeBackoffDelayMs(99)) // both already at the cap
  })

  it('never returns a negative or zero delay, even for attempt 0 or negative input', () => {
    expect(computeBackoffDelayMs(0)).toBeGreaterThan(0)
    expect(computeBackoffDelayMs(-5)).toBeGreaterThan(0)
  })

  it('defines a real maximum retry count', () => {
    expect(DEFAULT_MAX_ATTEMPTS).toBeGreaterThan(0)
  })
})

describe('Retry Policy — failure classification', () => {
  it('honors an explicit DeliveryError kind', () => {
    expect(classifyError(new DeliveryError('boom', 'Permanent')).kind).toBe('Permanent')
    expect(classifyError(new DeliveryError('boom', 'Transient')).kind).toBe('Transient')
  })

  it('treats a plain Error as Transient by default — never gives up on an unrecognized failure prematurely', () => {
    expect(classifyError(new Error('unknown failure')).kind).toBe('Transient')
  })

  it('treats a non-Error thrown value as Transient too', () => {
    expect(classifyError('a string was thrown').kind).toBe('Transient')
    expect(classifyError(undefined).kind).toBe('Transient')
  })

  it('preserves the original error message', () => {
    expect(classifyError(new DeliveryError('specific reason', 'Permanent')).message).toBe('specific reason')
    expect(classifyError(new Error('another reason')).message).toBe('another reason')
  })
})
