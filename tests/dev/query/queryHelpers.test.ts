import { describe, it, expect } from 'vitest'
import { paginate, inDateRange, buildSearchIndex, searchWithIndex } from '../../../lib/dev/query/queryHelpers'

describe('Query Helpers — paginate', () => {
  const items = Array.from({ length: 47 }, (_, i) => i)

  it('returns the first page by default', () => {
    const result = paginate(items)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(25)
    expect(result.items).toEqual(items.slice(0, 25))
    expect(result.total).toBe(47)
    expect(result.totalPages).toBe(2)
  })

  it('returns a requested page', () => {
    const result = paginate(items, { page: 2, pageSize: 25 })
    expect(result.items).toEqual(items.slice(25, 47))
    expect(result.items).toHaveLength(22)
  })

  it('never loads more than pageSize items — large datasets are never returned whole', () => {
    const huge = Array.from({ length: 100_000 }, (_, i) => i)
    const result = paginate(huge, { pageSize: 10 })
    expect(result.items).toHaveLength(10)
    expect(result.total).toBe(100_000)
  })

  it('clamps a page beyond the last page to the last page', () => {
    const result = paginate(items, { page: 999, pageSize: 25 })
    expect(result.page).toBe(2)
  })

  it('clamps a page below 1 to page 1', () => {
    const result = paginate(items, { page: 0 })
    expect(result.page).toBe(1)
  })

  it('caps pageSize at a maximum regardless of what is requested', () => {
    const huge = Array.from({ length: 10_000 }, (_, i) => i)
    const result = paginate(huge, { pageSize: 100_000 })
    expect(result.pageSize).toBeLessThanOrEqual(200)
  })

  it('handles an empty array', () => {
    const result = paginate([])
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
    expect(result.totalPages).toBe(1)
  })
})

describe('Query Helpers — inDateRange', () => {
  it('matches everything when no range is given', () => {
    expect(inDateRange('2026-01-01T00:00:00.000Z')).toBe(true)
  })

  it('respects an inclusive lower bound', () => {
    expect(inDateRange('2026-01-01T00:00:00.000Z', { from: '2026-01-01T00:00:00.000Z' })).toBe(true)
    expect(inDateRange('2025-12-31T23:59:59.000Z', { from: '2026-01-01T00:00:00.000Z' })).toBe(false)
  })

  it('respects an inclusive upper bound', () => {
    expect(inDateRange('2026-01-05T00:00:00.000Z', { to: '2026-01-05T00:00:00.000Z' })).toBe(true)
    expect(inDateRange('2026-01-06T00:00:00.000Z', { to: '2026-01-05T00:00:00.000Z' })).toBe(false)
  })

  it('respects both bounds together', () => {
    const range = { from: '2026-01-01T00:00:00.000Z', to: '2026-01-31T23:59:59.000Z' }
    expect(inDateRange('2026-01-15T00:00:00.000Z', range)).toBe(true)
    expect(inDateRange('2026-02-01T00:00:00.000Z', range)).toBe(false)
  })
})

describe('Query Helpers — search index', () => {
  type Rec = { id: string; title: string; detail: string }
  const records: Rec[] = [
    { id: '1', title: 'Build failure in payments service', detail: 'TypeScript compile error' },
    { id: '2', title: 'Security review required', detail: 'External API key rotation' },
    { id: '3', title: 'Build failure in auth service', detail: 'Test suite timeout' },
  ]
  const index = buildSearchIndex(records, r => `${r.title} ${r.detail}`)

  it('finds records matching a single token, case-insensitively', () => {
    const results = searchWithIndex(records, index, 'BUILD')
    expect(results.map(r => r.id).sort()).toEqual(['1', '3'])
  })

  it('applies AND semantics across multiple query tokens', () => {
    const results = searchWithIndex(records, index, 'build auth')
    expect(results.map(r => r.id)).toEqual(['3'])
  })

  it('returns no results for a token that matches nothing', () => {
    expect(searchWithIndex(records, index, 'nonexistentterm')).toEqual([])
  })

  it('returns every record for an empty query', () => {
    expect(searchWithIndex(records, index, '   ')).toEqual(records)
  })

  it('preserves original array order in results, not index-insertion order', () => {
    const results = searchWithIndex(records, index, 'service')
    expect(results.map(r => r.id)).toEqual(['1', '3'])
  })
})
