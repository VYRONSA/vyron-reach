import { readLocal } from '../localStore'
import type { Project } from '../projectsData'
import type { Milestone } from '../milestonesStorage'
import type { Batch } from '../batchesStorage'
import type { Decision } from '../decisionsStorage'
import type { Risk } from '../risksStorage'
import type { TechnicalDebt } from '../technicalDebtStorage'
import type { ProjectListItem, ProjectListKind } from '../projectLists'
import type { MigrationStatus, PlanningMigrationPayload, PlanningMigrationResult } from './planningStateTypes'

/**
 * The one, one-time read of localStorage-backed planning state that
 * makes the Durable Server Planning State Store possible — gathered
 * client-side (nothing else can reach localStorage) and POSTed to
 * /api/dev/planning/migrate exactly once.
 *
 * Deliberately reads the RAW legacy localStorage keys directly via
 * readLocal, rather than through projectsData.ts/milestonesStorage.ts/
 * etc.'s own getters — as of Version 2.0 Milestone 1.1 Completion, those
 * modules read the Planning Service's in-memory cache instead of
 * localStorage, so calling them here would read the (possibly still
 * empty, pre-migration) cache instead of the legacy data this function
 * exists to import. This is the one place in the app legacy localStorage
 * keys are still referenced, and only for this one-time import — nothing
 * here is ever written back to localStorage.
 */
const PROJECTS_KEY = 'vyron-dev-projects-v1'
const MILESTONES_KEY = 'vyron-dev-milestones-v1'
const BATCHES_KEY = 'vyron-dev-batches-v1'
const DECISIONS_KEY = 'vyron-dev-decisions-v1'
const RISKS_KEY = 'vyron-dev-risks-v1'
const TECHNICAL_DEBT_KEY = 'vyron-dev-technical-debt-v1'
const ROADMAP_KINDS: ProjectListKind[] = ['roadmap', 'upcoming']

function projectListKey(projectSlug: string, kind: ProjectListKind): string {
  return `vyron-dev-project-${kind}-${projectSlug}-v1`
}

export function gatherLocalPlanningData(): PlanningMigrationPayload {
  const projects = readLocal<Project[]>(PROJECTS_KEY, [])
  const projectLists = projects.flatMap(project =>
    ROADMAP_KINDS.map(kind => ({
      project: project.slug,
      kind,
      items: readLocal<ProjectListItem[]>(projectListKey(project.slug, kind), []),
    })).filter(entry => entry.items.length > 0)
  )

  return {
    projects,
    milestones: readLocal<Milestone[]>(MILESTONES_KEY, []),
    batches: readLocal<Batch[]>(BATCHES_KEY, []),
    decisions: readLocal<Decision[]>(DECISIONS_KEY, []),
    risks: readLocal<Risk[]>(RISKS_KEY, []),
    technicalDebt: readLocal<TechnicalDebt[]>(TECHNICAL_DEBT_KEY, []),
    projectLists,
  }
}

export async function fetchMigrationStatus(): Promise<MigrationStatus> {
  const res = await fetch('/api/dev/planning/migrate')
  if (!res.ok) return { migrated: false, migratedAt: null }
  const data = (await res.json()) as { status: MigrationStatus }
  return data.status
}

/** Idempotent — safe to call on every portal load. No-ops immediately once the server confirms migration already happened. */
export async function ensurePlanningMigrated(): Promise<PlanningMigrationResult | null> {
  const status = await fetchMigrationStatus()
  if (status.migrated) return null

  const payload = gatherLocalPlanningData()
  const res = await fetch('/api/dev/planning/migrate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) return null
  const data = (await res.json()) as { result: PlanningMigrationResult }
  return data.result
}
