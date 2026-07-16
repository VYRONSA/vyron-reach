'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { ActionPriority, ExecutiveAction } from '@/lib/dev/executiveActionEngine'
import { DevBadge, DevSectionLabel } from './ui'

const PRIORITY_ORDER: ActionPriority[] = ['Critical', 'High', 'Medium', 'Low']

const PRIORITY_TONE: Record<ActionPriority, 'danger' | 'warning' | 'info' | 'neutral'> = {
  Critical: 'danger',
  High: 'warning',
  Medium: 'info',
  Low: 'neutral',
}

/**
 * The full action queue, top 10, grouped by priority, collapsed by
 * default — everything Mission Control isn't already showing as the one
 * primary action. Purely presentational over an already-computed
 * ExecutiveActionQueue.actions list.
 */
export function ExecutiveActionQueuePanel({ actions }: { actions: ExecutiveAction[] }) {
  const [expanded, setExpanded] = useState(false)
  const top = actions.slice(0, 10)
  const groups = PRIORITY_ORDER.map(priority => ({ priority, items: top.filter(a => a.priority === priority) })).filter(
    g => g.items.length > 0
  )

  return (
    <div className="mt-4 border-t border-[var(--dev-border)] pt-4">
      <button type="button" onClick={() => setExpanded(v => !v)} className="flex w-full items-center justify-between text-left">
        <DevSectionLabel>Executive Action Queue ({top.length})</DevSectionLabel>
        <span className="font-mono text-[10px] uppercase tracking-wide text-[var(--dev-text-faint)]">
          {expanded ? 'Hide' : 'Show'}
        </span>
      </button>

      {expanded ? (
        <div className="mt-3 space-y-4">
          {top.length === 0 ? (
            <p className="text-sm text-[var(--dev-text-faint)]">No outstanding actions.</p>
          ) : (
            groups.map(group => (
              <div key={group.priority}>
                <div className="mb-1.5 flex items-center gap-2">
                  <DevBadge tone={PRIORITY_TONE[group.priority]}>{group.priority}</DevBadge>
                  <span className="text-xs text-[var(--dev-text-faint)]">
                    {group.items.length} item{group.items.length === 1 ? '' : 's'}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {group.items.map((action, i) => (
                    <li key={i} className="rounded-lg border border-[var(--dev-border)] px-3 py-2">
                      <Link
                        href={action.href}
                        className="flex items-center justify-between gap-2 text-sm text-[var(--dev-text)] hover:text-[var(--dev-accent)]"
                      >
                        <span className="truncate">{action.title}</span>
                        <span className="shrink-0 text-[11px] text-[var(--dev-text-faint)]">{action.category}</span>
                      </Link>
                      <p className="mt-0.5 truncate text-xs text-[var(--dev-text-faint)]">{action.recommendedAction}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
