'use client'

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { PROJECTS } from '@/lib/dev/projectsData'
import { KNOWLEDGE_SECTIONS } from '@/lib/dev/knowledgeData'
import { recordRecentPage, getRecentItems } from '@/lib/dev/recents'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import { getTasks } from '@/lib/dev/queueStorage'
import { getDecisions } from '@/lib/dev/decisionsStorage'
import { getPrompts } from '@/lib/dev/promptsStorage'
import { getJournalEntries } from '@/lib/dev/journalStorage'
import { getQuickNotes } from '@/lib/dev/quickNotesStorage'
import { getMilestones } from '@/lib/dev/milestonesStorage'
import { getBatches } from '@/lib/dev/batchesStorage'
import { getRisks } from '@/lib/dev/risksStorage'
import { getTechnicalDebt } from '@/lib/dev/technicalDebtStorage'
import { getReleases } from '@/lib/dev/releasesStorage'

const NAV_LABELS: { href: string; label: string; group: string }[] = [
  { href: '/dev', label: 'Dashboard', group: 'Portal' },
  { href: '/dev/activity', label: 'Global Activity', group: 'Portal' },
  { href: '/dev/portfolio', label: 'Product Portfolio', group: 'Portal' },
  { href: '/dev/projects', label: 'Projects', group: 'Portal' },
  { href: '/dev/milestones', label: 'Milestones', group: 'Portal' },
  { href: '/dev/batches', label: 'Batches', group: 'Portal' },
  { href: '/dev/queue', label: 'Development Queue', group: 'Portal' },
  { href: '/dev/risks', label: 'Risk Register', group: 'Portal' },
  { href: '/dev/technical-debt', label: 'Technical Debt', group: 'Portal' },
  { href: '/dev/decisions', label: 'Architecture Decisions', group: 'Portal' },
  { href: '/dev/prompts', label: 'Prompt Library', group: 'Portal' },
  { href: '/dev/journal', label: 'Development Journal', group: 'Portal' },
  { href: '/dev/ai-workspace', label: 'AI Workspace', group: 'Portal' },
  { href: '/dev/knowledge', label: 'Knowledge Centre', group: 'Portal' },
  { href: '/dev/git-build', label: 'Git & Build', group: 'Portal' },
  { href: '/dev/settings', label: 'Settings', group: 'Portal' },
]

type SearchItem = { href: string; label: string; group: string }

function staticSearchIndex(): SearchItem[] {
  return [
    ...NAV_LABELS,
    ...PROJECTS.map(p => ({ href: `/dev/projects/${p.slug}`, label: p.name, group: 'Projects' })),
    ...KNOWLEDGE_SECTIONS.map(s => ({ href: `/dev/knowledge/${s.slug}`, label: s.title, group: 'Knowledge Centre' })),
  ]
}

function dynamicSearchIndex(): SearchItem[] {
  const items: SearchItem[] = []

  for (const task of getTasks()) {
    items.push({ href: `/dev/queue?focus=${task.id}`, label: task.title, group: 'Tasks' })
  }
  for (const decision of getDecisions()) {
    items.push({ href: `/dev/decisions?focus=${decision.id}`, label: decision.decision, group: 'Decisions' })
  }
  for (const prompt of getPrompts()) {
    items.push({ href: `/dev/prompts?focus=${prompt.id}`, label: prompt.title, group: 'Prompts' })
  }
  for (const entry of getJournalEntries()) {
    items.push({
      href: `/dev/journal?focus=${entry.id}`,
      label: `${entry.date} — ${entry.summary || 'Untitled entry'}`,
      group: 'Journal',
    })
  }
  for (const note of getQuickNotes()) {
    const snippet = note.content.trim().slice(0, 60) || 'Empty note'
    items.push({ href: '/dev', label: snippet, group: 'Quick Notes' })
  }
  for (const project of PROJECTS) {
    items.push({ href: `/dev/projects/${project.slug}`, label: `Product Bible — ${project.name}`, group: 'Product Bibles' })
  }
  for (const milestone of getMilestones()) {
    items.push({ href: `/dev/milestones?focus=${milestone.id}`, label: milestone.title, group: 'Milestones' })
  }
  for (const batch of getBatches()) {
    items.push({ href: `/dev/batches?focus=${batch.id}`, label: `Batch ${batch.batchNumber}`, group: 'Batches' })
  }
  for (const risk of getRisks()) {
    items.push({ href: `/dev/risks?focus=${risk.id}`, label: risk.title, group: 'Risks' })
  }
  for (const debt of getTechnicalDebt()) {
    items.push({ href: `/dev/technical-debt?focus=${debt.id}`, label: debt.title, group: 'Technical Debt' })
  }
  for (const release of getReleases()) {
    items.push({ href: `/dev/milestones?focus=${release.id}`, label: release.version, group: 'Releases' })
  }

  return items
}

