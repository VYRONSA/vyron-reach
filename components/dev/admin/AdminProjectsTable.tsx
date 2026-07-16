'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  archiveProject,
  getProjects,
  restoreProject,
  setProjectStatus,
  STATUS_LABEL,
  STATUS_TONE,
  type Project,
} from '@/lib/dev/projectsData'
import { DevBadge, DevButton, DevEmptyState, DevSkeleton } from '../ui'

export function AdminProjectsTable() {
  const [projects, setProjects] = useState<Project[] | null>(null)

  const refresh = () => setProjects(getProjects())

  useEffect(() => {
    refresh()
  }, [])

  if (!projects) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <DevSkeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (projects.length === 0) {
    return <DevEmptyState>No projects yet.</DevEmptyState>
  }

  return (
    <div className="space-y-2">
      {projects.map(project => (
        <div
          key={project.slug}
          className={`rounded-xl border border-[var(--dev-border)] bg-[var(--dev-surface)] p-4 ${project.archived ? 'opacity-60' : ''}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link href={`/dev/admin/projects/${project.slug}`} className="truncate font-mono text-sm font-semibold text-[var(--dev-text)] hover:text-[var(--dev-accent)]">
                  {project.name}
                </Link>
                <span className="font-mono text-[11px] text-[var(--dev-text-faint)]">{project.slug}</span>
                {project.archived ? <DevBadge tone="neutral">Archived</DevBadge> : null}
              </div>
              <div className="mt-0.5 truncate text-xs text-[var(--dev-text-faint)]">
                {project.category || 'Uncategorised'} · {project.phase || 'No phase set'}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <DevBadge tone={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</DevBadge>
              <Link href={`/dev/admin/projects/${project.slug}`}>
                <DevButton variant="secondary">Edit</DevButton>
              </Link>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--dev-border)] pt-3">
            {!project.archived ? (
              <>
                <DevButton
                  variant="secondary"
                  onClick={() => {
                    setProjectStatus(project.slug, 'active')
                    refresh()
                  }}
                >
                  Activate
                </DevButton>
                <DevButton
                  variant="secondary"
                  onClick={() => {
                    setProjectStatus(project.slug, 'paused')
                    refresh()
                  }}
                >
                  Pause
                </DevButton>
                <DevButton
                  variant="secondary"
                  onClick={() => {
                    setProjectStatus(project.slug, 'complete')
                    refresh()
                  }}
                >
                  Complete
                </DevButton>
                <DevButton
                  variant="danger"
                  onClick={() => {
                    archiveProject(project.slug)
                    refresh()
                  }}
                >
                  Archive
                </DevButton>
              </>
            ) : (
              <DevButton
                variant="secondary"
                onClick={() => {
                  restoreProject(project.slug)
                  refresh()
                }}
              >
                Restore
              </DevButton>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
