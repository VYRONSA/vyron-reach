'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import { getProjectBySlug } from '@/lib/dev/projectsData'
import { getTasks, type Task } from '@/lib/dev/queueStorage'
import { getCurrentMilestone, getMilestoneProgress, overdueMilestones, type Milestone } from '@/lib/dev/milestonesStorage'
import { getCurrentBatchForProject, type Batch } from '@/lib/dev/batchesStorage'
import { getDecisions, type Decision } from '@/lib/dev/decisionsStorage'
import { getPrompts, type Prompt } from '@/lib/dev/promptsStorage'
import { getJournalEntries, type JournalEntry } from '@/lib/dev/journalStorage'
import { openHighRisks, type Risk } from '@/lib/dev/risksStorage'
import { outstandingDebt } from '@/lib/dev/technicalDebtStorage'
import { recentReleases, type Release } from '@/lib/dev/releasesStorage'
import type { DashboardWidgetId } from '@/lib/dev/preferences'
import { DevBadge, DevCard, DevEmptyState, DevGrid, DevSkeleton, DevStat } from './ui'
import { DashboardCustomizer } from './DashboardCustomizer'

type Snapshot = {
  tasks: Task[]
  decisions: Decision[]
  prompts: Prompt[]
  journal: JournalEntry[]
  highRisks: Risk[]
  debtHighCount: number
  releases: Release[]
  overdue: Milestone[]
  milestone: Milestone | null
  batch: Batch | null
  milestoneProgress: number | null
}

function loadSnapshot(defaultProjectSlug: string): Snapshot {
  const debt = outstandingDebt()
  return {
    tasks: getTasks(),
    decisions: getDecisions(),
    prompts: getPrompts(),
    journal: getJournalEntries(),
    highRisks: openHighRisks(),
    debtHighCount: debt.filter(d => d.priority === 'High').length,
    releases: recentReleases(5),
    overdue: overdueMilestones(),
    milestone: defaultProjectSlug ? getCurrentMilestone(defaultProjectSlug) : null,
    batch: defaultProjectSlug ? getCurrentBatchForProject(defaultProjectSlug) : null,
    milestoneProgress: defaultProjectSlug ? getMilestoneProgress(defaultProjectSlug) : null,
  }
}