function pageLabelFor(pathname: string): string {
  const exact = NAV_LABELS.find(n => n.href === pathname)
  if (exact) return exact.label
  const project = PROJECTS.find(p => pathname === `/dev/projects/${p.slug}`)
  if (project) return project.name
  const knowledge = KNOWLEDGE_SECTIONS.find(s => pathname === `/dev/knowledge/${s.slug}`)
  if (knowledge) return knowledge.title
  return pathname
}

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: 'Ctrl / Cmd + K', description: 'Open command palette' },
  { keys: '/', description: 'Open command palette' },
  { keys: 'Ctrl / Cmd + J', description: 'Toggle Quick Notes' },
  { keys: '?', description: 'Show this shortcuts helper' },
  { keys: 'Esc', description: 'Close search, notes, or shortcuts' },
  { keys: '↑ / ↓', description: 'Move through results' },
  { keys: 'Enter', description: 'Go to highlighted result' },
]

type DevExperienceContextValue = {
  openSearch: () => void
  openShortcuts: () => void
  notesOpen: boolean
  openNotes: () => void
  toggleNotes: () => void
  closeNotes: () => void
}

const DevExperienceContext = createContext<DevExperienceContextValue | null>(null)

export function useDevExperience() {
  const ctx = useContext(DevExperienceContext)
  if (!ctx) throw new Error('useDevExperience must be used within DevExperienceProvider')
  return ctx
}

