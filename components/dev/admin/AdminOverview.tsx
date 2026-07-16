'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { getProjects, STATUS_LABEL, type ProjectStatus } from '@/lib/dev/projectsData'
import { getMilestones } from '@/lib/dev/milestonesStorage'
import { getBatches } from '@/lib/dev/batchesStorage'
import { DevButton, DevCard, DevGrid, DevSkeleton, DevStat } from '../ui'

type Stats = {
  total: number
  archived: number
  byStatus: Record<ProjectStatus, number>
  milestones: number
  batches: number
}

function computeStats(): Stats {
  const projects = getProjects()
  const byStatus: Record<ProjectStatus, number> = { active: 0, paused: 0, planning: 0, complete: 0 }
  let archived = 0
  for (const p of projects) {
    if (p.archived) {
      archived += 1
      continue
    }
    byStatus[p.status] += 1
  }
  return {
    total: projects.length,
    archived,
    byStatus,
    milestones: getMilestones().length,
    batches: getBatches().length,
  }
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    setStats(computeStats())
  }, [])

  if (!stats) {
    return (
      <DevGrid>
        {Array.from({ length: 6 }).map((_, i) => (
          <DevCard key={i}>
            <DevSkeleton className="h-3 w-24" />
            <DevSkeleton className="mt-2 h-6 w-16" />
          </DevCard>
        ))}
      </DevGrid>
    )
  }

  return (
    <div>
      <DevGrid>
        <DevStat label="Total Products" value={String(stats.total)} hint={`${stats.archived} archived`} />
        <DevStat label={STATUS_LABEL.active} value={String(stats.byStatus.active)} tone="success" />
        <DevStat label={STATUS_LABEL.paused} value={String(stats.byStatus.paused)} tone="warning" />
        <DevStat label={STATUS_LABEL.planning} value={String(stats.byStatus.planning)} tone="neutral" />
        <DevStat label="Milestones" value={String(stats.milestones)} hint="Across all products" />
        <DevStat label="Batches" value={String(stats.batches)} hint="Across all products" />
      </DevGrid>

      <div className="mt-6 flex items-center gap-2">
        <Link href="/dev/admin/projects">
          <DevButton variant="secondary">Manage Projects</DevButton>
        </Link>
        <Link href="/dev/admin/projects/new">
          <DevButton>New Project</DevButton>
        </Link>
      </div>
    </div>
  )
}
