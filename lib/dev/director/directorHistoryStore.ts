import { randomUUID } from 'node:crypto'
import { readJsonStore, updateJsonStore } from './fileJsonStore'
import type { DirectorHistoryEntry } from './directorRuntimeTypes'

const FILE = 'director-history.json'
const MAX_ENTRIES = 2000

/** Append-only execution history — "Maintaining execution history" is one of the Director's own listed responsibilities, not just a debugging aid. Appending under updateJsonStore's file lock so concurrent appends (from different projects' loops, or a recovery pass and a live loop) never lose one side's entry. Capped so the file doesn't grow unbounded across a long-running project. */
export function appendDirectorHistory(input: Omit<DirectorHistoryEntry, 'id' | 'timestamp'>): DirectorHistoryEntry {
  const entry: DirectorHistoryEntry = { ...input, id: randomUUID(), timestamp: new Date().toISOString() }
  updateJsonStore<DirectorHistoryEntry[]>(FILE, [], entries => [entry, ...entries].slice(0, MAX_ENTRIES))
  return entry
}

export function historyForProject(project: string, limit = 100): DirectorHistoryEntry[] {
  return readJsonStore<DirectorHistoryEntry[]>(FILE, [])
    .filter(e => e.project === project)
    .slice(0, limit)
}
