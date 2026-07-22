import type { PageRequest, PageResult, DateRangeFilter } from './queryTypes'

const DEFAULT_PAGE_SIZE = 25
const MAX_PAGE_SIZE = 200

/** The one pagination implementation every store's `query*` function calls — "Large datasets must never be loaded entirely" holds because callers only ever get back `pageSize` items, never the full underlying array, regardless of how large the store has grown. */
export function paginate<T>(items: T[], request: PageRequest = {}): PageResult<T> {
  const pageSize = Math.min(Math.max(1, request.pageSize ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE)
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, request.page ?? 1), totalPages)
  const start = (page - 1) * pageSize
  return { items: items.slice(start, start + pageSize), page, pageSize, total, totalPages }
}

/** Inclusive on both ends; a filter with neither bound set matches everything, so "no date filter" and "an empty DateRangeFilter object" behave identically. ISO-8601 timestamps compare correctly as plain strings — no Date parsing needed for the common case, only for genuinely non-ISO input. */
export function inDateRange(timestamp: string, range?: DateRangeFilter): boolean {
  if (!range) return true
  if (range.from && timestamp < range.from) return false
  if (range.to && timestamp > range.to) return false
  return true
}

/**
 * A lightweight inverted index: token -> the set of item indices whose
 * extracted text contains that token. "Indexed searching" for this
 * codebase's file-backed JSON stores means exactly this — an index built
 * once per search call from the current in-memory array (itself served
 * from fileJsonStore's read-through cache, see fileJsonStore.ts, so
 * repeated searches don't re-read the file) and queried with a set
 * intersection, rather than a linear substring scan repeated per query
 * token against every record. There is no real full-text database
 * underneath this app, so a persisted, incrementally-maintained index
 * would be a new subsystem this milestone's "extend existing services
 * only" constraint rules out; this stays proportionate to that
 * constraint while still being a genuine index, not `Array.includes`.
 */
export type SearchIndex = Map<string, Set<number>>

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

export function buildSearchIndex<T>(items: T[], extractText: (item: T) => string): SearchIndex {
  const index: SearchIndex = new Map()
  items.forEach((item, i) => {
    for (const token of tokenize(extractText(item))) {
      let postings = index.get(token)
      if (!postings) {
        postings = new Set()
        index.set(token, postings)
      }
      postings.add(i)
    }
  })
  return index
}

/** AND semantics across query tokens (every token must appear somewhere in the record's indexed text) — the common, predictable behavior for a multi-word search box. Returns items in their original array order, never index-insertion order. */
export function searchWithIndex<T>(items: T[], index: SearchIndex, query: string): T[] {
  const tokens = tokenize(query)
  if (tokens.length === 0) return items

  let matched: Set<number> | null = null
  for (const token of tokens) {
    const postings = index.get(token) ?? new Set<number>()
    matched = matched === null ? new Set(postings) : intersect(matched, postings)
    if (matched.size === 0) return []
  }

  return items.filter((_, i) => matched!.has(i))
}

function intersect(a: Set<number>, b: Set<number>): Set<number> {
  const result = new Set<number>()
  for (const value of a) if (b.has(value)) result.add(value)
  return result
}
