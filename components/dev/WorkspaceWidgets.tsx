'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import { getProjectBySlug, STATUS_LABEL, STATUS_TONE } from '@/lib/dev/projectsData'
import { getMilestones, type Milestone } from '@/lib/dev/milestonesStorage'
import { getBatches, type Batch } from '@/lib/dev/batchesStorage'
import { getPrompts } from '@/lib/dev/promptsStorage'
import { KNOWLEDGE_SECTIONS } from '@/lib/dev/knowledgeData'
import { DevBadge, DevCard, DevEmptyState } from './ui'

export function PinnedProjectsCard() {
  const { preferences, hydrated } = useDevPreferences()
  if (!hydrated) return null
  const pinned = preferences.pinnedProjects.map(getProjectBySlug).filter((p): p is NonNullable<typeof p> => Boolean(p))

  return (
    <DevCard eyebrow="Pinned" title="Pinned Projects">
      {pinned.length === 0 ? (
        <DevEmptyState>Star a project from its workspace to pin it here.</DevEmptyState>
      ) : (
        <div className="mt-2 space-y-1.5">
          {pinned.map(project => (
            <Link
              key={project.slug}
              href={`/dev/projects/${project.slug}`}
              className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 text-sm transition-colors hover:bg-[var(--dev-surface-hover)]"
            >
              <span className="truncate text-[var(--dev-text)]">{project.name}</span>
              <DevBadge tone={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</DevBadge>
            </Link>
          ))}
        </div>
      )}
    </DevCard>
  )
}

export function PinnedMilestonesCard() {
  const { preferences, hydrated } = useDevPreferences()
  const [milestones, setMilestones] = useState<Milestone[]>([])

  useEffect(() => {
    setMilestones(getMilestones())
  }, [])

  if (!hydrated) return null
  const pinned = milestones.filter(m => preferences.pinnedMilestones.includes(m.id))

  return (
    <DevCard eyebrow="Pinned" title="Pinned Milestones">
      {pinned.length === 0 ? (
        <DevEmptyState>Star a milestone to pin it here.</DevEmptyState>
      ) : (
        <div className="mt-2 space-y-1.5">
          {pinned.map(m => (
            <Link
              key={m.id}
              href={`/dev/milestones?focus=${m.id}`}
              className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 text-sm transition-colors hover:bg-[var(--dev-surface-hover)]"
            >
              <span className="truncate text-[var(--dev-text)]">{m.title}</span>
              <span className="shrink-0 font-mono text-[11px] text-[var(--dev-text-faint)]">{m.progress}%</span>
            </Link>
          ))}
        </div>
      )}
    </DevCard>
  )
}

export function PinnedBatchesCard() {
  const { preferences, hydrated } = useDevPreferences()
  const [batches, setBatches] = useState<Batch[]>([])

  useEffect(() => {
    setBatches(getBatches())
  }, [])

  if (!hydrated) return null
  const pinned = batches.filter(b => preferences.pinnedBatches.includes(b.id))

  return (
    <DevCard eyebrow="Pinned" title="Pinned Batches">
      {pinned.length === 0 ? (
        <DevEmptyState>Star a batch to pin it here.</DevEmptyState>
      ) : (
        <div className="mt-2 space-y-1.5">
          {pinned.map(b => (
            <Link
              key={b.id}
              href={`/dev/batches?focus=${b.id}`}
              className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 text-sm transition-colors hover:bg-[var(--dev-surface-hover)]"
            >
              <span className="truncate text-[var(--dev-text)]">Batch {b.batchNumber}</span>
              <span className="shrink-0 text-[11px] text-[var(--dev-text-faint)]">{b.status}</span>
            </Link>
          ))}
        </div>
      )}
    </DevCard>
  )
}

export function FavouritePromptsCard() {
  const [favourites, setFavourites] = useState<ReturnType<typeof getPrompts>>([])

  useEffect(() => {
    setFavourites(getPrompts().filter(p => p.favourite))
  }, [])

  return (
    <DevCard eyebrow="Favourites" title="Favourite Prompts">
      {favourites.length === 0 ? (
        <DevEmptyState>Star a prompt in the library to pin it here.</DevEmptyState>
      ) : (
        <div className="mt-2 space-y-1.5">
          {favourites.map(p => (
            <Link
              key={p.id}
              href={`/dev/prompts?focus=${p.id}`}
              className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 text-sm transition-colors hover:bg-[var(--dev-surface-hover)]"
            >
              <span className="truncate text-[var(--dev-text)]">{p.title}</span>
              <DevBadge tone="info">{p.category}</DevBadge>
            </Link>
          ))}
        </div>
      )}
    </DevCard>
  )
}

export function FavouriteKnowledgeCard() {
  const { preferences, hydrated, setPreferences } = useDevPreferences()
  if (!hydrated) return null
  const favourites = KNOWLEDGE_SECTIONS.filter(s => preferences.favouriteKnowledgeSections.includes(s.slug))

  const unfavourite = (slug: string) => {
    setPreferences({ favouriteKnowledgeSections: preferences.favouriteKnowledgeSections.filter(s => s !== slug) })
  }

  return (
    <DevCard eyebrow="Favourites" title="Favourite Knowledge Pages">
      {favourites.length === 0 ? (
        <DevEmptyState>Star a knowledge section to pin it here.</DevEmptyState>
      ) : (
        <div className="mt-2 space-y-1.5">
          {favourites.map(s => (
            <div key={s.slug} className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 text-sm hover:bg-[var(--dev-surface-hover)]">
              <Link href={`/dev/knowledge/${s.slug}`} className="truncate text-[var(--dev-text)]">
                {s.title}
              </Link>
              <button
                type="button"
                onClick={() => unfavourite(s.slug)}
                aria-label="Remove favourite"
                className="shrink-0 text-amber-500 dark:text-amber-400"
              >
                &#9733;
              </button>
            </div>
          ))}
        </div>
      )}
    </DevCard>
  )
}
