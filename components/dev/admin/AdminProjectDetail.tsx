'use client'

import { useEffect, useState } from 'react'
import { getProjectBySlug, type Project } from '@/lib/dev/projectsData'
import { DevEmptyState, DevSkeleton } from '../ui'
import { AdminProjectForm } from './AdminProjectForm'
import { AdminMilestoneSection } from './AdminMilestoneSection'
import { AdminBatchSection } from './AdminBatchSection'

export function AdminProjectDetail({ slug }: { slug: string }) {
  const [project, setProject] = useState<Project | null | undefined>(undefined)

  useEffect(() => {
    setProject(getProjectBySlug(slug) ?? null)
  }, [slug])

  if (project === undefined) {
    return (
      <div className="space-y-4">
        <DevSkeleton className="h-32 w-full rounded-2xl" />
        <DevSkeleton className="h-24 w-full rounded-2xl" />
      </div>
    )
  }

  if (project === null) {
    return <DevEmptyState>Project not found.</DevEmptyState>
  }

  return (
    <div className="space-y-8">
      <AdminProjectForm project={project} />
      <div className="border-t border-[var(--dev-border)] pt-6">
        <AdminMilestoneSection projectSlug={project.slug} />
      </div>
      <div className="border-t border-[var(--dev-border)] pt-6">
        <AdminBatchSection projectSlug={project.slug} />
      </div>
    </div>
  )
}
