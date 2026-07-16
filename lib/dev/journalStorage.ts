import { readLocal, writeLocal } from './localStore'

export type JournalEntry = {
  id: string
  date: string // YYYY-MM-DD
  project: string // project slug, or '' for none
  summary: string
  wins: string
  problems: string
  ideas: string
  nextActions: string
  createdAt: string
  updatedAt: string
}

const KEY = 'vyron-dev-journal-v1'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function getJournalEntries(): JournalEntry[] {
  return readLocal<JournalEntry[]>(KEY, [])
}

function saveEntries(entries: JournalEntry[]) {
  writeLocal(KEY, entries)
}

export function createJournalEntry(input: {
  date?: string
  project: string
  summary: string
  wins: string
  problems: string
  ideas: string
  nextActions: string
}): JournalEntry {
  const now = new Date().toISOString()
  const entry: JournalEntry = {
    id: `journal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    date: input.date || todayISO(),
    project: input.project,
    summary: input.summary.trim(),
    wins: input.wins.trim(),
    problems: input.problems.trim(),
    ideas: input.ideas.trim(),
    nextActions: input.nextActions.trim(),
    createdAt: now,
    updatedAt: now,
  }
  const entries = getJournalEntries()
  entries.unshift(entry)
  entries.sort((a, b) => (a.date < b.date ? 1 : -1))
  saveEntries(entries)
  return entry
}

export function updateJournalEntry(id: string, patch: Partial<Omit<JournalEntry, 'id' | 'createdAt'>>) {
  const entries = getJournalEntries().map(e =>
    e.id === id ? { ...e, ...patch, updatedAt: new Date().toISOString() } : e
  )
  saveEntries(entries)
}

export function deleteJournalEntry(id: string) {
  saveEntries(getJournalEntries().filter(e => e.id !== id))
}

export function searchJournalEntries(query: string): JournalEntry[] {
  const q = query.trim().toLowerCase()
  const entries = getJournalEntries()
  if (!q) return entries
  return entries.filter(e =>
    [e.summary, e.wins, e.problems, e.ideas, e.nextActions, e.date].some(field => field.toLowerCase().includes(q))
  )
}
