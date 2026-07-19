'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Project } from '@/lib/dev/projectsData'
import { getActivityEvents } from '@/lib/dev/activityFeed'
import type { GitIntelligence } from '@/lib/dev/gitIntelligence'
import type { DeploymentIntelligence } from '@/lib/dev/deploymentIntelligence'
import type { BuildIntelligence } from '@/lib/dev/buildIntelligence'
import { DevBadge, DevCard, DevTabBar } from './ui'
import { ExecutiveCommandCentre } from './ExecutiveCommandCentre'
import { LiveEngineeringCommandCentre } from './LiveEngineeringCommandCentre'
import { DevelopmentPlanPanel } from './DevelopmentPlanPanel'
import { GitIntelligenceCard } from './GitIntelligenceCard'
import { DeploymentIntelligenceCard } from './DeploymentIntelligenceCard'
import { BuildIntelligenceCard } from './BuildIntelligenceCard'
import { LatestHandoverCard } from './LatestHandoverCard'
import { ProjectListSection } from './ProjectListSection'
import { DecisionsBoard } from './DecisionsBoard'
import { MilestonesBoard } from './MilestonesBoard'
import { BatchesBoard } from './BatchesBoard'
import { RisksBoard } from './RisksBoard'
import { TechnicalDebtBoard } from './TechnicalDebtBoard'
import { ProductBibleEditor } from './ProductBibleEditor'
import { QueueBoard } from './QueueBoard'
import { JournalBoard } from './JournalBoard'
import { PromptLibraryBoard } from './PromptLibraryBoard'
import { ReleasesLog } from './ReleasesLog'

type Tab =
  | 'overview'
  | 'director'
  | 'roadmap'
  | 'milestones'
  | 'batches'
  | 'queue'
  | 'decisions'
  | 'techDebt'
  | 'risks'
  | 'bible'
  | 'journal'
  | 'prompts'
  | 'releases'
  | 'upcoming'

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'director', label: 'Director' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'batches', label: 'Batches' },
  { id: 'queue', label: 'Queue' },
  { id: 'decisions', label: 'Decisions' },
  { id: 'techDebt', label: 'Tech Debt' },
  { id: 'risks', label: 'Risks' },
  { id: 'bible', label: 'Product Bible' },
  { id: 'journal', label: 'Journal' },
  { id: 'prompts', label: 'Prompts' },
  { id: 'releases', label: 'Releases' },
  { id: 'upcoming', label: 'Upcoming' },
]

const ID_PREFIX_TO_TAB: Record<string, Tab> = {
  milestone: 'milestones',
  batch: 'batches',
  risk: 'risks',
  debt: 'techDebt',
  decision: 'decisions',
  journal: 'journal',
  prompt: 'prompts',
  release: 'releases',
  task: 'queue',
}

function tabFromFocusId(id: string): Tab | null {
  const prefix = id.split('_')[0]
  return ID_PREFIX_TO_TAB[prefix] ?? null
}

const CATEGORY_TONE: Record<string, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  Journal: 'neutral',
  Queue: 'info',
  Milestones: 'info',
  Batches: 'info',
  Releases: 'success',
  Decisions: 'neutral',
  Risks: 'danger',
  'Technical Debt': 'warning',
  Prompts: 'neutral',
}

