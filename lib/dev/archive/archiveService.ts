import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import { paginate } from '../query/queryHelpers'
import type { PageRequest, PageResult } from '../query/queryTypes'
import type { RetentionPolicy, ArchiveResult } from './archiveTypes'

/**
 * Enterprise Scalability (Version 2.0 Phase 5, Milestone 5.2) — a single
 * generic archive/retention mechanism every eligible store extends
 * itself with, rather than each store inventing its own archiving code.
 * Built entirely on the existing fileJsonStore primitives (readJsonStore/
 * writeJsonStore/updateJsonStore) — one more JSON file per store (its
 * "-archive.json" counterpart), no new persistence mechanism.
 *
 * "Retention must never affect active runtime state": this function only
 * ever archives records the CALLER's `isEligible` predicate returns true
 * for. Every call site in this milestone passes a predicate that is only
 * ever true for a terminal status (Resolved/Dismissed/Cancelled/
 * Delivered/Failed/...) — an Open inbox item, a Running Director, a
 * Monitoring escalation are never eligible, so they can never be
 * archived no matter how old they are or how the count policy is
 * configured. That invariant lives in each call site's predicate, not
 * here, by design: this function has no domain knowledge of what
 * "active" means for any particular store.
 *
 * "Archive operations must be deterministic": the only time-sensitive
 * input is the explicit `now` parameter — never read internally via
 * Date.now() — so calling this twice with identical stored data and an
 * identical `now` always produces an identical result.
 *
 * Concurrency: the live file's entire read-decide-write cycle happens
 * inside one updateJsonStore call, exactly like every other store's own
 * mutation function in this codebase (patchDirectorStatus, patchDelivery,
 * ...) — a separate readJsonStore-then-writeJsonStore pair here would
 * reopen the exact read-modify-write race updateJsonStore's file lock
 * exists to close: a concurrent write to the same live file landing
 * between the read and the write would be silently overwritten and lost.
 */
export type ArchiveOptions<T> = {
  liveFile: string
  archiveFile: string
  isEligible: (item: T) => boolean
  getTimestamp: (item: T) => string
  policy: RetentionPolicy
  now: string
}

export function archiveEligibleRecords<T>(options: ArchiveOptions<T>): ArchiveResult {
  const { liveFile, archiveFile, isEligible, getTimestamp, policy, now } = options
  const nowMs = new Date(now).getTime()
  let archivedRecords: T[] = []

  const kept = updateJsonStore<T[]>(liveFile, [], live => {
    const eligibleIndices = live
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => isEligible(item))
      .sort((a, b) => getTimestamp(a.item).localeCompare(getTimestamp(b.item))) // oldest first, deterministic

    const toArchive = new Set<number>()

    if (policy.maxAgeMs !== null) {
      for (const { item, index } of eligibleIndices) {
        const ageMs = nowMs - new Date(getTimestamp(item)).getTime()
        if (ageMs >= policy.maxAgeMs) toArchive.add(index)
      }
    }

    if (policy.maxLiveCount !== null) {
      const remainingAfterAge = live.length - toArchive.size
      let overflow = remainingAfterAge - policy.maxLiveCount
      if (overflow > 0) {
        for (const { index } of eligibleIndices) {
          if (overflow <= 0) break
          if (toArchive.has(index)) continue // already counted by the age pass
          toArchive.add(index)
          overflow -= 1
        }
      }
    }

    archivedRecords = [...toArchive].sort((a, b) => a - b).map(i => live[i])
    return toArchive.size === 0 ? live : live.filter((_, i) => !toArchive.has(i))
  })

  if (archivedRecords.length === 0) {
    return { archived: 0, remaining: kept.length, timestamp: now }
  }

  updateJsonStore<T[]>(archiveFile, [], current => [...archivedRecords, ...current])

  return { archived: archivedRecords.length, remaining: kept.length, timestamp: now }
}

/** "Old operational records should move into archive storage while remaining queryable" — paginated read access to an archive file, on the same query primitives every live store's paginated read uses. */
export function queryArchive<T>(archiveFile: string, request: PageRequest = {}, predicate?: (item: T) => boolean): PageResult<T> {
  const all = readJsonStore<T[]>(archiveFile, [])
  const filtered = predicate ? all.filter(predicate) : all
  return paginate(filtered, request)
}
