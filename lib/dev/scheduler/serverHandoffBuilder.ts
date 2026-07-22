import * as planningStateService from '../planningState/planningStateService'
import { getDevelopmentRules } from '../knowledge/developmentRulesStore'
import type { HandoffInput } from '../director/executionSnapshotTypes'
import type { Project } from '../projectsData'

/**
 * The server-native equivalent of lib/dev/runtime/directorHandoff.ts's
 * gatherDirectorHandoff — the Scheduler has no browser to gather a
 * hand-off from (nothing prompts a CEO to click "Start Development" for
 * a project the Scheduler decides to start on its own), so it needs its
 * own way to build one directly from durable server state. Uses the
 * exact same filtering rules as the browser path and as Milestone 2.2's
 * Live Knowledge Refresh (top 10 decisions; High-priority, unresolved
 * technical debt; High-severity, still-open risks) so a Scheduler-started
 * run's initial context is never inconsistent with what a CEO-started
 * run would have produced from the same Planning Service state.
 *
 * Product Bible is a client-only, localStorage-backed store
 * (lib/dev/productBibleStorage.ts) with no server-side equivalent — an
 * honest empty default is used rather than fabricating content, the
 * same "never fabricate" rule every other engine in this codebase
 * follows. Development Rules use the server-owned store Milestone 2.2
 * added specifically to close this same class of gap.
 */
export function buildServerHandoff(project: Project): HandoffInput {
  const slug = project.slug

  return {
    project: slug,
    projectName: project.name,
    projectTagline: project.tagline,
    projectDescription: project.description,
    milestones: planningStateService.listMilestones(slug),
    batches: planningStateService.listBatches(slug),
    decisions: planningStateService
      .listDecisions(slug)
      .slice(0, 10)
      .map(d => ({ decision: d.decision, reason: d.reason })),
    technicalDebt: planningStateService
      .listTechnicalDebt(slug)
      .filter(d => d.priority === 'High' && d.status !== 'Resolved')
      .map(d => ({ title: d.title, priority: d.priority, relatedBatch: d.relatedBatch })),
    openRisks: planningStateService
      .listRisks(slug)
      .filter(r => r.status !== 'Mitigated' && r.status !== 'Closed' && r.severity === 'High')
      .map(r => ({ title: r.title, severity: r.severity, relatedMilestone: r.relatedMilestone })),
    developmentRules: getDevelopmentRules().content,
    productBible: { vision: '', goals: '', targetMarket: '', coreFeatures: '', futureRoadmap: '', notes: '', updatedAt: '' },
  }
}

/** Whether this project has anything left for a Director to do — the Scheduler's eligibility gate, and the reason a Completed project with newly-added batches becomes schedulable again rather than staying permanently Completed. */
export function hasAvailableWork(project: string): boolean {
  return planningStateService.listBatches(project).some(b => b.status !== 'Complete')
}
