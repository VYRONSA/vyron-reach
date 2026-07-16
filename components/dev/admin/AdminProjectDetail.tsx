'use client'

import { useCallback, useEffect, useState } from 'react'
import { getProjectBySlug, type Project } from '@/lib/dev/projectsData'
import { getMilestones, type Milestone } from '@/lib/dev/milestonesStorage'
import { DevEmptyState, DevSkeleton } from '../ui'
import { AdminProjectForm } from './AdminProjectForm'
import { AdminMilestoneSection } from './AdminMilestoneSection'
import { AdminBatchSection } from './AdminBatchSection'

/**
 * Owns the milestone list for this project and passes it down to both
 * AdminMilestoneSection and AdminBatchSection. Milestones must live here,
 * not inside either section: they're sibling components, and a sibling's
 * own useEffect(() => fetch(), [projectSlug]) never re-runs when the
 * *other* sibling creates a milestone — that mismatch was the root cause
 * of the New Batch button appearing to do nothing after creating a
 * milestone (its local, stale, empty milestones array kept the button
 * disabled). One fetch, one source of truth, passed down — not refetched
 * independently by each consumer.
 */
export function AdminProjectDetail({ slug }: { slug: string }) {
  const [project, setProject] = useState<Project | null | undefined>(undefined)
  const [milestones, setMilestones] = useState<Milestone[]>([])

  useEffect(() => {
    setProject(getProjectBySlug(slug) ?? null)
  }, [slug])

  const refreshMilestones = useCallback(() => {
    setMilestones(getMilestones().filter(m => m.project === slug))
  }, [slug])

  useEffect(() => {
    refreshMilestones()
  }, [refreshMilestones])

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
        <AdminMilestoneSection projectSlug={project.slug} milestones={milestones} onChange={refreshMilestones} />
      </div>
      <div className="border-t border-[var(--dev-border)] pt-6">
        <AdminBatchSection projectSlug={project.slug} milestones={milestones} />
      </div>
    </div>
  )
}
