import { readJsonStore, updateJsonStore } from '../director/fileJsonStore'
import type { EngineeringDNAEntry, EngineeringDNAProfile, EngineeringMemoryEntry, ExecutionLearningRecord } from './learningTypes'

/**
 * Server-side, file-backed persistence — now on the same shared atomic
 * primitives every other store in the app uses (readJsonStore/
 * updateJsonStore from lib/dev/director/fileJsonStore.ts, themselves on
 * fileLock.ts's write-then-rename + cross-process mutex), not hand-rolled
 * fs calls. This closes two real gaps the hand-rolled version had: it now
 * honors VYRON_DEV_DATA_DIR (getVyronDevDataDir(), via fileJsonStore.ts)
 * for test isolation the same way every Director/Planning/Knowledge store
 * already does, and every mutation is now lock-protected — previously
 * appendDNAEntry/appendMemoryEntry/appendExecutionRecord had no locking
 * at all, a genuine concurrent-write hazard unlike every other store.
 *
 * Three stores: execution records (the foundation everything else derives
 * from), DNA profiles (append-only, versioned, never overwritten), and
 * memory entries (searchable knowledge extracted from successful
 * executions).
 */
const EXECUTIONS_FILE = 'learning-executions.json'
const DNA_FILE = 'engineering-dna.json'
const MEMORY_FILE = 'engineering-memory.json'
const MAX_EXECUTIONS = 500

export function readExecutionRecords(projectSlug?: string): ExecutionLearningRecord[] {
  const all = readJsonStore<ExecutionLearningRecord[]>(EXECUTIONS_FILE, [])
  return projectSlug ? all.filter(r => r.projectSlug === projectSlug) : all
}

/** No duplicate learning — an execution id already recorded is never appended twice. Read-modify-write happens inside updateJsonStore's file lock. */
export function appendExecutionRecord(record: ExecutionLearningRecord): void {
  updateJsonStore<ExecutionLearningRecord[]>(EXECUTIONS_FILE, [], all => {
    if (all.some(r => r.id === record.id)) return all
    return [record, ...all].slice(0, MAX_EXECUTIONS)
  })
}

export function readDNAProfile(productSlug: string): EngineeringDNAProfile {
  const all = readJsonStore<Record<string, EngineeringDNAProfile>>(DNA_FILE, {})
  return all[productSlug] ?? { productSlug, current: [], history: [] }
}

export function readAllDNAProfiles(): Record<string, EngineeringDNAProfile> {
  return readJsonStore<Record<string, EngineeringDNAProfile>>(DNA_FILE, {})
}

/**
 * Appends a new DNA version and updates `current` to point at it — the
 * prior version is never removed from `history`. `entry.supersedes` is
 * set by the caller to the id of the entry (if any) this new version
 * replaces in `current`, so the lineage of a single logical fact stays
 * traceable. Read-modify-write happens inside updateJsonStore's file lock.
 */
export function appendDNAEntry(entry: EngineeringDNAEntry): void {
  updateJsonStore<Record<string, EngineeringDNAProfile>>(DNA_FILE, {}, all => {
    const profile = all[entry.productSlug] ?? { productSlug: entry.productSlug, current: [], history: [] }
    const withoutSuperseded = profile.current.filter(e => e.id !== entry.supersedes)
    return {
      ...all,
      [entry.productSlug]: {
        productSlug: entry.productSlug,
        current: [...withoutSuperseded, entry],
        history: [...profile.history, entry],
      },
    }
  })
}

export function readMemoryEntries(): EngineeringMemoryEntry[] {
  return readJsonStore<EngineeringMemoryEntry[]>(MEMORY_FILE, [])
}

export function appendMemoryEntry(entry: EngineeringMemoryEntry): void {
  updateJsonStore<EngineeringMemoryEntry[]>(MEMORY_FILE, [], all => {
    if (all.some(e => e.id === entry.id)) return all
    return [entry, ...all].slice(0, 1000)
  })
}
