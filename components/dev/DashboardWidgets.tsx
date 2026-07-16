'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useDevPreferences } from '@/context/dev/DevPreferencesContext'
import { getProjectBySlug } from '@/lib/dev/projectsData'
import { formatTimeAgo, getRecentPages, getRecentProjects, type RecentEntry } from '@/lib/dev/recents'
import { DevCard } from './ui'

export function QuickActionsCard() {
  const { preferences, hydrated } = useDevPreferences()
  const [lastProject, setLastProject] = useState<RecentEntry | null>(null)

  useEffect(() => {
    const [first] = getRecentProjects()
    setLastProject(first ?? null)
  }, [])

  const defaultProject = hydrated ? getProjectBySlug(preferences.defaultProject) : undefined

  const actions = [
    lastProject && preferences.autoOpenLastProject
      ? { href: lastProject.path, label: `Continue: ${lastProject.label}` }
      : defaultProject
        ? { href: `/dev/projects/${defaultProject.slug}`, label: `Open ${defaultProject.name}` }
        : { href: '/dev/projects', label: 'Browse projects' },
    { href: '/dev/queue', label: 'Add a task' },
    { href: '/dev/knowledge', label: 'Write a knowledge note' },
    { href: '/dev/settings', label: 'Adjust settings' },
  ]

  return (
    <DevCard eyebrow="Shortcuts" title="Quick Actions">
      <div className="mt-3 space-y-1.5">
        {actions.map(action => (
          <Link
            key={action.label}
            href={action.href}
            className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-[var(--dev-text)] transition-colors hover:bg-[var(--dev-surface-hover)]"
          >
            {action.label}
            <span className="text-[var(--dev-text-faint)]">&rarr;</span>
          </Link>
        ))}
      </div>
    </DevCard>
  )
}

export function RecentPagesCard() {
  const [pages, setPages] = useState<RecentEntry[]>([])

  useEffect(() => {
    setPages(getRecentPages())
  }, [])

  return (
    <DevCard eyebrow="History" title="Recent Pages">
      {pages.length === 0 ? (
        <div className="mt-3 text-xs text-[var(--dev-text-faint)]">Nothing visited yet this session.</div>
      ) : (
        <div className="mt-3 space-y-1.5">
          {pages.map(page => (
            <Link
              key={page.path}
              href={page.path}
              className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-[var(--dev-text)] transition-colors hover:bg-[var(--dev-surface-hover)]"
            >
              <span className="truncate">{page.label}</span>
              <span className="shrink-0 pl-2 text-[11px] text-[var(--dev-text-faint)]">{formatTimeAgo(page.visitedAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </DevCard>
  )
}

export function RecentProjectsCard() {
  const [projects, setProjects] = useState<RecentEntry[]>([])

  useEffect(() => {
    setProjects(getRecentProjects())
  }, [])

  if (projects.length === 0) return null

  return (
    <DevCard eyebrow="History" title="Recent Projects">
      <div className="mt-3 space-y-1.5">
        {projects.map(project => (
          <Link
            key={project.path}
            href={project.path}
            className="flex items-center justify-between rounded-lg px-2.5 py-2 text-sm text-[var(--dev-text)] transition-colors hover:bg-[var(--dev-surface-hover)]"
          >
            <span className="truncate">{project.label}</span>
            <span className="shrink-0 pl-2 text-[11px] text-[var(--dev-text-faint)]">{formatTimeAgo(project.visitedAt)}</span>
          </Link>
        ))}
      </div>
    </DevCard>
  )
}
