'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import type { Project } from '@/lib/dev/projectsData'
import { getCurrentMilestone, getMilestoneProgress } from '@/lib/dev/milestonesStorage'
import { getCurrentBatchForProject } from '@/lib/dev/batchesStorage'
import { openRisksForProject } from '@/lib/dev/risksStorage'
import { debtForProject } from '@/lib/dev/technicalDebtStorage'
import { getReleases } from '@/lib/dev/releasesStorage'
import { getActivityEvents } from '@/lib/dev/activityFeed'
import { todaysTotalSeconds, formatDuration } from '@/lib/dev/sessionStorage'
import { computeProjectHealth, HEALTH_TONE } from '@/lib/dev/projectHealth'
import { DevBadge } from './ui'

type PulseData = {
  progress: number | null
  milestoneLabel: string | null
  batchLabel: string | null
  openRisks: number
  openDebt: number
  health: ReturnType<typeof computeProjectHealth>
  devTimeToday: number
  recentReleaseCount: number
  latestReleaseVersion: string | null
  lastActivityLabel: string | null
}

function loadPulse(slug: string): PulseData {
  const batch = getCurrentBatchForProject(slug)
  const releases = getReleases().filter(r => r.project === slug)
  const [latestRelease] = [...releases].sort((a, b) => (a.date < b.date ? 1 : -1))
  const [lastActivity] = getActivityEvents().filter(e => e.project === slug)

  return {
    progress: getMilestoneProgress(slug),
    milestoneLabel: getCurrentMilestone(slug)?.title ?? null,
    batchLabel: batch ? `Batch ${batch.batchNumber}` : null,
    openRisks: openRisksForProject(slug).length,
    openDebt: debtForProject(slug).filter(d => d.status !== 'Resolved').length,
    health: computeProjectHealth(slug),
    devTimeToday: todaysTotalSeconds(slug),
    recentReleaseCount: releases.length,
    latestReleaseVersion: latestRelease?.version ?? null,
    lastActivityLabel: lastActivity ? lastActivity.title : null,
  }
}

/**
 * Always-visible pulse strip shown above the project tabs — the "complete
 * picture" a project should give the moment you open it, regardless of
 * which tab is active underneath.
 */
export function ProjectPulse({ project }: { project: Project }) {
  const { preferences, setPreferences } = useDevPreferences()
  const [data, setData] = useState<PulseData | null>(null)

  useEffect(() => {
    setData(loadPulse(project.slug))
    const id = window.setInterval(() => setData(loadPulse(project.slug)), 15_000)
    return () => window.clearInterval(id)
  }, [project.slug])

  const hydrated = data !== null
  const pinned = preferences.pinnedProjects.includes(project.slug)
  const togglePin = () => {
    const pinnedProjects = pinned
      ? preferences.pinnedProjects.filter(s => s !== project.slug)
      : [...preferences.pinnedProjects, project.slug]
    setPreferences({ pinnedProjects })
  }

  return (
    <div className="mb-6 rounded-2xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-4 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_12px_28px_-14px_rgba(0,0,0,0.4)]">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <button
          type="button"
          onClick={togglePin}
          aria-label={pinned ? 'Unpin project' : 'Pin project'}
          className={`text-lg leading-none ${pinned ? 'text-amber-500 dark:text-amber-400' : 'text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]'}`}
        >
          &#9733;
        </button>

        <PulseStat label="Health">
          {hydrated ? <DevBadge tone={HEALTH_TONE[data.health.label]}>{data.health.label}</DevBadge> : <Placeholder />}
        </PulseStat>

        <PulseStat label="Completion">
          <span className="font-mono text-sm text-[var(--dev-text)]">
            {hydrated ? `${data.progress ?? project.progress}%` : '—'}
          </span>
        </PulseStat>

        <PulseStat label="Milestone">
          <span className="text-sm text-[var(--dev-text)]">{hydrated ? data.milestoneLabel ?? project.milestone : '—'}</span>
        </PulseStat>

        <PulseStat label="Batch">
          <span className="text-sm text-[var(--dev-text)]">{hydrated ? data.batchLabel ?? 'None active' : '—'}</span>
        </PulseStat>

        <PulseStat label="Dev Time Today">
          <span className="font-mono text-sm text-[var(--dev-text)]">{hydrated ? formatDuration(data.devTimeToday) : '—'}</span>
        </PulseStat>

        <PulseStat label="Open Risks">
          <span className={`font-mono text-sm ${hydrated && data.openRisks > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-[var(--dev-text)]'}`}>
            {hydrated ? data.openRisks : '—'}
          </span>
        </PulseStat>

        <PulseStat label="Outstanding Debt">
          <span className={`font-mono text-sm ${hydrated && data.openDebt > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-[var(--dev-text)]'}`}>
            {hydrated ? data.openDebt : '—'}
          </span>
        </PulseStat>

        <PulseStat label="Recent Releases">
          <span className="text-sm text-[var(--dev-text)]">
            {hydrated ? (data.latestReleaseVersion ? `${data.latestReleaseVersion} (${data.recentReleaseCount} total)` : 'None yet') : '—'}
          </span>
        </PulseStat>

        <PulseStat label="Last Activity">
          <span className="max-w-[220px] truncate text-sm text-[var(--dev-text)]">
            {hydrated ? data.lastActivityLabel ?? project.recentActivity[0]?.label ?? 'No recorded activity' : '—'}
          </span>
        </PulseStat>
      </div>

      {hydrated && data.health.label !== 'Excellent' ? (
        <div className="mt-3 border-t border-[var(--dev-border)] pt-3 text-xs text-[var(--dev-text-faint)]">
          {data.health.signals.join(' · ')}
        </div>
      ) : null}
    </div>
  )
}

function PulseStat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--dev-text-faint)]">{label}</div>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function Placeholder() {
  return <span className="text-xs text-[var(--dev-text-faint)]">—</span>
}
