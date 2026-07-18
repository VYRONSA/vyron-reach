'use client'

import { useEffect, useState } from 'react'
import type { GitIntelligence } from '@/lib/dev/gitIntelligence'
import type { DeploymentIntelligence } from '@/lib/dev/deploymentIntelligence'
import type { BuildIntelligence } from '@/lib/dev/buildIntelligence'
import { getSelfDevelopmentStatus, type SelfDevelopmentStatus } from '@/lib/dev/selfDevelopmentEngine'
import { developmentEventsForProject, type DevelopmentEvent } from '@/lib/dev/developmentEventEngine'
import { developmentDependencyStatusForProject, type DevelopmentDependencyStatus } from '@/lib/dev/developmentDependencyEngine'
import { getDevelopmentConversationMemory } from '@/lib/dev/developmentConversationMemoryEngine'
import { getExecutiveActions } from '@/lib/dev/executiveActionEngine'
import { getLatestHandover, type Handover } from '@/lib/dev/handoverStorage'
import { DevCard, DevSkeleton } from './ui'
import { PlanningCentrePanel } from './PlanningCentrePanel'

/**
 * Standalone Planning Centre page composition — the same Session/
 * Dependency/Memory/Action Queue chain ExecutiveCommandCentre.tsx
 * already assembles internally, recomputed here only because that
 * chain isn't otherwise exposed to a page that wants just the Planning
 * panel without the rest of the Executive Command Centre.
 */
export function PlanningCentreProjectView({
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
  const [status, setStatus] = useState<SelfDevelopmentStatus | null>(null)
  const [events, setEvents] = useState<DevelopmentEvent[]>([])
  const [dependencies, setDependencies] = useState<DevelopmentDependencyStatus | null>(null)
  const [latestHandover, setLatestHandover] = useState<Handover | null>(null)

  useEffect(() => {
    const context = { buildStatus, typescriptStatus, git, deployment, build }
    setStatus(getSelfDevelopmentStatus(slug, context))
    setEvents(developmentEventsForProject(slug, { git, build, deployment }))
    setDependencies(developmentDependencyStatusForProject(slug, context))
    setLatestHandover(getLatestHandover(slug))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, buildStatus, typescriptStatus, git, deployment, build])

  if (!status || !dependencies) {
    return (
      <DevCard>
        <DevSkeleton className="h-3 w-56" />
        <DevSkeleton className="mt-4 h-6 w-full" />
      </DevCard>
    )
  }

  const memory = getDevelopmentConversationMemory(slug, status.session, status.plan, dependencies, events)
  const queue = getExecutiveActions(status.session, status.plan, dependencies, events, memory)

  return (
    <PlanningCentrePanel
      projectSlug={slug}
      session={status.session}
      dependencies={dependencies}
      memory={memory}
      latestHandover={latestHandover}
      queue={queue}
      git={git}
      build={build}
    />
  )
}
