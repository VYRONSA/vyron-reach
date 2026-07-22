import { getMigrationStatus, setMigrationStatus, putPlanningMetadata } from './planningStateStore'
import {
  putPlanningProject,
  putPlanningMilestones,
  putPlanningBatches,
  putPlanningDecisions,
  putPlanningRisks,
  putPlanningTechnicalDebt,
  putPlanningRoadmapLists,
} from './planningStateStore'
import type { Batch, Milestone, PlanningMetadata, PlanningMigrationPayload, PlanningMigrationResult, RoadmapLists } from './planningStateTypes'

/**
 * One-time import of the browser's localStorage planning universe into
 * the Durable Server Planning State Store. Global and idempotent: once
 * `planning-migration-status.json` records `migrated: true`, every later
 * call is a no-op — "future reads must ignore localStorage" means the
 * server, once seeded, never re-imports over data it or a later CEO edit
 * may have already changed via the Planning Service.
 *
 * Batch/Milestone ids and Batch.updatedAt are carried through completely
 * unchanged (this function never regenerates an id or a timestamp for
 * migrated records) — Execution Identity's `executionIdentityKey` depends
 * on exactly this being true across the migration boundary.
 */
export function importFromLocalStorage(payload: PlanningMigrationPayload): PlanningMigrationResult {
  if (getMigrationStatus().migrated) {
    return { imported: false, projectsImported: [] }
  }

  const now = new Date().toISOString()
  const knownSlugs = new Set(payload.projects.map(p => p.slug))

  for (const project of payload.projects) {
    putPlanningProject(project)
    const metadata: PlanningMetadata = {
      project: project.slug,
      planningVersion: 1,
      migratedFromLocalStorage: true,
      migratedAt: now,
      createdAt: now,
      updatedAt: now,
    }
    putPlanningMetadata(project.slug, metadata)
  }

  const milestonesBySlug = new Map<string, Milestone[]>()
  for (const milestone of payload.milestones) {
    if (!knownSlugs.has(milestone.project)) continue
    milestonesBySlug.set(milestone.project, [...(milestonesBySlug.get(milestone.project) ?? []), milestone])
  }
  for (const [slug, items] of milestonesBySlug) putPlanningMilestones(slug, items)

  const milestoneProjectOf = new Map(payload.milestones.map(m => [m.id, m.project]))
  const batchesBySlug = new Map<string, Batch[]>()
  for (const batch of payload.batches) {
    const slug = milestoneProjectOf.get(batch.milestone)
    if (!slug || !knownSlugs.has(slug)) continue
    batchesBySlug.set(slug, [...(batchesBySlug.get(slug) ?? []), batch])
  }
  for (const [slug, items] of batchesBySlug) putPlanningBatches(slug, items)

  const decisionsBySlug = new Map<string, typeof payload.decisions>()
  for (const decision of payload.decisions) {
    if (!knownSlugs.has(decision.relatedProject)) continue
    decisionsBySlug.set(decision.relatedProject, [...(decisionsBySlug.get(decision.relatedProject) ?? []), decision])
  }
  for (const [slug, items] of decisionsBySlug) putPlanningDecisions(slug, items)

  const risksBySlug = new Map<string, typeof payload.risks>()
  for (const risk of payload.risks) {
    if (!knownSlugs.has(risk.project)) continue
    risksBySlug.set(risk.project, [...(risksBySlug.get(risk.project) ?? []), risk])
  }
  for (const [slug, items] of risksBySlug) putPlanningRisks(slug, items)

  const debtBySlug = new Map<string, typeof payload.technicalDebt>()
  for (const debt of payload.technicalDebt) {
    if (!knownSlugs.has(debt.project)) continue
    debtBySlug.set(debt.project, [...(debtBySlug.get(debt.project) ?? []), debt])
  }
  for (const [slug, items] of debtBySlug) putPlanningTechnicalDebt(slug, items)

  const roadmapBySlug = new Map<string, RoadmapLists>()
  for (const entry of payload.projectLists) {
    if (!knownSlugs.has(entry.project)) continue
    const current = roadmapBySlug.get(entry.project) ?? { roadmap: [], upcoming: [] }
    roadmapBySlug.set(entry.project, { ...current, [entry.kind]: entry.items })
  }
  for (const [slug, lists] of roadmapBySlug) putPlanningRoadmapLists(slug, lists)

  setMigrationStatus({ migrated: true, migratedAt: now })

  return { imported: true, projectsImported: [...knownSlugs] }
}
