'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getKnowledgeNote, KNOWLEDGE_SECTIONS } from '@/lib/dev/knowledgeData'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import { DevBadge, DevPageHeader } from '@/components/dev/ui'

export default function DevKnowledgeCentrePage() {
  const { preferences, hydrated, setPreferences } = useDevPreferences()
  const [updatedMap, setUpdatedMap] = useState<Record<string, string>>({})

  useEffect(() => {
    const map: Record<string, string> = {}
    for (const section of KNOWLEDGE_SECTIONS) {
      const note = getKnowledgeNote(section.slug)
      if (note.updatedAt) map[section.slug] = note.updatedAt
    }
    setUpdatedMap(map)
  }, [])

  const toggleFavourite = (slug: string) => {
    const favourites = preferences.favouriteKnowledgeSections.includes(slug)
      ? preferences.favouriteKnowledgeSections.filter(s => s !== slug)
      : [...preferences.favouriteKnowledgeSections, slug]
    setPreferences({ favouriteKnowledgeSections: favourites })
  }

  return (
    <div>
      <DevPageHeader
        eyebrow="Reference"
        title="Knowledge Centre"
        description="Notes stored per category in your browser. Open a section to write or read."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {KNOWLEDGE_SECTIONS.map(section => {
          const updatedAt = updatedMap[section.slug]
          const favourited = hydrated && preferences.favouriteKnowledgeSections.includes(section.slug)
          return (
            <div
              key={section.slug}
              className="dev-lift group relative rounded-2xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-5 transition-colors hover:border-[var(--dev-accent)]/30"
            >
              <button
                type="button"
                onClick={() => toggleFavourite(section.slug)}
                aria-label={favourited ? 'Unfavourite section' : 'Favourite section'}
                className={`absolute right-5 top-5 z-10 text-base leading-none ${favourited ? 'text-amber-500 dark:text-amber-400' : 'text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]'}`}
              >
                &#9733;
              </button>
              <Link href={`/dev/knowledge/${section.slug}`} className="block">
                <div className="flex items-start justify-between pr-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--dev-surface-hover)] font-mono text-xs font-semibold text-[var(--dev-text-muted)]">
                    {section.title.charAt(0)}
                  </div>
                  <DevBadge tone={updatedAt ? 'success' : 'neutral'}>{updatedAt ? 'Has notes' : 'Empty'}</DevBadge>
                </div>
                <div className="mt-4 text-sm font-medium text-[var(--dev-text)]">{section.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-[var(--dev-text-faint)]">{section.description}</p>
                {updatedAt ? (
                  <div className="mt-3 text-[11px] text-[var(--dev-text-faint)]">
                    Updated {new Date(updatedAt).toLocaleString()}
                  </div>
                ) : null}
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
