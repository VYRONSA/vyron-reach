'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { ensurePlanningMigrated } from '@/lib/dev/planningState/planningMigrationClient'
import { hydratePlanningCache, refreshPlanningCache } from '@/lib/dev/planningState/planningClientCache'
import { useDashboardEvents } from './realtime/useDashboardEvents'

/**
 * Blocks the portal's page content (not the surrounding shell chrome —
 * see app/dev/(portal)/layout.tsx) until the browser's in-memory planning
 * cache has been hydrated from the Planning Service at least once. This
 * is what makes the migration off localStorage safe for every existing
 * component: several of them read planning data inside a mount-only
 * useEffect (`useEffect(() => setX(getX()), [])`), which would otherwise
 * never re-run once the cache populates asynchronously after their own
 * mount. Gating render here means their very first read already sees
 * real data — the one-time network round trip happens once per portal
 * session, typically well under 100ms locally.
 *
 * DEF-001 root cause fix: Project Initiation provisions real projects/
 * milestones/batches/risks/dependencies straight into the Planning
 * Service from its own server-side API routes (lib/dev/initiation/) —
 * never through this cache's own scheduleServerWrite()/refreshPlanningCache()
 * mutation path (that path is only ever exercised by the client-side
 * CRUD wrappers in lib/dev/projectsData.ts, milestonesStorage.ts, etc.).
 * Because this gate hydrates only once per portal session (the `[]`
 * effect above never re-runs on client-side navigation, since this
 * layout-level component stays mounted across sibling page changes), a
 * project provisioned after that first hydration was invisible to every
 * reader of getPlanningCache() — the Project Portfolio and
 * getProjectBySlug() among them — even though the Planning Service (the
 * one, single source of truth) already had it. The Engineering Inbox
 * never had this problem because it reads live via the Event Service,
 * not this cache.
 *
 * The fix is not a second registry or a per-page patch: it subscribes
 * this same cache to the exact real-time events Initiation already
 * publishes at every transition that changes Planning Service state
 * (lib/dev/initiation/initiationService.ts's publishInitiationEvent,
 * category 'Project Initiation') and reconciles via the cache's own
 * existing refreshPlanningCache() — the same mechanism every other
 * mutation path already uses to converge. Every reader of
 * getPlanningCache() (Portfolio, Projects, and any future one) is fixed
 * by this one subscription, with no new store and no duplicate write.
 */
export function PlanningHydrationGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ensurePlanningMigrated()
      .then(() => hydratePlanningCache())
      .finally(() => {
        if (!cancelled) setReady(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useDashboardEvents({
    categories: ['Project Initiation'],
    onEvent: () => {
      void refreshPlanningCache()
    },
  })

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-neutral-400">
        Loading planning data…
      </div>
    )
  }

  return <>{children}</>
}
