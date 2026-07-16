'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createPrompt,
  deletePrompt,
  getPrompts,
  PROMPT_CATEGORIES,
  toggleFavourite,
  updatePrompt,
  type Prompt,
  type PromptCategory,
} from '@/lib/dev/promptsStorage'
import { decisionsForPrompt } from '@/lib/dev/decisionsStorage'
import { recordRecentItem } from '@/lib/dev/recents'
import { DevBadge, DevButton, DevEmptyState, DevInput, DevSelect, DevTextarea } from './ui'
import { useFocusHighlight } from './useFocusHighlight'

const emptyForm = { title: '', category: PROMPT_CATEGORIES[0] as PromptCategory, content: '' }

export function PromptLibraryBoard() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<PromptCategory | 'All'>('All')
  const [favouritesOnly, setFavouritesOnly] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const [decisionCounts, setDecisionCounts] = useState<Record<string, number>>({})

  const refresh = () => {
    const all = getPrompts()
    setPrompts(all)
    const counts: Record<string, number> = {}
    for (const p of all) counts[p.id] = decisionsForPrompt(p.id).length
    setDecisionCounts(counts)
  }

  useEffect(() => {
    refresh()
    setHydrated(true)
  }, [])

  const visible = useMemo(() => {
    let list = prompts
    if (category !== 'All') list = list.filter(p => p.category === category)
    if (favouritesOnly) list = list.filter(p => p.favourite)
    const q = query.trim().toLowerCase()
    if (q) list = list.filter(p => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q))
    return [...list].sort((a, b) => {
      if (a.favourite !== b.favourite) return a.favourite ? -1 : 1
      return a.createdAt < b.createdAt ? 1 : -1
    })
  }, [prompts, category, favouritesOnly, query])

  const highlighted = useFocusHighlight(visible.map(p => p.id))

  const startCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  const startEdit = (p: Prompt) => {
    setEditingId(p.id)
    recordRecentItem({ type: 'prompt', id: p.id, label: p.title, href: `/dev/prompts?focus=${p.id}` })
    setForm({ title: p.title, category: p.category, content: p.content })
    setShowForm(true)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    if (editingId) {
      updatePrompt(editingId, form)
    } else {
      createPrompt(form)
    }
    setShowForm(false)
    setForm(emptyForm)
    setEditingId(null)
    refresh()
  }

  const handleDelete = (id: string) => {
    deletePrompt(id)
    refresh()
  }

  const handleFavourite = (id: string) => {
    toggleFavourite(id)
    refresh()
  }

  const handleCopy = async (p: Prompt) => {
    try {
      await navigator.clipboard.writeText(p.content)
      setCopiedId(p.id)
      recordRecentItem({ type: 'prompt', id: p.id, label: p.title, href: `/dev/prompts?focus=${p.id}` })
      window.setTimeout(() => setCopiedId(null), 1500)
    } catch {
      // clipboard unavailable — no-op
    }
  }

  if (!hydrated) return <div className="text-sm text-[var(--dev-text-faint)]">Loading prompt library...</div>

  return (
    <div>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <DevInput
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search prompts..."
            aria-label="Search prompts"
            className="sm:max-w-xs"
          />
          <DevSelect value={category} onChange={e => setCategory(e.target.value as PromptCategory | 'All')} className="sm:w-44">
            <option value="All">All categories</option>
            {PROMPT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </DevSelect>
          <button
            type="button"
            onClick={() => setFavouritesOnly(v => !v)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              favouritesOnly
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-500 dark:text-amber-400'
                : 'border-[var(--dev-border-strong)] text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]'
            }`}
          >
            &#9733; Favourites
          </button>
        </div>
        <DevButton onClick={startCreate}>{showForm && !editingId ? 'Cancel' : 'New prompt'}</DevButton>
      </div>

      {showForm ? (
        <form
          onSubmit={handleSubmit}
          className="mb-5 space-y-3 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-4"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_180px]">
            <DevInput
              value={form.title}
              onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Prompt title"
              required
            />
            <DevSelect
              value={form.category}
              onChange={e => setForm(prev => ({ ...prev, category: e.target.value as PromptCategory }))}
            >
              {PROMPT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </DevSelect>
          </div>
          <DevTextarea
            value={form.content}
            onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
            placeholder="Prompt content"
            rows={6}
            className="font-mono text-[13px]"
          />
          <div className="flex items-center gap-2">
            <DevButton type="submit">{editingId ? 'Save changes' : 'Save prompt'}</DevButton>
            <DevButton
              type="button"
              variant="secondary"
              onClick={() => {
                setShowForm(false)
                setEditingId(null)
              }}
            >
              Cancel
            </DevButton>
          </div>
        </form>
      ) : null}

      {visible.length === 0 ? (
        <DevEmptyState>No prompts{query || category !== 'All' || favouritesOnly ? ' match your filters' : ' yet'}.</DevEmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {visible.map(p => (
            <div
              key={p.id}
              id={`record-${p.id}`}
              className={`scroll-mt-24 rounded-xl border bg-[var(--dev-surface)] p-4 transition-shadow duration-500 ${
                highlighted === p.id ? 'border-[var(--dev-accent)] ring-2 ring-[var(--dev-accent)]/30' : 'border-[var(--dev-border)]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <button type="button" onClick={() => startEdit(p)} className="text-left text-sm font-medium text-[var(--dev-text)] hover:text-[var(--dev-accent)]">
                  {p.title}
                </button>
                <button
                  type="button"
                  onClick={() => handleFavourite(p.id)}
                  aria-label="Toggle favourite"
                  className={`shrink-0 text-base ${p.favourite ? 'text-amber-500 dark:text-amber-400' : 'text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]'}`}
                >
                  &#9733;
                </button>
              </div>
              <div className="mt-1.5">
                <DevBadge tone="info">{p.category}</DevBadge>
              </div>
              <pre className="mt-3 max-h-32 overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-black/20 p-2.5 font-mono text-[11.5px] leading-relaxed text-[var(--dev-text-muted)]">
                {p.content || '(empty)'}
              </pre>
              <div className="mt-3 flex items-center gap-2">
                <DevButton variant="secondary" onClick={() => handleCopy(p)}>
                  {copiedId === p.id ? 'Copied' : 'Copy'}
                </DevButton>
                <DevButton variant="danger" onClick={() => handleDelete(p.id)}>
                  Delete
                </DevButton>
                {decisionCounts[p.id] > 0 ? (
                  <Link
                    href={`/dev/decisions?prompt=${p.id}`}
                    className="ml-auto text-[11px] text-[var(--dev-text-faint)] hover:text-[var(--dev-accent)]"
                  >
                    {decisionCounts[p.id]} linked decision{decisionCounts[p.id] === 1 ? '' : 's'}
                  </Link>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
