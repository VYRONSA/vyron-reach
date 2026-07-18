'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getProjects, type Project } from '@/lib/dev/projectsData'
import { getEngineeringOrganizationState } from '@/lib/dev/initializer/organizationInitializer'
import { DevBadge, DevPageHeader, DevSkeleton } from '@/components/dev/ui'

/**
 * The Planning Centre — one entry point to every project's Engineering
 * Plan. Each card links to /dev/planning/[slug], which runs the
 * read-only Planning Engine (lib/dev/planning/) for that project.
 */
export default function DevPlanningCentrePage() {
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [ready, setReady] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const list = getProjects().filter(p => !p.archived)
    setProjects(list)
    const readiness: Record<string, boolean> = {}
    for (const p of list) readiness[p.slug] = getEngineeringOrganizationState(p.slug).engineeringReady
    setReady(readiness)
  }, [])

  return (
    <div>
      <DevPageHeader
        eyebrow="Engineering"
        title="Planning Centre"
        description="Converts Engineering Assessment and Director Recommendations into a proposed plan for review — read-only until a human approves it."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {!projects
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-5">
                <DevSkeleton className="h-4 w-32" />
                <DevSkeleton className="mt-2 h-3 w-full" />
              </div>
            ))
          : projects.map(project => (
              <Link
                key={project.slug}
                href={`/dev/planning/${project.slug}`}
                className="dev-lift group rounded-2xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_12px_28px_-14px_rgba(0,0,0,0.4)] transition-colors hover:border-[var(--dev-accent)]/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-mono text-sm font-semibold tracking-tight text-[var(--dev-text)]">{project.name}</div>
                  <DevBadge tone={ready[project.slug] ? 'success' : 'neutral'}>{ready[project.slug] ? 'Engineering Ready' : 'Unknown'}</DevBadge>
                </div>
                <div className="mt-0.5 text-xs text-[var(--dev-text-faint)]">{project.tagline}</div>
                <div className="mt-4 text-xs text-[var(--dev-accent)]">Generate Engineering Plan &rarr;</div>
              </Link>
            ))}
      </div>
    </div>
  )
}
