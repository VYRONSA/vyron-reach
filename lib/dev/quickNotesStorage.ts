import { readLocal, writeLocal } from './localStore'

export type QuickNote = {
  id: string
  content: string
  createdAt: string
  updatedAt: string
}

const KEY = 'vyron-dev-quick-notes-v1'

export function getQuickNotes(): QuickNote[] {
  return readLocal<QuickNote[]>(KEY, [])
}

function saveNotes(notes: QuickNote[]) {
  writeLocal(KEY, notes)
}

export function createQuickNote(content = ''): QuickNote {
  const now = new Date().toISOString()
  const note: QuickNote = {
    id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    content,
    createdAt: now,
    updatedAt: now,
  }
  const notes = getQuickNotes()
  notes.unshift(note)
  saveNotes(notes)
  return note
}

export function updateQuickNote(id: string, content: string) {
  const notes = getQuickNotes().map(n => (n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n))
  saveNotes(notes)
}

export function deleteQuickNote(id: string) {
  saveNotes(getQuickNotes().filter(n => n.id !== id))
}
