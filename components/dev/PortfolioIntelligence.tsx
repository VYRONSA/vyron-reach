'use client'

import { useEffect, useState } from 'react'
import { getProjects } from '@/lib/dev/projectsData'
import { getMilestones } from '@/lib/dev/milestonesStorage'
import { getBatches } from '@/lib/dev/batchesStorage'
import { getRisks, openHighRisks, isOpenRisk } from '@/lib/dev/risksStorage'
import { outstandingDebt } from '@/lib/dev/technicalDebtStorage'
import { getReleases } from '@/lib/dev/releasesStorage'
import { getTasks } from '@/lib/dev/queueStorage'
import { recentlyCompleted, type ActivityEvent } from '@/lib/dev/activityFeed'
import { getProjectIntelligence } from '@/lib/dev/projectIntelligence'
import { DevCard, DevGrid, DevSkeleton, DevStat } from './ui'

type Intelligence = {
  projectCompletion: number
  milestoneCompletion: number
  batchCompletion: number
  openRisks: number
  criticalRisks: number
  openDebt: number
  completedReleases: number
  velocity: number
  recentProgress: ActivityEvent[]
}

function computeIntelligence(): Intelligence {
  const milestones = getMilestones()
  const batches = getBatches()
  const risks = getRisks()
  const projects = getProjects()
  const projectCompletion =
    projects.length === 0
      ? 0
      : Math.round(projects.reduce((sum, p) => sum + getProjectIntelligence(p.slug).progress, 0) / projects.length)
  const milestoneCompletion =
    milestones.length === 0 ? 0 : Math.round((milestones.filter(m => m.status === 'Complete').length / milestones.length) * 100)
  const batchCompletion =
    batches.length === 0 ? 0 : Math.round((batches.filter(b => b.status === 'Complete').length / batches.length) * 100)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const velocity = getTasks().filter(t => t.status === 'done' && t.updatedAt >= sevenDaysAgo).length

  return {
    projectCompletion,
    milestoneCompletion,
    batchCompletion,
    openRisks: risks.filter(isOpenRisk).length,
    criticalRisks: openHighRisks().length,
    openDebt: outstandingDebt().length,
    completedReleases: getReleases().length,
    velocity,
    recentProgress: recentlyCompleted(5),
  }
}

export function PortfolioIntelligence() {
  const [data, setData] = useState<Intelligence | null>(null)

  useEffect(() => {
    setData(computeIntelligence())
  }, [])

  if (!data) {
    return (
      <div>
        <DevSkeleton className="mb-3 h-3 w-40" />
        <DevGrid>
          {Array.from({ length: 8 }).map((_, i) => (
            <DevCard key={i}>
              <DevSkeleton className="h-3 w-24" />
              <DevSkeleton className="mt-2 h-6 w-16" />
            </DevCard>
          ))}
        </DevGrid>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-3 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-[var(--dev-accent)]">
        Portfolio Intelligence
      </div>
      <DevGrid>
        <DevStat label="Project Completion" value={`${data.projectCompletion}%`} hint="Average across all products" tone="info" />
        <DevStat label="Milestone Completion" value={`${data.milestoneCompletion}%`} hint="All milestones, all products" tone="info" />
        <DevStat label="Batch Completion" value={`${data.batchCompletion}%`} hint="All batches, all products" tone="info" />
        <DevStat label="Open Risks" value={String(data.openRisks)} tone={data.openRisks > 0 ? 'warning' : 'neutral'} />
        <DevStat label="Critical Risks" value={String(data.criticalRisks)} tone={data.criticalRisks > 0 ? 'danger' : 'neutral'} />
        <DevStat label="Open Technical Debt" value={String(data.openDebt)} tone={data.openDebt > 0 ? 'warning' : 'neutral'} />
        <DevStat label="Completed Releases" value={String(data.completedReleases)} tone="success" />
        <DevStat label="Development Velocity" value={String(data.velocity)} hint="Tasks completed, last 7 days" tone="info" />

        <DevCard eyebrow="Momentum" title="Recent Progress">
          {data.recentProgress.length === 0 ? (
            <div className="mt-2 text-sm text-[var(--dev-text-faint)]">Nothing completed yet.</div>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {data.recentProgress.map(event => (
                <li key={`${event.category}-${event.id}`} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-[var(--dev-text)]">{event.title}</span>
                  <span className="shrink-0 text-[11px] text-[var(--dev-text-faint)]">{event.category}</span>
                </li>
              ))}
            </ul>
          )}
        </DevCard>
      </DevGrid>
    </div>
  )
}
