'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PROJECTS, STATUS_LABEL, STATUS_TONE } from '@/lib/dev/projectsData'
import { getTasks } from '@/lib/dev/queueStorage'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import { DevBadge, DevPageHeader } from '@/components/dev/ui'

export default function DevProjectsPage() {
  const { preferences, hydrated } = useDevPreferences()
  const [taskCounts, setTaskCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const tasks = getTasks()
    const counts: Record<string, number> = {}
    for (const task of tasks) {
      if (!task.project) continue
      counts[task.project] = (counts[task.project] ?? 0) + 1
    }
    setTaskCounts(counts)
  }, [])

  return (
    <div>
      <DevPageHeader
        eyebrow="Portfolio"
        title="Projects"
        description="All VYRON projects tracked from this portal. Open a project to see its overview and scoped queue."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PROJECTS.map(project => (
          <Link
            key={project.slug}
            href={`/dev/projects/${project.slug}`}
            className="dev-lift group rounded-2xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_12px_28px_-14px_rgba(0,0,0,0.4)] transition-colors hover:border-[var(--dev-accent)]/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 font-mono text-sm font-semibold tracking-tight text-[var(--dev-text)]">
                  {project.name}
                  {hydrated && preferences.defaultProject === project.slug ? (
                    <span className="rounded-full bg-[var(--dev-accent-soft)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--dev-accent)]">
                      Default
                    </span>
                  ) : null}
                </div>
                <div className="mt-0.5 text-xs text-[var(--dev-text-faint)]">{project.tagline}</div>
              </div>
              <DevBadge tone={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</DevBadge>
            </div>

            <div className="mt-4 text-xs text-[var(--dev-text-muted)]">{project.phase}</div>

            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--dev-surface-hover)]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-[var(--dev-text-faint)]">
                <span className="font-mono">{project.progress}%</span>
                <span>{taskCounts[project.slug] ?? 0} queued tasks</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
