import { beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useIsolatedDataDir, uniqueSlug, type IsolatedDataDir } from '../support/testHarness'
import { readProductDNAProfile, initializeDNA } from '../../../lib/dev/initializer/dnaInitializer'

/**
 * Wave 4 (Unlocked Stores) remediation — dnaInitializer.ts previously did
 * a raw fs read-check-write with no lock spanning the three steps: two
 * concurrent initializeDNA calls for the same productSlug could both pass
 * the "doesn't exist yet" check and both write. The whole check-and-set
 * now runs inside fileJsonStore.ts's updateJsonStore, under one real file
 * lock — these tests prove the on-disk behavior/format is unchanged, and
 * that repeated initialization attempts for the same product are
 * deterministic (exactly one ever actually creates the profile).
 */

let isolated: IsolatedDataDir

beforeEach(() => {
  isolated = useIsolatedDataDir()
})

afterEach(() => {
  isolated.cleanup()
})

describe('dnaInitializer — format and compatibility', () => {
  it('returns null for a product with no profile yet', () => {
    expect(readProductDNAProfile(uniqueSlug())).toBeNull()
  })

  it('creates Version 1 with the given name/category and blank everything else', () => {
    const slug = uniqueSlug()
    const result = initializeDNA(slug, 'My Product', 'SaaS')

    expect(result).toEqual({ step: 'Engineering DNA', created: ['DNA Version 1'], skipped: [] })
    const profile = readProductDNAProfile(slug)
    expect(profile?.productSlug).toBe(slug)
    expect(profile?.productName).toBe('My Product')
    expect(profile?.category).toBe('SaaS')
    expect(profile?.dnaVersion).toBe(1)
    expect(profile?.technologyStack).toBe('')
  })

  it('a second call against an already-initialized product is a no-op, reporting skipped', () => {
    const slug = uniqueSlug()
    initializeDNA(slug, 'My Product', 'SaaS')

    const second = initializeDNA(slug, 'Different Name', 'Different Category')

    expect(second.created).toEqual([])
    expect(second.skipped).toEqual(['DNA Version 1 already exists'])
    // Never overwritten — the original name/category from the first call survive.
    const profile = readProductDNAProfile(slug)
    expect(profile?.productName).toBe('My Product')
    expect(profile?.category).toBe('SaaS')
  })

  it('two different products get fully independent profiles', () => {
    const slugA = uniqueSlug('a')
    const slugB = uniqueSlug('b')
    initializeDNA(slugA, 'Product A', 'Cat A')
    initializeDNA(slugB, 'Product B', 'Cat B')

    expect(readProductDNAProfile(slugA)?.productName).toBe('Product A')
    expect(readProductDNAProfile(slugB)?.productName).toBe('Product B')
  })
})

describe('dnaInitializer — repeated/concurrent initialization attempts (Wave 4)', () => {
  it('multiple repeated initializeDNA calls for the same product never produce more than one real creation, and never corrupt the profile', () => {
    const slug = uniqueSlug()
    const attempts = 10
    const results = Array.from({ length: attempts }, () => initializeDNA(slug, 'Race Product', 'Race Category'))

    const creators = results.filter(r => r.created.length > 0)
    const skippers = results.filter(r => r.skipped.length > 0)
    expect(creators).toHaveLength(1)
    expect(skippers).toHaveLength(attempts - 1)

    const profile = readProductDNAProfile(slug)
    expect(profile?.dnaVersion).toBe(1)
    expect(profile?.productName).toBe('Race Product')
  })
})
