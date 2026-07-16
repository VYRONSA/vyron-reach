'use client'

import { useEffect, useRef, useState } from 'react'
import { createQuickNote, deleteQuickNote, getQuickNotes, updateQuickNote, type QuickNote } from '@/lib/dev/quickNotesStorage'
import { useDevExperience } from './DevExperience'

export function QuickNotesPanel() {
  const { notesOpen, toggleNotes, closeNotes } = useDevExperience()
  const [notes, setNotes] = useState<QuickNote[]>([])
  const [hydrated, setHydrated] = useState(false)
  const debounceRef = useRef<Record<string, number>>({})

  useEffect(() => {
    setNotes(getQuickNotes())
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (notesOpen) setNotes(getQuickNotes())
  }, [notesOpen])

  const handleAdd = () => {
    createQuickNote('')
    setNotes(getQuickNotes())
  }

  const handleChange = (id: string, content: string) => {
    setNotes(prev => prev.map(n => (n.id === id ? { ...n, content } : n)))
    window.clearTimeout(debounceRef.current[id])
    debounceRef.current[id] = window.setTimeout(() => {
      updateQuickNote(id, content)
    }, 400)
  }

  const handleDelete = (id: string) => {
    deleteQuickNote(id)
    setNotes(getQuickNotes())
  }

  if (!hydrated) return null

  return (
    <>
      <button
        type="button"
        onClick={toggleNotes}
        title="Quick Notes (Ctrl/Cmd+J)"
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-[0_12px_28px_-8px_rgba(2,132,199,0.6)] transition-transform hover:scale-105"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" className="h-5 w-5">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H16l4 4v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5Z" />
          <path d="M15 3v4a1 1 0 0 0 1 1h4" />
        </svg>
        {notes.length > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--dev-bg)] px-1 font-mono text-[10px] font-semibold text-[var(--dev-text)] ring-1 ring-[var(--dev-border-strong)]">
            {notes.length}
          </span>
        ) : null}
      </button>

      {notesOpen ? (
        <div className="fixed inset-0 z-40" onClick={closeNotes}>
          <div
            className="fixed bottom-24 right-6 z-40 flex max-h-[70vh] w-[340px] flex-col overflow-hidden rounded-2xl border border-[var(--dev-border-strong)] bg-[var(--dev-surface)] shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--dev-border)] px-4 py-3">
              <span className="text-sm font-semibold text-[var(--dev-text)]">Quick Notes</span>
              <button
                type="button"
                onClick={handleAdd}
                className="rounded-md border border-[var(--dev-border-strong)] px-2 py-1 text-xs text-[var(--dev-text-muted)] transition-colors hover:border-[var(--dev-accent)]/40 hover:text-[var(--dev-text)]"
              >
                + New
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {notes.length === 0 ? (
                <div className="px-2 py-6 text-center text-xs text-[var(--dev-text-faint)]">
                  No quick notes yet. Click &quot;+ New&quot; to jot something down.
                </div>
              ) : (
                notes.map(note => (
                  <div key={note.id} className="rounded-lg border border-[var(--dev-border)] bg-[var(--dev-input-bg)] p-2">
                    <textarea
                      value={note.content}
                      onChange={e => handleChange(note.id, e.target.value)}
                      placeholder="Type a note — it saves automatically"
                      rows={3}
                      className="w-full resize-none bg-transparent text-xs leading-relaxed text-[var(--dev-text)] outline-none placeholder:text-[var(--dev-text-faint)]"
                    />
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-[10px] text-[var(--dev-text-faint)]">
                        {new Date(note.updatedAt).toLocaleTimeString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDelete(note.id)}
                        className="text-[10px] text-[var(--dev-text-faint)] hover:text-rose-500"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
