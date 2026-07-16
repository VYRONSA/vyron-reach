'use client'

import { useEffect, useMemo, useState } from 'react'
import { getProjects, getProjectName } from '@/lib/dev/projectsData'
import { getMilestones, type Milestone } from '@/lib/dev/milestonesStorage'
import { getBatches, type Batch } from '@/lib/dev/batchesStorage'
import { deleteHandover, getHandovers, type Handover } from '@/lib/dev/handoverStorage'
import { DevBadge, DevButton, DevEmptyState, DevInput, DevSelect, devValidationTone } from './ui'
import { HandoverForm } from './HandoverForm'
import { HandoverViewer } from './HandoverViewer'
import { useQueryParam } from './useQueryParam'

type Mode = 'list' | 'create' | 'edit' | 'view'

export function HandoverWorkspace() {
  const [handovers, setHandovers] = useState<Handover[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [query, setQuery] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [milestoneFilter, setMilestoneFilter] = useState('')
  const [batchFilter, setBatchFilter] = useState('')
  const [mode, setMode] = useState<Mode>('list')
  const [activeId, setActiveId] = useState<string | null>(null)

  const focusParam = useQueryParam('focus')

  const refresh = () => {
    setHandovers(getHandovers())
    setMilestones(getMilestones())
    setBatches(getBatches())
  }

  useEffect(() => {
    refresh()
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (focusParam && handovers.some(h => h.id === focusParam)) {
      setActiveId(focusParam)
      setMode('view')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusParam, handovers.length])

  const visible = useMemo(() => {
    let list = handovers
    if (projectFilter) list = list.filter(h => h.project === projectFilter)
    if (milestoneFilter) list = list.filter(h => h.relatedMilestone === milestoneFilter)
    if (batchFilter) list = list.filter(h => h.relatedBatch === batchFilter)
    const q = query.trim().toLowerCase()
    if (q) {
      list = list.filter(h =>
        [h.phase, h.claudeModel, h.objective, h.executiveSummary, h.risksIdentified, h.recommendations, h.nextSuggestedBatch, getProjectName(h.project)].some(
          f => f.toLowerCase().includes(q)
        )
      )
    }
    return [...list].sort((a, b) => (a.date === b.date ? (a.createdAt < b.createdAt ? 1 : -1) : a.date < b.date ? 1 : -1))
  }, [handovers, projectFilter, milestoneFilter, batchFilter, query])

  const milestoneOptions = useMemo(
    () => (projectFilter ? milestones.filter(m => m.project === projectFilter) : milestones),
    [milestones, projectFilter]
  )
  const batchOptions = useMemo(
    () => (milestoneFilter ? batches.filter(b => b.milestone === milestoneFilter) : batches),
    [batches, milestoneFilter]
  )

  const active = handovers.find(h => h.id === activeId) ?? null

  const startCreate = () => {
    setActiveId(null)
    setMode('create')
  }
  const openView = (h: Handover) => {
    setActiveId(h.id)
    setMode('view')
  }
  const startEdit = () => setMode('edit')
  const handleDelete = () => {
    if (!active) return
    deleteHandover(active.id)
    setActiveId(null)
    setMode('list')
    refresh()
  }
  const handleDone = () => {
    refresh()
    setMode(activeId ? 'view' : 'list')
  }
  const backToList = () => {
    setActiveId(null)
    setMode('list')
  }

  if (!hydrated) return <div className="text-sm text-[var(--dev-text-faint)]">Loading handovers...</div>

  if (mode === 'create') {
    return <HandoverForm onDone={handleDone} onCancel={backToList} />
  }
  if (mode === 'edit' && active) {
    return <HandoverForm editing={active} onDone={handleDone} onCancel={() => setMode('view')} />
  }
  if (mode === 'view' && active) {
    return <HandoverViewer handover={active} onEdit={startEdit} onDelete={handleDelete} onBack={backToList} />
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-2">
          <DevInput
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search handovers..."
            aria-label="Search handovers"
            className="sm:max-w-xs"
          />
          <DevSelect
            value={projectFilter}
            onChange={e => {
              setProjectFilter(e.target.value)
              setMilestoneFilter('')
              setBatchFilter('')
            }}
            aria-label="Filter by project"
            className="sm:w-44"
          >
            <option value="">All projects</option>
            {getProjects().map(p => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </DevSelect>
          <DevSelect
            value={milestoneFilter}
            onChange={e => {
              setMilestoneFilter(e.target.value)
              setBatchFilter('')
            }}
            aria-label="Filter by milestone"
            className="sm:w-48"
          >
            <option value="">All milestones</option>
            {milestoneOptions.map(m => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </DevSelect>
          <DevSelect value={batchFilter} onChange={e => setBatchFilter(e.target.value)} aria-label="Filter by batch" className="sm:w-36">
            <option value="">All batches</option>
            {batchOptions.map(b => (
              <option key={b.id} value={b.id}>
                Batch {b.batchNumber}
              </option>
            ))}
          </DevSelect>
        </div>
        <DevButton onClick={startCreate}>New handover</DevButton>
      </div>

      {visible.length === 0 ? (
        <DevEmptyState>No handovers recorded{query || projectFilter || milestoneFilter || batchFilter ? ' matching your filters' : ' yet'}.</DevEmptyState>
      ) : (
        <div className="space-y-3">
          {visible.map(h => {
            const batch = batches.find(b => b.id === h.relatedBatch)
            const totalFiles = h.filesCreated.length + h.filesModified.length + h.filesDeleted.length
            return (
              <button
                key={h.id}
                type="button"
                id={`record-${h.id}`}
                onClick={() => openView(h)}
                className="block w-full scroll-mt-24 rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-4 text-left transition-colors hover:border-[var(--dev-accent)]/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--dev-text)]">{h.phase || 'Untitled handover'}</div>
                    <div className="mt-0.5 text-xs text-[var(--dev-text-faint)]">
                      {getProjectName(h.project)}
                      {batch ? ` · Batch ${batch.batchNumber}` : ''} · {h.date}
                    </div>
                  </div>
                  <DevBadge tone={devValidationTone(h.buildStatus)}>{h.buildStatus}</DevBadge>
                </div>
                {h.executiveSummary ? <p className="mt-2 truncate text-xs text-[var(--dev-text-muted)]">{h.executiveSummary}</p> : null}
                <div className="mt-2 text-[11px] text-[var(--dev-text-faint)]">
                  {totalFiles} file{totalFiles === 1 ? '' : 's'} changed
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