export function DevExperienceProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { preferences } = useDevPreferences()
  const [searchOpen, setSearchOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [dynamicItems, setDynamicItems] = useState<SearchItem[]>([])
  const [curatedItems, setCuratedItems] = useState<SearchItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  const staticItems = useMemo(staticSearchIndex, [])
  const index = useMemo(() => [...staticItems, ...dynamicItems], [staticItems, dynamicItems])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q) return index.filter(item => item.label.toLowerCase().includes(q)).slice(0, 12)
    // Empty query: lead with Pinned + Recent, then fill remaining slots with nav items.
    const remaining = Math.max(0, 12 - curatedItems.length)
    const navFill = index
      .filter(item => !curatedItems.some(c => c.href === item.href && c.label === item.label))
      .slice(0, remaining)
    return [...curatedItems, ...navFill]
  }, [index, query, curatedItems])

  const groupedResults = useMemo(() => {
    const groups: { group: string; items: { item: SearchItem; index: number }[] }[] = []
    results.forEach((item, idx) => {
      let bucket = groups.find(g => g.group === item.group)
      if (!bucket) {
        bucket = { group: item.group, items: [] }
        groups.push(bucket)
      }
      bucket.items.push({ item, index: idx })
    })
    return groups
  }, [results])

  useEffect(() => {
    if (!pathname || pathname === '/dev/login') return
    recordRecentPage(pathname, pageLabelFor(pathname))
  }, [pathname])

  useEffect(() => {
    if (!searchOpen) return
    setDynamicItems(dynamicSearchIndex())

    const milestones = getMilestones()
    const batches = getBatches()
    const pinned: SearchItem[] = [
      ...preferences.pinnedProjects
        .map(slug => PROJECTS.find(p => p.slug === slug))
        .filter((p): p is (typeof PROJECTS)[number] => Boolean(p))
        .map(p => ({ href: `/dev/projects/${p.slug}`, label: p.name, group: 'Pinned' })),
      ...preferences.pinnedMilestones
        .map(id => milestones.find(m => m.id === id))
        .filter((m): m is NonNullable<typeof m> => Boolean(m))
        .map(m => ({ href: `/dev/milestones?focus=${m.id}`, label: m.title, group: 'Pinned' })),
      ...preferences.pinnedBatches
        .map(id => batches.find(b => b.id === id))
        .filter((b): b is NonNullable<typeof b> => Boolean(b))
        .map(b => ({ href: `/dev/batches?focus=${b.id}`, label: `Batch ${b.batchNumber}`, group: 'Pinned' })),
    ]
    const recent: SearchItem[] = getRecentItems()
      .slice(0, 6)
      .map(item => ({ href: item.href, label: item.label, group: 'Recent' }))

    setCuratedItems([...pinned, ...recent])
  }, [searchOpen, preferences.pinnedProjects, preferences.pinnedMilestones, preferences.pinnedBatches])

  useEffect(() => {
    if (!searchOpen && !shortcutsOpen && lastFocusedRef.current) {
      lastFocusedRef.current.focus()
      lastFocusedRef.current = null
    }
  }, [searchOpen, shortcutsOpen])

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      const el = target as HTMLElement | null
      if (!el) return false
      const tag = el.tagName
      return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable
    }

    function onKeyDown(e: KeyboardEvent) {
      const isSearchChord = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      const isSlashChord = e.key === '/' && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e.target)
      if (isSearchChord || isSlashChord) {
        e.preventDefault()
        lastFocusedRef.current = document.activeElement as HTMLElement | null
        setShortcutsOpen(false)
        setNotesOpen(false)
        setSearchOpen(true)
        setQuery('')
        setActiveIndex(0)
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setSearchOpen(false)
        setShortcutsOpen(false)
        setNotesOpen(v => !v)
        return
      }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setShortcutsOpen(false)
        setNotesOpen(false)
        return
      }
      if (e.key === '?' && !isTypingTarget(e.target)) {
        e.preventDefault()
        lastFocusedRef.current = document.activeElement as HTMLElement | null
        setSearchOpen(false)
        setNotesOpen(false)
        setShortcutsOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (searchOpen) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 10)
      return () => window.clearTimeout(id)
    }
  }, [searchOpen])

  const go = (href: string) => {
    setSearchOpen(false)
    router.push(href)
  }

  return (
    <DevExperienceContext.Provider
      value={{
        openSearch: () => {
          lastFocusedRef.current = document.activeElement as HTMLElement | null
          setShortcutsOpen(false)
          setNotesOpen(false)
          setSearchOpen(true)
          setQuery('')
          setActiveIndex(0)
        },
        openShortcuts: () => {
          lastFocusedRef.current = document.activeElement as HTMLElement | null
          setSearchOpen(false)
          setNotesOpen(false)
          setShortcutsOpen(true)
        },
        notesOpen,
        openNotes: () => {
          setSearchOpen(false)
          setShortcutsOpen(false)
          setNotesOpen(true)
        },
        toggleNotes: () => {
          setSearchOpen(false)
          setShortcutsOpen(false)
          setNotesOpen(v => !v)
        },
        closeNotes: () => setNotesOpen(false),
      }}
    >
      {children}

      {searchOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[14vh]"
          onClick={() => setSearchOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--dev-border-strong)] bg-[var(--dev-surface)] shadow-2xl"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
          >
            <input
              ref={inputRef}
              aria-label="Search projects, milestones, batches, decisions, prompts, and knowledge pages"
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={e => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault()
                  setActiveIndex(i => Math.min(i + 1, results.length - 1))
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault()
                  setActiveIndex(i => Math.max(i - 1, 0))
                } else if (e.key === 'Enter' && results[activeIndex]) {
                  e.preventDefault()
                  go(results[activeIndex].href)
                }
              }}
              placeholder="Search projects, milestones, batches, risks, tasks, decisions, prompts, journal..."
              className="w-full border-b border-[var(--dev-border)] bg-transparent px-4 py-3.5 text-sm text-[var(--dev-text)] outline-none placeholder:text-[var(--dev-text-faint)]"
            />
            <div className="max-h-96 overflow-y-auto p-1.5">
              {groupedResults.length === 0 ? (
                <div className="px-3 py-6 text-center text-xs text-[var(--dev-text-faint)]">No matches</div>
              ) : (
                groupedResults.map(bucket => (
                  <div key={bucket.group} className="mb-1 last:mb-0">
                    <div className="px-3 pb-1 pt-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--dev-text-faint)]">
                      {bucket.group}
                    </div>
                    {bucket.items.map(({ item, index: idx }) => (
                      <button
                        key={`${item.group}-${item.href}-${item.label}`}
                        type="button"
                        onClick={() => go(item.href)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                          idx === activeIndex
                            ? 'bg-[var(--dev-accent-soft)] text-[var(--dev-accent)]'
                            : 'text-[var(--dev-text)] hover:bg-[var(--dev-surface-hover)]'
                        }`}
                      >
                        <span className="truncate">{item.label}</span>
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {shortcutsOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setShortcutsOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--dev-border-strong)] bg-[var(--dev-surface)] p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
          >
            <div className="text-sm font-semibold text-[var(--dev-text)]">Keyboard shortcuts</div>
            <div className="mt-3 space-y-2.5">
              {SHORTCUTS.map(s => (
                <div key={s.keys} className="flex items-center justify-between gap-4">
                  <span className="text-xs text-[var(--dev-text-muted)]">{s.description}</span>
                  <kbd className="rounded-md border border-[var(--dev-border-strong)] bg-[var(--dev-input-bg)] px-2 py-1 font-mono text-[11px] text-[var(--dev-text)]">
                    {s.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </DevExperienceContext.Provider>
  )
}
