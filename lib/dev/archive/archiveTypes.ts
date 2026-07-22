/**
 * Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2) — archiving
 * and retention types.
 */

/**
 * `null` in either field means "no limit on that dimension." Different
 * stores define different policies ("Different stores may define
 * different retention periods") by passing different values into the
 * same archiveEligibleRecords function — the policy is data, not new
 * code per store.
 */
export type RetentionPolicy = {
  /** Archive eligible records older than this, in milliseconds. */
  maxAgeMs: number | null
  /** If set, archive the oldest eligible records beyond this count even if none have aged out yet — a hard ceiling on live-store size independent of age. */
  maxLiveCount: number | null
}

export type ArchiveResult = {
  archived: number
  remaining: number
  timestamp: string
}
