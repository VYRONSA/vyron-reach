'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getProjects, STATUS_LABEL, STATUS_TONE, type Project } from '@/lib/dev/projectsData'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import { tasksForProject } from '@/lib/dev/queueStorage'
import { getProjectList } from '@/lib/dev/projectLists'
import { getProjectIntelligence } from '@/lib/dev/projectIntelligence'
import { HEALTH_TONE, type ProjectHealth } from '@/lib/dev/projectHealth'
import { DevBadge, DevPageHeader } from '@/components/dev/ui'

type PortfolioStats = {
  progress: number
  milestoneLabel: string
  batchLabel: string
  openTasks: number
  openRisks: number
  upcoming: string
  health: ProjectHealth
}

/** Sourced from the Project Intelligence Engine wherever the engine already covers it. */
function computeStats(project: Project): PortfolioStats {
  const intel = getProjectIntelligence(project.slug)
  const openTasks = tasksForProject(project.slug).filter(t => t.status !== 'done')
  const upcoming = getProjectList(project.slug, 'upcoming')[0]

  return {
    progress: intel.progress,
    milestoneLabel: intel.currentMilestone?.title ?? project.milestone,
    batchLabel: intel.currentBatch ? `Batch ${intel.currentBatch.batchNumber}` : 'No active batch',
    openTasks: openTasks.length,
    openRisks: intel.openRisks.length,
    upcoming: upcoming?.title ?? 'Nothing planned yet',
    health: intel.health,
  }
}

export default function DevPortfolioPage() {
  const { preferences, hydrated: prefsHydrated, setPreferences } = useDevPreferences()
  const [hydrated, setHydrated] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [stats, setStats] = useState<Record<string, PortfolioStats>>({})

  useEffect(() => {
    const list = getProjects().filter(p => !p.archived)
    const next: Record<string, PortfolioStats> = {}
    for (const project of list) next[project.slug] = computeStats(project)
    setProjects(list)
    setStats(next)
    setHydrated(true)
  }, [])

  const togglePin = (slug: string) => {
    const pinned = preferences.pinnedProjects.includes(slug)
      ? preferences.pinnedProjects.filter(s => s !== slug)
      : [...preferences.pinnedProjects, slug]
    setPreferences({ pinnedProjects: pinned })
  }

  return (
    <div>
      <DevPageHeader
        eyebrow="Executive"
        title="Product Portfolio"
        description="Every VYRON product, summarised the way an executive reads it — status, progress, health, and what's next."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {projects.map(project => {
          const s = stats[project.slug]
          const pinned = prefsHydrated && preferences.pinnedProjects.includes(project.slug)
          return (
            <div
              key={project.slug}
              className="dev-lift group relative rounded-2xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_12px_28px_-14px_rgba(0,0,0,0.4)] transition-colors hover:border-[var(--dev-accent)]/30"
            >
              <button
                type="button"
                onClick={() => togglePin(project.slug)}
                aria-label={pinned ? 'Unpin project' : 'Pin project'}
                className={`absolute right-5 top-5 z-10 text-base leading-none ${pinned ? 'text-amber-500 dark:text-amber-400' : 'text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]'}`}
              >
                &#9733;
              </button>

              <Link href={`/dev/projects/${project.slug}`} className="block">
                <div className="flex items-start justify-between gap-3 pr-6">
                  <div>
                    <div className="font-mono text-sm font-semibold tracking-tight text-[var(--dev-text)]">
                      {project.name}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--dev-text-faint)]">{project.tagline}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <DevBadge tone={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</DevBadge>
                    {hydrated ? <DevBadge tone={HEALTH_TONE[s.health.label]}>{s.health.label}</DevBadge> : null}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--dev-surface-hover)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500 transition-[width] duration-500"
                      style={{ width: `${hydrated ? s.progress : project.progress}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--dev-text-faint)]">
                    <span className="font-mono">{hydrated ? s.progress : project.progress}% complete</span>
                    <span className="truncate pl-2">{hydrated ? s.milestoneLabel : project.milestone}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-[var(--dev-text-faint)]">Current batch</div>
                    <div className="mt-0.5 truncate text-[var(--dev-text)]">{hydrated ? s.batchLabel : '—'}</div>
                  </div>
                  <div>
                    <div className="text-[var(--dev-text-faint)]">Open tasks</div>
                    <div className="mt-0.5 text-[var(--dev-text)]">{hydrated ? s.openTasks : '—'}</div>
                  </div>
                  <div>
                    <div className="text-[var(--dev-text-faint)]">Open risks</div>
                    <div className={`mt-0.5 ${hydrated && s.openRisks > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-[var(--dev-text)]'}`}>
                      {hydrated ? s.openRisks : '—'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--dev-text-faint)]">Last activity</div>
                    <div className="mt-0.5 truncate text-[var(--dev-text)]">
                      {project.recentActivity[0]?.time ?? project.lastUpdated}
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-[var(--dev-border)] pt-3">
                  <div className="text-xs text-[var(--dev-text-faint)]">Upcoming work</div>
                  <div className="mt-0.5 truncate text-sm text-[var(--dev-text)]">{hydrated ? s.upcoming : '—'}</div>
                </div>
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}