export function ProjectWorkspaceTabs({
  project,
  buildStatus,
  typescriptStatus,
  git,
  deployment,
  build,
}: {
  project: Project
  buildStatus?: string
  typescriptStatus?: string
  git?: GitIntelligence
  deployment?: DeploymentIntelligence
  build?: BuildIntelligence
}) {
  const [tab, setTab] = useState<Tab>('overview')
  const [activity, setActivity] = useState<ReturnType<typeof getActivityEvents>>([])
  const [activityHydrated, setActivityHydrated] = useState(false)

  useEffect(() => {
    setActivity(getActivityEvents().filter(e => e.project === project.slug).slice(0, 8))
    setActivityHydrated(true)
  }, [project.slug])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const focusParam = params.get('focus')
    if (focusParam) {
      const inferred = tabFromFocusId(focusParam)
      if (inferred) {
        setTab(inferred)
        return
      }
    }
    const tabParam = params.get('tab')
    if (tabParam && TABS.some(t => t.id === tabParam)) setTab(tabParam as Tab)
  }, [])

  const handleTabChange = (next: Tab) => {
    setTab(next)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', next)
      url.searchParams.delete('focus')
      window.history.replaceState(null, '', url.toString())
    }
  }

  return (
    <div>
      <div className="mb-6">
        <ExecutiveCommandCentre
          projectSlug={project.slug}
          buildStatus={buildStatus}
          typescriptStatus={typescriptStatus}
          git={git}
          deployment={deployment}
          build={build}
        />
      </div>

      <DevTabBar tabs={TABS} active={tab} onChange={handleTabChange} />

      <div key={tab} className="dev-fade-in pt-6">
        {tab === 'overview' ? (
          <div className="space-y-4">
            <LatestHandoverCard projectSlug={project.slug} />

            <DevelopmentPlanPanel
              projectSlug={project.slug}
              buildStatus={buildStatus}
              typescriptStatus={typescriptStatus}
              git={git}
              deployment={deployment}
              build={build}
            />

            <GitIntelligenceCard git={git} />

            <DeploymentIntelligenceCard deployment={deployment} />

            <BuildIntelligenceCard build={build} />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <DevCard eyebrow="Notes" title="Notes">
                <p className="mt-2 text-sm leading-relaxed text-[var(--dev-text-muted)]">{project.notes}</p>
              </DevCard>
              <DevCard eyebrow="Unified Timeline" title="Recent Activity">
                {!activityHydrated ? (
                  <div className="mt-2 text-sm text-[var(--dev-text-faint)]">Loading...</div>
                ) : activity.length === 0 ? (
                  <div className="mt-2 text-sm text-[var(--dev-text-faint)]">No recorded activity yet.</div>
                ) : (
                  <ul className="mt-2 space-y-2.5">
                    {activity.map(event => (
                      <li key={`${event.category}-${event.id}`}>
                        <Link
                          href={event.href}
                          className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-1 text-sm transition-colors hover:bg-[var(--dev-surface-hover)]"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <DevBadge tone={CATEGORY_TONE[event.category] ?? 'neutral'}>{event.category}</DevBadge>
                            <span className="truncate text-[var(--dev-text)]">{event.title}</span>
                          </span>
                          <span className="shrink-0 font-mono text-[11px] text-[var(--dev-text-faint)]">
                            {event.date.slice(0, 10)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <Link
                  href={`/dev/activity`}
                  className="mt-3 inline-block text-xs text-[var(--dev-accent)] hover:underline"
                >
                  View full activity timeline &rarr;
                </Link>
              </DevCard>
            </div>
          </div>
        ) : null}

        {tab === 'director' ? <LiveEngineeringCommandCentre projectSlug={project.slug} /> : null}
        {tab === 'roadmap' ? <ProjectListSection projectSlug={project.slug} kind="roadmap" /> : null}
        {tab === 'milestones' ? <MilestonesBoard projectFilter={project.slug} /> : null}
        {tab === 'batches' ? <BatchesBoard projectFilter={project.slug} /> : null}
        {tab === 'techDebt' ? <TechnicalDebtBoard projectFilter={project.slug} /> : null}
        {tab === 'risks' ? <RisksBoard projectFilter={project.slug} /> : null}
        {tab === 'upcoming' ? <ProjectListSection projectSlug={project.slug} kind="upcoming" /> : null}
        {tab === 'decisions' ? <DecisionsBoard projectFilter={project.slug} /> : null}
        {tab === 'bible' ? <ProductBibleEditor projectSlug={project.slug} /> : null}
        {tab === 'queue' ? <QueueBoard projectFilter={project.slug} compact /> : null}
        {tab === 'journal' ? <JournalBoard projectFilter={project.slug} /> : null}
        {tab === 'prompts' ? <PromptLibraryBoard /> : null}
        {tab === 'releases' ? <ReleasesLog projectFilter={project.slug} /> : null}
      </div>
    </div>
  )
}
