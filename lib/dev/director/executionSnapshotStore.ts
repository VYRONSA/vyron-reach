import { readJsonStore, updateJsonStore } from './fileJsonStore'
import type { ExecutionSnapshot } from './executionSnapshotTypes'

const FILE = 'execution-snapshots.json'

type SnapshotMap = Record<string, ExecutionSnapshot>

export function getExecutionSnapshot(project: string): ExecutionSnapshot | null {
  return readJsonStore<SnapshotMap>(FILE, {})[project] ?? null
}

/** Under updateJsonStore's file lock so a concurrent write for a different project (or a stale, superseded write for this one) can never clobber this snapshot. */
export function saveExecutionSnapshot(snapshot: ExecutionSnapshot): void {
  updateJsonStore<SnapshotMap>(FILE, {}, current => ({ ...current, [snapshot.project]: snapshot }))
}

export function listExecutionSnapshots(): ExecutionSnapshot[] {
  return Object.values(readJsonStore<SnapshotMap>(FILE, {}))
}
