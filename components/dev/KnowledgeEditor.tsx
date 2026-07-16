'use client'

import { useEffect, useState } from 'react'
import { getKnowledgeNote, saveKnowledgeNote } from '@/lib/dev/knowledgeData'
import { renderMarkdownLite } from '@/lib/dev/markdownLite'
import { DevButton, DevTextarea } from './ui'

export function KnowledgeEditor({ slug }: { slug: string }) {
  const [content, setContent] = useState('')
  const [updatedAt, setUpdatedAt] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [mode, setMode] = useState<'write' | 'preview'>('write')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const note = getKnowledgeNote(slug)
    setContent(note.content)
    setUpdatedAt(note.updatedAt)
    setHydrated(true)
  }, [slug])

  const handleSave = () => {
    const note = saveKnowledgeNote(slug, content)
    setUpdatedAt(note.updatedAt)
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1500)
  }

  if (!hydrated) {
    return <div className="text-sm text-[var(--dev-text-faint)]">Loading notes...</div>
  }

  return (
    <div className="rounded-2xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-5">
      <div className="flex items-center justify-between border-b border-[var(--dev-border)] pb-3">
        <div className="flex gap-1 rounded-lg border border-[var(--dev-border-strong)] p-1">
          <button
            type="button"
            onClick={() => setMode('write')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              mode === 'write'
                ? 'bg-[var(--dev-accent-soft)] text-[var(--dev-accent)]'
                : 'text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
              mode === 'preview'
                ? 'bg-[var(--dev-accent-soft)] text-[var(--dev-accent)]'
                : 'text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]'
            }`}
          >
            Preview
          </button>
        </div>
        <div className="flex items-center gap-3">
          {saved ? <span className="text-xs text-emerald-500 dark:text-emerald-400">Saved</span> : null}
          {updatedAt ? (
            <span className="text-[11px] text-[var(--dev-text-faint)]">
              Last saved {new Date(updatedAt).toLocaleString()}
            </span>
          ) : null}
          <DevButton onClick={handleSave}>Save</DevButton>
        </div>
      </div>

      <div className="mt-4">
        {mode === 'write' ? (
          <DevTextarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={16}
            placeholder={'# Heading\n\n- bullet point\n- **bold**, *italic*, `code`\n\nWrite notes here...'}
            className="font-mono text-[13px] leading-relaxed"
          />
        ) : content.trim() ? (
          renderMarkdownLite(content)
        ) : (
          <div className="text-sm text-[var(--dev-text-faint)]">Nothing to preview yet.</div>
        )}
      </div>
    </div>
  )
}
