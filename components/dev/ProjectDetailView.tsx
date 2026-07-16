'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getProjectBySlug, STATUS_LABEL, STATUS_TONE, type Project } from '@/lib/dev/projectsData'
import type { GitIntelligence } from '@/lib/dev/gitIntelligence'
import type { DeploymentIntelligence } from '@/lib/dev/deploymentIntelligence'
import type { BuildIntelligence } from '@/lib/dev/buildIntelligence'
import { DevBadge, DevEmptyState, DevPageHeader, DevSkeleton } from './ui'
import { ProjectVisitTracker } from './ProjectVisitTracker'
import { ProjectWorkspaceTabs } from './ProjectWorkspaceTabs'

const BACK_LINK = (
  <Link href="/dev/projects" className="mb-4 inline-flex items-center gap-1.5 text-xs text-[var(--dev-text-faint)] hover:text-[var(--dev-text)]">
    &larr; All projects
  </Link>
)

/**
 * Resolves a project by slug from the admin-editable, localStorage-backed
 * project store (lib/dev/projectsData.ts). Projects can no longer be read
 * server-side (no database, no fs access to localStorage), so — same as
 * every other localStorage-backed value in VYRON DEV — this self-fetches
 * client-side rather than the Server Component page resolving it.
 */
export function ProjectDetailView({
  slug,
  buildStatus,
  typescriptStatus,
  git,
  deployment,
  build,
}: {
  slug: string
  buildStatus?: string
  typescriptStatus?: string
  git?: GitIntelligence
  deployment?: DeploymentIntelligence
  build?: BuildIntelligence
}) {
  const [project, setProject] = useState<Project | null | undefined>(undefined)

  useEffect(() => {
    setProject(getProjectBySlug(slug) ?? null)
  }, [slug])

  if (project === undefined) {
    return (
      <div>
        <DevSkeleton className="h-3 w-24" />
        <DevSkeleton className="mt-6 h-7 w-64" />
        <DevSkeleton className="mt-3 h-4 w-full max-w-xl" />
      </div>
    )
  }

  if (project === null) {
    return (
      <div>
        {BACK_LINK}
        <DevEmptyState>Project not found.</DevEmptyState>
      </div>
    )
  }

  return (
    <div>
      <ProjectVisitTracker slug={project.slug} name={project.name} />
      {BACK_LINK}
      <DevPageHeader
        eyebrow="Project"
        title={project.name}
        description={project.description}
        actions={<DevBadge tone={STATUS_TONE[project.status]}>{STATUS_LABEL[project.status]}</DevBadge>}
      />
      <ProjectWorkspaceTabs
        project={project}
        buildStatus={buildStatus}
        typescriptStatus={typescriptStatus}
        git={git}
        deployment={deployment}
        build={build}
      />
    </div>
  )
}