export function DashboardSummary() {
  const { preferences, hydrated: prefsHydrated } = useDevPreferences()
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [customizing, setCustomizing] = useState(false)

  useEffect(() => {
    setSnapshot(loadSnapshot(preferences.defaultProject))
  }, [preferences.defaultProject])

  // Memoized so toggling the Customize panel (or any unrelated re-render) doesn't
  // re-filter every store and rebuild all twelve widget closures each time.
  const derived = useMemo(() => {
    if (!snapshot) return null
    const { tasks, decisions, prompts, journal, highRisks, debtHighCount, releases, overdue, milestone, batch, milestoneProgress } =
      snapshot
    const defaultProject = preferences.defaultProject ? getProjectBySlug(preferences.defaultProject) : undefined

    const blockedTasks = tasks.filter(t => t.status === 'blocked')
    const openProjectTasks = preferences.defaultProject
      ? tasks.filter(t => t.project === preferences.defaultProject && t.status !== 'done')
      : tasks.filter(t => t.status !== 'done')

    const healthScore = blockedTasks.length + highRisks.length * 2 + overdue.length * 2 + debtHighCount
    const healthLabel = healthScore === 0 ? 'Healthy' : healthScore <= 3 ? 'Needs Attention' : 'Critical'
    const healthTone = healthScore === 0 ? 'success' : healthScore <= 3 ? 'warning' : 'danger'
    const healthClass =
      healthTone === 'success' ? 'text-emerald-500 dark:text-emerald-400' : healthTone === 'warning' ? 'text-amber-500 dark:text-amber-400' : 'text-rose-500 dark:text-rose-400'

    const rawFocus = batch?.objective?.trim() || milestone?.description?.trim() || milestone?.title || defaultProject?.tagline
    const focusLabel = rawFocus ? (rawFocus.length > 64 ? `${rawFocus.slice(0, 64)}…` : rawFocus) : 'No active focus set — assign a milestone or batch'

    return {
      defaultProject,
      tasks,
      decisions,
      prompts,
      journal,
      highRisks,
      debtHighCount,
      releases,
      overdue,
      milestone,
      batch,
      milestoneProgress,
      blockedTasks,
      openProjectTasks,
      healthLabel,
      healthClass,
      focusLabel,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot, preferences.defaultProject])

  if (!snapshot || !prefsHydrated || !derived) {
    return (
      <div>
        <DevSkeleton className="mb-3 h-3 w-48" />
        <DevGrid>
          {Array.from({ length: 6 }).map((_, i) => (
            <DevCard key={i}>
              <DevSkeleton className="h-3 w-24" />
              <DevSkeleton className="mt-2 h-5 w-32" />
            </DevCard>
          ))}
        </DevGrid>
      </div>
    )
  }

  const {
    defaultProject,
    decisions,
    prompts,
    journal,
    releases,
    milestone,
    batch,
    milestoneProgress,
    blockedTasks,
    highRisks,
    overdue,
    debtHighCount,
    openProjectTasks,
    healthLabel,
    healthClass,
    focusLabel,
  } = derived

  const widgets: Record<DashboardWidgetId, () => ReactNode> = {
    focus: () => (
      <DevStat label="Development Focus" value={focusLabel} hint={defaultProject?.name} tone="info" />
    ),
    currentProject: () => (
      <DevStat
        label="Current Project"
        value={defaultProject?.name ?? 'None set'}
        hint={defaultProject?.tagline}
        tone="info"
      />
    ),
    currentMilestone: () => (
      <DevStat
        label="Current Milestone"
        value={milestone?.title ?? 'None set'}
        hint={milestone?.targetDate ? `Target ${milestone.targetDate} · ${milestoneProgress ?? 0}% complete` : undefined}
        tone="info"
      />
    ),
    currentBatch: () => (
      <DevStat
        label="Current Batch"
        value={batch ? `Batch ${batch.batchNumber}` : 'None active'}
        hint={batch?.objective}
        tone={batch ? 'info' : 'neutral'}
      />
    ),
    objectives: () => (
      <DevCard eyebrow="Today" title="Today's Objectives">
        {openProjectTasks.length === 0 ? (
          <div className="mt-2 text-sm text-[var(--dev-text-faint)]">
            No open tasks{defaultProject ? ` for ${defaultProject.name}` : ''}.
          </div>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {openProjectTasks.slice(0, 5).map(t => (
              <li key={t.id} className="flex items-center justify-between gap-2 text-sm text-[var(--dev-text)]">
                <span className="truncate">{t.title}</span>
                <DevBadge tone={t.priority === 'high' ? 'danger' : t.priority === 'medium' ? 'warning' : 'neutral'}>
                  {t.priority}
                </DevBadge>
              </li>
            ))}
          </ul>
        )}
      </DevCard>
    ),
    health: () => (
      <DevCard eyebrow="Status" title="Development Health">
        <div className={`mt-2 font-mono text-lg font-semibold ${healthClass}`}>{healthLabel}</div>
        <div className="mt-1.5 text-xs leading-relaxed text-[var(--dev-text-faint)]">
          {blockedTasks.length} blocked task{blockedTasks.length === 1 ? '' : 's'} · {highRisks.length} open high
          risk{highRisks.length === 1 ? '' : 's'} · {overdue.length} overdue milestone{overdue.length === 1 ? '' : 's'} ·{' '}
          {debtHighCount} high-priority debt item{debtHighCount === 1 ? '' : 's'}
        </div>
      </DevCard>
    ),
    blockers: () => (
      <DevCard eyebrow="Attention" title="Active Blockers">
        {blockedTasks.length === 0 && highRisks.length === 0 ? (
          <div className="mt-2 text-sm text-[var(--dev-text-faint)]">No active blockers.</div>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {blockedTasks.slice(0, 3).map(t => (
              <li key={t.id} className="truncate text-sm text-[var(--dev-text)]">
                Blocked task — {t.title}
              </li>
            ))}
            {highRisks.slice(0, 3).map(r => (
              <li key={r.id} className="truncate text-sm text-[var(--dev-text)]">
                High risk — {r.title}
              </li>
            ))}
          </ul>
        )}
      </DevCard>
    ),
    activity: () => (
      <DevCard eyebrow="History" title="Recent Activity">
        {!defaultProject || defaultProject.recentActivity.length === 0 ? (
          <div className="mt-2 text-sm text-[var(--dev-text-faint)]">No recent activity.</div>
        ) : (
          <ul className="mt-2 space-y-2">
            {defaultProject.recentActivity.slice(0, 4).map(a => (
              <li key={a.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate text-[var(--dev-text)]">{a.label}</span>
                <span className="shrink-0 text-[11px] text-[var(--dev-text-faint)]">{a.time}</span>
              </li>
            ))}
          </ul>
        )}
      </DevCard>
    ),
    decisions: () => (
      <DevCard eyebrow="Latest" title="Recent Decisions">
        {decisions.length === 0 ? (
          <div className="mt-2 text-sm text-[var(--dev-text-faint)]">No decisions recorded yet.</div>
        ) : (
          <div className="mt-2 space-y-1.5">
            {decisions.slice(0, 3).map(d => (
              <Link key={d.id} href={`/dev/decisions?focus=${d.id}`} className="block truncate text-sm text-[var(--dev-text)] hover:text-[var(--dev-accent)]">
                {d.decision}
              </Link>
            ))}
          </div>
        )}
      </DevCard>
    ),
    journal: () => (
      <DevCard eyebrow="Latest" title="Recent Journal Entries">
        {journal.length === 0 ? (
          <div className="mt-2 text-sm text-[var(--dev-text-faint)]">No journal entries yet.</div>
        ) : (
          <div className="mt-2 space-y-1.5">
            {journal.slice(0, 3).map(j => (
              <Link key={j.id} href={`/dev/journal?focus=${j.id}`} className="block truncate text-sm text-[var(--dev-text)] hover:text-[var(--dev-accent)]">
                {j.date} — {j.summary || 'Untitled entry'}
              </Link>
            ))}
          </div>
        )}
      </DevCard>
    ),
    prompts: () => (
      <DevCard eyebrow="Latest" title="Recent Prompt Updates">
        {prompts.length === 0 ? (
          <div className="mt-2 text-sm text-[var(--dev-text-faint)]">No prompts saved yet.</div>
        ) : (
          <div className="mt-2 space-y-1.5">
            {[...prompts]
              .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
              .slice(0, 3)
              .map(p => (
                <Link key={p.id} href={`/dev/prompts?focus=${p.id}`} className="block truncate text-sm text-[var(--dev-text)] hover:text-[var(--dev-accent)]">
                  {p.title}
                </Link>
              ))}
          </div>
        )}
      </DevCard>
    ),
    releases: () => (
      <DevCard eyebrow="Latest" title="Recent Releases">
        {releases.length === 0 ? (
          <div className="mt-2 text-sm text-[var(--dev-text-faint)]">No releases logged yet.</div>
        ) : (
          <div className="mt-2 space-y-1.5">
            {releases.map(r => (
              <Link
                key={r.id}
                href={`/dev/milestones?focus=${r.id}`}
                className="flex items-center justify-between gap-2 text-sm text-[var(--dev-text)] hover:text-[var(--dev-accent)]"
              >
                <span className="truncate">{r.version}</span>
                <span className="shrink-0 text-[11px] text-[var(--dev-text-faint)]">{r.date}</span>
              </Link>
            ))}
          </div>
        )}
      </DevCard>
    ),
  }

  const hidden = new Set(preferences.dashboardHiddenWidgets)
  const visibleOrder = preferences.dashboardWidgetOrder.filter(id => widgets[id] && !hidden.has(id))

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--dev-accent)]">
          Command Centre Summary
        </div>
        <button
          type="button"
          onClick={() => setCustomizing(v => !v)}
          className="text-xs font-medium text-[var(--dev-text-faint)] transition-colors hover:text-[var(--dev-accent)]"
        >
          {customizing ? 'Done' : 'Customize'}
        </button>
      </div>

      {customizing ? <DashboardCustomizer /> : null}

      {visibleOrder.length === 0 ? (
        <DevEmptyState>All dashboard widgets are hidden. Use Customize to bring some back.</DevEmptyState>
      ) : (
        <DevGrid>
          {visibleOrder.map(id => (
            <div key={id} className="dev-fade-in">
              {widgets[id]()}
            </div>
          ))}
        </DevGrid>
      )}
    </div>
  )
}
