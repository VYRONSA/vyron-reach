import { getProductBible } from '../productBibleStorage'
import { getKnowledgeNote } from '../knowledgeData'
import { ensurePlanningMigrated } from '../planningState/planningMigrationClient'
import type { PlanningState } from '../planningState/planningStateTypes'
import type { HandoffInput } from '../director/executionSnapshotTypes'

/**
 * The one, one-time read of server-owned planning state that makes true
 * headless execution possible — gathered client-side and POSTed to
 * /api/dev/director/[project]/handoff at Start Development. From that
 * point on, the server Director owns this data; the browser never reads
 * it again for the purposes of autonomous execution (see
 * serverExecutionLoop.ts's doc comment).
 *
 * As of Version 2.0 Milestone 1.1 (Durable Server Planning State Store),
 * project/milestones/batches/decisions/technicalDebt/openRisks are read
 * from the Planning Service (server-owned, survives localStorage being
 * cleared) instead of directly from localStorage — the browser is
 * presentation-only for this data now. Product Bible and development
 * rules (coding standards) are outside Milestone 1.1's scope and are
 * still read from their existing localStorage-backed modules unchanged.
 * `ensurePlanningMigrated()` is called defensively so this still works
 * correctly even if the portal's one-time migration bootstrap hasn't run
 * yet in this browser session.
 */
export async function gatherDirectorHandoff(slug: string): Promise<HandoffInput> {
  await ensurePlanningMigrated()

  const res = await fetch(`/api/dev/planning/projects/${slug}`)
  const state: PlanningState | null = res.ok ? (await res.json()).state : null

  const bible = getProductBible(slug)

  return {
    project: slug,
    projectName: state?.project.name ?? slug,
    projectTagline: state?.project.tagline ?? '',
    projectDescription: state?.project.description ?? '',
    milestones: state?.milestones ?? [],
    batches: state?.batches ?? [],
    decisions: (state?.decisions ?? []).slice(0, 10).map(d => ({ decision: d.decision, reason: d.reason })),
    technicalDebt: (state?.technicalDebt ?? [])
      .filter(d => d.priority === 'High' && d.status !== 'Resolved')
      .map(d => ({ title: d.title, priority: d.priority, relatedBatch: d.relatedBatch })),
    openRisks: (state?.risks ?? [])
      .filter(r => r.status !== 'Mitigated' && r.status !== 'Closed' && r.severity === 'High')
      .map(r => ({ title: r.title, severity: r.severity, relatedMilestone: r.relatedMilestone })),
    developmentRules: getKnowledgeNote('coding-standards').content,
    productBible: bible,
  }
}
