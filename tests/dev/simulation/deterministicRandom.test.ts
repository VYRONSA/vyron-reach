import { describe, it, expect } from 'vitest'
import { createRng, chance } from '../../../lib/dev/simulation/deterministicRandom'

describe('Deterministic Random — createRng', () => {
  it('the same seed always produces the exact same sequence', () => {
    const a = createRng(42)
    const b = createRng(42)
    const seqA = Array.from({ length: 20 }, () => a())
    const seqB = Array.from({ length: 20 }, () => b())
    expect(seqA).toEqual(seqB)
  })

  it('different seeds produce different sequences', () => {
    const a = createRng(1)
    const b = createRng(2)
    const seqA = Array.from({ length: 10 }, () => a())
    const seqB = Array.from({ length: 10 }, () => b())
    expect(seqA).not.toEqual(seqB)
  })

  it('always produces values in [0, 1)', () => {
    const rng = createRng(7)
    for (let i = 0; i < 200; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})

describe('Deterministic Random — chance', () => {
  it('a rate of 0 never returns true', () => {
    const rng = createRng(3)
    for (let i = 0; i < 100; i++) expect(chance(rng, 0)).toBe(false)
  })

  it('a rate of 1 always returns true', () => {
    const rng = createRng(3)
    for (let i = 0; i < 100; i++) expect(chance(rng, 1)).toBe(true)
  })

  it('is reproducible — the same seed and rate produce the same yes/no sequence', () => {
    const a = createRng(99)
    const b = createRng(99)
    const seqA = Array.from({ length: 30 }, () => chance(a, 0.5))
    const seqB = Array.from({ length: 30 }, () => chance(b, 0.5))
    expect(seqA).toEqual(seqB)
  })
})
