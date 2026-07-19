import { getProjectBySlug } from '../projectsData'
import { milestonesForProject } from '../milestonesStorage'
import { batchesForProject } from '../batchesStorage'
import { decisionsForProject } from '../decisionsStorage'
import { debtForProject } from '../technicalDebtStorage'
import { openRisksForProject } from '../risksStorage'
import { getKnowledgeNote } from '../knowledgeData'
import { getProductBible } from '../productBibleStorage'
import type { HandoffInput } from '../director/executionSnapshotTypes'

/**
 * The one, one-time read of localStorage-backed planning state that makes
 * true headless execution possible — gathered client-side (nothing else
 * can reach localStorage) and POSTed to /api/dev/director/[project]/handoff
 * at Start Development. From that point on, the server owns this data;
 * the browser never reads it again for the purposes of autonomous
 * execution (see serverExecutionLoop.ts's doc comment).
 */
export function gatherDirectorHandoff(slug: string): HandoffInput {
  const project = getProjectBySlug(slug)
  const bible = getProductBible(slug)

  return {
    project: slug,
    projectName: project?.name ?? slug,
    projectTagline: project?.tagline ?? '',
    projectDescription: project?.description ?? '',
    milestones: milestonesForProject(slug),
    batches: batchesForProject(slug),
    decisions: decisionsForProject(slug)
      .slice(0, 10)
      .map(d => ({ decision: d.decision, reason: d.reason })),
    technicalDebt: debtForProject(slug)
      .filter(d => d.priority === 'High' && d.status !== 'Resolved')
      .map(d => ({ title: d.title, priority: d.priority, relatedBatch: d.relatedBatch })),
    openRisks: openRisksForProject(slug)
      .filter(r => r.severity === 'High')
      .map(r => ({ title: r.title, severity: r.severity, relatedMilestone: r.relatedMilestone })),
    developmentRules: getKnowledgeNote('coding-standards').content,
    productBible: bible,
  }
}
