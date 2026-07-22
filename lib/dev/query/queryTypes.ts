/**
 * Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2) — shared
 * query types. "Extend existing services only" means this module is
 * additive infrastructure every store's existing `list*` functions sit
 * alongside, never a replacement for them: a store gains a new
 * `query*`/paginated function built on these primitives, its original
 * `list*` function stays exactly as every earlier milestone left it.
 */

export type PageRequest = {
  /** 1-indexed — page 1 is the first page, matching how every dashboard control in this app already numbers things for humans. */
  page?: number
  pageSize?: number
}

export type PageResult<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type DateRangeFilter = {
  /** Inclusive ISO timestamp lower bound. */
  from?: string
  /** Inclusive ISO timestamp upper bound. */
  to?: string
}
