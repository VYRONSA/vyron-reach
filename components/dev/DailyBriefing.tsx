'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import { getProjectIntelligence, type ProjectIntelligence } from '@/lib/dev/projectIntelligence'
import { getTasks, PRIORITY_LABEL } from '@/lib/dev/queueStorage'
import { openHighRisks, type Risk } from '@/lib/dev/risksStorage'
import { outstandingDebt, type TechnicalDebt } from '@/lib/dev/technicalDebtStorage'
import { recentlyCompleted, type ActivityEvent } from '@/lib/dev/activityFeed'
import { getJournalEntries, type JournalEntry } from '@/lib/dev/journalStorage'
import { getPrompts, type Prompt } from '@/lib/dev/promptsStorage'
import { DevBadge, DevCard, DevSkeleton } from './ui'

type Briefing = {
  intel: ProjectIntelligence
  openTaskCount: number
  highRisks: Risk[]
  debt: TechnicalDebt[]
  completed: ActivityEvent[]
  journalEntry: JournalEntry | null
  prompt: Prompt | null
}

function greeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

/**
 * Current project/milestone/batch and the suggested next task come straight
 * from the Project Intelligence Engine. Open high risks, tech debt, and
 * recently completed work stay app-wide by design — the briefing is meant to
 * surface things that need attention regardless of which project is default.
 */
function loadBriefing(defaultSlug: string): Briefing {
  const intel = getProjectIntelligence(defaultSlug)
  const openTaskCount = getTasks().filter(t => (!defaultSlug || t.project === defaultSlug) && t.status !== 'done').length
  const [journalEntry] = getJournalEntries()
  const [prompt] = [...getPrompts()].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))

  return {
    intel,
    openTaskCount,
    highRisks: openHighRisks(),
    debt: outstandingDebt(),
    completed: recentlyCompleted(3),
    journalEntry: journalEntry ?? null,
    prompt: prompt ?? null,
  }
}

export function DailyBriefing() {
  const { preferences, hydrated: prefsHydrated } = useDevPreferences()
  const [briefing, setBriefing] = useState<Briefing | null>(null)

  useEffect(() => {
    setBriefing(loadBriefing(preferences.defaultProject))
  }, [preferences.defaultProject])

  if (!prefsHydrated || !briefing) {
    return (
      <DevCard className="mb-8">
        <DevSkeleton className="h-5 w-48" />
        <DevSkeleton className="mt-3 h-4 w-full" />
        <DevSkeleton className="mt-2 h-4 w-5/6" />
        <DevSkeleton className="mt-2 h-4 w-2/3" />
      </DevCard>
    )
  }

  const { intel } = briefing
  const recentDecision = intel.recentDecisions[0] ?? null
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <DevCard className="mb-8" eyebrow={dateLabel} title={`${greeting()} — here's today's briefing.`}>
      <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
        <BriefRow label="Current Project" value={intel.project?.name ?? 'None set'} />
        <BriefRow label="Current Milestone" value={intel.currentMilestone?.title ?? 'None set'} />
        <BriefRow label="Current Batch" value={intel.currentBatch ? `Batch ${intel.currentBatch.batchNumber}` : 'None active'} />
        <BriefRow
          label="Today's Objectives"
          value={briefing.openTaskCount === 0 ? 'Nothing queued' : `${briefing.openTaskCount} open task${briefing.openTaskCount === 1 ? '' : 's'}`}
          href="/dev/queue"
        />
        <BriefRow
          label="Open High Risks"
          value={String(briefing.highRisks.length)}
          tone={briefing.highRisks.length > 0 ? 'danger' : 'success'}
          href="/dev/risks"
        />
        <BriefRow
          label="Outstanding Tech Debt"
          value={String(briefing.debt.length)}
          tone={briefing.debt.length > 0 ? 'warning' : 'success'}
          href="/dev/technical-debt"
        />
        <BriefRow
          label="Recent Decision"
          value={recentDecision?.decision ?? 'None recorded yet'}
          href={recentDecision ? `/dev/decisions?focus=${recentDecision.id}` : undefined}
        />
        <BriefRow
          label="Last Journal Entry"
          value={briefing.journalEntry ? `${briefing.journalEntry.date} — ${briefing.journalEntry.summary || 'Untitled'}` : 'None yet'}
          href={briefing.journalEntry ? `/dev/journal?focus=${briefing.journalEntry.id}` : undefined}
        />
        <BriefRow
          label="Most Recent Prompt"
          value={briefing.prompt?.title ?? 'None saved'}
          href={briefing.prompt ? `/dev/prompts?focus=${briefing.prompt.id}` : undefined}
        />
      </div>

      {briefing.completed.length > 0 ? (
        <div className="mt-4 border-t border-[var(--dev-border)] pt-3">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">
            Recently Completed Work
          </div>
          <ul className="mt-2 space-y-1">
            {briefing.completed.map(event => (
              <li key={`${event.category}-${event.id}`}>
                <Link
                  href={event.href}
                  className="flex items-center justify-between gap-2 text-sm text-[var(--dev-text)] hover:text-[var(--dev-accent)]"
                >
                  <span className="truncate">{event.title}</span>
                  <span className="shrink-0 text-[11px] text-[var(--dev-text-faint)]">{event.category}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--dev-accent)]/30 bg-[var(--dev-accent-soft)] px-4 py-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-accent)]">
            Suggested Next Task
          </div>
          <div className="mt-1 truncate text-sm font-medium text-[var(--dev-text)]">
            {intel.nextRecommendedTask?.title ?? 'Nothing queued — add a task to get started'}
          </div>
        </div>
        {intel.nextRecommendedTask ? (
          <div className="flex shrink-0 items-center gap-2">
            <DevBadge tone={intel.nextRecommendedTask.priority === 'high' ? 'danger' : intel.nextRecommendedTask.priority === 'medium' ? 'warning' : 'neutral'}>
              {PRIORITY_LABEL[intel.nextRecommendedTask.priority]}
            </DevBadge>
            <Link href={`/dev/queue?focus=${intel.nextRecommendedTask.id}`} className="text-xs font-medium text-[var(--dev-accent)] hover:underline">
              Open &rarr;
            </Link>
          </div>
        ) : null}
      </div>
    </DevCard>
  )
}

function BriefRow({
  label,
  value,
  href,
  tone,
}: {
  label: string
  value: string
  href?: string
  tone?: 'success' | 'warning' | 'danger'
}) {
  const toneClass =
    tone === 'danger'
      ? 'text-rose-500 dark:text-rose-400'
      : tone === 'warning'
        ? 'text-amber-500 dark:text-amber-400'
        : tone === 'success'
          ? 'text-emerald-500 dark:text-emerald-400'
          : 'text-[var(--dev-text)]'

  const content = (
    <div className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-1 transition-colors hover:bg-[var(--dev-surface-hover)]">
      <span className="text-xs text-[var(--dev-text-faint)]">{label}</span>
      <span className={`truncate text-right text-sm font-medium ${toneClass}`}>{value}</span>
    </div>
  )

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  )
}
