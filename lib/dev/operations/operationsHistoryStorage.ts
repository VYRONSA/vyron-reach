import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import type { OperationsSnapshot } from './operationsTypes'

/**
 * Server-side, file-backed history of Operations Snapshots — the same
 * pattern runtimeStorage.ts already established for job records. Exists
 * so the Executive Operations Dashboard's trend fields (Engineering
 * Trend, Technical Debt Trend, Risk Trend) have real history to compare
 * against instead of a single point-in-time value.
 *
 * Wave 4 (Unlocked Stores) remediation — previously raw fs.readFileSync/
 * writeFileSync with no lock and a non-atomic direct overwrite (a crash
 * mid-write could truncate the file; two concurrent appends could lose
 * one side's snapshot). Now routed through fileJsonStore.ts's shared
 * locked primitive, the same fix already applied to every other store in
 * this codebase — on-disk format (a flat OperationsSnapshot[] array,
 * newest first, capped at MAX_HISTORY) is unchanged.
 */
const STORE_FILE = 'operations-history.json'
const MAX_HISTORY = 200

export function readOperationsHistory(projectSlug?: string): OperationsSnapshot[] {
  const history = readJsonStore<OperationsSnapshot[]>(STORE_FILE, [])
  return projectSlug ? history.filter(h => h.projectSlug === projectSlug) : history
}

export function appendOperationsSnapshot(snapshot: OperationsSnapshot): void {
  updateJsonStore<OperationsSnapshot[]>(STORE_FILE, [], current => [snapshot, ...current].slice(0, MAX_HISTORY))
}
