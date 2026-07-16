'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { formatTimeAgo, getRecentItems, type RecentItem, type RecentItemType } from '@/lib/dev/recents'
import { DevBadge, DevCard, DevEmptyState } from './ui'

const TYPE_LABEL: Record<RecentItemType, string> = {
  project: 'Project',
  prompt: 'Prompt',
  knowledge: 'Knowledge',
  journal: 'Journal',
  decision: 'Decision',
  milestone: 'Milestone',
  batch: 'Batch',
}

const TYPE_TONE: Record<RecentItemType, 'neutral' | 'info' | 'success' | 'warning'> = {
  project: 'info',
  prompt: 'neutral',
  knowledge: 'neutral',
  journal: 'neutral',
  decision: 'neutral',
  milestone: 'info',
  batch: 'info',
}

export function RecentlyUsedCard({ limit = 6 }: { limit?: number }) {
  const [items, setItems] = useState<RecentItem[]>([])

  useEffect(() => {
    setItems(getRecentItems().slice(0, limit))
  }, [limit])

  return (
    <DevCard eyebrow="Across the app" title="Recently Used">
      {items.length === 0 ? (
        <DevEmptyState>Milestones, batches, decisions, prompts, journal, and knowledge pages you open will show up here.</DevEmptyState>
      ) : (
        <div className="mt-2 space-y-1.5">
          {items.map(item => (
            <Link
              key={`${item.type}-${item.id}`}
              href={item.href}
              className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-1.5 text-sm transition-colors hover:bg-[var(--dev-surface-hover)]"
            >
              <span className="flex min-w-0 items-center gap-2">
                <DevBadge tone={TYPE_TONE[item.type]}>{TYPE_LABEL[item.type]}</DevBadge>
                <span className="truncate text-[var(--dev-text)]">{item.label}</span>
              </span>
              <span className="shrink-0 text-[11px] text-[var(--dev-text-faint)]">{formatTimeAgo(item.visitedAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </DevCard>
  )
}
