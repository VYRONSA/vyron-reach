import fs from 'node:fs'
import path from 'node:path'
import type { EngineeringDNAEntry, EngineeringDNAProfile, EngineeringMemoryEntry, ExecutionLearningRecord } from './learningTypes'

/**
 * Server-side, file-backed persistence — the same pattern runtimeStorage.ts
 * and operationsHistoryStorage.ts already established. Three stores:
 * execution records (the foundation everything else derives from), DNA
 * profiles (append-only, versioned, never overwritten), and memory
 * entries (searchable knowledge extracted from successful executions).
 */
const STORE_DIR = path.join(process.cwd(), '.vyron-dev')
const EXECUTIONS_FILE = path.join(STORE_DIR, 'learning-executions.json')
const DNA_FILE = path.join(STORE_DIR, 'engineering-dna.json')
const MEMORY_FILE = path.join(STORE_DIR, 'engineering-memory.json')
const MAX_EXECUTIONS = 500

function ensureFile(file: string, initial: string): void {
  if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true })
  if (!fs.existsSync(file)) fs.writeFileSync(file, initial, 'utf-8')
}

function readJson<T>(file: string, initial: T): T {
  ensureFile(file, JSON.stringify(initial))
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T
  } catch {
    return initial
  }
}

function writeJson<T>(file: string, value: T): void {
  ensureFile(file, JSON.stringify(value))
  fs.writeFileSync(file, JSON.stringify(value, null, 2), 'utf-8')
}

export function readExecutionRecords(projectSlug?: string): ExecutionLearningRecord[] {
  const all = readJson<ExecutionLearningRecord[]>(EXECUTIONS_FILE, [])
  return projectSlug ? all.filter(r => r.projectSlug === projectSlug) : all
}

/** No duplicate learning — an execution id already recorded is never appended twice. */
export function appendExecutionRecord(record: ExecutionLearningRecord): void {
  const all = readJson<ExecutionLearningRecord[]>(EXECUTIONS_FILE, [])
  if (all.some(r => r.id === record.id)) return
  all.unshift(record)
  writeJson(EXECUTIONS_FILE, all.slice(0, MAX_EXECUTIONS))
}

export function readDNAProfile(productSlug: string): EngineeringDNAProfile {
  const all = readJson<Record<string, EngineeringDNAProfile>>(DNA_FILE, {})
  return all[productSlug] ?? { productSlug, current: [], history: [] }
}

export function readAllDNAProfiles(): Record<string, EngineeringDNAProfile> {
  return readJson<Record<string, EngineeringDNAProfile>>(DNA_FILE, {})
}

/**
 * Appends a new DNA version and updates `current` to point at it — the
 * prior version is never removed from `history`. `entry.supersedes` is
 * set by the caller to the id of the entry (if any) this new version
 * replaces in `current`, so the lineage of a single logical fact stays
 * traceable.
 */
export function appendDNAEntry(entry: EngineeringDNAEntry): void {
  const all = readJson<Record<string, EngineeringDNAProfile>>(DNA_FILE, {})
  const profile = all[entry.productSlug] ?? { productSlug: entry.productSlug, current: [], history: [] }
  const withoutSuperseded = profile.current.filter(e => e.id !== entry.supersedes)
  all[entry.productSlug] = {
    productSlug: entry.productSlug,
    current: [...withoutSuperseded, entry],
    history: [...profile.history, entry],
  }
  writeJson(DNA_FILE, all)
}

export function readMemoryEntries(): EngineeringMemoryEntry[] {
  return readJson<EngineeringMemoryEntry[]>(MEMORY_FILE, [])
}

export function appendMemoryEntry(entry: EngineeringMemoryEntry): void {
  const all = readJson<EngineeringMemoryEntry[]>(MEMORY_FILE, [])
  if (all.some(e => e.id === entry.id)) return
  all.unshift(entry)
  writeJson(MEMORY_FILE, all.slice(0, 1000))
}
